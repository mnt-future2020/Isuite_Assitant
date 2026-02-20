import { NextRequest, NextResponse } from "next/server";
import { Resend } from "resend";

const resend = new Resend(process.env.RESEND_API_KEY);

export async function POST(req: NextRequest) {
  try {
    const { email, licenseKey, plan, durationDays } = await req.json();

    if (!email || !licenseKey) {
      return NextResponse.json(
        { error: "Missing email or license key" },
        { status: 400 }
      );
    }

    const planLabels: Record<string, string> = {
      "20days": "Starter (20 Days)",
      "30days": "Monthly (30 Days)",
      "90days": "Quarterly (90 Days)",
      "365days": "Annual (365 Days)",
    };

    const planLabel = planLabels[plan] || `${durationDays} Days`;

    await resend.emails.send({
      from: "iSuite <noreply@isuiteassistant.com>",
      to: [email],
      subject: "🎉 Your iSuite License Key",
      html: `
        <!DOCTYPE html>
        <html>
        <head>
          <meta charset="utf-8">
          <style>
            body { font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; background: #0a0a0a; color: #f5f5f5; margin: 0; padding: 0; }
            .container { max-width: 520px; margin: 0 auto; padding: 40px 20px; }
            .card { background: #161616; border: 1px solid #262626; border-radius: 16px; padding: 40px; text-align: center; }
            .logo { font-size: 24px; font-weight: 800; margin-bottom: 24px; color: #f5f5f5; }
            .logo span { color: #6366f1; }
            h1 { font-size: 22px; margin: 0 0 8px; color: #f5f5f5; }
            .subtitle { font-size: 14px; color: #a3a3a3; margin: 0 0 32px; }
            .license-box { background: #0a0a0a; border: 2px dashed #6366f1; border-radius: 12px; padding: 20px; margin: 24px 0; }
            .license-label { font-size: 11px; text-transform: uppercase; letter-spacing: 2px; color: #6366f1; margin: 0 0 8px; font-weight: 600; }
            .license-key { font-size: 22px; font-family: 'Courier New', monospace; font-weight: 700; color: #f5f5f5; letter-spacing: 2px; margin: 0; word-break: break-all; }
            .plan-info { font-size: 13px; color: #a3a3a3; margin: 16px 0 0; }
            .steps { text-align: left; margin: 32px 0; }
            .steps h2 { font-size: 14px; color: #f5f5f5; margin: 0 0 16px; }
            .step { display: flex; gap: 12px; margin-bottom: 16px; }
            .step-num { width: 24px; height: 24px; background: #6366f1; color: white; border-radius: 50%; display: inline-flex; align-items: center; justify-content: center; font-size: 12px; font-weight: 600; flex-shrink: 0; }
            .step-text { font-size: 13px; color: #a3a3a3; line-height: 1.5; }
            .footer { text-align: center; margin-top: 32px; font-size: 12px; color: #525252; }
          </style>
        </head>
        <body>
          <div class="container">
            <div class="card">
              <div class="logo">i<span>Suite</span></div>
              <h1>Your License Key is Ready! 🎉</h1>
              <p class="subtitle">Thank you for choosing iSuite Assistant.</p>

              <div class="license-box">
                <p class="license-label">Your License Key</p>
                <p class="license-key">${licenseKey}</p>
              </div>

              <p class="plan-info">
                <strong>Plan:</strong> ${planLabel}
              </p>

              <div class="steps">
                <h2>Getting Started:</h2>
                <div class="step">
                  <span class="step-num">1</span>
                  <span class="step-text">Download the iSuite desktop app from our website</span>
                </div>
                <div class="step">
                  <span class="step-num">2</span>
                  <span class="step-text">Open the app and click "Activate License"</span>
                </div>
                <div class="step">
                  <span class="step-num">3</span>
                  <span class="step-text">Paste your license key above and start using AI!</span>
                </div>
              </div>
            </div>

            <div class="footer">
              <p>© ${new Date().getFullYear()} iSuite Assistant. All rights reserved.</p>
              <p>If you didn't request this email, please ignore it.</p>
            </div>
          </div>
        </body>
        </html>
      `,
    });

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Send email error:", error);
    return NextResponse.json(
      { error: "Failed to send email" },
      { status: 500 }
    );
  }
}
