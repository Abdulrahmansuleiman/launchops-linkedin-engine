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

function addMonths(date: Date, months: number): Date {
  const d = new Date(date)
  d.setMonth(d.getMonth() + months)
  return d
}

function formatDate(date: Date): string {
  return date.toLocaleDateString("en-GB", { day: "numeric", month: "long", year: "numeric" })
}

export function generateContractHtml(data: ContractInput): string {
  const startDate = new Date()
  const endDate = data.contractDuration ? addMonths(startDate, data.contractDuration) : addMonths(startDate, 1)
  const firstPaymentDate = addMonths(startDate, 1)
  const dateStr = formatDate(startDate)
  const endDateStr = formatDate(endDate)
  const firstPaymentStr = formatDate(firstPaymentDate)
  const retainer = data.monthlyRetainer ? formatCurrency(data.monthlyRetainer) : "TBD"
  const setup = data.setupFee ? formatCurrency(data.setupFee) : "TBD"
  const duration = data.contractDuration ? `${data.contractDuration} months` : "Month to month"
  const paymentTermsDisplay = data.paymentTerms
    ? data.paymentTerms
    : "Net 14 days from invoice date"

  const servicesDotList = data.services.map((s) =>
    `<tr><td style="padding: 2px 0 2px 20px; font-size: 13.5px; color: #1F2937; line-height: 1.8;">. ${s}</td></tr>`
  ).join("\n")

  return `<!DOCTYPE html>
<html lang="en">
<head>
<meta charset="utf-8">
<title>Service Agreement | ${data.companyName}</title>
<link href="https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700&display=swap" rel="stylesheet">
<style>
  * { margin: 0; padding: 0; box-sizing: border-box; }
  body {
    font-family: 'Inter', system-ui, sans-serif;
    background: #0F0F0F;
    display: flex;
    justify-content: center;
    padding: 40px 20px;
  }
  #contract-document {
    max-width: 760px;
    width: 100%;
    padding: 64px 72px;
    background: #FFFFFF;
    border-radius: 4px;
    box-shadow: 0 4px 32px rgba(0,0,0,0.08);
  }

  .wordmark {
    text-align: center;
    font-size: 13px;
    font-weight: 600;
    color: #2563EB;
    letter-spacing: 0.05em;
    margin-bottom: 24px;
  }

  .doc-title {
    text-align: center;
    font-size: 28px;
    font-weight: 700;
    letter-spacing: -0.02em;
    color: #0D0D0D;
    margin-bottom: 8px;
  }
  .doc-sub {
    text-align: center;
    font-size: 14px;
    color: #6B7280;
    font-weight: 400;
    margin-bottom: 16px;
  }
  .status-pill {
    display: inline-block;
    background: #EFF6FF;
    color: #1D4ED8;
    font-size: 11px;
    font-weight: 500;
    padding: 4px 12px;
    border-radius: 999px;
    text-align: center;
    margin: 0 auto;
    display: table;
  }
  .header-spacer { height: 48px; }

  .section {
    margin-bottom: 32px;
  }
  .section-header {
    display: flex;
    align-items: center;
    gap: 14px;
    margin-bottom: 16px;
  }
  .section-accent {
    width: 3px;
    height: 20px;
    background: #2563EB;
    border-radius: 2px;
    flex-shrink: 0;
  }
  .section-label {
    font-size: 10px;
    font-weight: 600;
    text-transform: uppercase;
    letter-spacing: 0.12em;
    color: #2563EB;
    margin: 0;
  }

  .two-col {
    display: flex;
    gap: 48px;
  }
  .two-col > div { flex: 1; }
  .party-name {
    font-size: 14px;
    font-weight: 600;
    color: #0D0D0D;
    margin-bottom: 6px;
  }
  .party-detail {
    font-size: 13px;
    font-weight: 400;
    color: #4B5563;
    line-height: 1.7;
  }
  .party-detail a {
    color: #2563EB;
    text-decoration: none;
  }

  .body-text {
    font-size: 13.5px;
    font-weight: 400;
    line-height: 1.75;
    color: #1F2937;
    margin-bottom: 12px;
  }
  .body-text:last-child { margin-bottom: 0; }

  .sub-heading {
    font-size: 14px;
    font-weight: 600;
    color: #0D0D0D;
    margin-top: 16px;
    margin-bottom: 6px;
  }

  .fees-grid {
    display: grid;
    grid-template-columns: 1fr 1fr;
    gap: 32px 48px;
  }
  .fee-label {
    font-size: 10px;
    font-weight: 500;
    text-transform: uppercase;
    letter-spacing: 0.1em;
    color: #6B7280;
    margin-bottom: 4px;
  }
  .fee-value {
    font-size: 18px;
    font-weight: 600;
    color: #0D0D0D;
  }
  .fee-value-sm {
    font-size: 13.5px;
    font-weight: 400;
    color: #1F2937;
    line-height: 1.6;
  }

  .clause {
    margin-bottom: 24px;
  }
  .clause:last-child { margin-bottom: 0; }
  .clause-title {
    font-size: 13.5px;
    font-weight: 600;
    color: #0D0D0D;
  }
  .clause-body {
    font-size: 13.5px;
    font-weight: 400;
    color: #1F2937;
    line-height: 1.8;
  }

  .signatures {
    margin-top: 40px;
    padding-top: 32px;
  }
  .sig-intro {
    font-size: 13px;
    color: #6B7280;
    margin-bottom: 28px;
    line-height: 1.6;
  }
  .sig-row {
    display: flex;
    gap: 48px;
  }
  .sig-col { flex: 1; }
  .sig-col-title {
    font-size: 13px;
    font-weight: 600;
    color: #0D0D0D;
    margin-bottom: 8px;
  }
  .sig-line {
    border-bottom: 1.5px solid #D1D5DB;
    width: 200px;
    height: 36px;
    margin-bottom: 4px;
  }
  .sig-label {
    font-size: 11px;
    color: #9CA3AF;
    margin-bottom: 2px;
  }
  .sig-name {
    font-size: 12px;
    font-weight: 500;
    color: #374151;
  }

  .footer {
    text-align: center;
    margin-top: 48px;
    padding-top: 24px;
    border-top: 1px solid #E5E7EB;
  }
  .footer-text {
    font-size: 11px;
    color: #9CA3AF;
    line-height: 1.8;
  }
  .footer-text .dot {
    margin: 0 6px;
  }
</style>
</head>
<body>
<div id="contract-document">

  <div class="wordmark">LaunchOps</div>

  <h1 class="doc-title">Service Agreement</h1>
  <p class="doc-sub">Between LaunchOps AI and ${data.companyName}</p>
  <div class="status-pill">DRAFT | ${dateStr.toUpperCase()}</div>
  <div class="header-spacer"></div>

  <div class="section">
    <div class="section-header">
      <div class="section-accent"></div>
      <h2 class="section-label">Parties</h2>
    </div>
    <div class="two-col">
      <div>
        <p class="party-name">LaunchOps AI</p>
        <p class="party-detail">Raymon Suleiman<br>launchopsai.click<br>ray@launchopsai.click</p>
      </div>
      <div>
        <p class="party-name">${data.companyName}</p>
        <p class="party-detail">${data.contactName}${data.contactEmail ? `<br>${data.contactEmail}` : ""}${data.website ? `<br>${data.website}` : ""}</p>
      </div>
    </div>
  </div>

  <div class="section">
    <div class="section-header">
      <div class="section-accent"></div>
      <h2 class="section-label">Services</h2>
    </div>
    <p class="body-text">LaunchOps AI will deliver the following to ${data.companyName}:</p>
    <table style="border-collapse: collapse; width: 100%;">
      <tbody>
${servicesDotList}
      </tbody>
    </table>
    ${data.scope ? `
    <p class="sub-heading">Scope of Work</p>
    <p class="body-text">${data.scope}</p>
    ` : ""}
    ${data.goals ? `
    <p class="sub-heading">Goals</p>
    <p class="body-text">${data.goals}</p>
    ` : ""}
  </div>

  <div class="section">
    <div class="section-header">
      <div class="section-accent"></div>
      <h2 class="section-label">Fees and Payment</h2>
    </div>
    <div class="fees-grid">
      <div>
        <p class="fee-label">Monthly Retainer</p>
        <p class="fee-value">${retainer}</p>
      </div>
      <div>
        <p class="fee-label">Setup Fee</p>
        <p class="fee-value">${setup}</p>
      </div>
      <div>
        <p class="fee-label">Contract Duration</p>
        <p class="fee-value">${duration}</p>
      </div>
      <div>
        <p class="fee-label">Payment Terms</p>
        <p class="fee-value-sm">${paymentTermsDisplay}. Payment is due on ${firstPaymentStr}. An invoice will be sent in advance.</p>
      </div>
    </div>
  </div>

  <div class="section">
    <div class="section-header">
      <div class="section-accent"></div>
      <h2 class="section-label">Terms and Conditions</h2>
    </div>

    <div class="clause">
      <p class="clause-body"><span class="clause-title">Term.</span> This agreement begins on ${dateStr} and runs for ${duration}. Either party may end it with 30 days written notice after the initial term.</p>
    </div>

    <div class="clause">
      <p class="clause-body"><span class="clause-title">Invoicing.</span> LaunchOps AI will invoice ${data.companyName} on a monthly basis. The first payment is due on ${firstPaymentStr}. An invoice will be sent no later than 6pm on that date.</p>
    </div>

    <div class="clause">
      <p class="clause-body"><span class="clause-title">Intellectual Property.</span> Upon full payment, all work product delivered under this agreement becomes the property of ${data.companyName}. LaunchOps AI retains the right to display the work in its portfolio.</p>
    </div>

    <div class="clause">
      <p class="clause-body"><span class="clause-title">Confidentiality.</span> Both parties agree to keep confidential all proprietary information shared during the course of this engagement.</p>
    </div>

    <div class="clause">
      <p class="clause-body"><span class="clause-title">Limitation of Liability.</span> LaunchOps AI total liability under this agreement will not exceed the fees paid in the 12 months prior to the claim.</p>
    </div>

    <div class="clause">
      <p class="clause-body"><span class="clause-title">Governing Law.</span> This agreement is governed by the laws of England and Wales.</p>
    </div>
  </div>

  <div class="section signatures">
    <div class="section-header">
      <div class="section-accent"></div>
      <h2 class="section-label">Signatures</h2>
    </div>
    <p class="sig-intro">By signing below, both parties confirm they have read and agree to the terms of this Service Agreement.</p>
    <div class="sig-row">
      <div class="sig-col">
        <p class="sig-col-title">LaunchOps AI</p>
        <div class="sig-line"></div>
        <p class="sig-label">Signature</p>
        <p class="sig-name">Raymon Suleiman, Director</p>
      </div>
      <div class="sig-col">
        <p class="sig-col-title">${data.companyName}</p>
        <div class="sig-line"></div>
        <p class="sig-label">Signature</p>
        <p class="sig-name">${data.contactName}</p>
      </div>
    </div>
  </div>

  <div class="footer">
    <p class="footer-text">
      LaunchOps AI <span class="dot">.</span> launchopsai.click <span class="dot">.</span> ray@launchopsai.click<br>
      This document was auto-generated and is a draft until signed by both parties.
    </p>
  </div>

</div>
</body>
</html>`
}
