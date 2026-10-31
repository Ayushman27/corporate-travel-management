const mongoose = require('mongoose');
const logger = require('../utils/logger');

const connectDB = async () => {
  const uri = process.env.MONGODB_URI || 'mongodb://localhost:27017/ctm_db';

  try {
    const conn = await mongoose.connect(uri, {
      serverSelectionTimeoutMS: 5000,
      socketTimeoutMS: 45000,
    });
    logger.info(`MongoDB connected: ${conn.connection.host}`);

    // Clean up stale single-field unique indexes that conflict with compound indexes
    try {
      const usersCollection = conn.connection.db.collection('users');
      const indexes = await usersCollection.indexes();
      const staleIndexes = indexes.filter(idx => {
        const keys = Object.keys(idx.key);
        // Drop single-field unique indexes on employeeId or email
        // (these should only be unique as part of compound indexes with companyId)
        return idx.unique && keys.length === 1 && ['employeeId', 'email'].includes(keys[0]);
      });
      for (const idx of staleIndexes) {
        logger.info(`[DB] Dropping stale unique index: ${idx.name}`);
        await usersCollection.dropIndex(idx.name);
      }
      if (staleIndexes.length > 0) {
        logger.info(`[DB] Dropped ${staleIndexes.length} stale index(es). Rebuilding correct indexes...`);
        await mongoose.model('User').syncIndexes();
      }
    } catch (indexErr) {
      // Collection may not exist yet on first run — that's fine
      if (indexErr.codeName !== 'NamespaceNotFound') {
        logger.warn(`[DB] Index cleanup warning: ${indexErr.message}`);
      }
    }
  } catch (err) {
    logger.error(`MongoDB connection error: ${err.message}`);
    // Retry after 5 s instead of crashing immediately
    setTimeout(connectDB, 5000);
  }
};

mongoose.connection.on('disconnected', () =>
  logger.warn('MongoDB disconnected — attempting reconnect...')
);

module.exports = connectDB;
