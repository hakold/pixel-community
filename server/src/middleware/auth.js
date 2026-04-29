/**
 * JWT 认证中间件
 * 验证请求头中的 Bearer Token，解析用户信息并注入到 req.player
 * 认证失败直接抛出异常，由全局错误处理器统一处理
 */
const jwt = require('jsonwebtoken');
const config = require('../config');
const { AppError } = require('./errorHandler');

/**
 * JWT 认证中间件
 * 从 Authorization 头提取 Bearer Token，验证后挂载玩家信息
 */
function authMiddleware(req, _res, next) {
  const authHeader = req.headers.authorization;
  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    return next(new AppError('未提供认证令牌', 401));
  }

  const token = authHeader.split(' ')[1];

  try {
    const decoded = jwt.verify(token, config.jwt.secret);
    req.player = {
      id: decoded.id,
      username: decoded.username,
      characterName: decoded.characterName,
    };
    next();
  } catch (err) {
    // JWT 异常让全局错误处理器根据 err.name 处理
    next(err);
  }
}

module.exports = authMiddleware;
