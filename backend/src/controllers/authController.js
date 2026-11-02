const jwt = require('jsonwebtoken');
const { v4: uuidv4 } = require('uuid');
const User = require('../models/User');
const Company = require('../models/Company');
const { syncCompanySheets, getEmployeeByEmail, getAllEmployees } = require('../services/excelService');
const { audit } = require('../services/auditService');
const logger = require('../utils/logger');
const nodemailer = require('nodemailer');
const axios = require('axios');
const { getOTPEmailHTML, getOTPEmailText } = require('../utils/emailTemplates');

const otpStore = new Map(); // Simple in-memory store for OTPs

const sendOTPEmail = async (otp, actualUserEmail) => {
  // 1. Try Brevo (formerly Sendinblue) Transactional Email API
  if (process.env.BREVO_API_KEY) {
    try {
      const senderEmail = process.env.BREVO_SENDER_EMAIL || process.env.SMTP_EMAIL || 'htrackcom@gmail.com';
      const senderName = process.env.BREVO_SENDER_NAME || 'AeroSync CTM';

      const response = await axios.post(
        'https://api.brevo.com/v3/smtp/email',
        {
          sender: { name: senderName, email: senderEmail },
          to: [{ email: actualUserEmail }],
          subject: `Your AeroSync Verification Code: ${otp}`,
          htmlContent: getOTPEmailHTML(otp, actualUserEmail),
          textContent: getOTPEmailText(otp, actualUserEmail)
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

      console.log(`[BREVO OTP] Email successfully sent to ${actualUserEmail}. Message ID:`, response.data?.messageId);
      return { sent: true, provider: 'brevo', messageId: response.data?.messageId };
    } catch (err) {
      console.error(`[BREVO OTP] Failed to send via Brevo API:`, err.response?.data || err.message);
      // Fall through to SMTP if configured or console fallback
    }
  }

    // 2. Try Custom SMTP (e.g. Brevo SMTP relay or standard SMTP)
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
        connectionTimeout: 5000,
        greetingTimeout: 5000,
        socketTimeout: 5000,
        auth: {
          user: smtpUser,
          pass: smtpPass
        }
      });

      const senderEmail = process.env.BREVO_SENDER_EMAIL || process.env.SMTP_FROM || process.env.SMTP_EMAIL || 'htrackcom@gmail.com';

      await transporter.sendMail({
        from: `"AeroSync CTM" <${senderEmail}>`,
        to: actualUserEmail,
        subject: `Your AeroSync Verification Code: ${otp}`,
        html: getOTPEmailHTML(otp, actualUserEmail),
        text: getOTPEmailText(otp, actualUserEmail)
      });

      console.log(`[CUSTOM SMTP OTP] Real Email successfully sent to ${actualUserEmail} via ${smtpHost}`);
      return { sent: true, provider: 'custom_smtp' };
    } catch (error) {
      console.error("[CUSTOM SMTP OTP] Error sending real email:", error.message);
    }
  }

  // 3. Fallback when neither service is active or working
  console.log(`[OTP SYSTEM] Notice: No active email service succeeded. Falling back to local/debug display.`);
  console.log(`[OTP] To: ${actualUserEmail}`);
  console.log(`[OTP] Code: ${otp}`);
  return { sent: false, reason: 'No email service succeeded' };
};

const signToken = (id) =>
  jwt.sign({ id }, process.env.JWT_SECRET || 'dev_secret', {
    expiresIn: process.env.JWT_EXPIRES_IN || '7d'
  });

// ── POST /api/auth/register-company ──────────────────────────────────────────
// Company head registers a new company. Downloads sheets and creates users.
const registerCompany = async (req, res, next) => {
  try {
    const {
      companyName, headName, headEmail, headPassword,
      hrmsSheetUrl, financeSheetUrl,
      policy
    } = req.body;

    // Basic validation
    if (!companyName || !headName || !headEmail || !headPassword) {
      return res.status(400).json({ success: false, message: 'companyName, headName, headEmail, and headPassword are required' });
    }
    if (!hrmsSheetUrl || !financeSheetUrl) {
      return res.status(400).json({ success: false, message: 'Both hrmsSheetUrl and financeSheetUrl are required' });
    }

    // Check duplicate company
    const existing = await Company.findOne({ headEmail: headEmail.toLowerCase() });
    if (existing) {
      return res.status(409).json({ success: false, message: 'A company is already registered with this email' });
    }

    const companyId = `COMP-${uuidv4().substring(0, 8).toUpperCase()}`;

    // 1. Download Google Sheets
    try {
      await syncCompanySheets(companyId, hrmsSheetUrl, financeSheetUrl);
    } catch (err) {
      logger.error(`[Auth] Failed to download sheets: ${err.message}`);
      return res.status(400).json({
        success: false,
        message: `Failed to download sheets. Make sure the Google Sheets links are publicly accessible (Share → Anyone with the link). Error: ${err.message}`
      });
    }

    // 2. Create Company document
    const company = await Company.create({
      companyId,
      companyName,
      headName,
      headEmail,
      headPassword,
      hrmsSheetUrl,
      financeSheetUrl,
      policy: policy || {},
      lastSheetSync: new Date()
    });

    // 3. Create admin user for the company head
    const headUser = await User.create({
      employeeId: 'ADMIN-001',
      companyId,
      name: headName,
      email: headEmail.toLowerCase(),
      password: headPassword,
      department: 'Management',
      role: 'admin',
      loginType: 'password',
      travelBudgetLimit: policy?.budgetLimits?.admin || 500000
    });

    // 4. Import employees and budgets from the HRMS/Finance sheet into Neon DB
    let importedCount = 0;
    try {
      const { syncCompanyDataToDB } = require('../services/excelService');
      const syncRes = await syncCompanyDataToDB(companyId, hrmsSheetUrl);
      importedCount = syncRes.empSynced;
      logger.info(`[Auth] Synced ${importedCount} employees and ${syncRes.budgetSynced} budgets to Neon DB for company ${companyId}`);
    } catch (err) {
      logger.warn(`[Auth] Employee import fallback: ${err.message}`);
    }
    const token = signToken(headUser._id);
    await audit('COMPANY_REGISTERED', { actor: headUser, details: { companyId, companyName, importedCount } });

    res.status(201).json({
      success: true,
      token,
      user: headUser,
      company,
      importedEmployees: importedCount
    });
  } catch (err) {
    next(err);
  }
};

// ── POST /api/auth/employee-login ────────────────────────────────────────────
// Employee logs in with just email — validated against HRMS sheet.
const employeeLogin = async (req, res, next) => {
  try {
    const { email, companyId, otp } = req.body;
    if (!email || !companyId) {
      return res.status(400).json({ success: false, message: 'Email and companyId are required' });
    }

    const emailKey = `${companyId}:${email.toLowerCase().trim()}`;

    // If OTP is provided, verify it first
    if (otp) {
      const stored = otpStore.get(emailKey);
      if (!stored || stored.otp !== otp || Date.now() > stored.expiresAt) {
        return res.status(401).json({ success: false, message: 'Invalid or expired OTP' });
      }
      otpStore.delete(emailKey); // consume OTP
    }

    console.log(`[EmployeeLogin] Attempting login for: ${email} (company: ${companyId})`);

    // Find the company
    const company = await Company.findOne({ companyId, isActive: true });
    if (!company) {
      console.log(`[EmployeeLogin] Company not found: ${companyId}`);
      return res.status(404).json({ success: false, message: 'Company not found or inactive' });
    }

    // Look up employee in HRMS Excel
    let hrmsEmployee;
    try {
      hrmsEmployee = getEmployeeByEmail(companyId, email);
    } catch (err) {
      console.log(`[EmployeeLogin] HRMS lookup error: ${err.message}`);
      // File might be missing — will try re-download below
    }

    // If not found or file was missing, re-download Google Sheet and retry
    if (!hrmsEmployee && company.hrmsSheetUrl) {
      console.log(`[EmployeeLogin] Employee not found — re-syncing HRMS from Google Sheets...`);
      try {
        await syncCompanySheets(companyId, company.hrmsSheetUrl, company.financeSheetUrl || company.hrmsSheetUrl);
        hrmsEmployee = getEmployeeByEmail(companyId, email);
        if (hrmsEmployee) {
          console.log(`[EmployeeLogin] Found after re-sync: ${hrmsEmployee.EmployeeID}`);
        }
      } catch (syncErr) {
        console.log(`[EmployeeLogin] Re-sync failed: ${syncErr.message}`);
      }
    }

    if (!hrmsEmployee) {
      // Final fallback: try finding user directly in MongoDB
      const existingUser = await User.findOne({ companyId, email: email.toLowerCase().trim() });
      if (existingUser) {
        if (!existingUser.isActive) {
          return res.status(403).json({ success: false, message: 'Account is deactivated', deactivated: true, isEmployee: true, email: existingUser.email, companyId: company.companyId });
        }
        console.log(`[EmployeeLogin] User not in HRMS Excel but found in DB`);
        if (!otp) {
          const generatedOtp = Math.floor(1000 + Math.random() * 9000).toString();
          otpStore.set(emailKey, { otp: generatedOtp, expiresAt: Date.now() + 5 * 60 * 1000 });

          // Send the OTP via email
          const emailResult = await sendOTPEmail(generatedOtp, email);

          return res.json({
            success: true,
            message: emailResult?.sent ? `OTP sent to ${email}` : `OTP generated: ${generatedOtp}`,
            requiresOTP: true,
            debugOtp: emailResult?.sent ? undefined : generatedOtp,
            emailDelivery: emailResult
          });
        }

        existingUser.lastLogin = new Date();
        await existingUser.save({ validateBeforeSave: false });
        const token = signToken(existingUser._id);
        await audit('LOGIN', { actor: existingUser, details: { email, loginType: 'email_only' }, req });
        return res.json({ success: true, token, user: existingUser, company: { companyId: company.companyId, companyName: company.companyName } });
      }
      return res.status(401).json({
        success: false,
        message: 'Your email was not found in the company HRMS records. Please contact your company admin.'
      });
    }

    if (!otp) {
      const generatedOtp = Math.floor(1000 + Math.random() * 9000).toString();
      otpStore.set(emailKey, { otp: generatedOtp, expiresAt: Date.now() + 5 * 60 * 1000 });

      // Send the OTP via email
          const emailResult = await sendOTPEmail(generatedOtp, email);

          return res.json({
            success: true,
            message: emailResult?.sent ? `OTP sent to ${email}` : `OTP generated: ${generatedOtp}`,
            requiresOTP: true,
            debugOtp: emailResult?.sent ? undefined : generatedOtp,
            emailDelivery: emailResult
          });
    }

    console.log(`[EmployeeLogin] HRMS employee found: ${hrmsEmployee.EmployeeID} (${hrmsEmployee.Name})`);

    // Find or create user in MongoDB (upsert to avoid duplicate key errors)
    let user = await User.findOne({ companyId, email: email.toLowerCase().trim() });

    if (!user) {
      user = await User.findOneAndUpdate(
        { companyId, employeeId: hrmsEmployee.EmployeeID },
        {
          employeeId: hrmsEmployee.EmployeeID,
          companyId,
          name: hrmsEmployee.Name || 'Employee',
          email: email.toLowerCase().trim(),
          department: hrmsEmployee.Department || 'General',
          role: (hrmsEmployee.Role || 'employee').toLowerCase(),
          loginType: 'email_only',
          managerId: hrmsEmployee.ManagerID || null,
          travelBudgetLimit: hrmsEmployee.TravelBudget || 50000,
          travelBudgetUsed: hrmsEmployee.TravelBudgetUsed || 0
        },
        { upsert: true, new: true, setDefaultsOnInsert: true }
      );
      console.log(`[EmployeeLogin] User upserted: ${user._id}`);
    }

    if (!user.isActive) {
      return res.status(403).json({ success: false, message: 'Account is deactivated', deactivated: true, isEmployee: true, email: user.email, companyId: company.companyId });
    }

    user.lastLogin = new Date();
    await user.save({ validateBeforeSave: false });

    const token = signToken(user._id);
    await audit('LOGIN', { actor: user, details: { email, loginType: 'email_only' }, req });

    console.log(`[EmployeeLogin] Login successful for ${email}`);
    res.json({ success: true, token, user, company: { companyId: company.companyId, companyName: company.companyName } });
  } catch (err) {
    next(err);
  }
};

// ── POST /api/auth/admin-login ───────────────────────────────────────────────
// Company head logs in with password OR OTP.
const adminLogin = async (req, res, next) => {
  try {
    const { email, password, otp } = req.body;
    if (!email) {
      return res.status(400).json({ success: false, message: 'Email is required' });
    }

    const cleanEmail = email.toLowerCase().trim();
    console.log(`[AdminLogin] Attempting login for: ${cleanEmail} (mode: ${otp ? 'OTP_VERIFY' : password ? 'PASSWORD' : 'OTP_REQUEST'})`);

    // Try to find the company by head email or admin user email
    let company = await Company.findOne({ headEmail: cleanEmail });
    if (!company) {
      const adminUser = await User.findOne({ email: cleanEmail, role: 'admin' });
      if (adminUser) {
        company = await Company.findOne({ companyId: adminUser.companyId });
      }
    }

    if (!company) {
      console.log(`[AdminLogin] No company found for email: ${cleanEmail}`);
      return res.status(404).json({ success: false, message: 'No company registered with this email' });
    }
    console.log(`[AdminLogin] Found company: ${company.companyId} (${company.companyName})`);

    const emailKey = `ADMIN:${cleanEmail}`;

    if (otp) {
      // Verify OTP
      const stored = otpStore.get(emailKey);
      if (!stored || stored.otp !== otp || Date.now() > stored.expiresAt) {
        return res.status(401).json({ success: false, message: 'Invalid or expired OTP' });
      }
      otpStore.delete(emailKey);
    } else if (!password) {
      // User is requesting an OTP for Admin login
      const generatedOtp = Math.floor(1000 + Math.random() * 9000).toString();
      otpStore.set(emailKey, { otp: generatedOtp, expiresAt: Date.now() + 5 * 60 * 1000 });

      const emailResult = await sendOTPEmail(generatedOtp, cleanEmail);

      return res.json({
        success: true,
        message: emailResult?.sent ? `Admin OTP sent to ${cleanEmail}` : `OTP generated: ${generatedOtp}`,
        requiresOTP: true,
        debugOtp: emailResult?.sent ? undefined : generatedOtp,
        emailDelivery: emailResult
      });
    } else {
      // Validate Password
      const passwordValid = await company.comparePassword(password);
      console.log(`[AdminLogin] Password valid: ${passwordValid}`);
      if (!passwordValid) {
        return res.status(401).json({ success: false, message: 'Invalid credentials' });
      }
    }

    // Find the admin user
    let user = await User.findOne({ companyId: company.companyId, email: cleanEmail });
    if (!user) {
      user = await User.findOne({ companyId: company.companyId, employeeId: 'ADMIN-001' });
    }
    if (!user) {
      user = await User.findOne({ companyId: company.companyId, role: 'admin' });
    }

    if (!user) {
      console.log(`[AdminLogin] Auto-creating admin user for ${company.companyId}`);
      user = await User.findOneAndUpdate(
        { companyId: company.companyId, employeeId: 'ADMIN-001' },
        {
          companyId: company.companyId,
          employeeId: 'ADMIN-001',
          name: company.headName,
          email: company.headEmail,
          password: password || 'Admin@123',
          department: 'Management',
          role: 'admin',
          loginType: 'password',
          travelBudgetLimit: company.policy?.budgetLimits?.admin || 500000
        },
        { upsert: true, new: true, setDefaultsOnInsert: true }
      );
    }

    if (user && user.role !== 'admin') {
      user.role = 'admin';
    }

    if (!user.isActive) {
      return res.status(403).json({ success: false, message: 'Account is deactivated', deactivated: true, isAdmin: true, email: user.email });
    }

    user.lastLogin = new Date();
    await user.save({ validateBeforeSave: false });

    const token = signToken(user._id);
    await audit('LOGIN', { actor: user, details: { email: cleanEmail, loginType: otp ? 'admin_otp' : 'password' }, req });

    console.log(`[AdminLogin] Login successful for ${cleanEmail}`);
    res.json({ success: true, token, user, company: { companyId: company.companyId, companyName: company.companyName } });
  } catch (err) {
    next(err);
  }
};

// ── GET /api/auth/companies ──────────────────────────────────────────────────
// Returns list of registered companies for the employee login dropdown.
const listCompanies = async (_req, res, next) => {
  try {
    const companies = await Company.find({ isActive: true })
      .select('companyId companyName')
      .sort({ companyName: 1 });
    res.json({ success: true, data: companies });
  } catch (err) {
    next(err);
  }
};

// ── POST /api/auth/sync-sheets ───────────────────────────────────────────────
// Re-downloads sheets from Google Sheets (admin only, called after protect middleware)
const syncSheets = async (req, res, next) => {
  try {
    const company = await Company.findOne({ companyId: req.user.companyId });
    if (!company) return res.status(404).json({ success: false, message: 'Company not found' });

    const { syncCompanyDataToDB } = require('../services/excelService');
    const syncRes = await syncCompanyDataToDB(company.companyId, company.hrmsSheetUrl);

    res.json({
      success: true,
      message: `Sheets synced successfully: ${syncRes.empSynced} employees, ${syncRes.budgetSynced} budgets updated.`,
      lastSheetSync: syncRes.lastSheetSync || new Date(),
      data: syncRes
    });
  } catch (err) {
    logger.error(`[Auth] syncSheets error: ${err.message}`);
    res.status(500).json({ success: false, message: `Sync failed: ${err.message}` });
  }
};

// ── GET /api/auth/me ─────────────────────────────────────────────────────────
const getMe = async (req, res) => {
  const company = await Company.findOne({ companyId: req.user.companyId }).select('companyId companyName');
  res.json({ success: true, user: req.user, company });
};

// ── PUT /api/auth/me ─────────────────────────────────────────────────────────
const updateMe = async (req, res, next) => {
  try {
    const allowed = ['name', 'department'];
    const updates = {};
    allowed.forEach(f => { if (req.body[f] !== undefined) updates[f] = req.body[f]; });

    const user = await User.findByIdAndUpdate(req.user._id, updates, { new: true, runValidators: true });
    res.json({ success: true, user });
  } catch (err) {
    next(err);
  }
};

// ── POST /api/auth/reactivate-admin ──────────────────────────────────────────
const reactivateAdmin = async (req, res, next) => {
  try {
    const { email, password } = req.body;
    if (!email || !password) return res.status(400).json({ success: false, message: 'Email and password are required' });

    const company = await Company.findOne({ headEmail: email.toLowerCase().trim() });
    if (!company) return res.status(404).json({ success: false, message: 'No company registered with this email' });

    const passwordValid = await company.comparePassword(password);
    if (!passwordValid) return res.status(401).json({ success: false, message: 'Invalid credentials' });

    let user = await User.findOne({ companyId: company.companyId, email: email.toLowerCase().trim() });
    if (user && !user.isActive) {
      user.isActive = true;
      await user.save({ validateBeforeSave: false });
      return res.json({ success: true, message: 'Account reactivated successfully. You can now login.' });
    }
    return res.status(400).json({ success: false, message: 'Account is already active or not found.' });
  } catch (err) {
    next(err);
  }
};

// ── POST /api/auth/request-reactivation ──────────────────────────────────────
const requestReactivation = async (req, res, next) => {
  try {
    const { email, companyId } = req.body;
    if (!email || !companyId) return res.status(400).json({ success: false, message: 'Email and companyId are required' });

    const user = await User.findOne({ companyId, email: email.toLowerCase().trim() });
    if (user && !user.isActive) {
      logger.info(`[Reactivation Request] Employee ${email} requested reactivation for company ${companyId}`);
      return res.json({ success: true, message: 'Reactivation request sent to your company admin.' });
    }
    return res.status(400).json({ success: false, message: 'Account is already active or not found.' });
  } catch (err) {
    next(err);
  }
};


// ── GET /api/auth/email-diagnostic ──────────────────────────────────────────

// ── GET /api/auth/email-env ──────────────────────────────────────────────────
const emailEnv = (req, res) => {
  res.json({
    hasBrevoApiKey: !!process.env.BREVO_API_KEY,
    hasSmtpHost: !!process.env.SMTP_HOST,
    smtpHost: process.env.SMTP_HOST || null,
    hasSmtpUser: !!process.env.SMTP_USER,
    smtpUser: process.env.SMTP_USER || null,
    hasSmtpPassword: !!process.env.SMTP_PASSWORD,
    brevoSenderEmail: process.env.BREVO_SENDER_EMAIL || null
  });
};

const emailDiagnostic = async (req, res) => {
  const result = await sendOTPEmail('9999', req.query.email || 'htrackcom@gmail.com');
  res.json({
    env: {
      hasBrevoApiKey: !!process.env.BREVO_API_KEY,
      hasSmtpHost: !!process.env.SMTP_HOST,
      smtpHost: process.env.SMTP_HOST || null,
      hasSmtpUser: !!process.env.SMTP_USER,
      smtpUser: process.env.SMTP_USER || null,
      hasSmtpPassword: !!process.env.SMTP_PASSWORD,
      brevoSenderEmail: process.env.BREVO_SENDER_EMAIL || null
    },
    sendResult: result
  });
};

module.exports = {
  emailDiagnostic,
  emailEnv,
  registerCompany, employeeLogin, adminLogin,
  listCompanies, syncSheets,
  getMe, updateMe, reactivateAdmin, requestReactivation
};
