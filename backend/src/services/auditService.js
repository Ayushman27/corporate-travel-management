const Log = require('../models/Log');
const logger = require('../utils/logger');

/**
 * Records an audit log entry.
 * Non-blocking — failures are logged but don't throw.
 */
const audit = async (action, { tripId, actor, details, req } = {}) => {
  try {
    await Log.create({
      tripId,
      actorId:   actor?.id   || actor?._id,
      actorName: actor?.name,
      actorRole: actor?.role,
      action,
      details,
      ipAddress: req?.ip,
      userAgent: req?.headers?.['user-agent']
    });
  } catch (err) {
    logger.error(`[Audit] Failed to write log for action ${action}: ${err.message}`);
  }
};

const getLogsForTrip = (tripId) =>
  Log.find({ tripId }).sort({ timestamp: 1 }).lean();

const getLogsByAction = (action, limit = 100) =>
  Log.find({ action }).sort({ timestamp: -1 }).limit(limit).lean();

const getRecentLogs = (limit = 50) =>
  Log.find().sort({ timestamp: -1 }).limit(limit).lean();

module.exports = { audit, getLogsForTrip, getLogsByAction, getRecentLogs };
