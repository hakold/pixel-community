/**
 * 全局精力自动回复服务
 *
 * 规则：
 * - 对齐服务器时钟，每 5 分钟（0,5,10,15...分）触发一次
 * - 所有角色统一 +5 精力，达到上限 100 时不再增加
 * - 消耗精力发生在两次 tick 之间，需等到下一个 5 分钟才会恢复
 * - tick 完成后通过 WebSocket 实时推送在线玩家的最新精力值
 */
const Player = require('../models/Player');
const roomManager = require('../ws/roomManager');
const { sendToPlayer } = require('../ws');

const REGEN_AMOUNT = 5;
const INTERVAL_MINUTES = 5;
const MAX_ENERGY = 100;

let intervalId = null;
let nextTickMs = 0;

/**
 * 向所有在线玩家推送最新精力值
 */
async function syncOnlinePlayers() {
  const playerIds = roomManager.getAllOnlinePlayerIds();
  if (!playerIds.length) return;

  try {
    const players = await Player.find(
      { _id: { $in: playerIds } },
      { lifeAttributes: 1 }
    );

    for (const player of players) {
      sendToPlayer(player._id.toString(), 'attributes_sync', {
        lifeAttributes: player.lifeAttributes,
      });
    }
  } catch (err) {
    console.error('[Regen] 推送精力失败:', err.message);
  }
}

/**
 * 执行一次精力回复
 * 所有 lifeAttributes.energy < MAX 的角色 +REGEN_AMOUNT，上限 MAX
 */
async function tick() {
  const start = Date.now();
  try {
    // 先 +5（仅对未满的玩家）
    const incResult = await Player.updateMany(
      { 'lifeAttributes.energy': { $lt: MAX_ENERGY } },
      { $inc: { 'lifeAttributes.energy': REGEN_AMOUNT } }
    );
    // 修正超过上限的（兜底）
    const capResult = await Player.updateMany(
      { 'lifeAttributes.energy': { $gt: MAX_ENERGY } },
      { $set: { 'lifeAttributes.energy': MAX_ENERGY } }
    );

    const touched = incResult.modifiedCount || 0;
    const capped = capResult.modifiedCount || 0;
    if (touched > 0 || capped > 0) {
      console.log(`[Regen] tick 完成: +${REGEN_AMOUNT} 精力 → ${touched} 人` + (capped > 0 ? ` (${capped} 人触发上限修正)` : ''));
    }

    // 推送在线玩家最新精力
    await syncOnlinePlayers();
  } catch (err) {
    console.error('[Regen] tick 失败:', err.message);
  }
  console.log(`[Regen] 耗时: ${Date.now() - start}ms, 下次: ${new Date(nextTickMs).toISOString()}`);
}

/**
 * 计算距离下一个 5 分钟边界的毫秒数
 */
function msUntilNextBoundary() {
  const now = new Date();
  const m = now.getMinutes();
  const s = now.getSeconds();
  const ms = now.getMilliseconds();
  const next = (Math.floor(m / INTERVAL_MINUTES) + 1) * INTERVAL_MINUTES;
  const deltaM = next - m;
  return (deltaM * 60 - s) * 1000 - ms;
}

/**
 * 启动全局回复定时器
 * 首次对齐到最近的 5 分钟整点，之后每 5 分钟执行
 */
function start() {
  if (intervalId) return;

  const delay = msUntilNextBoundary();
  nextTickMs = Date.now() + delay;
  console.log(`[Regen] 首次 tick 将在 ${Math.round(delay / 1000)}s 后触发 (${new Date(nextTickMs).toISOString()})`);

  intervalId = setTimeout(() => {
    tick();
    // 之后每 5 分钟执行
    intervalId = setInterval(tick, INTERVAL_MINUTES * 60 * 1000);
  }, delay);
}

/**
 * 停止定时器
 */
function stop() {
  if (intervalId) {
    clearInterval(intervalId);
    intervalId = null;
  }
}

module.exports = { start, stop, tick };
