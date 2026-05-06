const { fail } = require('../utils/response');

const WINDOW_MS = 10 * 60 * 1000;
const MAX_REQUESTS = 10;
const buckets = new Map();

function pruneExpired(now) {
  for (const [key, entry] of buckets.entries()) {
    if (entry.expiresAt <= now) {
      buckets.delete(key);
    }
  }
}

function authRateLimit(req, res, next) {
  const now = Date.now();
  pruneExpired(now);

  const key = `${req.ip}:${req.path}`;
  const entry = buckets.get(key);

  if (!entry || entry.expiresAt <= now) {
    buckets.set(key, {
      count: 1,
      expiresAt: now + WINDOW_MS,
    });
    return next();
  }

  if (entry.count >= MAX_REQUESTS) {
    const retryAfter = Math.ceil((entry.expiresAt - now) / 1000);
    res.set('Retry-After', String(retryAfter));
    return fail(res, '请求过于频繁，请稍后再试', 429);
  }

  entry.count += 1;
  return next();
}

module.exports = { authRateLimit };
