/**
 * 行为控制器
 * 处理 5 种挂机行为的开始、查询、结算、取消
 */
const actionService = require('../services/actionService');
const { getActionConfig, getAllActionConfigs } = require('../config/gameConfig');
const { success } = require('../utils/response');
const { AppError } = require('../middleware/errorHandler');

/**
 * GET /api/action/list — 获取全部 5 种行为配置
 * 返回: { study, work, mining, woodcut, fishing }
 */
function listActions(_req, res, next) {
  try {
    const data = getAllActionConfigs();
    return success(res, data, '获取成功');
  } catch (err) {
    next(err);
  }
}

/**
 * POST /api/action/start — 开始挂机任务
 * Body: { actionType, actionId }
 */
async function startAction(req, res, next) {
  try {
    const { actionType, actionId } = req.body;

    if (!actionType || !actionId) {
      throw new AppError('请指定行为类型(actionType)和行为ID(actionId)');
    }
    if (!actionService.VALID_ACTION_TYPES.includes(actionType)) {
      throw new AppError(
        `无效的行为类型，可选: ${actionService.VALID_ACTION_TYPES.join(' / ')}`
      );
    }

    const config = getActionConfig(actionType, actionId);
    if (!config) {
      throw new AppError(`行为配置不存在: ${actionType}.${actionId}`);
    }

    const { task, player } = await actionService.startAction(
      req.player.id, actionType, actionId,
    );

    return success(res, { task, player }, `开始${config.name}`, 201);
  } catch (err) {
    if (err.message.includes('已有') || err.message.includes('不足') || err.message.includes('需要')) {
      return next(new AppError(err.message, 400));
    }
    next(err);
  }
}

/**
 * GET /api/action/status — 查询任务进度
 */
async function getStatus(req, res, next) {
  try {
    const status = await actionService.checkActionStatus(req.player.id);
    return success(res, status, '获取成功');
  } catch (err) {
    next(err);
  }
}

/**
 * POST /api/action/collect — 结算已完成任务，领取收益
 * 收益 = 配置表基础值 × 心情倍率
 */
async function collectAction(req, res, next) {
  try {
    const result = await actionService.collectAction(req.player.id);
    return success(res, result, '结算成功');
  } catch (err) {
    if (err.message.includes('没有') || err.message.includes('未完成') || err.message.includes('不存在')) {
      return next(new AppError(err.message, 400));
    }
    next(err);
  }
}

/**
 * POST /api/action/cancel — 取消当前任务（无奖励）
 */
async function cancelAction(req, res, next) {
  try {
    const task = await actionService.cancelAction(req.player.id);
    return success(res, { task }, '已取消');
  } catch (err) {
    if (err.message.includes('没有')) {
      return next(new AppError(err.message, 400));
    }
    next(err);
  }
}

module.exports = { listActions, startAction, getStatus, collectAction, cancelAction };
