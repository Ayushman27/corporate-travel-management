/**
 * Generates sample hrms.xlsx and finance.xlsx in ./data/
 * Run: node src/utils/seedExcel.js
 */

const xlsx = require('xlsx');
const path = require('path');
const fs = require('fs');
const axios = require('axios');

const dataDir = path.join(__dirname, '../../data');
if (!fs.existsSync(dataDir)) fs.mkdirSync(dataDir, { recursive: true });

// ── HRMS Excel ────────────────────────────────────────────────────────────────
(async () => {
  try {
    const url = 'https://docs.google.com/spreadsheets/d/1EjlWbgIPWdQtTtQwEVymXZfJjG3MJbw-yVob1xd42rs/export?format=xlsx';
    console.log('Downloading HRMS data from Google Sheets...');
    const response = await axios.get(url, { responseType: 'arraybuffer' });
    fs.writeFileSync(path.join(dataDir, 'hrms.xlsx'), response.data);
    console.log('✅ hrms.xlsx downloaded from Google Sheets');
  } catch (err) {
    console.error('❌ Failed to download HRMS data:', err.message);
  }

// ── Finance Excel ─────────────────────────────────────────────────────────────
const currentYear = new Date().getFullYear();
const months = [
  'January', 'February', 'March', 'April', 'May', 'June',
  'July', 'August', 'September', 'October', 'November', 'December'
];

const financeData = months.map((month, i) => ({
  Month:            `${month} ${currentYear}`,
  Department:       'All',
  AllocatedBudget:  500000,
  SpentAmount:      i < 4 ? Math.floor(Math.random() * 300000) + 50000 : 0,
  RemainingBudget:  0,           // computed below
  LastUpdated:      i < 4 ? new Date().toISOString() : ''
}));

// Add departmental breakdown rows
const departments = ['Engineering', 'Sales', 'Marketing', 'Finance', 'Operations'];
const deptRows = departments.map(dept => ({
  Month:           `Current Year ${currentYear}`,
  Department:      dept,
  AllocatedBudget: dept === 'Sales' ? 200000 : 100000,
  SpentAmount:     Math.floor(Math.random() * 80000),
  RemainingBudget: 0,
  LastUpdated:     new Date().toISOString()
}));

[...financeData, ...deptRows].forEach(row => {
  row.RemainingBudget = row.AllocatedBudget - row.SpentAmount;
});

const finSheet = xlsx.utils.json_to_sheet([...financeData, ...deptRows]);
const finBook  = xlsx.utils.book_new();
xlsx.utils.book_append_sheet(finBook, finSheet, 'Budget');
xlsx.writeFile(finBook, path.join(dataDir, 'finance.xlsx'));
console.log('✅ finance.xlsx created');

console.log('\n📊 Sample Excel files generated in ./data/');
})();
