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

// Track processed payments for idempotency
const processedPayments = new Set<string>();

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

    // 1. Idempotency check — prevent duplicate license creation
    if (processedPayments.has(razorpay_payment_id)) {
      return NextResponse.json(
        { success: false, error: "Payment already processed" },
        { status: 409 }
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

    // 5. Mark payment as processed (idempotency)
    processedPayments.add(razorpay_payment_id);

    // Clean up after 24 hours
    setTimeout(() => {
      processedPayments.delete(razorpay_payment_id);
    }, 24 * 60 * 60 * 1000);

    // 6. Create license key in Convex
    const result = await convex.mutation(anyApi.licenses.createLicense, {
      email,
      plan,
      durationDays,
      paymentId: razorpay_payment_id,
    });

    // 7. Send license key via email (best effort)
    try {
      await fetch(`${process.env.NEXT_PUBLIC_BASE_URL || "http://localhost:3000"}/api/send-email`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          email,
          licenseKey: result.licenseKey,
          plan,
          durationDays,
        }),
      });
    } catch (emailError) {
      console.error("Email sending failed (non-blocking):", emailError);
    }

    return NextResponse.json({
      success: true,
      licenseKey: result.licenseKey,
      expiresAt: result.expiresAt,
    });
  } catch (error) {
    console.error("Verify payment error:", error);
    return NextResponse.json(
      { success: false, error: "Payment verification failed" },
      { status: 500 }
    );
  }
}
