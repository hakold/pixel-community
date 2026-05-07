const economyService = require('../services/economyService');
const Player = require('../models/Player');
const { success } = require('../utils/response');
const { AppError } = require('../middleware/errorHandler');

async function listShops(req, res, next) {
  try {
    const player = await Player.findById(req.player.id);
    if (!player) {
      throw new AppError('玩家不存在', 404);
    }

    return success(res, {
      shops: economyService.listShops(player.level),
      items: economyService.listItems()
    }, '获取成功');
  } catch (err) {
    next(err);
  }
}

async function buyItem(req, res, next) {
  try {
    const { shopId, itemId, quantity } = req.body;
    if (!shopId || !itemId) {
      throw new AppError('请提供 shopId 和 itemId');
    }

    const result = await economyService.buyItem(req.player.id, shopId, itemId, quantity);
    return success(res, result, '购买成功');
  } catch (err) {
    if (err.message.includes('不存在') || err.message.includes('不足') || err.message.includes('需要') || err.message.includes('仅支持') || err.message.includes('数量')) {
      return next(new AppError(err.message, 400));
    }
    next(err);
  }
}

async function sellItem(req, res, next) {
  try {
    const { itemId, quantity } = req.body;
    if (!itemId) {
      throw new AppError('请提供 itemId');
    }

    const result = await economyService.sellItem(req.player.id, itemId, quantity);
    return success(res, result, '出售成功');
  } catch (err) {
    if (err.message.includes('不存在') || err.message.includes('不足') || err.message.includes('不可出售') || err.message.includes('数量')) {
      return next(new AppError(err.message, 400));
    }
    next(err);
  }
}

module.exports = {
  listShops,
  buyItem,
  sellItem
};
