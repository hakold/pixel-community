/**
 * 应用配置加载器
 * 读取 .env 环境变量并导出统一配置对象
 */
const path = require('path');
const dotenv = require('dotenv');

// 加载 .env 文件
dotenv.config({ path: path.join(__dirname, '..', '..', '.env') });

const config = {
  // 服务配置
  server: {
    port: parseInt(process.env.PORT, 10) || 3000,
    host: process.env.SERVER_HOST || 'localhost',
  },

  // MongoDB 配置
  mongodb: {
    uri: process.env.MONGODB_URI || 'mongodb://localhost:27017/pixel-community',
  },

  // Redis 配置
  redis: {
    host: process.env.REDIS_HOST || 'localhost',
    port: parseInt(process.env.REDIS_PORT, 10) || 6379,
    password: process.env.REDIS_PASSWORD || undefined,
  },

  // JWT 配置
  jwt: {
    secret: process.env.JWT_SECRET || 'default-secret',
    expiresIn: process.env.JWT_EXPIRES_IN || '7d',
  },

  // WebSocket 配置
  ws: {
    heartbeatInterval: parseInt(process.env.WS_HEARTBEAT_INTERVAL, 10) || 30000,
  },
};

module.exports = config;
