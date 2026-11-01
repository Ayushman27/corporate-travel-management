/**
 * Generates a luxury, enterprise-grade, responsive HTML email template for AeroSync CTM OTP.
 * Fully compatible with Gmail (iOS/Android/Web), Apple Mail, and Outlook.
 */
function getOTPEmailHTML(otp, userEmail) {
  return `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>AeroSync Verification Code</title>
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
        <h1 class="brand-title">✈ AeroSync</h1>
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
            <td class="details-val">AeroSync Employee Dashboard</td>
          </tr>
          <tr class="details-row">
            <td class="details-key">Security Status:</td>
            <td class="details-val" style="color: #27AE60;">● Active Encryption</td>
          </tr>
        </table>

        <!-- Security Note -->
        <div class="instructions">
          <strong>Security Notice:</strong> Never share this code with anyone. AeroSync representatives will never ask you for your verification code. If you did not make this request, you can safely disregard this message.
        </div>
      </div>

      <!-- Footer -->
      <div class="footer-bar">
        <p class="footer-text">
          © 2026 AeroSync Corporate Travel Management System.<br>
          Automated security dispatch — please do not reply to this email.
        </p>
      </div>
    </div>
  </div>
</body>
</html>`;
}

function getOTPEmailText(otp, userEmail) {
  return `✈ AEROSYNC CORPORATE TRAVEL MANAGEMENT
==========================================

Hello,

A sign-in request was initiated for your corporate travel account (${userEmail}).

Your One-Time Verification Code is:
>>> ${otp} <<<

(This code expires in 5 minutes)

Security Notice:
Never share this code with anyone. AeroSync representatives will never ask you for your code. If you did not initiate this request, you can safely disregard this email.

--
© 2026 AeroSync Inc. All rights reserved.
`;
}

module.exports = {
  getOTPEmailHTML,
  getOTPEmailText
};

