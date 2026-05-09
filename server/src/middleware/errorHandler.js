/**
 * 全局错误处理中间件
 * 统一捕获所有未处理的异常，返回标准 JSON 格式
 */
const { fail } = require('../utils/response');

/**
 * 自定义业务异常类
 * 用于在任意层级抛出可预期的业务错误
 */
class AppError extends Error {
  /**
   * @param {string} message - 错误描述
   * @param {number} statusCode - HTTP 状态码
   * @param {number} errCode - 业务错误码
   */
  constructor(message, statusCode = 400, errCode = -1) {
    super(message);
    this.statusCode = statusCode;
    this.errCode = errCode;
  }
}

/**
 * 全局错误处理中间件（4 个参数，Express 识别为错误处理器）
 * @param {Error} err - 捕获到的错误
 * @param {import('express').Request} req
 * @param {import('express').Response} res
 * @param {import('express').NextFunction} _next
 */
function errorHandler(err, req, _res, _next) {
  // 业务异常
  if (err instanceof AppError) {
    return fail(_res, err.message, err.statusCode, err.errCode);
  }

  // JWT 验证异常
  if (err.name === 'JsonWebTokenError') {
    return fail(_res, '无效的认证令牌', 401);
  }
  if (err.name === 'TokenExpiredError') {
    return fail(_res, '令牌已过期，请重新登录', 401);
  }

  // Mongoose 校验异常
  if (err.name === 'ValidationError') {
    const messages = Object.values(err.errors).map((e) => e.message);
    return fail(_res, messages.join('; '), 400);
  }

  // Mongoose 重复键异常
  if (err.code === 11000) {
    const field = Object.keys(err.keyValue || {})[0] || '字段';
    return fail(_res, `${field} 已存在`, 409);
  }

  // 未知异常：记录日志，返回 500
  console.error(`[Error] ${req.method} ${req.path}:`, err);
  // 开发模式下返回真实错误信息，便于前端调试
  const devMessage = process.env.NODE_ENV !== 'production'
    ? `${err.message || 'Unknown error'}`
    : '服务器内部错误';
  return fail(_res, devMessage, 500);
}

module.exports = { errorHandler, AppError };
