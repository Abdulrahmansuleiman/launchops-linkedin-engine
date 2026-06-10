export interface ContractInput {
  companyName: string
  contactName: string
  contactEmail?: string
  website?: string
  services: string[]
  scope: string
  monthlyRetainer?: number
  setupFee?: number
  contractDuration?: number
  paymentTerms?: string
  goals?: string
}

function formatCurrency(n: number): string {
  return new Intl.NumberFormat("en-GB", { style: "currency", currency: "GBP", minimumFractionDigits: 0 }).format(n)
}

export function generateContractHtml(data: ContractInput): string {
  const date = new Date().toLocaleDateString("en-GB", { day: "numeric", month: "long", year: "numeric" })
  const retainer = data.monthlyRetainer ? formatCurrency(data.monthlyRetainer) : "TBD"
  const setup = data.setupFee ? formatCurrency(data.setupFee) : "N/A"
  const duration = data.contractDuration ? `${data.contractDuration} months` : "Month-to-month"
  const paymentTerms = data.paymentTerms || "Net 14 days from invoice date"

  const servicesList = data.services.map((s) => `        <li>${s}</li>`).join("\n")

  return `<!DOCTYPE html>
<html lang="en">
<head>
<meta charset="utf-8">
<title>Service Agreement — ${data.companyName}</title>
<style>
  @page { margin: 0; size: A4; }
  * { margin: 0; padding: 0; box-sizing: border-box; }
  body { font-family: 'Inter', -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; color: #1a1a1a; line-height: 1.6; font-size: 12px; }
  .page { width: 210mm; min-height: 297mm; padding: 30mm 25mm; margin: 0 auto; }

  .header { text-align: center; margin-bottom: 40px; padding-bottom: 30px; border-bottom: 3px solid #2563eb; }
  .header h1 { font-size: 26px; font-weight: 700; letter-spacing: -0.5px; color: #111; margin-bottom: 4px; }
  .header .sub { font-size: 14px; color: #666; }
  .header .badge { display: inline-block; margin-top: 8px; background: #2563eb; color: #fff; font-size: 10px; font-weight: 600; padding: 4px 14px; border-radius: 20px; letter-spacing: 0.5px; text-transform: uppercase; }

  .section { margin-bottom: 28px; }
  .section h2 { font-size: 14px; font-weight: 600; color: #2563eb; text-transform: uppercase; letter-spacing: 0.5px; margin-bottom: 10px; padding-bottom: 4px; border-bottom: 1px solid #e5e7eb; }
  .section p, .section li { font-size: 12px; color: #333; }

  .two-col { display: flex; gap: 40px; }
  .two-col > div { flex: 1; }

  .summary-grid { display: grid; grid-template-columns: 1fr 1fr; gap: 8px 32px; }
  .summary-grid .label { font-size: 11px; color: #888; text-transform: uppercase; letter-spacing: 0.3px; }
  .summary-grid .value { font-size: 14px; font-weight: 600; color: #111; }

  ul { padding-left: 18px; }
  ul li { margin-bottom: 4px; }

  .signatures { margin-top: 50px; padding-top: 30px; border-top: 2px solid #e5e7eb; }
  .signatures h2 { font-size: 14px; font-weight: 600; color: #2563eb; text-transform: uppercase; letter-spacing: 0.5px; margin-bottom: 20px; }
  .sig-row { display: flex; gap: 60px; }
  .sig-block { flex: 1; }
  .sig-block .line { border-bottom: 1px solid #333; height: 36px; margin-bottom: 4px; }
  .sig-block .name-label { font-size: 11px; color: #888; }
  .sig-block .title-label { font-size: 11px; color: #888; margin-top: 24px; }
  .sig-block .line-title { border-bottom: 1px solid #333; height: 28px; margin-bottom: 4px; }

  .footer { text-align: center; margin-top: 40px; padding-top: 20px; border-top: 1px solid #e5e7eb; font-size: 10px; color: #999; }
  .footer a { color: #2563eb; text-decoration: none; }

  @media print {
    body { -webkit-print-color-adjust: exact; print-color-adjust: exact; }
    .page { padding: 20mm 25mm; }
  }
</style>
</head>
<body>
<div class="page">

<div class="header">
  <h1>Service Agreement</h1>
  <div class="sub">Between <strong>LaunchOps AI</strong> and <strong>${data.companyName}</strong></div>
  <div class="badge">Draft — ${date}</div>
</div>

<div class="section">
  <h2>Parties</h2>
  <div class="two-col">
    <div>
      <p><strong>LaunchOps AI</strong></p>
      <p style="font-size:11px;color:#666;">Raymon Suleiman<br>launchopsai.click<br>ray@launchopsai.click</p>
    </div>
    <div>
      <p><strong>${data.companyName}</strong></p>
      <p style="font-size:11px;color:#666;">${data.contactName}${data.contactEmail ? `<br>${data.contactEmail}` : ""}${data.website ? `<br>${data.website}` : ""}</p>
    </div>
  </div>
</div>

<div class="section">
  <h2>Services</h2>
  <p>LaunchOps AI agrees to provide the following services to ${data.companyName}:</p>
  <ul>
${servicesList}
  </ul>
  ${data.scope ? `<p style="margin-top:10px;"><strong>Scope of Work:</strong> ${data.scope}</p>` : ""}
  ${data.goals ? `<p style="margin-top:6px;"><strong>Goals &amp; Objectives:</strong> ${data.goals}</p>` : ""}
</div>

<div class="section">
  <h2>Fees &amp; Payment</h2>
  <div class="summary-grid">
    <div><div class="label">Monthly Retainer</div><div class="value">${retainer}</div></div>
    <div><div class="label">Setup Fee</div><div class="value">${setup}</div></div>
    <div><div class="label">Contract Duration</div><div class="value">${duration}</div></div>
    <div><div class="label">Payment Terms</div><div class="value">${paymentTerms}</div></div>
  </div>
</div>

<div class="section">
  <h2>Terms &amp; Conditions</h2>
  <p><strong>1. Term.</strong> This agreement begins on ${date} and continues for ${duration}. Either party may terminate with 30 days written notice after the initial term.</p>
  <p style="margin-top:8px;"><strong>2. Invoicing.</strong> LaunchOps AI will invoice ${data.companyName} on a monthly basis. Payment is due ${paymentTerms}.</p>
  <p style="margin-top:8px;"><strong>3. Intellectual Property.</strong> Upon full payment, all work product delivered under this agreement becomes the property of ${data.companyName}. LaunchOps AI retains the right to display the work in its portfolio.</p>
  <p style="margin-top:8px;"><strong>4. Confidentiality.</strong> Both parties agree to keep confidential all proprietary information shared during the course of this engagement.</p>
  <p style="margin-top:8px;"><strong>5. Limitation of Liability.</strong> LaunchOps AI's total liability under this agreement shall not exceed the fees paid in the 12 months prior to the claim.</p>
  <p style="margin-top:8px;"><strong>6. Governing Law.</strong> This agreement shall be governed by the laws of England and Wales.</p>
</div>

<div class="signatures">
  <h2>Signatures</h2>
  <p style="font-size:11px;color:#666;margin-bottom:24px;">By signing below, both parties agree to the terms of this Service Agreement.</p>
  <div class="sig-row">
    <div class="sig-block">
      <p class="name-label"><strong>LaunchOps AI</strong></p>
      <div class="line"></div>
      <p class="name-label">Signature</p>
      <div class="line-title"></div>
      <p class="title-label">Raymon Suleiman — Director</p>
    </div>
    <div class="sig-block">
      <p class="name-label"><strong>${data.companyName}</strong></p>
      <div class="line"></div>
      <p class="name-label">Signature</p>
      <div class="line-title"></div>
      <p class="title-label">${data.contactName}</p>
    </div>
  </div>
</div>

<div class="footer">
  LaunchOps AI &mdash; launchopsai.click &mdash; ray@launchopsai.click<br>
  This document was auto-generated and is a draft until signed by both parties.
</div>

</div>
</body>
</html>`
}
