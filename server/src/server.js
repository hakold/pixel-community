/**
 * 服务启动入口
 * 负责初始化数据库连接、启动 HTTP + WebSocket 服务
 */
const path = require('path');
const http = require('http');
const app = require('./app');
const config = require('./config');
const configManager = require('./config/configManager');
const { connectMongoDB, connectRedis, closeConnections } = require('./config/db');
const { initWebSocket } = require('./ws');

// 全局 Redis 实例引用（后续模块通过此处获取）
let redis = null;

/**
 * 启动服务
 */
async function start() {
  // 0. 初始化配置管理器（加载全部 JSON 配置到内存）
  const configDir = path.join(__dirname, '..', 'config');
  configManager.init(configDir);
  console.log('[Server] 配置管理器已初始化');

  // 1. 连接 MongoDB
  await connectMongoDB();

  // 2. 连接 Redis
  redis = await connectRedis();

  // 3. 创建 HTTP Server
  const httpServer = http.createServer(app);

  // 4. 挂载 WebSocket 到 HTTP Server
  initWebSocket(httpServer);

  // 5. 启动监听
  httpServer.listen(config.server.port, () => {
    console.log('════════════════════════════════════════');
    console.log('  《像素社区》后端服务');
    console.log(`  HTTP:  http://localhost:${config.server.port}`);
    console.log(`  WS:    ws://localhost:${config.server.port}`);
    console.log('════════════════════════════════════════');
  });

  // 6. 优雅退出
  process.on('SIGINT', async () => {
    console.log('\n正在关闭服务...');
    await closeConnections(redis);
    process.exit(0);
  });
}

// 获取 Redis 实例
function getRedis() {
  return redis;
}

start().catch((err) => {
  console.error('服务启动失败:', err);
  process.exit(1);
});

module.exports = { getRedis };
