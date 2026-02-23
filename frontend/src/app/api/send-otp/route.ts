import { NextRequest, NextResponse } from "next/server";
import nodemailer from "nodemailer";

export async function POST(req: NextRequest) {
  try {
    const { email, otp } = await req.json();

    if (!email || !otp) {
      return NextResponse.json(
        { error: "Missing email or OTP" },
        { status: 400 }
      );
    }

    // Initialize Nodemailer transporter
    const transporter = nodemailer.createTransport({
      host: process.env.SMTP_HOST,
      port: Number(process.env.SMTP_PORT) || 587,
      secure: Number(process.env.SMTP_PORT) === 465, // true for 465, false for other ports
      auth: {
        user: process.env.SMTP_USER,
        pass: process.env.SMTP_PASS,
      },
    });

    await transporter.verify();

    const logoUrl = "https://cc24839ed0.imgdist.com/public/users/BeeFree/beefree-69596733-e56e-4991-b1c4-e2d5cd04ec0e/logo.png";

    await transporter.sendMail({
      from: `"${process.env.SMTP_FROM_NAME || 'iSuite Assistant'}" <${process.env.SMTP_FROM_EMAIL}>`,
      to: email,
      subject: "🔒 Your iSuite Verification Code",
      html: `
        <!DOCTYPE html>
        <html>
        <head>
          <meta charset="utf-8">
          <style>
            body { font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; background: #0a0a0a; color: #f5f5f5; margin: 0; padding: 0; }
            .container { max-width: 560px; margin: 0 auto; padding: 40px 20px; }
            .card { background: #161616; border: 1px solid #262626; border-radius: 16px; padding: 40px; text-align: center; }
            .logo { font-size: 28px; font-weight: 800; margin-bottom: 24px; color: #f5f5f5; }
            .logo span { color: #6366f1; }
            h1 { font-size: 24px; margin: 0 0 8px; color: #f5f5f5; }
            .subtitle { font-size: 15px; color: #a3a3a3; margin: 0 0 32px; }
            
            /* OTP Section */
            .otp-box { background: #0a0a0a; border: 2px dashed #6366f1; border-radius: 12px; padding: 32px 24px; margin: 24px 0; }
            .otp-label { font-size: 12px; text-transform: uppercase; letter-spacing: 2px; color: #6366f1; margin: 0 0 16px; font-weight: 600; }
            .otp-code { font-size: 36px; font-family: 'Courier New', monospace; font-weight: 700; color: #f5f5f5; letter-spacing: 8px; margin: 0; user-select: all; -webkit-user-select: all; cursor: pointer; }
            .copy-hint { font-size: 11px; color: #6b7280; margin-top: 16px; text-transform: uppercase; letter-spacing: 1px; }
            
            .warning { font-size: 13px; color: #ef4444; margin-top: 24px; background: rgba(239, 68, 68, 0.1); padding: 12px; border-radius: 8px; }
            
            /* Footer */
            .footer { text-align: center; margin-top: 32px; font-size: 12px; color: #525252; }
            .footer p { margin: 6px 0; }
          </style>
        </head>
        <body>
          <div class="container">
            <div class="card">
              <div class="logo">
                <img src="${logoUrl}" width="48" height="48" alt="iSuite Logo" style="vertical-align: middle; margin-right: 12px; border-radius: 8px; display: inline-block;" />
                <span style="vertical-align: middle;">i<span style="color: #6366f1;">Suite</span></span>
              </div>
              <h1>Secure Activation</h1>
              <p class="subtitle">Enter the code below to verify your device.</p>

              <div class="otp-box">
                <p class="otp-label">Verification Code</p>
                <p class="otp-code">${otp}</p>
                <p class="copy-hint">(Double-click or long-press to copy)</p>
              </div>

              <p class="warning">This code will expire in 10 minutes. Do not share it with anyone.</p>
            </div>

            <div class="footer">
              <p>If you didn't request this code, you can safely ignore this email.</p>
              <p>© ${new Date().getFullYear()} iSuite Assistant. All rights reserved.</p>
            </div>
          </div>
        </body>
        </html>
      `,
    });

    return NextResponse.json({ success: true });
  } catch (error: unknown) {
    console.error("Send OTP email error:", error);
    const errorMessage = error instanceof Error ? error.message : "Unknown error";
    return NextResponse.json(
      { error: "Failed to send OTP email", details: errorMessage },
      { status: 500 }
    );
  }
}
