/**
 * 玩家控制器
 * 处理玩家信息、属性、背包、技能查询
 */
const Player = require('../models/Player');
const actionService = require('../services/actionService');
const attributeService = require('../services/attributeService');
const { success } = require('../utils/response');
const { AppError } = require('../middleware/errorHandler');

/**
 * GET /api/player/profile — 完整玩家信息 + 任务状态
 */
async function getProfile(req, res, next) {
  try {
    const player = await Player.findById(req.player.id);
    if (!player) {
      throw new AppError('玩家不存在', 404);
    }

    const taskStatus = await actionService.checkActionStatus(req.player.id);

    return success(res, { player, task: taskStatus }, '获取成功');
  } catch (err) {
    next(err);
  }
}

/**
 * GET /api/player/attributes — 属性详情 + 心情/升级信息
 */
async function getAttributes(req, res, next) {
  try {
    const player = await Player.findById(req.player.id);
    if (!player) {
      throw new AppError('玩家不存在', 404);
    }

    const moodLevel = attributeService.calculateMoodLevel(player.lifeAttributes.mood);
    const moodMultiplier = attributeService.getMoodMultiplier(player.lifeAttributes.mood);
    const expToNext = attributeService.calculateExpForLevel(player.level + 1);
    const expCurrent = player.exp - attributeService.calculateExpForLevel(player.level);

    return success(res, {
      lifeAttributes: player.lifeAttributes,
      battleAttributes: player.battleAttributes,
      level: player.level,
      exp: player.exp,
      expToNext,
      expCurrent: Math.max(0, expCurrent),
      moodLevel,
      moodMultiplier,
      currency: player.currency,
    }, '获取成功');
  } catch (err) {
    next(err);
  }
}

/**
 * GET /api/player/inventory — 背包物品
 */
async function getInventory(req, res, next) {
  try {
    const player = await Player.findById(req.player.id);
    if (!player) {
      throw new AppError('玩家不存在', 404);
    }

    return success(res, { inventory: player.inventory }, '获取成功');
  } catch (err) {
    next(err);
  }
}

/**
 * GET /api/player/skills — 技能列表
 */
async function getSkills(req, res, next) {
  try {
    const player = await Player.findById(req.player.id);
    if (!player) {
      throw new AppError('玩家不存在', 404);
    }

    return success(res, { skills: player.skills }, '获取成功');
  } catch (err) {
    next(err);
  }
}

module.exports = { getProfile, getAttributes, getInventory, getSkills };
