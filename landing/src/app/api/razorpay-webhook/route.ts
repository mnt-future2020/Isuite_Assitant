import { NextRequest, NextResponse } from "next/server";
import crypto from "crypto";
import { ConvexHttpClient } from "convex/browser";
import { anyApi } from "convex/server";

// ============================================================
// Razorpay Webhook Handler — Production-Grade
// ============================================================
//
// Events handled:
//   • payment.captured  — Primary: license created when payment is captured
//   • order.paid        — Fallback: same data, triggered when order is fully paid
//   • payment.failed    — Logging only (no action)
//
// Security:
//   • HMAC SHA256 signature verification on RAW body
//   • Webhook secret is separate from API key secret
//   • Idempotency via x-razorpay-event-id header
//   • PaymentId uniqueness check in Convex before creating license
//
// Razorpay Dashboard Setup:
//   1. Go to Account & Settings → Webhooks → + Add New Webhook
//   2. URL: https://your-domain.com/api/razorpay-webhook
//   3. Secret: Generate a strong secret and add to RAZORPAY_WEBHOOK_SECRET env
//   4. Events: Select "payment.captured" and "order.paid"
//   5. Alert Email: your-email@example.com
// ============================================================

const convex = new ConvexHttpClient(process.env.NEXT_PUBLIC_CONVEX_URL!);

// Track processed event IDs for idempotency (in-memory; replace with Redis in multi-instance prod)
const processedEventIds = new Set<string>();

// Clean up old event IDs every hour to prevent memory leak
setInterval(() => {
  processedEventIds.clear();
}, 60 * 60 * 1000);

// ============================================================
// Signature Verification
// ============================================================

function verifyWebhookSignature(rawBody: string, signature: string, secret: string): boolean {
  const expectedSignature = crypto
    .createHmac("sha256", secret)
    .update(rawBody)
    .digest("hex");

  // Timing-safe comparison to prevent timing attacks
  try {
    return crypto.timingSafeEqual(
      Buffer.from(expectedSignature, "hex"),
      Buffer.from(signature, "hex")
    );
  } catch {
    return false;
  }
}

// ============================================================
// Extract order metadata from notes
// ============================================================

interface OrderNotes {
  email?: string;
  plan?: string;
  durationDays?: string;
}

function extractOrderData(payload: Record<string, unknown>): {
  paymentId: string;
  orderId: string;
  email: string;
  plan: string;
  durationDays: number;
  amount: number;
} | null {
  try {
    // payment.captured → payload.payment.entity
    // order.paid → payload.payment.entity + payload.order.entity
    const paymentEntity = (payload?.payment as Record<string, unknown>)?.entity as Record<string, unknown>;
    const orderEntity = (payload?.order as Record<string, unknown>)?.entity as Record<string, unknown>;

    if (!paymentEntity) return null;

    const paymentId = paymentEntity.id as string;
    const orderId = paymentEntity.order_id as string;
    const amount = paymentEntity.amount as number;

    // Notes can be on the order entity (order.paid) or we fall back to payment email
    const notes: OrderNotes = (orderEntity?.notes as OrderNotes) ||
                              (paymentEntity.notes as OrderNotes) ||
                              {};

    const email = notes.email || (paymentEntity.email as string) || "";
    const plan = notes.plan || "";
    const durationDays = notes.durationDays ? parseInt(notes.durationDays, 10) : 0;

    if (!paymentId || !email || !plan || !durationDays) {
      console.error("[Webhook] Missing required fields:", { paymentId, email, plan, durationDays });
      return null;
    }

    return { paymentId, orderId, email, plan, durationDays, amount };
  } catch (error) {
    console.error("[Webhook] Failed to extract order data:", error);
    return null;
  }
}

// ============================================================
// POST Handler
// ============================================================

export async function POST(req: NextRequest) {
  try {
    // 1. Read RAW body (do NOT parse before signature verification)
    const rawBody = await req.text();
    const signature = req.headers.get("x-razorpay-signature") || "";
    const eventId = req.headers.get("x-razorpay-event-id") || "";

    // 2. Verify webhook secret exists
    const webhookSecret = process.env.RAZORPAY_WEBHOOK_SECRET;
    if (!webhookSecret) {
      console.error("[Webhook] RAZORPAY_WEBHOOK_SECRET not configured");
      return NextResponse.json({ status: "error", message: "Webhook secret not configured" }, { status: 500 });
    }

    // 3. Verify signature (HMAC SHA256 on raw body)
    if (!signature || !verifyWebhookSignature(rawBody, signature, webhookSecret)) {
      console.error("[Webhook] Invalid signature");
      return NextResponse.json({ status: "error", message: "Invalid signature" }, { status: 401 });
    }

    // 4. Parse body AFTER signature verification
    const event = JSON.parse(rawBody);
    const eventType = event.event as string;

    console.log(`[Webhook] Received event: ${eventType} | Event ID: ${eventId}`);

    // 5. Idempotency check via x-razorpay-event-id
    if (eventId && processedEventIds.has(eventId)) {
      console.log(`[Webhook] Duplicate event ignored: ${eventId}`);
      return NextResponse.json({ status: "ok", message: "Already processed" });
    }

    // 6. Handle events
    switch (eventType) {
      case "payment.captured":
      case "order.paid": {
        const orderData = extractOrderData(event.payload);
        if (!orderData) {
          console.error(`[Webhook] Could not extract order data from ${eventType}`);
          // Return 200 to prevent Razorpay from retrying (bad payload won't improve on retry)
          return NextResponse.json({ status: "ok", message: "Skipped — incomplete data" });
        }

        // Check if license already exists for this paymentId (true idempotency)
        try {
          const existing = await convex.query(anyApi.licenses.getLicenseByPaymentId, {
            paymentId: orderData.paymentId,
          });
          if (existing) {
            console.log(`[Webhook] License already exists for payment ${orderData.paymentId}`);
            if (eventId) processedEventIds.add(eventId);
            return NextResponse.json({ status: "ok", message: "License already exists" });
          }
        } catch {
          // Query might not exist yet — continue with creation
          console.log("[Webhook] Could not check existing license, proceeding with creation");
        }

        // Create license
        const result = await convex.mutation(anyApi.licenses.createLicense, {
          email: orderData.email,
          plan: orderData.plan,
          durationDays: orderData.durationDays,
          paymentId: orderData.paymentId,
        });

        console.log(`[Webhook] ✅ License created: ${result.licenseKey} for ${orderData.email} (${orderData.plan})`);

        // Send email (best-effort, non-blocking)
        try {
          await fetch(`${process.env.NEXT_PUBLIC_BASE_URL || "http://localhost:3000"}/api/send-email`, {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({
              email: orderData.email,
              licenseKey: result.licenseKey,
              plan: orderData.plan,
              durationDays: orderData.durationDays,
            }),
          });
        } catch (emailError) {
          console.error("[Webhook] Email failed (non-blocking):", emailError);
        }

        // Mark event as processed
        if (eventId) processedEventIds.add(eventId);

        return NextResponse.json({ status: "ok", message: "License created" });
      }

      case "payment.failed": {
        // Log failed payments for analytics/debugging — no action needed
        const paymentEntity = (event.payload?.payment as Record<string, unknown>)?.entity as Record<string, unknown>;
        console.log(`[Webhook] Payment failed: ${paymentEntity?.id} | Error: ${paymentEntity?.error_description}`);
        return NextResponse.json({ status: "ok", message: "Noted" });
      }

      default: {
        console.log(`[Webhook] Unhandled event: ${eventType}`);
        return NextResponse.json({ status: "ok", message: "Unhandled event" });
      }
    }
  } catch (error) {
    console.error("[Webhook] Unhandled error:", error);
    // Return 200 to prevent infinite retries for malformed payloads
    // Return 500 only for genuine server errors we want Razorpay to retry
    return NextResponse.json({ status: "error", message: "Internal error" }, { status: 500 });
  }
}
