const { fail } = require('../utils/response');

function isLoopbackIp(ip) {
  return ip === '127.0.0.1'
    || ip === '::1'
    || ip === '::ffff:127.0.0.1';
}

function localOnly(req, res, next) {
  if (isLoopbackIp(req.ip)) {
    return next();
  }

  return fail(res, '该接口仅允许主机本地访问', 403);
}

module.exports = { localOnly };
