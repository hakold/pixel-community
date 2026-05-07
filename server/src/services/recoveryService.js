const Player = require('../models/Player');
const { getRecoveryActionsConfig, getRecoveryActionConfig } = require('../config/gameConfig');

function clampLifeAttribute(value) {
  return Math.max(0, Math.min(100, Math.round(value)));
}

function listRecoveryActions(playerLevel = 0) {
  const actions = getRecoveryActionsConfig() || [];
  return actions.map((action) => ({
    ...action,
    isUnlocked: !action.requirements?.level || playerLevel >= action.requirements.level
  }));
}

async function performRecoveryAction(playerId, recoveryActionId) {
  const config = getRecoveryActionConfig(recoveryActionId);
  if (!config) {
    throw new Error('恢复行为不存在');
  }

  const player = await Player.findById(playerId);
  if (!player) {
    throw new Error('玩家不存在');
  }

  if (config.requirements?.level && player.level < config.requirements.level) {
    throw new Error(`需要等级 ${config.requirements.level} 才能执行`);
  }

  if (config.costGold && player.currency.gold < config.costGold) {
    throw new Error(`金币不足（需要 ${config.costGold}，当前 ${player.currency.gold}）`);
  }

  if (config.costGold) {
    player.currency.gold -= config.costGold;
  }

  const applied = {};
  for (const [attr, value] of Object.entries(config.effects || {})) {
    if (player.lifeAttributes[attr] === undefined) {
      continue;
    }
    const before = player.lifeAttributes[attr];
    player.lifeAttributes[attr] = clampLifeAttribute(before + value);
    applied[attr] = player.lifeAttributes[attr] - before;
  }

  await player.save();

  return {
    recoveryActionId,
    applied,
    lifeAttributes: player.lifeAttributes,
    currency: { gold: player.currency.gold }
  };
}

module.exports = {
  listRecoveryActions,
  performRecoveryAction
};
