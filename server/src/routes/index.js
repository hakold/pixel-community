/**
 * 路由聚合入口
 * 将所有子路由挂载到 Express 应用
 */
const authRoutes = require('./auth');
const actionRoutes = require('./action');
const playerRoutes = require('./player');
const adminRoutes = require('./admin');
const mapRoutes = require('./maps');

function registerRoutes(app) {
  app.use('/api/auth', authRoutes);
  app.use('/api/action', actionRoutes);
  app.use('/api/player', playerRoutes);
  app.use('/api/admin', adminRoutes);
  app.use('/api/maps', mapRoutes);

  app.get('/api/health', (_req, res) => {
    res.json({ code: 0, message: 'ok', data: { uptime: process.uptime() } });
  });
}

module.exports = registerRoutes;
