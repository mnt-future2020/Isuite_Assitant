import { NextRequest, NextResponse } from "next/server";
import crypto from "crypto";
import Razorpay from "razorpay";
import { ConvexHttpClient } from "convex/browser";
import { anyApi } from "convex/server";

const convex = new ConvexHttpClient(process.env.NEXT_PUBLIC_CONVEX_URL!);

const razorpay = new Razorpay({
  key_id: process.env.RAZORPAY_KEY_ID!,
  key_secret: process.env.RAZORPAY_KEY_SECRET!,
});

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const {
      razorpay_order_id,
      razorpay_payment_id,
      razorpay_signature,
    } = body;

    if (!razorpay_order_id || !razorpay_payment_id || !razorpay_signature) {
      return NextResponse.json(
        { success: false, error: "Missing payment details" },
        { status: 400 }
      );
    }

    // 2. Verify Razorpay signature
    const expectedSignature = crypto
      .createHmac("sha256", process.env.RAZORPAY_KEY_SECRET!)
      .update(`${razorpay_order_id}|${razorpay_payment_id}`)
      .digest("hex");

    if (expectedSignature !== razorpay_signature) {
      return NextResponse.json(
        { success: false, error: "Invalid payment signature" },
        { status: 400 }
      );
    }

    // 3. Fetch order details directly from Razorpay API
    //    This is resilient to server restarts — no in-memory Map needed
    const order = await razorpay.orders.fetch(razorpay_order_id);

    if (!order || !order.notes) {
      return NextResponse.json(
        { success: false, error: "Order not found on Razorpay" },
        { status: 400 }
      );
    }

    const email = order.notes.email as string;
    const plan = order.notes.plan as string;
    const durationDays = Number(order.notes.durationDays);

    if (!email || !plan || !durationDays) {
      return NextResponse.json(
        { success: false, error: "Order metadata incomplete" },
        { status: 400 }
      );
    }

    // 4. Verify payment is actually captured/authorized on Razorpay
    try {
      const payment = await razorpay.payments.fetch(razorpay_payment_id);
      if (payment.status !== "captured" && payment.status !== "authorized") {
        return NextResponse.json(
          { success: false, error: `Payment not completed. Status: ${payment.status}` },
          { status: 400 }
        );
      }
    } catch (fetchError) {
      console.error("Failed to fetch payment status:", fetchError);
      // Continue — signature was valid (defense-in-depth)
    }

    // --------------------------------------------------------------------------------
    // ARCHITECTURE FIX: Prevent duplicate license creation & duplicate emails
    // --------------------------------------------------------------------------------
    // The webhook (`api/razorpay-webhook`) is the EXCLUSIVE creator of licenses and emails.
    // This `verify-payment` endpoint simply polls Convex waiting for the Webhook to finish.
    // This eliminates the race condition where both endpoints create a key simultaneously.

    let createdLicense = null;
    let attempts = 0;
    const maxAttempts = 15; // 15 seconds polling max
    
    while (!createdLicense && attempts < maxAttempts) {
      try {
        createdLicense = await convex.query(anyApi.licenses.getLicenseByPaymentId, {
          paymentId: razorpay_payment_id,
        });
        
        if (createdLicense) {
          break;
        }
      } catch (err) {
        console.error("Error polling for License:", err);
      }
      
      attempts++;
      // Wait 1 second before polling again
      await new Promise((resolve) => setTimeout(resolve, 1000));
    }
    
    // If webhook is deeply delayed, we might timeout pulling.
    // By returning success anyway, the UI moves to the success screen, and the user 
    // will get the email eventually when the webhook fires.
    if (!createdLicense) {
       console.log(`[Verify] Webhook is delayed/slow for ${razorpay_payment_id}. Redirecting to success without key rendering.`);
       return NextResponse.json({
         success: true,
         licenseKey: "Pending - Check your Email shortly",
         expiresAt: 0,
       });
    }

    return NextResponse.json({
      success: true,
      licenseKey: createdLicense.licenseKey,
      expiresAt: createdLicense.expiresAt,
    });
  } catch (error) {
    console.error("Verify payment error:", error);
    return NextResponse.json(
      { success: false, error: "Payment verification failed" },
      { status: 500 }
    );
  }
}
