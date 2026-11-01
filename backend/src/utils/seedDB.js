/**
 * Seeds the Neon database with a sample company and users.
 * Run: node src/utils/seedDB.js
 */

require('dotenv').config({ path: require('path').join(__dirname, '../../.env') });
const fs = require('fs');
const path = require('path');
const { pool, connectDB } = require('../config/db');
const User = require('../models/User');
const Company = require('../models/Company');

const COMPANY_ID = 'COMP-DEV00001';
const DATA_DIR = path.join(__dirname, '../../data');
const COMPANY_DIR = path.join(DATA_DIR, COMPANY_ID);

const sampleCompany = {
  companyId: COMPANY_ID,
  companyName: 'Dev Corp (Sample)',
  headName: 'Suresh Kumar',
  headEmail: 'suresh@company.com',
  headPassword: 'password123',
  hrmsSheetUrl: 'https://docs.google.com/spreadsheets/d/1EjlWbgIPWdQtTtQwEVymXZfJjG3MJbw-yVob1xd42rs/edit',
  financeSheetUrl: 'https://docs.google.com/spreadsheets/d/1EjlWbgIPWdQtTtQwEVymXZfJjG3MJbw-yVob1xd42rs/edit',
  policy: {
    budgetLimits: { employee: 50000, manager: 150000, finance: 150000, admin: 500000 },
    minAdvanceNoticeDays: 2,
    maxTripDurationDays: 30
  }
};

const users = [
  {
    employeeId: 'EMP001', companyId: COMPANY_ID, name: 'Arjun Sharma', email: 'arjun@company.com',
    department: 'Engineering', role: 'employee', loginType: 'email_only',
    managerId: 'EMP005', travelBudgetLimit: 50000
  },
  {
    employeeId: 'EMP002', companyId: COMPANY_ID, name: 'Priya Mehta', email: 'priya@company.com',
    department: 'Sales', role: 'employee', loginType: 'email_only',
    managerId: 'EMP006', travelBudgetLimit: 80000
  },
  {
    employeeId: 'EMP003', companyId: COMPANY_ID, name: 'Rahul Gupta', email: 'rahul@company.com',
    department: 'Marketing', role: 'employee', loginType: 'email_only',
    managerId: 'EMP005', travelBudgetLimit: 50000
  },
  {
    employeeId: 'EMP005', companyId: COMPANY_ID, name: 'Vikram Nair', email: 'vikram@company.com',
    department: 'Engineering', role: 'manager', loginType: 'email_only',
    managerId: 'EMP009', travelBudgetLimit: 150000
  },
  {
    employeeId: 'EMP006', companyId: COMPANY_ID, name: 'Kavitha Iyer', email: 'kavitha@company.com',
    department: 'Sales', role: 'manager', loginType: 'email_only',
    managerId: 'EMP009', travelBudgetLimit: 150000
  },
  {
    employeeId: 'EMP007', companyId: COMPANY_ID, name: 'Deepak Joshi', email: 'deepak@company.com',
    department: 'Finance', role: 'finance', loginType: 'email_only',
    managerId: 'EMP009', travelBudgetLimit: 100000
  },
  {
    employeeId: 'ADMIN-001', companyId: COMPANY_ID, name: 'Suresh Kumar', email: 'suresh@company.com',
    password: 'password123', department: 'Management',
    role: 'admin', loginType: 'password', travelBudgetLimit: 500000
  },
];

(async () => {
  try {
    await connectDB();

    // Upsert sample company
    await Company.findOneAndUpdate(
      { companyId: COMPANY_ID },
      sampleCompany,
      { upsert: true, new: true }
    );
    console.log(`✅ Upserted sample company: ${sampleCompany.companyName}`);

    // Upsert sample users
    for (const u of users) {
      await User.findOneAndUpdate(
        { companyId: u.companyId, employeeId: u.employeeId },
        u,
        { upsert: true, new: true }
      );
    }
    console.log(`✅ Upserted ${users.length} sample users into Neon DB`);

    // Copy Excel files into per-company directory
    if (!fs.existsSync(COMPANY_DIR)) fs.mkdirSync(COMPANY_DIR, { recursive: true });

    const filesToCopy = ['hrms.xlsx', 'finance.xlsx'];
    for (const file of filesToCopy) {
      const src = path.join(DATA_DIR, file);
      const dest = path.join(COMPANY_DIR, file);
      if (fs.existsSync(src)) {
        fs.copyFileSync(src, dest);
        console.log(`✅ Copied ${file} → data/${COMPANY_ID}/${file}`);
      }
    }

    console.log('\n📋 Login credentials:');
    console.log('  Employee login: arjun@company.com (Company ID: COMP-DEV00001)');
    console.log('  Admin login:    suresh@company.com / password123');

    await pool.end();
  } catch (err) {
    console.error('Seed error:', err);
    process.exit(1);
  }
})();
