/**
 * Generates a luxury, enterprise-grade, responsive HTML email template for Travello CTM OTP.
 * Fully compatible with Gmail (iOS/Android/Web), Apple Mail, and Outlook.
 */
function getOTPEmailHTML(otp, userEmail) {
  return `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Travello Verification Code</title>
  <style>
    body {
      margin: 0;
      padding: 0;
      background-color: #0d0f12;
      font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif;
      color: #e6e8eb;
      -webkit-font-smoothing: antialiased;
    }
    table {
      border-collapse: collapse;
    }
    .wrapper {
      width: 100%;
      background-color: #0d0f12;
      padding: 36px 12px;
    }
    .card {
      max-width: 520px;
      margin: 0 auto;
      background: #15181e;
      border: 1px solid rgba(196, 162, 93, 0.28);
      border-radius: 16px;
      overflow: hidden;
      box-shadow: 0 12px 40px rgba(0, 0, 0, 0.45);
    }
    .header-bar {
      background: linear-gradient(135deg, #1f1b13 0%, #15181e 100%);
      padding: 32px 36px 24px;
      border-bottom: 1px solid rgba(196, 162, 93, 0.18);
      text-align: center;
    }
    .brand-title {
      font-family: 'Georgia', serif;
      font-size: 26px;
      font-weight: 700;
      letter-spacing: 1.5px;
      color: #C4A25D;
      margin: 0;
    }
    .brand-sub {
      font-size: 11px;
      font-weight: 600;
      letter-spacing: 2px;
      text-transform: uppercase;
      color: #8c8270;
      margin-top: 6px;
    }
    .content-body {
      padding: 32px 36px;
    }
    .greeting {
      font-size: 16px;
      color: #f0f2f5;
      font-weight: 600;
      margin: 0 0 10px;
    }
    .intro-text {
      font-size: 14px;
      line-height: 1.6;
      color: #b0b4ba;
      margin: 0 0 24px;
    }
    .otp-box-wrapper {
      background: linear-gradient(180deg, rgba(196, 162, 93, 0.08) 0%, rgba(196, 162, 93, 0.02) 100%);
      border: 1px solid rgba(196, 162, 93, 0.35);
      border-radius: 12px;
      padding: 24px;
      text-align: center;
      margin-bottom: 24px;
    }
    .otp-label {
      font-size: 11px;
      font-weight: 700;
      text-transform: uppercase;
      letter-spacing: 2px;
      color: #A38647;
      margin: 0 0 10px;
    }
    .otp-code {
      font-family: 'Courier New', Courier, monospace;
      font-size: 38px;
      font-weight: 800;
      letter-spacing: 10px;
      color: #F3E5AB;
      margin: 0;
      text-shadow: 0 2px 10px rgba(196, 162, 93, 0.3);
    }
    .otp-expiry {
      font-size: 12px;
      color: #8c8270;
      margin-top: 10px;
      margin-bottom: 0;
    }
    .details-table {
      width: 100%;
      background: #1a1e26;
      border-radius: 8px;
      padding: 12px 16px;
      margin-bottom: 24px;
      border: 1px solid rgba(255, 255, 255, 0.05);
    }
    .details-row td {
      padding: 6px 0;
      font-size: 13px;
    }
    .details-key {
      color: #7b818c;
      width: 40%;
    }
    .details-val {
      color: #e1e4e8;
      font-weight: 500;
      text-align: right;
    }
    .instructions {
      font-size: 13px;
      line-height: 1.5;
      color: #9ba1ab;
      margin: 0 0 24px;
      border-left: 2px solid #C4A25D;
      padding-left: 14px;
    }
    .footer-bar {
      background: #0f1115;
      padding: 20px 36px;
      border-top: 1px solid rgba(255, 255, 255, 0.05);
      text-align: center;
    }
    .footer-text {
      font-size: 11px;
      line-height: 1.5;
      color: #636873;
      margin: 0;
    }
    .footer-security {
      font-size: 11px;
      color: #7d6b49;
      margin-top: 6px;
    }
  </style>
</head>
<body>
  <div class="wrapper">
    <div class="card">
      <!-- Brand Header -->
      <div class="header-bar">
        <h1 class="brand-title">✈ Travello</h1>
        <div class="brand-sub">Corporate Travel Management</div>
      </div>

      <!-- Content Body -->
      <div class="content-body">
        <p class="greeting">Hello,</p>
        <p class="intro-text">
          A sign-in request was initiated for your corporate travel account. Please use the verification code below to complete your login securely:
        </p>

        <!-- OTP Code Box -->
        <div class="otp-box-wrapper">
          <p class="otp-label">One-Time Verification Code</p>
          <div class="otp-code">${otp}</div>
          <p class="otp-expiry">⏱ Valid for the next 5 minutes</p>
        </div>

        <!-- Request Details -->
        <table class="details-table" role="presentation">
          <tr class="details-row">
            <td class="details-key">Target Account:</td>
            <td class="details-val">${userEmail}</td>
          </tr>
          <tr class="details-row">
            <td class="details-key">Portal:</td>
            <td class="details-val">Travello Employee Dashboard</td>
          </tr>
          <tr class="details-row">
            <td class="details-key">Security Status:</td>
            <td class="details-val" style="color: #27AE60;">● Active Encryption</td>
          </tr>
        </table>

        <!-- Security Note -->
        <div class="instructions">
          <strong>Security Notice:</strong> Never share this code with anyone. Travello representatives will never ask you for your verification code. If you did not make this request, you can safely disregard this message.
        </div>
      </div>

      <!-- Footer -->
      <div class="footer-bar">
        <p class="footer-text">
          © 2026 Travello Corporate Travel Management System.<br>
          Automated security dispatch — please do not reply to this email.
        </p>
      </div>
    </div>
  </div>
</body>
</html>`;
}

function getOTPEmailText(otp, userEmail) {
  return `✈ TRAVELLO CORPORATE TRAVEL MANAGEMENT
==========================================

Hello,

A sign-in request was initiated for your corporate travel account (${userEmail}).

Your One-Time Verification Code is:
>>> ${otp} <<<

(This code expires in 5 minutes)

Security Notice:
Never share this code with anyone. Travello representatives will never ask you for your code. If you did not initiate this request, you can safely disregard this email.

--
© 2026 Travello Inc. All rights reserved.
`;
}

/**
 * Generates an executive, responsive HTML email template for Trip Decision (Approved or Rejected by Finance).
 */
function getTripDecisionEmailHTML({ trip, decision, approvedBudget, comments, employeeName, approverName, portalUrl, magicToken, bookingUrl, dashboardUrl }) {
  const isApproved = decision === 'approved';
  const statusColor = isApproved ? '#10B981' : '#EF4444';
  const statusBg    = isApproved ? 'rgba(16, 185, 129, 0.12)' : 'rgba(239, 68, 68, 0.12)';
  const statusBorder= isApproved ? 'rgba(16, 185, 129, 0.35)' : 'rgba(239, 68, 68, 0.35)';
  const badgeLabel  = isApproved ? '✓ APPROVED BY FINANCE' : '✕ REJECTED BY FINANCE';
  const headline    = isApproved ? 'Trip Request Approved' : 'Trip Request Declined';

  const travelDateStr = trip.travelDate
    ? new Date(trip.travelDate).toLocaleDateString('en-IN', { weekday: 'short', day: 'numeric', month: 'short', year: 'numeric' })
    : 'Not specified';

  const returnDateStr = trip.returnDate
    ? new Date(trip.returnDate).toLocaleDateString('en-IN', { weekday: 'short', day: 'numeric', month: 'short', year: 'numeric' })
    : 'One-way';

  const defaultPortal = 'https://corporate-travel-management-one.vercel.app';
  const finalBookingUrl = bookingUrl || (portalUrl ? `${portalUrl}/trip/${trip.tripId}` : `${defaultPortal}/trip/${trip.tripId}`);
  const finalDashboardUrl = dashboardUrl || (portalUrl ? `${portalUrl}/dashboard` : `${defaultPortal}/dashboard`);

  const budgetDisplay = isApproved
    ? `<div style="background: rgba(16, 185, 129, 0.08); border: 1px solid rgba(16, 185, 129, 0.25); border-radius: 10px; padding: 18px 20px; margin-bottom: 24px; text-align: center;">
         <div style="font-size: 11px; font-weight: 700; letter-spacing: 1.5px; text-transform: uppercase; color: #10B981; margin-bottom: 6px;">Approved Travel Budget</div>
         <div style="font-size: 32px; font-weight: 700; color: #f0fdf4; letter-spacing: -0.5px;">₹${Number(approvedBudget || trip.approvedBudget || trip.estimatedBudget || 0).toLocaleString('en-IN')}</div>
         ${trip.estimatedBudget && Number(trip.estimatedBudget) !== Number(approvedBudget) ? `<div style="font-size: 12px; color: #9ca3af; margin-top: 4px;">Requested: ₹${Number(trip.estimatedBudget).toLocaleString('en-IN')}</div>` : ''}
       </div>`
    : `<div style="background: rgba(239, 68, 68, 0.08); border: 1px solid rgba(239, 68, 68, 0.25); border-radius: 10px; padding: 18px 20px; margin-bottom: 24px; text-align: center;">
         <div style="font-size: 11px; font-weight: 700; letter-spacing: 1.5px; text-transform: uppercase; color: #ef4444; margin-bottom: 6px;">Requested Travel Budget</div>
         <div style="font-size: 28px; font-weight: 700; color: #fef2f2; letter-spacing: -0.5px;">₹${Number(trip.estimatedBudget || 0).toLocaleString('en-IN')}</div>
       </div>`;

  const commentsBox = comments ? `
    <div style="background: ${isApproved ? 'rgba(196, 162, 93, 0.08)' : 'rgba(239, 68, 68, 0.08)'}; border-left: 3px solid ${isApproved ? '#C4A25D' : '#ef4444'}; border-radius: 0 8px 8px 0; padding: 12px 16px; margin-bottom: 24px;">
      <div style="font-size: 11px; font-weight: 700; letter-spacing: 1px; text-transform: uppercase; color: ${isApproved ? '#C4A25D' : '#ef4444'}; margin-bottom: 4px;">Finance Department Remarks</div>
      <div style="font-size: 13px; color: #e5e7eb; line-height: 1.5; font-style: italic;">"${comments}"</div>
    </div>` : '';

  return `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>${headline}</title>
  <style>
    body {
      margin: 0; padding: 0;
      background-color: #0b0e14;
      font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif;
      color: #e6e8eb;
      -webkit-font-smoothing: antialiased;
    }
    table { border-collapse: collapse; }
    .wrapper { width: 100%; background-color: #0b0e14; padding: 36px 12px; }
    .card {
      max-width: 540px; margin: 0 auto;
      background: #141a24;
      border: 1px solid rgba(255, 255, 255, 0.1);
      border-radius: 16px; overflow: hidden;
      box-shadow: 0 16px 48px rgba(0, 0, 0, 0.5);
    }
    .header-bar {
      background: #10151d;
      padding: 28px 36px 20px;
      border-bottom: 1px solid rgba(255, 255, 255, 0.08);
      text-align: center;
    }
    .brand-title {
      font-size: 22px; font-weight: 800; letter-spacing: -0.5px;
      color: #ffffff; margin: 0;
    }
    .brand-sub {
      font-size: 10px; font-weight: 700; letter-spacing: 2px;
      text-transform: uppercase; color: #94a3b8; margin-top: 4px;
    }
    .content-body { padding: 32px 36px; }
    .badge-pill {
      display: inline-block; padding: 5px 14px; border-radius: 999px;
      font-size: 11px; font-weight: 700; letter-spacing: 1px;
      text-transform: uppercase; margin-bottom: 16px;
    }
    .main-heading {
      font-size: 20px; font-weight: 700; color: #ffffff;
      margin: 0 0 8px; letter-spacing: -0.3px;
    }
    .intro-msg {
      font-size: 14px; line-height: 1.6; color: #94a3b8;
      margin: 0 0 20px;
    }
    .details-table {
      width: 100%; background: #18202d;
      border-radius: 10px; padding: 14px 18px; margin-bottom: 24px;
      border: 1px solid rgba(255, 255, 255, 0.06);
    }
    .details-row td { padding: 7px 0; font-size: 13px; }
    .details-key { color: #64748b; width: 42%; font-weight: 500; }
    .details-val { color: #f1f5f9; font-weight: 600; text-align: right; }
    .btn-action {
      display: inline-block; width: 100%; box-sizing: border-box;
      padding: 14px 20px; border-radius: 10px;
      background: ${isApproved ? 'linear-gradient(135deg, #2563EB 0%, #1D4ED8 100%)' : '#27272a'};
      color: #ffffff !important; text-align: center; font-size: 14px;
      font-weight: 700; text-decoration: none; letter-spacing: 0.5px;
      box-shadow: ${isApproved ? '0 4px 16px rgba(37, 99, 235, 0.35)' : 'none'};
    }
    .footer-bar {
      background: #0d1117; padding: 20px 36px;
      border-top: 1px solid rgba(255, 255, 255, 0.05); text-align: center;
    }
    .footer-text { font-size: 11px; line-height: 1.5; color: #64748b; margin: 0; }
  </style>
</head>
<body>
  <div class="wrapper">
    <div class="card">
      <div class="header-bar">
        <h1 class="brand-title">✈ Travello</h1>
        <div class="brand-sub">Corporate Travel Management</div>
      </div>

      <div class="content-body">
        <div class="badge-pill" style="background: ${statusBg}; border: 1px solid ${statusBorder}; color: ${statusColor};">
          ${badgeLabel}
        </div>

        <h2 class="main-heading">${headline}</h2>
        <p class="intro-msg">
          Hello <strong>${employeeName || 'Colleague'}</strong>,<br>
          ${isApproved
            ? `Your travel request has been reviewed and <strong style="color: #10B981;">approved</strong> by the Finance Department. You can now proceed to review the booking options on the Travello portal.`
            : `Your travel request has been reviewed and <strong style="color: #ef4444;">declined</strong> by the Finance Department. Please see the remarks below for details.`}
        </p>

        ${budgetDisplay}

        ${commentsBox}

        <table class="details-table" role="presentation">
          <tr class="details-row">
            <td class="details-key">Trip Reference ID:</td>
            <td class="details-val" style="font-family: monospace; color: #38bdf8;">${trip.tripId}</td>
          </tr>
          <tr class="details-row">
            <td class="details-key">Itinerary Route:</td>
            <td class="details-val">${trip.fromCity} ➔ ${trip.toCity}</td>
          </tr>
          <tr class="details-row">
            <td class="details-key">Departure Date:</td>
            <td class="details-val">${travelDateStr}</td>
          </tr>
          ${trip.returnDate ? `
          <tr class="details-row">
            <td class="details-key">Return Date:</td>
            <td class="details-val">${returnDateStr}</td>
          </tr>` : ''}
          <tr class="details-row">
            <td class="details-key">Travel Mode:</td>
            <td class="details-val" style="text-transform: capitalize;">${trip.travelMode || 'Mixed - AI Planned'}</td>
          </tr>
          ${trip.purpose ? `
          <tr class="details-row">
            <td class="details-key">Purpose of Travel:</td>
            <td class="details-val">${trip.purpose}</td>
          </tr>` : ''}
          ${approverName ? `
          <tr class="details-row">
            <td class="details-key">Reviewed By:</td>
            <td class="details-val">${approverName} (Finance)</td>
          </tr>` : ''}
        </table>

        <div style="text-align: center; margin-top: 28px;">
          <a href="${finalBookingUrl}" class="btn-action" target="_blank">
            ${isApproved ? 'Open Trip & Complete Booking' : 'Review Trip Details on Portal'}
          </a>
        </div>

        <div style="text-align: center; margin-top: 14px;">
          <a href="${finalDashboardUrl}" style="color: #94a3b8; font-size: 13px; font-weight: 600; text-decoration: underline;" target="_blank">
            Or open your Employee Dashboard directly →
          </a>
        </div>

        <div style="text-align: center; margin-top: 14px;">
          <span style="display: inline-block; padding: 6px 14px; border-radius: 999px; background: rgba(37, 99, 235, 0.12); border: 1px solid rgba(37, 99, 235, 0.25); font-size: 11px; font-weight: 600; color: #60a5fa;">
            🔒 1-Click Secure Access — No OTP Login Required
          </span>
        </div>
      </div>

      <div class="footer-bar">
        <p class="footer-text">
          © 2026 Travello Corporate Travel Management System.<br>
          Automated travel notification dispatch — please do not reply directly to this email.
        </p>
      </div>
    </div>
  </div>
</body>
</html>`;
}

function getTripDecisionEmailText({ trip, decision, approvedBudget, comments, employeeName, approverName, portalUrl, bookingUrl, dashboardUrl }) {
  const isApproved = decision === 'approved';
  const defaultPortal = 'https://corporate-travel-management-one.vercel.app';
  const finalBookingUrl = bookingUrl || (portalUrl ? `${portalUrl}/trip/${trip.tripId}` : `${defaultPortal}/trip/${trip.tripId}`);
  const finalDashboardUrl = dashboardUrl || (portalUrl ? `${portalUrl}/dashboard` : `${defaultPortal}/dashboard`);
  return `✈ TRAVELLO CORPORATE TRAVEL MANAGEMENT
==========================================

Trip Decision: ${isApproved ? 'APPROVED' : 'REJECTED'} BY FINANCE

Hello ${employeeName || 'Colleague'},

${isApproved
  ? `Your travel request (${trip.tripId}) has been APPROVED by the Finance Department.`
  : `Your travel request (${trip.tripId}) has been REJECTED by the Finance Department.`}

Trip Details:
-------------
• Trip ID: ${trip.tripId}
• Route: ${trip.fromCity} -> ${trip.toCity}
• Departure: ${trip.travelDate ? new Date(trip.travelDate).toDateString() : 'N/A'}
${trip.returnDate ? `• Return: ${new Date(trip.returnDate).toDateString()}\n` : ''}• Requested Budget: Rs. ${(Number(trip.estimatedBudget) || 0).toLocaleString('en-IN')}
${isApproved ? `• Approved Budget: Rs. ${(Number(approvedBudget || trip.approvedBudget || trip.estimatedBudget) || 0).toLocaleString('en-IN')}\n` : ''}${comments ? `• Finance Remarks: "${comments}"\n` : ''}${approverName ? `• Reviewed By: ${approverName} (Finance)\n` : ''}

>> Open Trip & Complete Booking (Direct Access - No OTP Login):
${finalBookingUrl}

>> Or Open Your Dashboard Directly:
${finalDashboardUrl}

--
© 2026 Travello Corporate Travel Management System.
`;
}

module.exports = {
  getOTPEmailHTML,
  getOTPEmailText,
  getTripDecisionEmailHTML,
  getTripDecisionEmailText
};

