const jwt = require('jsonwebtoken');
const axios = require('axios');
const nodemailer = require('nodemailer');
const logger = require('../utils/logger');
const {
  getOTPEmailHTML,
  getOTPEmailText,
  getTripDecisionEmailHTML,
  getTripDecisionEmailText
} = require('../utils/emailTemplates');

/**
 * Universal email dispatcher:
 * 1. Tries Brevo (Sendinblue) Transactional REST API
 * 2. Falls back to Nodemailer SMTP (e.g. Brevo SMTP Relay)
 * 3. Falls back to console log with full payload if no credentials available
 */
const sendEmail = async ({ to, subject, html, text }) => {
  if (!to) {
    logger.warn('[EmailService] Dispatch aborted: recipient email is missing');
    return { sent: false, reason: 'Recipient email missing' };
  }

  const senderEmail = process.env.BREVO_SENDER_EMAIL || process.env.SMTP_EMAIL || 'htrackcom@gmail.com';
  const senderName  = process.env.BREVO_SENDER_NAME  || 'Travello CTM';

  // 1. Try Brevo REST API
  if (process.env.BREVO_API_KEY) {
    try {
      const response = await axios.post(
        'https://api.brevo.com/v3/smtp/email',
        {
          sender: { name: senderName, email: senderEmail },
          to: [{ email: to }],
          subject,
          htmlContent: html,
          textContent: text
        },
        {
          headers: {
            'accept': 'application/json',
            'api-key': process.env.BREVO_API_KEY,
            'content-type': 'application/json'
          },
          timeout: 10000
        }
      );

      logger.info(`[EmailService/Brevo] Email successfully dispatched to ${to} (${subject}). Message ID: ${response.data?.messageId}`);
      return { sent: true, provider: 'brevo', messageId: response.data?.messageId };
    } catch (err) {
      logger.error(`[EmailService/Brevo] Failed to dispatch via Brevo API: ${err.response?.data?.message || err.message}`);
    }
  }

  // 2. Try Nodemailer SMTP Relay
  const smtpHost = process.env.SMTP_HOST;
  const smtpPort = parseInt(process.env.SMTP_PORT || '587', 10);
  const smtpUser = process.env.SMTP_USER || process.env.SMTP_EMAIL;
  const smtpPass = process.env.SMTP_PASSWORD || process.env.SMTP_PASS;

  if (smtpHost && smtpUser && smtpPass) {
    try {
      const transporter = nodemailer.createTransport({
        host: smtpHost,
        port: smtpPort,
        secure: smtpPort === 465,
        connectionTimeout: 8000,
        greetingTimeout: 8000,
        socketTimeout: 8000,
        auth: { user: smtpUser, pass: smtpPass }
      });

      const info = await transporter.sendMail({
        from: `"${senderName}" <${senderEmail}>`,
        to,
        subject,
        html,
        text
      });

      logger.info(`[EmailService/SMTP] Email successfully dispatched to ${to} via ${smtpHost}. Message ID: ${info.messageId}`);
      return { sent: true, provider: 'smtp', messageId: info.messageId };
    } catch (err) {
      logger.error(`[EmailService/SMTP] Failed to dispatch via SMTP: ${err.message}`);
    }
  }

  // 3. Fallback
  logger.warn(`[EmailService/ConsoleFallback] No live email provider succeeded. Logged to console. To: ${to}, Subject: "${subject}"`);
  return { sent: false, reason: 'No external email provider succeeded' };
};

const cleanBaseUrl = (url) => {
  if (!url) return 'https://corporate-travel-management-one.vercel.app';
  let base = url.split(',')[0].trim().replace(/\/+$/, '');
  base = base.replace(/\/(dashboard|login|trip|manager|finance).*$/, '');
  if (base.includes('localhost') || base.includes('127.0.0.1')) {
    return 'https://corporate-travel-management-one.vercel.app';
  }
  return base || 'https://corporate-travel-management-one.vercel.app';
};

/**
 * Send Trip Decision Email (Finance Approval or Rejection) with secure passwordless magic link
 */
const sendTripDecisionEmail = async ({
  trip,
  decision,
  approvedBudget,
  comments,
  employeeEmail,
  employeeName,
  approverName,
  employeeId,
  companyId
}) => {
  const isApproved = decision === 'approved';
  const subject = isApproved
    ? `✈️ Trip Approved: ${trip.tripId} (${trip.fromCity} → ${trip.toCity})`
    : `❌ Trip Request Update: ${trip.tripId} (${trip.fromCity} → ${trip.toCity})`;

  const portalUrl = cleanBaseUrl(process.env.FRONTEND_URL);

  const empId = employeeId || trip.employeeId;
  const compId = companyId || trip.companyId;

  // Sign a secure, unique 14-day magic token for direct passwordless access
  let magicToken = '';
  try {
    magicToken = jwt.sign(
      {
        purpose: 'magic_trip_login',
        employeeId: empId,
        email: employeeEmail?.toLowerCase()?.trim(),
        companyId: compId,
        tripId: trip.tripId
      },
      process.env.JWT_SECRET || 'dev_secret',
      { expiresIn: '14d' }
    );
  } catch (signErr) {
    logger.warn(`[EmailService] Failed to sign magic token: ${signErr.message}`);
  }

  const bookingUrl = magicToken
    ? `${portalUrl}/magic-login?token=${encodeURIComponent(magicToken)}&redirect=${encodeURIComponent(`/trip/${trip.tripId}`)}`
    : `${portalUrl}/trip/${trip.tripId}`;

  const dashboardUrl = magicToken
    ? `${portalUrl}/magic-login?token=${encodeURIComponent(magicToken)}&redirect=${encodeURIComponent('/dashboard')}`
    : `${portalUrl}/dashboard`;

  const html = getTripDecisionEmailHTML({
    trip,
    decision,
    approvedBudget,
    comments,
    employeeName,
    approverName,
    portalUrl,
    magicToken,
    bookingUrl,
    dashboardUrl
  });

  const text = getTripDecisionEmailText({
    trip,
    decision,
    approvedBudget,
    comments,
    employeeName,
    approverName,
    portalUrl,
    magicToken,
    bookingUrl,
    dashboardUrl
  });

  return sendEmail({
    to: employeeEmail,
    subject,
    html,
    text
  });
};

/**
 * Send OTP Verification Email
 */
const sendOTPEmail = async (otp, actualUserEmail) => {
  const subject = `Your Travello Verification Code: ${otp}`;
  const html = getOTPEmailHTML(otp, actualUserEmail);
  const text = getOTPEmailText(otp, actualUserEmail);

  return sendEmail({
    to: actualUserEmail,
    subject,
    html,
    text
  });
};

module.exports = {
  sendEmail,
  sendOTPEmail,
  sendTripDecisionEmail,
};
