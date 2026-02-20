import { NextRequest, NextResponse } from "next/server";
import Razorpay from "razorpay";

const razorpay = new Razorpay({
  key_id: process.env.RAZORPAY_KEY_ID!,
  key_secret: process.env.RAZORPAY_KEY_SECRET!,
});

// In-memory store for pending orders (use Redis/DB in production for multi-instance setups)
// Maps orderId -> order metadata
const pendingOrders = new Map<string, { email: string; plan: string; durationDays: number; amount: number }>();

export { pendingOrders };

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { amount, plan, email, durationDays } = body;

    if (!amount || !plan || !email || !durationDays) {
      return NextResponse.json(
        { error: "Missing required fields" },
        { status: 400 }
      );
    }

    // Validate amount is a positive integer (paise)
    if (!Number.isInteger(amount) || amount <= 0) {
      return NextResponse.json(
        { error: "Invalid amount" },
        { status: 400 }
      );
    }

    const order = await razorpay.orders.create({
      amount: amount, // already in paise
      currency: "INR",
      receipt: `isuite_${plan}_${Date.now()}`,
      notes: {
        email,
        plan,
        durationDays: String(durationDays),
      },
    });

    // Store order details server-side for secure verification later
    // Razorpay docs: "Retrieve the order_id from your server. Do NOT use
    // the razorpay_order_id returned by Checkout."
    pendingOrders.set(order.id, { email, plan, durationDays, amount });

    // Clean up old orders after 30 minutes
    setTimeout(() => {
      pendingOrders.delete(order.id);
    }, 30 * 60 * 1000);

    return NextResponse.json({
      orderId: order.id,
      amount: order.amount,
      currency: order.currency,
    });
  } catch (error) {
    console.error("Create order error:", error);
    return NextResponse.json(
      { error: "Failed to create order" },
      { status: 500 }
    );
  }
}
