/**
 * 路由聚合入口
 * 将所有子路由挂载到 Express 应用
 */
const authRoutes = require('./auth');
const actionRoutes = require('./action');
const playerRoutes = require('./player');
const adminRoutes = require('./admin');

/**
 * 注册全部路由
 * @param {import('express').Express} app - Express 实例
 */
function registerRoutes(app) {
  app.use('/api/auth', authRoutes);
  app.use('/api/action', actionRoutes);
  app.use('/api/player', playerRoutes);
  app.use('/api/admin', adminRoutes);

  // 健康检查
  app.get('/api/health', (_req, res) => {
    res.json({ code: 0, message: 'ok', data: { uptime: process.uptime() } });
  });
}

module.exports = registerRoutes;
