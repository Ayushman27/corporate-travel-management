const xlsx   = require('xlsx');
const fs     = require('fs');
const path   = require('path');
const axios  = require('axios');
const logger = require('../utils/logger');

const BASE_DATA_DIR = path.join(__dirname, '../../data');

// ── Helper: parse Excel dates or strings safely ──────────────────────────────
const parseExcelDate = (val) => {
  if (!val) return new Date();
  if (typeof val === 'number' && val > 30000) {
    return new Date(Math.round((val - 25569) * 86400 * 1000));
  }
  const d = new Date(val);
  return isNaN(d.getTime()) ? new Date() : d;
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
  fs.writeFileSync(destPath, response.data);
  logger.info(`[Excel] Saved to ${destPath}`);
  return response.data;
};

// ── Generic helpers ──────────────────────────────────────────────────────────

const findSheet = (workbook, namePatterns, fallbackIndex = 0) => {
  const sheetNames = workbook.SheetNames;
  for (const pattern of namePatterns) {
    const match = sheetNames.find(s => s.toLowerCase().includes(pattern.toLowerCase()));
    if (match) return match;
  }
  return sheetNames[fallbackIndex] || sheetNames[0];
};

const readSheet = (filePath, sheetNameOrIndex = 0) => {
  if (!fs.existsSync(filePath)) {
    throw new Error(`Excel file not found: ${filePath}`);
  }
  const workbook = xlsx.readFile(filePath);
  let sheetName;
  if (typeof sheetNameOrIndex === 'number') {
    sheetName = workbook.SheetNames[sheetNameOrIndex];
  } else {
    sheetName = findSheet(workbook, [sheetNameOrIndex], 0);
  }
  return xlsx.utils.sheet_to_json(workbook.Sheets[sheetName], { defval: null });
};

const readHrmsSheet = (companyId) => {
  const filePath = hrmsPath(companyId);
  const workbook = xlsx.readFile(filePath);
  const sheetName = findSheet(workbook, ['hrms', 'employee', 'staff', 'people'], 0);
  return xlsx.utils.sheet_to_json(workbook.Sheets[sheetName], { defval: null });
};

const readFinanceSheet = (companyId) => {
  const filePath = financePath(companyId);
  const workbook = xlsx.readFile(filePath);
  const sheetName = findSheet(workbook, ['finance', 'budget', 'accounts', 'expense'], 1);
  return xlsx.utils.sheet_to_json(workbook.Sheets[sheetName], { defval: null });
};

const writeSheet = (filePath, rows, sheetName) => {
  let workbook;
  if (fs.existsSync(filePath)) {
    workbook = xlsx.readFile(filePath);
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
        fs.writeFileSync(dest, response.data);
      } catch (_) {}
    } catch (fetchErr) {
      logger.warn(`[ExcelSync] Failed to fetch Google Sheet online: ${fetchErr.message}`);
    }
  }

  // Fallback to local files if online fetch wasn't possible
  if (!workbook) {
    const localFile = hrmsPath(companyId);
    if (fs.existsSync(localFile)) {
      workbook = xlsx.readFile(localFile);
    } else {
      const fallbackFile = path.join(BASE_DATA_DIR, 'Company.xlsx');
      if (fs.existsSync(fallbackFile)) {
        workbook = xlsx.readFile(fallbackFile);
      }
    }
  }

  if (!workbook) {
    throw new Error(`No data source found to sync for company ${companyId}`);
  }

  // 1. Sync HRMS Employees
  const hrmsSheetName = findSheet(workbook, ['hrms', 'employee', 'staff', 'people'], 0);
  let empSynced = 0;
  if (hrmsSheetName && workbook.Sheets[hrmsSheetName]) {
    const hrmsRows = xlsx.utils.sheet_to_json(workbook.Sheets[hrmsSheetName]);
    for (const r of hrmsRows) {
      if (!r.EmployeeID || !r.Email) continue;
      const email = String(r.Email).toLowerCase().trim();
      const updateData = {
        name: r.Name || r.EmployeeID,
        email,
        department: r.Department || 'General',
        role: String(r.Role || 'employee').toLowerCase(),
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
    for (const r of finRows) {
      const month = r.Month || 'Unknown';
      const dept = r.Department || 'All';
      const year = Number(r.Year) || 2026;
      const allocated = Number(r.AllocatedBudget) || 0;
      const spent = Number(r.SpentAmount) || 0;
      const remaining = r.RemainingBudget !== undefined ? Number(r.RemainingBudget) : (allocated - spent);
      const lastUpdated = parseExcelDate(r.LastUpdated);

      const existing = await Budget.findOne({ companyId, month, year, department: dept });
      if (existing) {
        existing.allocatedBudget = allocated;
        existing.spentAmount = spent;
        existing.remainingBudget = remaining;
        existing.lastUpdated = lastUpdated;
        await existing.save();
      } else {
        await Budget.create({
          companyId,
          month,
          year,
          department: dept,
          allocatedBudget: allocated,
          spentAmount: spent,
          remainingBudget: remaining,
          lastUpdated
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
    const workbook = xlsx.readFile(filePath);
    const sheetName = findSheet(workbook, ['hrms', 'employee', 'staff', 'people'], 0);
    const rows = xlsx.utils.sheet_to_json(workbook.Sheets[sheetName], { defval: null });
    const idx  = rows.findIndex(r => r.EmployeeID === employeeId);
    if (idx !== -1) {
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
    const workbook = xlsx.readFile(filePath);
    const sheetName = findSheet(workbook, ['finance', 'budget', 'accounts', 'expense'], 1);
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
