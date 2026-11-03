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

/**
 * Send Trip Decision Email (Finance Approval or Rejection)
 */
const sendTripDecisionEmail = async ({ trip, decision, approvedBudget, comments, employeeEmail, employeeName, approverName }) => {
  const isApproved = decision === 'approved';
  const subject = isApproved
    ? `✈️ Trip Approved: ${trip.tripId} (${trip.fromCity} → ${trip.toCity})`
    : `❌ Trip Request Update: ${trip.tripId} (${trip.fromCity} → ${trip.toCity})`;

  const portalUrl = process.env.FRONTEND_URL || 'https://corporate-travel-management-one.vercel.app';

  const html = getTripDecisionEmailHTML({
    trip,
    decision,
    approvedBudget,
    comments,
    employeeName,
    approverName,
    portalUrl
  });

  const text = getTripDecisionEmailText({
    trip,
    decision,
    approvedBudget,
    comments,
    employeeName,
    approverName,
    portalUrl
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
  sendTripDecisionEmail,
  sendOTPEmail
};

