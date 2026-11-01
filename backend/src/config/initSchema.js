require('dotenv').config({ path: require('path').join(__dirname, '../../.env') });
const fs = require('fs');
const path = require('path');
const { Pool } = require('pg');

const connectionString = process.env.DATABASE_URL || 'postgresql://neondb_owner:npg_8FxyTVjeo3Dt@ep-steep-moon-b55zp83t-pooler.c-7.us-east-2.aws.neon.tech/neondb?sslmode=require&channel_binding=require';

const pool = new Pool({
  connectionString,
  ssl: { rejectUnauthorized: false }
});

async function initSchema() {
  const sql = fs.readFileSync(path.join(__dirname, 'schema.sql'), 'utf-8');
  console.log('Connecting to Neon DB to run schema...');
  await pool.query(sql);
  console.log('Schema executed successfully!');
  const res = await pool.query(`
    SELECT table_name 
    FROM information_schema.tables 
    WHERE table_schema = 'public' 
    ORDER BY table_name;
  `);
  console.log('Tables in Neon DB:', res.rows.map(r => r.table_name));
  await pool.end();
}

if (require.main === module) {
  initSchema().catch(err => {
    console.error('Failed to init schema:', err);
    process.exit(1);
  });
}

module.exports = { initSchema, pool };
