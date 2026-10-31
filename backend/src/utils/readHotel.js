const xlsx = require('xlsx');
const path = require('path');

const filePath = path.join(__dirname, '../../data/hotel_data.xlsx');

try {
  const workbook = xlsx.readFile(filePath);
  const sheetName = workbook.SheetNames[0];
  const sheet = workbook.Sheets[sheetName];
  const data = xlsx.utils.sheet_to_json(sheet);
  console.log('Headers:', Object.keys(data[0] || {}));
  console.log('Sample Data (first 2 rows):', data.slice(0, 2));
} catch (err) {
  console.error('Error reading hotel_data.xlsx:', err.message);
}
