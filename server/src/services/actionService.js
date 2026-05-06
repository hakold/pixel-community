/**
 * 行为系统服务（核心模块）
 *
 * 支持 5 种行为：study / work / mining / woodcut / fishing
 * 机制：创建任务 → 记录开始时间 → 等待完成 → 结算收益
 * 收益 = 配置表基础值 × 心情倍率
 * 离线登录时自动结算已完成周期
 */
const ActionTask = require('../models/ActionTask');
const Player = require('../models/Player');
const { getActionConfig, getGameConfig } = require('../config/gameConfig');
const attributeService = require('./attributeService');
const { sendToPlayer } = require('../ws');

// 有效的行为类型
const VALID_ACTION_TYPES = ['study', 'work', 'mining', 'woodcut', 'fishing'];

/**
 * 获取玩家当前学历阶段
 * 学历以技能形式存储，前缀 study_
 * @param {Object} player - 玩家文档
 * @returns {string|null} 学历 ID（如 'preschool'、'phd'）或 null
 */
function getPlayerEducation(player) {
  const studySkill = player.skills.find((s) => s.skillId.startsWith('study_'));
  return studySkill ? studySkill.skillId.replace('study_', '') : null;
}

/**
 * 开始一个挂机行为任务
 * @param {string} playerId - 玩家 ID
 * @param {string} actionType - 行为类型：study | work | mining | woodcut | fishing
 * @param {string} actionId - 行为配置 ID
 * @returns {Promise<Object>} { task, player }
 * @throws {Error} 条件不满足 / 已有进行中任务
 */
async function startAction(playerId, actionType, actionId) {
  // 校验行为类型
  if (!VALID_ACTION_TYPES.includes(actionType)) {
    throw new Error(`无效的行为类型: ${actionType}`);
  }

  // 获取配置
  const config = getActionConfig(actionType, actionId);
  if (!config) {
    throw new Error('无效的行为配置');
  }

  // 获取玩家
  const player = await Player.findById(playerId);
  if (!player) {
    throw new Error('玩家不存在');
  }

  // 检查是否有进行中的任务
  const existingTask = await ActionTask.findOne({ playerId, status: 'active' });
  if (existingTask) {
    throw new Error('已有进行中的任务，请先结算');
  }

  // 综合校验（精力 + 等级 + 金币 + 属性 + 学历，委托给 attributeService）
  const canStart = attributeService.canPerformAction(player, config);
  if (!canStart.valid) {
    throw new Error(canStart.reason);
  }

  // 消耗精力
  if (config.energyCost) {
    player.lifeAttributes.energy = Math.round(Math.max(0, player.lifeAttributes.energy - config.energyCost));
  }

  // 创建任务 — 核心：记录开始时间和持续时长
  const task = await ActionTask.create({
    playerId,
    actionType,
    actionId,
    startTime: new Date(),
    duration: config.duration,
    startSnapshot: {
      energy: player.lifeAttributes.energy,
      mood: player.lifeAttributes.mood,
      level: player.level,
      education: getPlayerEducation(player),
    },
  });

  await player.save();

  // 实时推送最新属性（精力已扣除）
  sendToPlayer(player._id.toString(), 'attributes_sync', {
    lifeAttributes: player.lifeAttributes,
  });

  return { task, player };
}

/**
 * 查询当前任务进度
 * @param {string} playerId - 玩家 ID
 * @returns {Promise<Object>} 任务状态
 */
async function checkActionStatus(playerId) {
  const task = await ActionTask.findOne({ playerId, status: 'active' });
  if (!task) {
    return { hasTask: false, task: null };
  }

  const startMs = task.startTime.getTime();
  const nowMs = Date.now();
  const elapsed = Math.floor((nowMs - startMs) / 1000);
  const remaining = Math.max(0, task.duration - elapsed);
  const progress = Math.min(1, elapsed / task.duration);

  const config = getActionConfig(task.actionType, task.actionId);

  return {
    hasTask: true,
    task: {
      id: task._id,
      actionType: task.actionType,
      actionId: task.actionId,
      actionName: config ? config.name : task.actionId,
      startTime: task.startTime,
      duration: task.duration,
      elapsed,
      remaining,
      progress,
      isComplete: elapsed >= task.duration,
    },
  };
}

/**
 * 结算已完成任务 — 核心收益计算
 *
 * 结算公式：
 *   最终收益 = 配置表基础值 × 心情倍率（0.8 ~ 1.2）
 *   同时扣除任务期间的属性衰减
 *
 * @param {string} playerId - 玩家 ID
 * @returns {Promise<Object>} { actionType, actionId, actionName, elapsedSeconds, moodLevel, moodMultiplier, rewards, player }
 * @throws {Error} 无任务 / 任务未完成
 */
async function collectAction(playerId) {
  const task = await ActionTask.findOne({ playerId, status: 'active' });
  if (!task) {
    throw new Error('没有进行中的任务');
  }

  const startMs = task.startTime.getTime();
  const elapsed = Math.floor((Date.now() - startMs) / 1000);

  if (elapsed < task.duration) {
    const remaining = task.duration - elapsed;
    throw new Error(`任务尚未完成，还需等待 ${remaining} 秒`);
  }

  // 获取配置
  const config = getActionConfig(task.actionType, task.actionId);
  if (!config) {
    throw new Error('行为配置不存在');
  }

  // 获取玩家
  const player = await Player.findById(playerId);
  if (!player) {
    throw new Error('玩家不存在');
  }

  // 应用时间段内的属性衰减
  const elapsedMinutes = elapsed / 60;
  attributeService.applyAttributeDecay(player, elapsedMinutes);

  // 心情倍率（来自配置表）
  const moodMultiplier = attributeService.getMoodMultiplier(player.lifeAttributes.mood);

  // 应用奖励（基础值 × 心情倍率）
  const rewardResult = attributeService.applyRewards(player, config.rewards, moodMultiplier);

  // study 类型：完成学历后记录技能
  if (task.actionType === 'study') {
    const skillId = `study_${task.actionId}`;
    const existingSkill = player.skills.find((s) => s.skillId === skillId);
    if (existingSkill) {
      existingSkill.level = Math.min(10, existingSkill.level + 1);
    } else {
      player.skills.push({ skillId, level: 1 });
    }
  }

  // 更新任务状态
  task.status = 'completed';
  task.completedAt = new Date();
  task.completedCycles += 1;
  await task.save();
  await player.save();

  // 实时推送最新属性（衰减+奖励已应用）
  sendToPlayer(player._id.toString(), 'attributes_sync', {
    lifeAttributes: player.lifeAttributes,
    exp: player.exp,
    currency: { gold: player.currency.gold },
  });

  return {
    actionType: task.actionType,
    actionId: task.actionId,
    actionName: config.name,
    elapsedSeconds: elapsed,
    moodLevel: attributeService.calculateMoodLevel(player.lifeAttributes.mood),
    moodMultiplier,
    rewards: rewardResult,
    player,
  };
}

/**
 * 离线结算 — 登录时自动调用
 *
 * 计算逻辑：
 *   1. 计算离线时长（距上次登出）
 *   2. 按任务周期结算（elapsed / duration 取整）
 *   3. 每周期: 奖励 = 配置表基础值 × 当时心情倍率
 *   4. 应用离线属性衰减
 *   5. 最大周期数受 offlineMaxCycles 限制
 *
 * @param {string} playerId - 玩家 ID
 * @param {Date} lastLogoutAt - 上次登出时间
 * @returns {Promise<Object|null>} 结算结果或 null
 */
async function settleOfflineAction(playerId, lastLogoutAt) {
  const task = await ActionTask.findOne({ playerId, status: 'active' });
  if (!task) return null;

  const player = await Player.findById(playerId);
  if (!player) return null;

  const now = Date.now();
  const startMs = task.startTime.getTime();
  const offlineMinutes = (now - Math.max(startMs, lastLogoutAt.getTime())) / 1000 / 60;
  const elapsedSeconds = Math.floor((now - startMs) / 1000);

  // 最大离线结算周期数
  const config = getActionConfig(task.actionType, task.actionId);
  const maxCycles = getGameConfig().action.offlineMaxCycles;
  const cycles = config
    ? Math.min(maxCycles, Math.floor(elapsedSeconds / task.duration))
    : 0;

  // 离线属性衰减
  attributeService.applyAttributeDecay(player, offlineMinutes);

  // 逐周期结算奖励
  const totalRewards = {
    expGained: 0,
    goldGained: 0,
    attrGains: {},
    itemsGained: [],
    leveledUp: false,
    newLevel: player.level,
  };

  if (cycles > 0 && config) {
    const moodMultiplier = attributeService.getMoodMultiplier(player.lifeAttributes.mood);

    for (let i = 0; i < cycles; i++) {
      const cycleResult = attributeService.applyRewards(player, config.rewards, moodMultiplier);
      totalRewards.expGained += cycleResult.expGained;
      totalRewards.goldGained += cycleResult.goldGained;
      for (const [attr, val] of Object.entries(cycleResult.attrGains)) {
        totalRewards.attrGains[attr] = (totalRewards.attrGains[attr] || 0) + val;
      }
      totalRewards.itemsGained.push(...cycleResult.itemsGained);
      if (cycleResult.leveledUp) {
        totalRewards.leveledUp = true;
        totalRewards.newLevel = cycleResult.newLevel;
      }
    }

    // study 类型：记录学历技能
    if (task.actionType === 'study') {
      const skillId = `study_${task.actionId}`;
      const existingSkill = player.skills.find((s) => s.skillId === skillId);
      if (existingSkill) {
        existingSkill.level = Math.min(10, existingSkill.level + 1);
      } else {
        player.skills.push({ skillId, level: 1 });
      }
    }

    task.status = 'completed';
    task.completedAt = new Date();
    task.completedCycles += cycles;
  }

  await task.save();
  await player.save();

  return {
    offlineMinutes: Math.floor(offlineMinutes),
    elapsedSeconds,
    completedCycles: cycles,
    rewards: totalRewards,
    player,
  };
}

/**
 * 取消进行中的任务（无奖励）
 * @param {string} playerId - 玩家 ID
 * @returns {Promise<Object>} 被取消的任务
 * @throws {Error} 没有进行中的任务
 */
async function cancelAction(playerId) {
  const task = await ActionTask.findOne({ playerId, status: 'active' });
  if (!task) {
    throw new Error('没有进行中的任务');
  }

  task.status = 'cancelled';
  await task.save();

  return task;
}

module.exports = {
  startAction,
  checkActionStatus,
  collectAction,
  settleOfflineAction,
  cancelAction,
  VALID_ACTION_TYPES,
};
