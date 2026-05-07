const mongoose = require('mongoose');
const Redis = require('ioredis');
const config = require('../src/config');

const args = new Set(process.argv.slice(2));
const confirmed = args.has('--yes');
const forced = args.has('--force');

function assertConfirmed() {
  if (confirmed) {
    return;
  }

  console.error('这个脚本会清空当前开发库和 Redis 当前库。');
  console.error('如确认执行，请追加参数: --yes');
  process.exit(1);
}

function assertSafeMongoDb(dbName) {
  if (forced) {
    return;
  }

  const safeNames = new Set(['pixel-community', 'pixel_community']);
  if (!safeNames.has(dbName)) {
    throw new Error(`MongoDB 数据库名不在安全名单内: ${dbName}。如需继续，请加 --force`);
  }
}

async function resetMongo() {
  await mongoose.connect(config.mongodb.uri);
  const dbName = mongoose.connection.db.databaseName;
  assertSafeMongoDb(dbName);
  await mongoose.connection.db.dropDatabase();
  console.log(`[reset] MongoDB 已清空: ${dbName}`);
  await mongoose.disconnect();
}

async function resetRedis() {
  const redis = new Redis({
    host: config.redis.host,
    port: config.redis.port,
    password: config.redis.password || undefined
  });

  await redis.flushdb();
  console.log(`[reset] Redis 当前库已清空: ${config.redis.host}:${config.redis.port}`);
  await redis.quit();
}

async function main() {
  assertConfirmed();
  await resetMongo();
  await resetRedis();
  console.log('[reset] 开发环境数据清理完成');
}

main().catch(async (error) => {
  console.error('[reset] 执行失败:', error.message);
  try {
    await mongoose.disconnect();
  } catch (_error) {
    // 忽略关闭失败
  }
  process.exit(1);
});
