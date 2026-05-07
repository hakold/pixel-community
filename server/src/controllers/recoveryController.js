const recoveryService = require('../services/recoveryService');
const Player = require('../models/Player');
const { success } = require('../utils/response');
const { AppError } = require('../middleware/errorHandler');

async function listRecoveryActions(req, res, next) {
  try {
    const player = await Player.findById(req.player.id);
    if (!player) {
      throw new AppError('玩家不存在', 404);
    }

    return success(res, {
      recoveryActions: recoveryService.listRecoveryActions(player.level)
    }, '获取成功');
  } catch (err) {
    next(err);
  }
}

async function performRecoveryAction(req, res, next) {
  try {
    const { recoveryActionId } = req.body;
    if (!recoveryActionId) {
      throw new AppError('请提供 recoveryActionId');
    }

    const result = await recoveryService.performRecoveryAction(req.player.id, recoveryActionId);
    return success(res, result, '恢复成功');
  } catch (err) {
    if (err.message.includes('不存在') || err.message.includes('不足') || err.message.includes('需要')) {
      return next(new AppError(err.message, 400));
    }
    next(err);
  }
}

module.exports = {
  listRecoveryActions,
  performRecoveryAction
};
