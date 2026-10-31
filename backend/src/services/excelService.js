const xlsx   = require('xlsx');
const fs     = require('fs');
const path   = require('path');
const axios  = require('axios');
const logger = require('../utils/logger');

const BASE_DATA_DIR = path.join(__dirname, '../../data');

// ── Helper: resolve per-company data directory ───────────────────────────────

const companyDir = (companyId) => {
  const dir = path.join(BASE_DATA_DIR, companyId);
  if (!fs.existsSync(dir)) fs.mkdirSync(dir, { recursive: true });
  return dir;
};

const hrmsPath = (companyId) => {
  // New approach: single Company.xlsx file per company
  const companyFile = path.join(companyDir(companyId), 'Company.xlsx');
  if (fs.existsSync(companyFile)) return companyFile;
  // Legacy: separate hrms.xlsx
  const legacy = path.join(companyDir(companyId), 'hrms.xlsx');
  if (fs.existsSync(legacy)) return legacy;
  // Fallback for seed company only
  if (companyId === 'COMP-DEV00001') {
    const root = path.join(BASE_DATA_DIR, 'hrms.xlsx');
    if (fs.existsSync(root)) {
      fs.copyFileSync(root, legacy);
      logger.info(`[Excel] Auto-copied hrms.xlsx from data/ root → ${companyId}/`);
      return legacy;
    }
  }
  return companyFile; // will throw in readSheet if missing
};

const financePath = (companyId) => {
  // New approach: single Company.xlsx file per company
  const companyFile = path.join(companyDir(companyId), 'Company.xlsx');
  if (fs.existsSync(companyFile)) return companyFile;
  // Legacy: separate finance.xlsx
  const legacy = path.join(companyDir(companyId), 'finance.xlsx');
  if (fs.existsSync(legacy)) return legacy;
  if (companyId === 'COMP-DEV00001') {
    const root = path.join(BASE_DATA_DIR, 'finance.xlsx');
    if (fs.existsSync(root)) {
      fs.copyFileSync(root, legacy);
      logger.info(`[Excel] Auto-copied finance.xlsx from data/ root → ${companyId}/`);
      return legacy;
    }
  }
  return companyFile;
};

// ── Google Sheets download ───────────────────────────────────────────────────

/**
 * Converts a Google Sheets sharing URL into an xlsx export URL.
 */
const toExportUrl = (sheetUrl) => {
  const match = sheetUrl.match(/\/d\/([a-zA-Z0-9_-]+)/);
  if (!match) throw new Error(`Invalid Google Sheets URL: ${sheetUrl}`);
  const sheetId = match[1];
  return `https://docs.google.com/spreadsheets/d/${sheetId}/export?format=xlsx`;
};

/**
 * Downloads a Google Sheet as xlsx and saves to the company's data folder.
 * Since the Google Sheet contains ALL data (HRMS + Finance) in one file,
 * we download it once as Company.xlsx.
 */
const downloadSheet = async (sheetUrl, destPath) => {
  const exportUrl = toExportUrl(sheetUrl);
  logger.info(`[Excel] Downloading sheet from ${exportUrl}`);
  const response = await axios.get(exportUrl, { responseType: 'arraybuffer', timeout: 30000 });
  fs.writeFileSync(destPath, response.data);
  logger.info(`[Excel] Saved to ${destPath}`);
};

/**
 * Downloads the company Google Sheet as a single Company.xlsx file.
 * Both HRMS and Finance data live in different tabs of the same sheet.
 */
const syncCompanySheets = async (companyId, hrmsUrl, financeUrl) => {
  const companyFile = path.join(companyDir(companyId), 'Company.xlsx');
  // Both URLs typically point to the same Google Sheet — download once
  await downloadSheet(hrmsUrl, companyFile);
  logger.info(`[Excel] Synced Company.xlsx for company ${companyId}`);
};

// ── Generic helpers ──────────────────────────────────────────────────────────

/**
 * Find a sheet by matching name patterns (case-insensitive).
 * Falls back to sheet at given index if no name match found.
 */
const findSheet = (workbook, namePatterns, fallbackIndex = 0) => {
  const sheetNames = workbook.SheetNames;
  // Try matching by name patterns
  for (const pattern of namePatterns) {
    const match = sheetNames.find(s => s.toLowerCase().includes(pattern.toLowerCase()));
    if (match) return match;
  }
  // Fallback to index
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
    sheetName = sheetNameOrIndex;
  }
  if (!workbook.Sheets[sheetName]) {
    throw new Error(`Sheet '${sheetName}' not found. Available sheets: ${workbook.SheetNames.join(', ')}`);
  }
  return xlsx.utils.sheet_to_json(workbook.Sheets[sheetName], { defval: null });
};

const readHrmsSheet = (companyId) => {
  const filePath = hrmsPath(companyId);
  const workbook = xlsx.readFile(filePath);
  const sheetName = findSheet(workbook, ['hrms', 'employee', 'staff', 'people'], 0);
  logger.info(`[Excel] Reading HRMS data from sheet: "${sheetName}" in ${path.basename(filePath)}`);
  return xlsx.utils.sheet_to_json(workbook.Sheets[sheetName], { defval: null });
};

const readFinanceSheet = (companyId) => {
  const filePath = financePath(companyId);
  const workbook = xlsx.readFile(filePath);
  const sheetName = findSheet(workbook, ['finance', 'budget', 'accounts', 'expense'], 1);
  logger.info(`[Excel] Reading Finance data from sheet: "${sheetName}" in ${path.basename(filePath)}`);
  return xlsx.utils.sheet_to_json(workbook.Sheets[sheetName], { defval: null });
};

const writeSheet = (filePath, data, sheetName = 'Sheet1') => {
  let workbook;
  if (fs.existsSync(filePath)) {
    workbook = xlsx.readFile(filePath);
  } else {
    workbook = xlsx.utils.book_new();
  }

  const sheet = xlsx.utils.json_to_sheet(data);
  if (workbook.SheetNames.includes(sheetName)) {
    workbook.Sheets[sheetName] = sheet;
  } else {
    xlsx.utils.book_append_sheet(workbook, sheet, sheetName);
  }
  xlsx.writeFile(workbook, filePath);
};

// ── HRMS (per-company) ──────────────────────────────────────────────────────

const getEmployeeById = (companyId, employeeId) => {
  const rows = readHrmsSheet(companyId);
  return rows.find(r => r.EmployeeID === employeeId) || null;
};

const getEmployeeByEmail = (companyId, email) => {
  const rows = readHrmsSheet(companyId);
  const lowerEmail = email.toLowerCase().trim();
  return rows.find(r => (r.Email || '').toLowerCase().trim() === lowerEmail) || null;
};

const getAllEmployees = (companyId) => readHrmsSheet(companyId);

const updateEmployeeBudgetUsed = (companyId, employeeId, additionalAmount) => {
  const filePath = hrmsPath(companyId);
  const workbook = xlsx.readFile(filePath);
  const sheetName = findSheet(workbook, ['hrms', 'employee', 'staff', 'people'], 0);
  const rows = xlsx.utils.sheet_to_json(workbook.Sheets[sheetName], { defval: null });
  const idx  = rows.findIndex(r => r.EmployeeID === employeeId);
  if (idx === -1) throw new Error(`Employee ${employeeId} not found in HRMS`);

  rows[idx].TravelBudgetUsed = (rows[idx].TravelBudgetUsed || 0) + additionalAmount;
  rows[idx].LastUpdated = new Date().toISOString();

  writeSheet(filePath, rows, sheetName);
  logger.info(`[Excel] Updated TravelBudgetUsed for ${employeeId} by +${additionalAmount}`);
  return rows[idx];
};

// ── Finance (per-company) ────────────────────────────────────────────────────

const getFinanceData = (companyId) => readFinanceSheet(companyId);

const getCurrentMonthFinance = (companyId) => {
  const rows = readFinanceSheet(companyId);
  const now  = new Date();
  const currentMonthName = now.toLocaleString('en-US', { month: 'long' }).toLowerCase();
  return rows.find(r => (!r.Department || String(r.Department).trim().toLowerCase() === 'all') && String(r.Month).toLowerCase().includes(currentMonthName)) || rows[0];
};

/**
 * Propose a budget update — writes to a "Proposals" sheet but does NOT
 * modify the live Budget sheet. Finance team must approve first.
 */
const proposeBudgetUpdate = (companyId, tripId, employeeId, amount, reason) => {
  const filePath = financePath(companyId);
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

  let existing = [];
  try {
    const wb = xlsx.readFile(filePath);
    if (wb.SheetNames.includes('Proposals')) {
      existing = xlsx.utils.sheet_to_json(wb.Sheets['Proposals'], { defval: null });
    }
  } catch (_) { /* first proposal */ }

  existing.push(proposal);

  const wb = xlsx.readFile(filePath);
  const sheet = xlsx.utils.json_to_sheet(existing);
  if (wb.SheetNames.includes('Proposals')) {
    wb.Sheets['Proposals'] = sheet;
  } else {
    xlsx.utils.book_append_sheet(wb, sheet, 'Proposals');
  }
  xlsx.writeFile(wb, filePath);

  logger.info(`[Excel] Budget proposal ${proposal.ProposalID} created`);
  return proposal;
};

/**
 * Applies an approved budget deduction to the Finance Budget sheet.
 * Should only be called after Finance approval.
 */
const applyBudgetDeduction = (companyId, amount, tripId) => {
  const filePath = financePath(companyId);
  const workbook = xlsx.readFile(filePath);
  const sheetName = findSheet(workbook, ['finance', 'budget', 'accounts', 'expense'], 1);
  const rows = xlsx.utils.sheet_to_json(workbook.Sheets[sheetName], { defval: null });
  const now  = new Date();
  const currentMonthName = now.toLocaleString('en-US', { month: 'long' }).toLowerCase();

  const idx = rows.findIndex(r => (!r.Department || String(r.Department).trim().toLowerCase() === 'all') && String(r.Month).toLowerCase().includes(currentMonthName));
  if (idx === -1) {
    logger.warn(`[Excel] No budget row found for ${currentMonthName} — skipping deduction`);
    return;
  }

  rows[idx].SpentAmount     = (rows[idx].SpentAmount || 0) + amount;
  rows[idx].RemainingBudget = rows[idx].AllocatedBudget - rows[idx].SpentAmount;
  rows[idx].LastUpdated     = now.toISOString();

  writeSheet(filePath, rows, sheetName);
  logger.info(`[Excel] Budget deducted ₹${amount} for trip ${tripId}`);
  return rows[idx];
};

module.exports = {
  readSheet, readHrmsSheet, readFinanceSheet, writeSheet,
  syncCompanySheets, downloadSheet, toExportUrl,
  getEmployeeById, getEmployeeByEmail, getAllEmployees, updateEmployeeBudgetUsed,
  getFinanceData, getCurrentMonthFinance, proposeBudgetUpdate, applyBudgetDeduction,
  hrmsPath, financePath
};
