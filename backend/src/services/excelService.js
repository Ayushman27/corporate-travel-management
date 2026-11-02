const xlsx   = require('xlsx');
const fs     = require('fs');
const path   = require('path');
const axios  = require('axios');
const logger = require('../utils/logger');

const BASE_DATA_DIR = path.join(__dirname, '../../data');

// ── Helper: parse Excel dates or strings safely ──────────────────────────────
const parseExcelDate = (val) => {
  if (val === undefined || val === null || val === '') return null;
  if (typeof val === 'number') {
    if (val > 30000) {
      // Excel serial date (days since 1899-12-30)
      const d = new Date(Math.round((val - 25569) * 86400 * 1000));
      return isNaN(d.getTime()) ? null : d;
    }
    return null;
  }
  const str = String(val).trim();
  if (!str) return null;

  // DD-MM-YYYY or DD/MM/YYYY
  const ddmmyyyy = str.match(/^(\d{1,2})[-\/](\d{1,2})[-\/](\d{4})$/);
  if (ddmmyyyy) {
    const [, d, m, y] = ddmmyyyy;
    const dateObj = new Date(Date.UTC(Number(y), Number(m) - 1, Number(d)));
    return isNaN(dateObj.getTime()) ? null : dateObj;
  }

  // YYYY-MM-DD
  const yyyymmdd = str.match(/^(\d{4})[-\/](\d{1,2})[-\/](\d{1,2})$/);
  if (yyyymmdd) {
    const [, y, m, d] = yyyymmdd;
    const dateObj = new Date(Date.UTC(Number(y), Number(m) - 1, Number(d)));
    return isNaN(dateObj.getTime()) ? null : dateObj;
  }

  const d = new Date(str);
  return isNaN(d.getTime()) ? null : d;
};

// ── Helper: resolve per-company data directory ───────────────────────────────

const companyDir = (companyId) => {
  const dir = path.join(BASE_DATA_DIR, companyId);
  if (!fs.existsSync(dir)) fs.mkdirSync(dir, { recursive: true });
  return dir;
};

const hrmsPath = (companyId) => {
  const companyFile = path.join(companyDir(companyId), 'Company.xlsx');
  if (fs.existsSync(companyFile)) return companyFile;
  const legacy = path.join(companyDir(companyId), 'hrms.xlsx');
  if (fs.existsSync(legacy)) return legacy;
  if (companyId === 'COMP-DEV00001') {
    const root = path.join(BASE_DATA_DIR, 'hrms.xlsx');
    if (fs.existsSync(root)) {
      try { fs.copyFileSync(root, legacy); } catch (_) {}
      return legacy;
    }
  }
  return companyFile;
};

const financePath = (companyId) => {
  const companyFile = path.join(companyDir(companyId), 'Company.xlsx');
  if (fs.existsSync(companyFile)) return companyFile;
  const legacy = path.join(companyDir(companyId), 'finance.xlsx');
  if (fs.existsSync(legacy)) return legacy;
  if (companyId === 'COMP-DEV00001') {
    const root = path.join(BASE_DATA_DIR, 'finance.xlsx');
    if (fs.existsSync(root)) {
      try { fs.copyFileSync(root, legacy); } catch (_) {}
      return legacy;
    }
  }
  return companyFile;
};

// ── Google Sheets download ───────────────────────────────────────────────────

const toExportUrl = (sheetUrl) => {
  const match = sheetUrl.match(/\/d\/([a-zA-Z0-9_-]+)/);
  if (!match) throw new Error(`Invalid Google Sheets URL: ${sheetUrl}`);
  const sheetId = match[1];
  return `https://docs.google.com/spreadsheets/d/${sheetId}/export?format=xlsx`;
};

const downloadSheet = async (sheetUrl, destPath) => {
  const exportUrl = toExportUrl(sheetUrl);
  logger.info(`[Excel] Downloading sheet from ${exportUrl}`);
  const response = await axios.get(exportUrl, { responseType: 'arraybuffer', timeout: 30000 });
  const dir = path.dirname(destPath);
  if (!fs.existsSync(dir)) fs.mkdirSync(dir, { recursive: true });
  fs.writeFileSync(destPath, response.data);
  logger.info(`[Excel] Saved to ${destPath}`);
  return response.data;
};

// ── Generic helpers ──────────────────────────────────────────────────────────

const findSheet = (workbook, namePatterns, fallbackIndex = 0) => {
  if (!workbook || !workbook.SheetNames) return null;
  const sheetNames = workbook.SheetNames;
  for (const pattern of namePatterns) {
    const match = sheetNames.find(s => s.toLowerCase().includes(pattern.toLowerCase()));
    if (match) return match;
  }
  return sheetNames[fallbackIndex] || sheetNames[0];
};

const readSheet = (filePath, sheetNameOrIndex = 0) => {
  if (!filePath || !fs.existsSync(filePath)) {
    return [];
  }
  try {
    const workbook = xlsx.readFile(filePath);
    let sheetName;
    if (typeof sheetNameOrIndex === 'number') {
      sheetName = workbook.SheetNames[sheetNameOrIndex];
    } else {
      sheetName = findSheet(workbook, [sheetNameOrIndex], 0);
    }
    return (sheetName && workbook.Sheets[sheetName]) ? xlsx.utils.sheet_to_json(workbook.Sheets[sheetName], { defval: null }) : [];
  } catch (err) {
    logger.warn(`[Excel] readSheet failed: ${err.message}`);
    return [];
  }
};

const readHrmsSheet = (companyId) => {
  try {
    const filePath = hrmsPath(companyId);
    if (!filePath || !fs.existsSync(filePath)) return [];
    const workbook = xlsx.readFile(filePath);
    const sheetName = findSheet(workbook, ['hrms', 'employee', 'staff', 'people'], 0);
    return (sheetName && workbook.Sheets[sheetName]) ? xlsx.utils.sheet_to_json(workbook.Sheets[sheetName], { defval: null }) : [];
  } catch (err) {
    logger.warn(`[Excel] readHrmsSheet failed for ${companyId}: ${err.message}`);
    return [];
  }
};

const readFinanceSheet = (companyId) => {
  try {
    const filePath = financePath(companyId);
    if (!filePath || !fs.existsSync(filePath)) return [];
    const workbook = xlsx.readFile(filePath);
    const sheetName = findSheet(workbook, ['finance', 'budget', 'accounts', 'expense'], 1);
    return (sheetName && workbook.Sheets[sheetName]) ? xlsx.utils.sheet_to_json(workbook.Sheets[sheetName], { defval: null }) : [];
  } catch (err) {
    logger.warn(`[Excel] readFinanceSheet failed for ${companyId}: ${err.message}`);
    return [];
  }
};

const writeSheet = (filePath, rows, sheetName) => {
  try {
    const dir = path.dirname(filePath);
    if (!fs.existsSync(dir)) fs.mkdirSync(dir, { recursive: true });
    let workbook;
    if (fs.existsSync(filePath)) {
      try {
        workbook = xlsx.readFile(filePath);
      } catch (_) {
        workbook = xlsx.utils.book_new();
      }
    } else {
      workbook = xlsx.utils.book_new();
    }
    const sheet = xlsx.utils.json_to_sheet(rows);
    if (workbook.SheetNames.includes(sheetName)) {
      workbook.Sheets[sheetName] = sheet;
    } else {
      xlsx.utils.book_append_sheet(workbook, sheet, sheetName);
    }
    xlsx.writeFile(workbook, filePath);
  } catch (err) {
    logger.warn(`[Excel] writeSheet failed: ${err.message}`);
  }
};

// ── Full Sync: Google Sheet / Excel → Neon DB ─────────────────────────────────

const syncCompanyDataToDB = async (companyId, sheetUrlOverride) => {
  const Company = require('../models/Company');
  const User = require('../models/User');
  const Budget = require('../models/Budget');
  const Hotel = require('../models/Hotel');

  const company = await Company.findOne({ companyId });
  if (!company) throw new Error(`Company ${companyId} not found`);

  const sheetUrl = sheetUrlOverride || company.hrmsSheetUrl || company.financeSheetUrl;
  let workbook = null;

  if (sheetUrl && sheetUrl.includes('docs.google.com')) {
    try {
      const exportUrl = toExportUrl(sheetUrl);
      logger.info(`[ExcelSync] Fetching Google Sheet from ${exportUrl} for ${companyId}`);
      const response = await axios.get(exportUrl, { responseType: 'arraybuffer', timeout: 30000 });
      workbook = xlsx.read(response.data);

      // Save local copy if possible
      try {
        const dest = path.join(companyDir(companyId), 'Company.xlsx');
        const dir = path.dirname(dest);
        if (!fs.existsSync(dir)) fs.mkdirSync(dir, { recursive: true });
        fs.writeFileSync(dest, response.data);
      } catch (_) {}
    } catch (fetchErr) {
      logger.warn(`[ExcelSync] Failed to fetch Google Sheet online: ${fetchErr.message}`);
    }
  }

  // Fallback to local files if online fetch wasn't possible
  if (!workbook) {
    const localFile = hrmsPath(companyId);
    if (localFile && fs.existsSync(localFile)) {
      try { workbook = xlsx.readFile(localFile); } catch (_) {}
    }
    if (!workbook) {
      const fallbackFile = path.join(BASE_DATA_DIR, 'Company.xlsx');
      if (fs.existsSync(fallbackFile)) {
        try { workbook = xlsx.readFile(fallbackFile); } catch (_) {}
      }
    }
  }

  if (!workbook) {
    logger.warn(`[ExcelSync] No data source found to sync for company ${companyId}`);
    return { empSynced: 0, budgetSynced: 0, hotelsSynced: 0, lastSheetSync: company.lastSheetSync };
  }

  // 1. Sync HRMS Employees
  const hrmsSheetName = findSheet(workbook, ['hrms', 'employee', 'staff', 'people'], 0);
  let empSynced = 0;
  if (hrmsSheetName && workbook.Sheets[hrmsSheetName]) {
    const hrmsRows = xlsx.utils.sheet_to_json(workbook.Sheets[hrmsSheetName]);
    for (const r of hrmsRows) {
      if (!r.EmployeeID || !r.Email) continue;
      const email = String(r.Email).toLowerCase().trim();
      const isCompanyHead = company && company.headEmail && email === String(company.headEmail).toLowerCase().trim();
      const role = isCompanyHead ? 'admin' : String(r.Role || 'employee').toLowerCase();
      const updateData = {
        name: r.Name || r.EmployeeID,
        email,
        department: r.Department || 'General',
        role,
        managerId: r.ManagerID || null,
        travelBudgetLimit: Number(r.TravelBudget) || 50000,
        salary: Number(r.Salary) || null,
        gender: r.Gender || null,
        age: Number(r.Age) || null,
        extraData: r
      };

      const existing = await User.findOne({ companyId, employeeId: r.EmployeeID });
      if (existing) {
        Object.assign(existing, updateData);
        await existing.save();
      } else {
        await User.create({
          companyId,
          employeeId: r.EmployeeID,
          ...updateData,
          travelBudgetUsed: Number(r.TravelBudgetUsed) || 0,
          loginType: 'email_only'
        });
      }
      empSynced++;
    }
  }

  // 2. Sync Finance Budgets
  const finSheetName = findSheet(workbook, ['finance', 'budget', 'accounts', 'expense'], 1);
  let budgetSynced = 0;
  if (finSheetName && workbook.Sheets[finSheetName]) {
    const finRows = xlsx.utils.sheet_to_json(workbook.Sheets[finSheetName]);

    // Aggregate approved trips in CTM so we don't wipe out real-time expenditures
    const Trip = require('../models/Trip');
    let approvedTrips = [];
    try {
      const allTrips = await Trip.find({ companyId });
      approvedTrips = (allTrips || []).filter(t => t.status === 'approved' || t.status === 'completed');
    } catch (_) {}

    const ctmSpendByMonth = {};
    for (const t of approvedTrips) {
      const d = new Date(t.travelDate || t.submittedAt || t.createdAt);
      if (isNaN(d.getTime())) continue;
      const mName = d.toLocaleString('en-US', { month: 'long' });
      const cost = (t.status === 'booked' && Number(t.actualCost) > 0)
        ? Number(t.actualCost)
        : (t.approvedBudget !== undefined && t.approvedBudget !== null
          ? Number(t.approvedBudget)
          : (Number(t.estimatedBudget) || 0));
      const updated = new Date(t.updatedAt || t.submittedAt || t.createdAt);

      if (!ctmSpendByMonth[mName]) {
        ctmSpendByMonth[mName] = { total: 0, latestUpdate: updated };
      }
      ctmSpendByMonth[mName].total += cost;
      if (updated > ctmSpendByMonth[mName].latestUpdate) {
        ctmSpendByMonth[mName].latestUpdate = updated;
      }
    }

    for (const r of finRows) {
      const month = r.Month || 'Unknown';
      const dept = r.Department || 'All';
      const year = Number(r.Year) || 2026;
      const allocated = Number(r.AllocatedBudget) || 0;
      const sheetSpent = Number(r.SpentAmount) || 0;
      const sheetLastUpdated = parseExcelDate(r.LastUpdated);

      const ctmData = (dept === 'All') ? ctmSpendByMonth[month] : null;
      const ctmSpent = ctmData ? ctmData.total : 0;
      const totalSpent = sheetSpent + ctmSpent;
      const remaining = Math.max(0, allocated - totalSpent);

      let effectiveLastUpdated = null;
      if (ctmData && ctmData.latestUpdate) {
        effectiveLastUpdated = ctmData.latestUpdate;
      } else if (sheetLastUpdated && totalSpent > 0) {
        effectiveLastUpdated = sheetLastUpdated;
      }

      const existing = await Budget.findOne({ companyId, month, year, department: dept });
      if (existing) {
        existing.allocatedBudget = allocated;
        existing.spentAmount = totalSpent;
        existing.remainingBudget = remaining;
        existing.lastUpdated = effectiveLastUpdated;
        await existing.save();
      } else {
        await Budget.create({
          companyId,
          month,
          year,
          department: dept,
          allocatedBudget: allocated,
          spentAmount: totalSpent,
          remainingBudget: remaining,
          lastUpdated: effectiveLastUpdated
        });
      }
      budgetSynced++;
    }
  }

  // 3. Sync Hotels (if sheet exists)
  const hotelSheetName = findSheet(workbook, ['hotel', 'stay', 'accommodation'], 2);
  let hotelsSynced = 0;
  if (hotelSheetName && workbook.Sheets[hotelSheetName]) {
    const hotelRows = xlsx.utils.sheet_to_json(workbook.Sheets[hotelSheetName]);
    for (const h of hotelRows) {
      const name = h.HotelName || h.Name || h.name;
      const city = h.City || h.city;
      if (!name || !city) continue;
      const existing = await Hotel.findOne({ name, city });
      if (!existing) {
        await Hotel.create({
          name,
          city,
          state: h.State || h.state || city,
          price: String(h.PricePerNight || h.Price || h.price || 4500),
          rating: Number(h.Rating || h.rating || 4.5),
          amenities: typeof h.Amenities === 'string' ? h.Amenities.split(/\s+/) : ['WiFi', 'AC'],
          source: 'excel'
        });
        hotelsSynced++;
      }
    }
  }

  company.lastSheetSync = new Date();
  await company.save();

  logger.info(`[ExcelSync] Successfully synced ${empSynced} employees, ${budgetSynced} budget rows, ${hotelsSynced} hotels into Neon DB for ${companyId}`);
  return { empSynced, budgetSynced, hotelsSynced, lastSheetSync: company.lastSheetSync };
};

const syncCompanySheets = async (companyId, hrmsUrl, financeUrl) => {
  const companyFile = path.join(companyDir(companyId), 'Company.xlsx');
  try {
    await downloadSheet(hrmsUrl, companyFile);
    logger.info(`[Excel] Synced Company.xlsx for company ${companyId}`);
  } catch (err) {
    logger.warn(`[Excel] Could not save local copy: ${err.message}`);
  }
  return await syncCompanyDataToDB(companyId, hrmsUrl);
};

// ── HRMS (per-company) ──────────────────────────────────────────────────────

const getEmployeeById = (companyId, employeeId) => {
  try {
    const rows = readHrmsSheet(companyId);
    return rows.find(r => r.EmployeeID === employeeId) || null;
  } catch (_) {
    return null;
  }
};

const getEmployeeByEmail = (companyId, email) => {
  try {
    const rows = readHrmsSheet(companyId);
    const lowerEmail = email.toLowerCase().trim();
    return rows.find(r => (r.Email || '').toLowerCase().trim() === lowerEmail) || null;
  } catch (_) {
    return null;
  }
};

const getAllEmployees = (companyId) => {
  try {
    return readHrmsSheet(companyId);
  } catch (_) {
    return [];
  }
};

const updateEmployeeBudgetUsed = (companyId, employeeId, additionalAmount) => {
  try {
    const filePath = hrmsPath(companyId);
    if (!filePath || !fs.existsSync(filePath)) return null;
    const workbook = xlsx.readFile(filePath);
    const sheetName = findSheet(workbook, ['hrms', 'employee', 'staff', 'people'], 0);
    if (!sheetName || !workbook.Sheets[sheetName]) return null;
    const rows = xlsx.utils.sheet_to_json(workbook.Sheets[sheetName], { defval: null });
    const idx  = rows.findIndex(r => r.EmployeeID === employeeId);
    if (idx !== -1) {
      const limit = Number(rows[idx].TravelBudget) || 50000;
      if (additionalAmount > limit || ((rows[idx].TravelBudgetUsed || 0) + additionalAmount) > limit) {
        logger.info(`[Excel] Amount ${additionalAmount} exceeds budget ${limit} for ${employeeId} — not cutting from personal budget`);
        return rows[idx];
      }
      rows[idx].TravelBudgetUsed = (rows[idx].TravelBudgetUsed || 0) + additionalAmount;
      rows[idx].LastUpdated = new Date().toISOString();
      writeSheet(filePath, rows, sheetName);
      logger.info(`[Excel] Updated TravelBudgetUsed for ${employeeId} by +${additionalAmount}`);
      return rows[idx];
    }
  } catch (err) {
    logger.warn(`[Excel] Local employee budget update skipped: ${err.message}`);
  }
  return null;
};

// ── Finance (per-company) ────────────────────────────────────────────────────

const getFinanceData = (companyId) => {
  try {
    return readFinanceSheet(companyId);
  } catch (_) {
    return [];
  }
};

const getCurrentMonthFinance = (companyId) => {
  try {
    const rows = readFinanceSheet(companyId);
    if (!rows || rows.length === 0) return null;
    const now  = new Date();
    const currentMonthName = now.toLocaleString('en-US', { month: 'long' }).toLowerCase();
    return rows.find(r => (!r.Department || String(r.Department).trim().toLowerCase() === 'all') && String(r.Month).toLowerCase().includes(currentMonthName)) || rows[0];
  } catch (_) {
    return null;
  }
};

const proposeBudgetUpdate = (companyId, tripId, employeeId, amount, reason) => {
  const proposal = {
    ProposalID:  `PROP-${Date.now()}`,
    TripID:      tripId,
    EmployeeID:  employeeId,
    Amount:      amount,
    Reason:      reason,
    Status:      'PENDING',
    ProposedAt:  new Date().toISOString(),
    ApprovedAt:  null
  };

  try {
    const filePath = financePath(companyId);
    if (!filePath || !fs.existsSync(filePath)) return proposal;
    let existing = [];
    try {
      const wb = xlsx.readFile(filePath);
      if (wb.SheetNames.includes('Proposals')) {
        existing = xlsx.utils.sheet_to_json(wb.Sheets['Proposals'], { defval: null });
      }
    } catch (_) {}

    existing.push(proposal);
    const wb = xlsx.readFile(filePath);
    const sheet = xlsx.utils.json_to_sheet(existing);
    if (wb.SheetNames.includes('Proposals')) {
      wb.Sheets['Proposals'] = sheet;
    } else {
      xlsx.utils.book_append_sheet(wb, sheet, 'Proposals');
    }
    xlsx.writeFile(wb, filePath);
  } catch (_) {}

  logger.info(`[Excel] Budget proposal ${proposal.ProposalID} created`);
  return proposal;
};

const applyBudgetDeduction = (companyId, amount, tripId) => {
  try {
    const filePath = financePath(companyId);
    if (!filePath || !fs.existsSync(filePath)) return null;
    const workbook = xlsx.readFile(filePath);
    const sheetName = findSheet(workbook, ['finance', 'budget', 'accounts', 'expense'], 1);
    if (!sheetName || !workbook.Sheets[sheetName]) return null;
    const rows = xlsx.utils.sheet_to_json(workbook.Sheets[sheetName], { defval: null });
    const now  = new Date();
    const currentMonthName = now.toLocaleString('en-US', { month: 'long' }).toLowerCase();

    const idx = rows.findIndex(r => (!r.Department || String(r.Department).trim().toLowerCase() === 'all') && String(r.Month).toLowerCase().includes(currentMonthName));
    if (idx !== -1) {
      rows[idx].SpentAmount     = (rows[idx].SpentAmount || 0) + amount;
      rows[idx].RemainingBudget = rows[idx].AllocatedBudget - rows[idx].SpentAmount;
      rows[idx].LastUpdated     = now.toISOString();
      writeSheet(filePath, rows, sheetName);
      logger.info(`[Excel] Budget deducted ₹${amount} for trip ${tripId}`);
      return rows[idx];
    }
  } catch (err) {
    logger.warn(`[Excel] Local budget deduction skipped: ${err.message}`);
  }
  return null;
};

module.exports = {
  readSheet, readHrmsSheet, readFinanceSheet, writeSheet,
  syncCompanySheets, downloadSheet, toExportUrl,
  getEmployeeById, getEmployeeByEmail, getAllEmployees, updateEmployeeBudgetUsed,
  getFinanceData, getCurrentMonthFinance, proposeBudgetUpdate, applyBudgetDeduction,
  hrmsPath, financePath, syncCompanyDataToDB, parseExcelDate
};
