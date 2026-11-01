const { Pool, types } = require('pg');
const fs = require('fs');
const path = require('path');
const logger = require('../utils/logger');

// Parse PostgreSQL NUMERIC/DECIMAL (OID 1700) as JavaScript numbers
types.setTypeParser(1700, (val) => (val === null ? null : parseFloat(val)));

const connectionString =
  process.env.DATABASE_URL ||
  process.env.NEON_DATABASE_URL ||
  'postgresql://neondb_owner:npg_8FxyTVjeo3Dt@ep-steep-moon-b55zp83t-pooler.c-7.us-east-2.aws.neon.tech/neondb?sslmode=require&channel_binding=require';

const pool = new Pool({
  connectionString,
  ssl: { rejectUnauthorized: false },
  max: 20,
  idleTimeoutMillis: 30000,
  connectionTimeoutMillis: 10000
});

pool.on('error', (err) => {
  logger.error(`[Neon] Unexpected client error: ${err.message}`);
});

const connectDB = async () => {
  if (process.env.NODE_ENV === 'test') return;

  try {
    const client = await pool.connect();
    const res = await client.query('SELECT NOW()');
    client.release();
    logger.info(`✅ Neon PostgreSQL connected successfully! Server time: ${res.rows[0].now}`);

    // Ensure database tables exist
    const schemaPath = path.join(__dirname, 'schema.sql');
    if (fs.existsSync(schemaPath)) {
      const sql = fs.readFileSync(schemaPath, 'utf-8');
      await pool.query(sql);
      logger.info('✅ Neon database schema verified');
    }
  } catch (err) {
    logger.error(`❌ Neon PostgreSQL connection error: ${err.message}`);
    setTimeout(connectDB, 5000);
  }
};

connectDB.connectDB = connectDB;
connectDB.pool = pool;
connectDB.query = (text, params) => pool.query(text, params);

module.exports = connectDB;
