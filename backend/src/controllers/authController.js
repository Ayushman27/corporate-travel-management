const jwt = require('jsonwebtoken');
const { v4: uuidv4 } = require('uuid');
const User = require('../models/User');
const Company = require('../models/Company');
const { syncCompanySheets, getEmployeeByEmail, getAllEmployees } = require('../services/excelService');
const { audit } = require('../services/auditService');
const logger = require('../utils/logger');
const nodemailer = require('nodemailer');

const otpStore = new Map(); // Simple in-memory store for OTPs

const sendOTPEmail = async (otp, actualUserEmail) => {
  try {
    if (!process.env.SMTP_EMAIL || !process.env.SMTP_PASSWORD) {
      console.log(`[OTP SYSTEM] Warning: SMTP credentials missing in .env. Falling back to console logging.`);
      console.log(`[OTP] To: ${actualUserEmail}`);
      console.log(`[OTP] Code: ${otp}`);
      return;
    }

    const transporter = nodemailer.createTransport({
      service: 'gmail',
      auth: {
        user: process.env.SMTP_EMAIL,
        pass: process.env.SMTP_PASSWORD
      }
    });

    await transporter.sendMail({
      from: '"AeroSync CTM" <ayushpatro000@gmail.com>',
      to: actualUserEmail, // Sending to the actual employee who is logging in
      subject: "Your AeroSync CTM Login OTP",
      text: `Hello,\n\nSomeone (email: ${actualUserEmail}) is attempting to login to CTM.\n\nYour CTM Login OTP is: ${otp}\n\nIt will expire in 5 minutes.\n\nRegards,\nAeroSync Team`,
      html: `<div style="font-family: sans-serif; padding: 20px;">
              <h2 style="color: #C4A25D;">AeroSync CTM Login</h2>
              <p>Someone (<b>${actualUserEmail}</b>) is attempting to log in.</p>
              <p>Your OTP is: <strong style="font-size: 24px; letter-spacing: 2px;">${otp}</strong></p>
              <p style="color: #777; font-size: 12px;">This code expires in 5 minutes.</p>
            </div>`
    });
    console.log(`[OTP SYSTEM] Real Email successfully sent to ${actualUserEmail}`);
  } catch (error) {
    console.error("[OTP SYSTEM] Error sending real email:", error.message);
  }
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

    // 4. Import employees from the HRMS sheet into MongoDB
    let importedCount = 0;
    try {
      const employees = getAllEmployees(companyId);
      for (const emp of employees) {
        if (!emp.EmployeeID || !emp.Email) continue;
        // Skip if same email as head
        if (emp.Email.toLowerCase().trim() === headEmail.toLowerCase().trim()) continue;

        await User.findOneAndUpdate(
          { companyId, employeeId: emp.EmployeeID },
          {
            companyId,
            employeeId: emp.EmployeeID,
            name: emp.Name || emp.EmployeeID,
            email: (emp.Email || '').toLowerCase().trim(),
            department: emp.Department || 'General',
            role: (emp.Role || 'employee').toLowerCase(),
            loginType: 'email_only',
            managerId: emp.ManagerID || null,
            travelBudgetLimit: emp.TravelBudget || 50000,
            travelBudgetUsed: emp.TravelBudgetUsed || 0,
            password: null
          },
          { upsert: true, new: true }
        );
        importedCount++;
      }
      logger.info(`[Auth] Imported ${importedCount} employees for company ${companyId}`);
    } catch (err) {
      logger.warn(`[Auth] Employee import partially failed: ${err.message}`);
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
          await sendOTPEmail(generatedOtp, email);

          return res.json({ success: true, message: `OTP sent to ${email}`, requiresOTP: true });
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
      await sendOTPEmail(generatedOtp, email);

      return res.json({ success: true, message: `OTP sent to ${email}`, requiresOTP: true });
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
// Company head logs in with email + password.
const adminLogin = async (req, res, next) => {
  try {
    const { email, password } = req.body;
    if (!email || !password) {
      return res.status(400).json({ success: false, message: 'Email and password are required' });
    }

    console.log(`[AdminLogin] Attempting login for: ${email}`);

    // Try to find the company by head email
    const company = await Company.findOne({ headEmail: email.toLowerCase().trim() });
    if (!company) {
      console.log(`[AdminLogin] No company found for email: ${email}`);
      return res.status(404).json({ success: false, message: 'No company registered with this email' });
    }
    console.log(`[AdminLogin] Found company: ${company.companyId} (${company.companyName})`);

    const passwordValid = await company.comparePassword(password);
    console.log(`[AdminLogin] Password valid: ${passwordValid}`);
    if (!passwordValid) {
      return res.status(401).json({ success: false, message: 'Invalid credentials' });
    }

    // Find the admin user — try by email first, then by employeeId
    let user = await User.findOne({ companyId: company.companyId, email: email.toLowerCase().trim() });
    if (!user) {
      // Maybe the user exists with employeeId ADMIN-001 but email differs slightly
      user = await User.findOne({ companyId: company.companyId, employeeId: 'ADMIN-001' });
    }
    console.log(`[AdminLogin] Admin user found: ${!!user}`);
    if (!user) {
      // Auto-create admin user (recovery from DB wipe)
      console.log(`[AdminLogin] Auto-creating admin user for ${company.companyId}`);
      user = await User.findOneAndUpdate(
        { companyId: company.companyId, employeeId: 'ADMIN-001' },
        {
          companyId: company.companyId,
          employeeId: 'ADMIN-001',
          name: company.headName,
          email: company.headEmail,
          password: password,
          department: 'Management',
          role: 'admin',
          loginType: 'password',
          travelBudgetLimit: company.policy?.budgetLimits?.admin || 500000
        },
        { upsert: true, new: true, setDefaultsOnInsert: true }
      );
      console.log(`[AdminLogin] Admin user auto-created: ${user._id}`);
    }

    // Ensure email matches the company head email
    if (user.email !== company.headEmail) {
      user.email = company.headEmail;
      await user.save({ validateBeforeSave: false });
    }

    if (!user.isActive) {
      return res.status(403).json({ success: false, message: 'Account is deactivated', deactivated: true, isAdmin: true, email: user.email });
    }

    user.lastLogin = new Date();
    await user.save({ validateBeforeSave: false });

    const token = signToken(user._id);
    await audit('LOGIN', { actor: user, details: { email, loginType: 'password' }, req });

    console.log(`[AdminLogin] Login successful for ${email}`);
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

    await syncCompanySheets(company.companyId, company.hrmsSheetUrl, company.financeSheetUrl);
    company.lastSheetSync = new Date();
    await company.save();

    // Re-import employees
    const employees = getAllEmployees(company.companyId);
    let importedCount = 0;
    for (const emp of employees) {
      if (!emp.EmployeeID || !emp.Email) continue;
      if (emp.Email.toLowerCase().trim() === company.headEmail.toLowerCase().trim()) continue;

      await User.findOneAndUpdate(
        { companyId: company.companyId, employeeId: emp.EmployeeID },
        {
          companyId: company.companyId,
          employeeId: emp.EmployeeID,
          name: emp.Name || emp.EmployeeID,
          email: (emp.Email || '').toLowerCase().trim(),
          department: emp.Department || 'General',
          role: (emp.Role || 'employee').toLowerCase(),
          loginType: 'email_only',
          managerId: emp.ManagerID || null,
          travelBudgetLimit: emp.TravelBudget || 50000,
          travelBudgetUsed: emp.TravelBudgetUsed || 0
        },
        { upsert: true, new: true }
      );
      importedCount++;
    }

    res.json({ success: true, message: `Sheets synced. ${importedCount} employees imported.`, lastSheetSync: company.lastSheetSync });
  } catch (err) {
    next(err);
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

module.exports = {
  registerCompany, employeeLogin, adminLogin,
  listCompanies, syncSheets,
  getMe, updateMe, reactivateAdmin, requestReactivation
};
