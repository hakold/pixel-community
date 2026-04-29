/**
 * 数据库连接管理
 * 负责 MongoDB 和 Redis 的连接建立与断开
 */
const mongoose = require('mongoose');
const Redis = require('ioredis');
const config = require('./index');

/**
 * 连接 MongoDB
 * @returns {Promise<void>}
 */
async function connectMongoDB() {
  try {
    await mongoose.connect(config.mongodb.uri);
    console.log('[MongoDB] 连接成功');
  } catch (err) {
    console.error('[MongoDB] 连接失败:', err.message);
    process.exit(1);
  }

  mongoose.connection.on('error', (err) => {
    console.error('[MongoDB] 连接异常:', err.message);
  });

  mongoose.connection.on('disconnected', () => {
    console.warn('[MongoDB] 连接断开');
  });
}

/**
 * 连接 Redis
 * @returns {Promise<Redis>} Redis 客户端实例
 */
async function connectRedis() {
  const redisOptions = {
    host: config.redis.host,
    port: config.redis.port,
    retryStrategy(times) {
      // 重试策略：最多重试 10 次，间隔递增
      if (times > 10) {
        console.error('[Redis] 重试次数超限，放弃连接');
        return null;
      }
      return Math.min(times * 200, 2000);
    },
  };

  if (config.redis.password) {
    redisOptions.password = config.redis.password;
  }

  const redis = new Redis(redisOptions);

  redis.on('connect', () => {
    console.log('[Redis] 连接成功');
  });

  redis.on('error', (err) => {
    console.error('[Redis] 连接异常:', err.message);
  });

  return redis;
}

/**
 * 关闭所有数据库连接
 * @param {Redis} redis - Redis 客户端实例
 * @returns {Promise<void>}
 */
async function closeConnections(redis) {
  await mongoose.disconnect();
  console.log('[MongoDB] 已断开');
  if (redis) {
    await redis.quit();
    console.log('[Redis] 已断开');
  }
}

module.exports = { connectMongoDB, connectRedis, closeConnections };
