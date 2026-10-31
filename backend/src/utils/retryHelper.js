const logger = require('./logger');

/**
 * Retries an async function up to `maxAttempts` times with exponential backoff.
 */
const withRetry = async (fn, { maxAttempts = 3, baseDelayMs = 500, label = 'operation' } = {}) => {
  let lastError;

  for (let attempt = 1; attempt <= maxAttempts; attempt++) {
    try {
      return await fn();
    } catch (err) {
      lastError = err;
      if (attempt === maxAttempts) break;

      const delay = baseDelayMs * Math.pow(2, attempt - 1); // 500, 1000, 2000 ...
      logger.warn(`[Retry] ${label} failed (attempt ${attempt}/${maxAttempts}) — retrying in ${delay}ms`);
      await sleep(delay);
    }
  }

  logger.error(`[Retry] ${label} failed after ${maxAttempts} attempts`);
  throw lastError;
};

const sleep = (ms) => new Promise(resolve => setTimeout(resolve, ms));

module.exports = { withRetry, sleep };
