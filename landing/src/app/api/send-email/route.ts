import { NextRequest, NextResponse } from "next/server";
import nodemailer from "nodemailer";
import fs from "fs";
import path from "path";

export async function POST(req: NextRequest) {
  try {
    const { email, licenseKey, plan, durationDays, amount, currency, paymentId, date } = await req.json();

    if (!email || !licenseKey) {
      return NextResponse.json(
        { error: "Missing email or license key" },
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

    const planLabels: Record<string, string> = {
      "20days": "Starter (20 Days)",
      "30days": "Monthly (30 Days)",
      "90days": "Quarterly (90 Days)",
      "365days": "Annual (365 Days)",
    };

    const planLabel = planLabels[plan] || `${durationDays} Days`;
    
    // Financial formatting
    const totalAmountNum = amount ? (amount / 100) : 0;
    // Assuming the total includes an 18% GST out of the box. You can adjust this later.
    const subtotalNum = totalAmountNum / 1.18;
    const gstNum = totalAmountNum - subtotalNum;

    const formattedTotal = totalAmountNum.toFixed(2);
    const formattedSubtotal = subtotalNum.toFixed(2);
    const formattedGst = gstNum.toFixed(2);
    
    const displayCurrency = currency || "INR";
    
    // Date formats
    const startDateObj = date ? new Date(date) : new Date();
    const invoiceDate = startDateObj.toLocaleDateString('en-US', { year: 'numeric', month: 'short', day: 'numeric' });
    
    // Calculate Billing Period End Date based on durationDays
    const endDateObj = new Date(startDateObj.getTime() + (durationDays || 30) * 24 * 60 * 60 * 1000);
    const endDateFormatted = endDateObj.toLocaleDateString('en-US', { year: 'numeric', month: 'short', day: 'numeric' });

    // Identifiers
    const safePaymentId = paymentId || `TRX-${Date.now()}`;
    const invoiceNumber = `INV-${safePaymentId.replace(/^pay_/, '')}`;
    
    // Validate formatting 
    const logoUrl = "https://cc24839ed0.imgdist.com/public/users/BeeFree/beefree-69596733-e56e-4991-b1c4-e2d5cd04ec0e/logo.png";

    await transporter.verify();

    // Generate PDF invoice cleanly using jsPDF (works in Serverless/Edge runtimes)
    // @ts-expect-error - Ignore type error if types module isn't loaded by tsconfig yet
    const { jsPDF } = await import('jspdf');
    // Using a reliable server-side oriented config
    const doc = new jsPDF({
      orientation: 'portrait',
      unit: 'pt',
      format: 'a4'
    });

    // --- Fetch Logo ---
    let logoBase64: string | null = null;
    try {
      // We explicitly read the local true PNG payload we extracted earlier to bypass the ICO signature issue
      const logoPath = path.join(process.cwd(), 'public', 'logo.png');
      logoBase64 = fs.readFileSync(logoPath, 'base64');
    } catch (err) {
      console.error("Could not read local logo for PDF:", err);
    }

    // --- PDF Content ---
    // Header Background
    doc.setFillColor(252, 252, 253);
    doc.rect(0, 0, 595, 140, 'F');
    doc.setDrawColor(229, 231, 235);
    doc.line(0, 140, 595, 140);

    // Header Content
    doc.setFont("helvetica", "bold");
    let logoOffset = 0;
    if (logoBase64) {
      // Add Image: (imageData, format, x, y, width, height)
      doc.addImage(`data:image/png;base64,${logoBase64}`, 'PNG', 50, 45, 40, 40);
      logoOffset = 52; // Shift text right
    }
    
    doc.setTextColor(17, 24, 39);
    doc.setFontSize(22);
    doc.text('iSuite Assistant Inc.', 50 + logoOffset, 62);
    
    doc.setFontSize(9);
    doc.setFont("helvetica", "normal");
    doc.setTextColor(107, 114, 128);
    doc.text('123 [Update Your Street Address]', 50 + logoOffset, 76);
    doc.text('[Update Your City, Country]  |  GSTIN: [Update Your GST No]', 50 + logoOffset, 88);

    // Title & Meta (Right aligned)
    doc.setFont("helvetica", "bold");
    doc.setFontSize(24);
    doc.setTextColor(31, 41, 55);
    doc.text('TAX INVOICE', 545, 62, { align: 'right' });
    
    doc.setFontSize(10);
    doc.setFont("helvetica", "normal");
    doc.setTextColor(107, 114, 128);
    doc.text(`Invoice No: ${invoiceNumber}`, 545, 80, { align: 'right' });
    doc.text(`Date of Issue: ${invoiceDate}`, 545, 95, { align: 'right' });
    doc.text(`Transaction ID: ${safePaymentId}`, 545, 110, { align: 'right' });

    // Billed To Section
    doc.setFont("helvetica", "bold");
    doc.setFontSize(10);
    doc.setTextColor(156, 163, 175);
    doc.text('BILLED TO', 50, 180);
    
    doc.setFont("helvetica", "bold");
    doc.setFontSize(14);
    doc.setTextColor(17, 24, 39);
    doc.text('Customer', 50, 200);
    
    doc.setFont("helvetica", "normal");
    doc.setFontSize(11);
    doc.setTextColor(75, 85, 99);
    doc.text(email, 50, 215);

    // --- Beautiful Table ---
    const tableTop = 270;
    
    // Table Header Background
    doc.setFillColor(249, 250, 251); 
    doc.setDrawColor(229, 231, 235);
    doc.rect(48, tableTop - 20, 499, 35, 'FD'); // Filled and Stroked
    
    // Table Headers
    doc.setFont("helvetica", "bold");
    doc.setFontSize(10);
    doc.setTextColor(55, 65, 81);
    doc.text('ITEM DESCRIPTION', 60, tableTop + 2);
    doc.text('AMOUNT', 535, tableTop + 2, { align: 'right' });

    // Table Body
    const rowTop = tableTop + 40;
    
    // Border sides
    doc.line(48, tableTop + 15, 48, rowTop + 85);
    doc.line(547, tableTop + 15, 547, rowTop + 85);
    
    // Content
    doc.setFont("helvetica", "bold");
    doc.setFontSize(12);
    doc.setTextColor(17, 24, 39);
    doc.text('iSuite Assistant Subscription', 60, rowTop);
    
    doc.setFontSize(10);
    doc.setFont("helvetica", "normal");
    doc.setTextColor(107, 114, 128);
    doc.text(`Plan: ${planLabel}`, 60, rowTop + 20);
    doc.text(`Billing Period: ${invoiceDate} - ${endDateFormatted}`, 60, rowTop + 35);
    
    doc.setFont("helvetica", "bold");
    doc.setTextColor(17, 24, 39);
    doc.text(`${displayCurrency} ${formattedTotal}`, 535, rowTop, { align: 'right' });

    // Bottom border of item section
    doc.setDrawColor(229, 231, 235);
    doc.line(48, rowTop + 65, 547, rowTop + 65);

    // Calculations Section
    const calcTop = rowTop + 95;
    
    doc.setFont("helvetica", "normal");
    doc.setTextColor(75, 85, 99);
    doc.text('Subtotal', 400, calcTop, { align: 'right' });
    doc.setTextColor(17, 24, 39);
    doc.text(`${displayCurrency} ${formattedSubtotal}`, 535, calcTop, { align: 'right' });

    doc.setTextColor(75, 85, 99);
    doc.text('GST (18%)', 400, calcTop + 20, { align: 'right' });
    doc.setTextColor(17, 24, 39);
    doc.text(`${displayCurrency} ${formattedGst}`, 535, calcTop + 20, { align: 'right' });

    // Total line inside box
    doc.setDrawColor(229, 231, 235);
    doc.setLineWidth(1);
    doc.line(48, calcTop + 40, 547, calcTop + 40); // close content area before total

    // Total Paid background
    doc.setFillColor(249, 250, 251); 
    doc.rect(48, calcTop + 40, 499, 50, 'F');
    
    // Outer border for calculation section
    doc.line(48, rowTop + 65, 48, calcTop + 90); // Left side
    doc.line(547, rowTop + 65, 547, calcTop + 90); // Right side
    doc.line(48, calcTop + 90, 547, calcTop + 90); // Bottom side

    doc.setFont("helvetica", "bold");
    doc.setFontSize(14);
    doc.text('Total Paid', 400, calcTop + 72, { align: 'right' });
    doc.text(`${displayCurrency} ${formattedTotal}`, 535, calcTop + 72, { align: 'right' });

    // Footer
    doc.setFontSize(10);
    doc.setFont("helvetica", "normal");
    doc.setTextColor(156, 163, 175);
    doc.text(`This is a computer generated receipt for ${email}`, 297, 750, { align: 'center' });
    doc.text(`© ${new Date().getFullYear()} iSuite Assistant Inc. All rights reserved.`, 297, 765, { align: 'center' });

    // Convert to Buffer
    const pdfBuffer = Buffer.from(doc.output('arraybuffer'));

    await transporter.sendMail({
      from: `"${process.env.SMTP_FROM_NAME || 'iSuite Assistant'}" <${process.env.SMTP_FROM_EMAIL}>`,
      to: email,
      subject: "🎉 Your iSuite License Key & Tax Invoice",
      attachments: amount ? [
        {
          filename: `${invoiceNumber}.pdf`,
          content: pdfBuffer,
          contentType: 'application/pdf'
        }
      ] : [],
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
            
            /* License Section */
            .license-box { background: #0a0a0a; border: 2px dashed #6366f1; border-radius: 12px; padding: 24px; margin: 24px 0; }
            .license-label { font-size: 12px; text-transform: uppercase; letter-spacing: 2px; color: #6366f1; margin: 0 0 12px; font-weight: 600; }
            .license-key { font-size: 24px; font-family: 'Courier New', monospace; font-weight: 700; color: #f5f5f5; letter-spacing: 2px; margin: 0; word-break: break-all; }
            
            /* Invoice Header & Billing Info */
            .invoice-wrapper { margin-top: 40px; padding-top: 32px; border-top: 1px dashed #262626; text-align: left; }
            .billing-row { display: table; width: 100%; margin-bottom: 32px; }
            .billing-col { display: table-cell; width: 50%; vertical-align: top; }
            .billing-title { font-size: 13px; text-transform: uppercase; letter-spacing: 1px; color: #a3a3a3; margin: 0 0 8px; font-weight: 600; }
            .billing-details { font-size: 14px; color: #f5f5f5; line-height: 1.6; margin: 0; }
            .billing-details span { color: #a3a3a3; }
            
            .invoice-meta-row { display: table; width: 100%; margin-bottom: 24px; }
            .invoice-title { font-size: 20px; font-weight: 700; color: #f5f5f5; margin: 0; display: table-cell; vertical-align: bottom; }
            .invoice-meta { font-size: 13px; color: #a3a3a3; text-align: right; display: table-cell; vertical-align: bottom; }
            .invoice-meta p { margin: 4px 0 0 0; }
            
            /* Invoice Table */
            table.items-table { width: 100%; border-collapse: collapse; margin-top: 16px; font-size: 14px; }
            .items-table th { text-align: left; padding: 12px; color: #a3a3a3; border-bottom: 1px solid #262626; font-weight: 600; text-transform: uppercase; font-size: 12px; letter-spacing: 1px; }
            .items-table td { padding: 16px 12px; color: #f5f5f5; border-bottom: 1px solid #262626; vertical-align: top;}
            .text-right { text-align: right !important; }
            .calc-row td { padding: 8px 12px; border-bottom: none; color: #a3a3a3; font-size: 14px; }
            .total-row td { font-weight: 700; font-size: 16px; padding-top: 16px; padding-bottom: 16px; color: #f5f5f5; border-top: 1px solid #262626; border-bottom: 2px solid #262626; margin-top: 8px; }
            
            /* Steps */
            .steps { text-align: left; margin: 40px 0 0; padding: 24px; background: #0a0a0a; border-radius: 12px; border: 1px solid #262626; }
            .steps h2 { font-size: 15px; color: #f5f5f5; margin: 0 0 20px; }
            .step { display: flex; gap: 16px; margin-bottom: 16px; }
            .step:last-child { margin-bottom: 0; }
            .step-num { width: 24px; height: 24px; background: #6366f1; color: white; border-radius: 50%; display: inline-flex; align-items: center; justify-content: center; font-size: 12px; font-weight: 600; flex-shrink: 0; }
            .step-text { font-size: 14px; color: #a3a3a3; line-height: 1.5; margin-top: 2px; }
            
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
              <h1>Your License Key is Ready! 🎉</h1>
              <p class="subtitle">Thank you for choosing iSuite Assistant.</p>

              <div class="license-box">
                <p class="license-label">Your License Key</p>
                <p class="license-key">${licenseKey}</p>
              </div>

              <div class="steps">
                <h2>Getting Started:</h2>
                <div class="step">
                  <span class="step-num">1</span>
                  <div class="step-text">Download the iSuite desktop app from <a href="https://isuiteassistant.com" style="color: #6366f1; text-decoration: none;">our website</a></div>
                </div>
                <div class="step">
                  <span class="step-num">2</span>
                  <div class="step-text">Open the app and click <strong>"Activate License"</strong></div>
                </div>
                <div class="step">
                  <span class="step-num">3</span>
                  <div class="step-text">Paste your license key above and start exploring!</div>
                </div>
              </div>

              ${amount ? `
              <div class="invoice-wrapper">
                
                <div class="billing-row">
                  <div class="billing-col">
                    <p class="billing-title">Billed From</p>
                    <p class="billing-details">
                      <strong>iSuite Assistant Inc.</strong><br/>
                      <span>123 [Update Your Street Address]</span><br/>
                      <span>[Update Your City, Country]</span><br/>
                      <span>GSTIN: [Update Your GST No]</span>
                    </p>
                  </div>
                  <div class="billing-col" style="text-align: right;">
                    <p class="billing-title">Billed To</p>
                    <p class="billing-details">
                      <strong>Customer</strong><br/>
                      <span>${email}</span>
                    </p>
                  </div>
                </div>

                <div class="invoice-meta-row">
                  <h2 class="invoice-title">Tax Invoice</h2>
                  <div class="invoice-meta">
                    <p><strong>Invoice No:</strong> ${invoiceNumber}</p>
                    <p><strong>Date of Issue:</strong> ${invoiceDate}</p>
                    <p><strong>Payment ID:</strong> ${safePaymentId}</p>
                  </div>
                </div>

                <table class="items-table">
                  <thead>
                    <tr>
                      <th>Description</th>
                      <th class="text-right">Amount</th>
                    </tr>
                  </thead>
                  <tbody>
                    <tr>
                      <td>
                        <strong style="color: #f5f5f5;">iSuite Assistant Subscription</strong><br/>
                        <span style="color: #a3a3a3; font-size: 13px; display: inline-block; margin-top: 4px;">Plan: ${planLabel}</span><br/>
                        <span style="color: #a3a3a3; font-size: 13px; display: inline-block; margin-top: 2px;">Billing Period: ${invoiceDate} &mdash; ${endDateFormatted}</span>
                      </td>
                      <td class="text-right">${displayCurrency} ${formattedTotal}</td>
                    </tr>
                    
                    <tr><td colspan="2" style="padding: 16px 0 0 0; border: none;"></td></tr>
                    
                    <tr class="calc-row">
                      <td class="text-right">Subtotal</td>
                      <td class="text-right">${displayCurrency} ${formattedSubtotal}</td>
                    </tr>
                    <tr class="calc-row">
                      <td class="text-right">GST (18%)</td>
                      <td class="text-right">${displayCurrency} ${formattedGst}</td>
                    </tr>
                    <tr class="total-row">
                      <td class="text-right">Total Paid</td>
                      <td class="text-right">${displayCurrency} ${formattedTotal}</td>
                    </tr>
                  </tbody>
                </table>
                <p style="font-size: 13px; color: #a3a3a3; text-align: center; margin-top: 32px;">A PDF copy of this invoice has been attached to this email.</p>
              </div>
              ` : ''}
            </div>

            <div class="footer">
              <p>This is a computer generated receipt for ${email}</p>
              <p>© ${new Date().getFullYear()} iSuite Assistant. All rights reserved.</p>
            </div>
          </div>
        </body>
        </html>
      `,
    });

    return NextResponse.json({ success: true });
  } catch (error: unknown) {
    console.error("Send email error:", error);
    const errorMessage = error instanceof Error ? error.message : "Unknown error";
    return NextResponse.json(
      { error: "Failed to send email", details: errorMessage },
      { status: 500 }
    );
  }
}
