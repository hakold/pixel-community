/**
 * 属性计算服务
 * 处理属性衰减、心情倍率、经验升级等核心数值计算
 */
const { getGameConfig } = require('../config/gameConfig');

/**
 * 根据心情值判断心情等级
 * @param {number} mood - 心情值 (0-100)
 * @returns {string} 'terrible' | 'bad' | 'normal' | 'good' | 'excellent'
 */
function calculateMoodLevel(mood) {
  const thresholds = getGameConfig().player.moodThresholds;
  if (mood <= thresholds.terrible) return 'terrible';
  if (mood <= thresholds.bad) return 'bad';
  if (mood <= thresholds.normal) return 'normal';
  if (mood <= thresholds.good) return 'good';
  return 'excellent';
}

/**
 * 获取心情对应的收益倍率
 * @param {number} mood - 心情值
 * @returns {number} 倍率 (0.8 ~ 1.2)
 */
function getMoodMultiplier(mood) {
  const cfg = getGameConfig().player;
  const level = calculateMoodLevel(mood);
  return cfg.moodMultiplier[level];
}

/**
 * 根据饥饿和健康值计算健康衰减
 * 饥饿 ≤ 0 时健康开始下降
 * @param {Object} attrs - 生活属性对象
 * @param {number} elapsedMinutes - 经过的分钟数
 * @returns {number} 健康衰减量
 */
function calculateHealthDecay(attrs, elapsedMinutes) {
  if (attrs.hunger <= 0) {
    const decayCfg = getGameConfig().attributeDecay;
    return decayCfg.healthDecayWhenStarving * elapsedMinutes;
  }
  return 0;
}

/**
 * 计算属性随时间的衰减量
 * @param {Object} attrs - 当前属性 { energy, mood, hunger, health, clean }
 * @param {number} elapsedMinutes - 经过的分钟数
 * @returns {Object} 各属性衰减量（正值表示减少）
 */
function calculateAttributeDecay(attrs, elapsedMinutes) {
  const decayCfg = getGameConfig().attributeDecay;
  const decay = {
    energy: decayCfg.energyDecayPerMinute * elapsedMinutes,
    hunger: decayCfg.hungerDecayPerMinute * elapsedMinutes,
    clean: decayCfg.cleanDecayPerMinute * elapsedMinutes,
    mood: decayCfg.moodDecayPerMinute * elapsedMinutes,
    health: calculateHealthDecay(attrs, elapsedMinutes),
  };
  return decay;
}

/**
 * 将属性衰减应用到玩家属性上（不保存数据库）
 * @param {Object} player - 玩家文档
 * @param {number} elapsedMinutes - 经过的分钟数
 * @returns {Object} 更新后的 lifeAttributes 对象
 */
function applyAttributeDecay(player, elapsedMinutes) {
  const decay = calculateAttributeDecay(player.lifeAttributes, elapsedMinutes);
  const cfg = getGameConfig().attributeDecay;
  const attrs = player.lifeAttributes;

  const clamp = (val) => Math.round(Math.max(cfg.minAttributeValue, Math.min(cfg.maxAttributeValue, val)));

  attrs.energy = clamp(attrs.energy - decay.energy);
  attrs.hunger = clamp(attrs.hunger - decay.hunger);
  attrs.clean = clamp(attrs.clean - decay.clean);
  attrs.mood = clamp(attrs.mood - decay.mood);
  attrs.health = clamp(attrs.health - decay.health);

  return attrs;
}

/**
 * 计算升到指定等级所需的总经验（指数增长）
 * @param {number} level - 目标等级
 * @returns {number} 所需总经验
 */
function calculateExpForLevel(level) {
  const curve = getGameConfig().expCurve;
  if (level <= 1) return 0;
  return Math.floor(curve.baseExp * Math.pow(curve.growthFactor, level - 1));
}

/**
 * 检查并执行升级
 * 经验不清零，累计升级
 * @param {Object} player - 玩家文档
 * @returns {number} 升级的等级数
 */
function checkAndLevelUp(player) {
  const maxLevel = getGameConfig().player.maxLevel;
  let levelUps = 0;

  while (player.level < maxLevel) {
    const requiredExp = calculateExpForLevel(player.level + 1);
    if (player.exp >= requiredExp) {
      player.level += 1;
      levelUps += 1;
      // 升级时提升战斗属性
      player.battleAttributes.maxHp += 5;
      player.battleAttributes.hp = player.battleAttributes.maxHp;
      player.battleAttributes.attack += 2;
      player.battleAttributes.defense += 2;
      player.battleAttributes.speed += 1;
    } else {
      break;
    }
  }

  return levelUps;
}

/**
 * 应用行为奖励到玩家
 * @param {Object} player - 玩家文档
 * @param {Object} rewards - 奖励配置 { exp, gold, attributes, items }
 * @param {number} moodMultiplier - 心情倍率
 * @returns {Object} 结算详情 { expGained, goldGained, attrGains, itemsGained, leveledUp, newLevel }
 */
function applyRewards(player, rewards, moodMultiplier = 1.0) {
  const result = {
    expGained: 0,
    goldGained: 0,
    attrGains: {},
    itemsGained: [],
    leveledUp: false,
    newLevel: player.level,
  };

  if (!rewards) return result;

  // 经验
  if (rewards.exp) {
    const gained = Math.floor(rewards.exp * moodMultiplier);
    player.exp = Math.round(player.exp + gained);
    result.expGained = gained;
  }

  // 金币
  if (rewards.gold) {
    const gained = Math.floor(rewards.gold * moodMultiplier);
    player.currency.gold = Math.round(player.currency.gold + gained);
    result.goldGained = gained;
  }

  // 属性加成
  if (rewards.attributes) {
    for (const [attr, value] of Object.entries(rewards.attributes)) {
      if (player.lifeAttributes[attr] !== undefined) {
        const gained = Math.floor(value * moodMultiplier);
        player.lifeAttributes[attr] = Math.round(Math.min(100, player.lifeAttributes[attr] + gained));
        result.attrGains[attr] = gained;
      }
    }
  }

  // 物品（概率掉落）
  if (rewards.items) {
    for (const itemDrop of rewards.items) {
      const roll = Math.random() * 100;
      if (roll <= itemDrop.weight) {
        result.itemsGained.push({ itemId: itemDrop.itemId, count: itemDrop.count });
        // 加入背包
        const existingItem = player.inventory.find((i) => i.itemId === itemDrop.itemId);
        if (existingItem) {
          existingItem.count += itemDrop.count;
        } else {
          player.inventory.push({ itemId: itemDrop.itemId, count: itemDrop.count });
        }
      }
    }
  }

  // 升级检查
  const levelUps = checkAndLevelUp(player);
  if (levelUps > 0) {
    result.leveledUp = true;
    result.newLevel = player.level;
  }

  return result;
}

/**
 * 获取心情完整信息（等级 + 倍率）
 * 便捷方法，一次调用获取全部心情相关数据
 * @param {number} mood - 心情值 (0-100)
 * @returns {{ level: string, multiplier: number }}
 */
function getMoodInfo(mood) {
  return {
    level: calculateMoodLevel(mood),
    multiplier: getMoodMultiplier(mood),
  };
}

/**
 * 校验行为前置条件是否满足
 * @param {Object} player - 玩家文档
 * @param {Object} requirements - 行为配置中的 requirements 对象
 * @returns {{ valid: boolean, reason: string }}
 */
function validateRequirements(player, requirements) {
  if (!requirements) return { valid: true, reason: '' };

  // 等级要求
  if (requirements.level && player.level < requirements.level) {
    return {
      valid: false,
      reason: `需要等级 ${requirements.level}（当前 ${player.level}）`,
      requirement: 'level',
      required: requirements.level,
      current: player.level,
    };
  }

  // 金币消耗
  if (requirements.gold && player.currency.gold < requirements.gold) {
    return {
      valid: false,
      reason: `需要金币 ${requirements.gold}（当前 ${player.currency.gold}）`,
      requirement: 'gold',
      required: requirements.gold,
      current: player.currency.gold,
    };
  }

  // 学历要求
  if (requirements.education) {
    const studySkill = player.skills.find((s) => s.skillId.startsWith('study_'));
    const playerEdu = studySkill ? studySkill.skillId.replace('study_', '') : null;
    if (playerEdu !== requirements.education) {
      return {
        valid: false,
        reason: `需要先完成前置学业: ${requirements.education}`,
        requirement: 'education',
        required: requirements.education,
        current: playerEdu || '无',
      };
    }
  }

  // 生活属性要求 (strength / intelligence / charm)
  const attrChecks = ['strength', 'intelligence', 'charm'];
  for (const attr of attrChecks) {
    if (requirements[attr] && player.lifeAttributes[attr] < requirements[attr]) {
      return {
        valid: false,
        reason: `需要${attr} ${requirements[attr]}（当前 ${player.lifeAttributes[attr]}）`,
        requirement: attr,
        required: requirements[attr],
        current: player.lifeAttributes[attr],
      };
    }
  }

  return { valid: true, reason: '' };
}

/**
 * 检查精力是否足够执行行为
 * @param {Object} player - 玩家文档
 * @param {number} energyCost - 精力消耗
 * @returns {{ valid: boolean, reason: string }}
 */
function checkEnergy(player, energyCost) {
  if (!energyCost || energyCost <= 0) return { valid: true, reason: '' };

  if (player.lifeAttributes.energy < energyCost) {
    return {
      valid: false,
      reason: `精力不足（需要 ${energyCost}，当前 ${player.lifeAttributes.energy}）`,
      requirement: 'energy',
      required: energyCost,
      current: player.lifeAttributes.energy,
    };
  }

  return { valid: true, reason: '' };
}

/**
 * 综合校验：玩家是否可以开始某个挂机行为
 * 同时检查精力 + 前置条件
 * @param {Object} player - 玩家文档
 * @param {Object} actionConfig - 行为配置项
 * @returns {{ valid: boolean, reason: string }}
 */
function canPerformAction(player, actionConfig) {
  // 精力检查
  if (actionConfig.energyCost) {
    const energyCheck = checkEnergy(player, actionConfig.energyCost);
    if (!energyCheck.valid) return energyCheck;
  }

  // 前置条件检查
  if (actionConfig.requirements) {
    const reqCheck = validateRequirements(player, actionConfig.requirements);
    if (!reqCheck.valid) return reqCheck;
  }

  return { valid: true, reason: '' };
}

module.exports = {
  calculateMoodLevel,
  getMoodMultiplier,
  getMoodInfo,
  calculateAttributeDecay,
  applyAttributeDecay,
  calculateExpForLevel,
  checkAndLevelUp,
  applyRewards,
  validateRequirements,
  checkEnergy,
  canPerformAction,
};
