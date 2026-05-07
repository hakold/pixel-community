/**
 * 游戏配置查询层（兼容性包装）
 *
 * 底层由 configManager 统一管理。
 * 按 5 种行为类型（study / work / mining / woodcut / fishing）组织配置。
 */
const configManager = require('./configManager');

/**
 * 获取主游戏配置 (game.json)
 */
function getGameConfig() {
  return configManager.get('game');
}

/**
 * 获取学习配置列表 (study.json)
 */
function getStudyConfig() {
  return configManager.get('study');
}

/**
 * 获取打工配置列表 (work.json)
 */
function getWorkConfig() {
  return configManager.get('work');
}

/**
 * 获取挖矿配置列表 (mining.json)
 */
function getMiningConfig() {
  return configManager.get('mining');
}

/**
 * 获取伐木配置列表 (woodcut.json)
 */
function getWoodcutConfig() {
  return configManager.get('woodcut');
}

/**
 * 获取钓鱼配置列表 (fishing.json)
 */
function getFishingConfig() {
  return configManager.get('fishing');
}

/**
 * 获取技能配置 (skills.json)
 */
function getSkillsConfig() {
  return configManager.get('skills');
}

/**
 * 获取道具配置 (items.json)
 */
function getItemsConfig() {
  return configManager.get('items');
}

/**
 * 获取商店配置 (shops.json)
 */
function getShopsConfig() {
  return configManager.get('shops');
}

/**
 * 获取恢复行为配置 (recoveryActions.json)
 */
function getRecoveryActionsConfig() {
  return configManager.get('recoveryActions');
}

/**
 * 根据 itemId 获取道具配置
 */
function getItemConfig(itemId) {
  const list = getItemsConfig() || [];
  return list.find((item) => item.itemId === itemId) || null;
}

/**
 * 根据 shopId 获取商店配置
 */
function getShopConfig(shopId) {
  const list = getShopsConfig() || [];
  return list.find((shop) => shop.id === shopId) || null;
}

/**
 * 根据恢复行为 ID 获取配置
 */
function getRecoveryActionConfig(recoveryActionId) {
  const list = getRecoveryActionsConfig() || [];
  return list.find((item) => item.id === recoveryActionId) || null;
}

/**
 * 根据行为类型获取对应配置列表
 * @param {string} actionType - 'study' | 'work' | 'mining' | 'woodcut' | 'fishing'
 * @returns {Array|null}
 */
function getConfigByType(actionType) {
  const map = {
    study: getStudyConfig,
    work: getWorkConfig,
    mining: getMiningConfig,
    woodcut: getWoodcutConfig,
    fishing: getFishingConfig,
  };
  const fn = map[actionType];
  return fn ? fn() : null;
}

/**
 * 根据 ID 查找行为配置（跨全部 5 种类型）
 * @param {string} actionType - 'study' | 'work' | 'mining' | 'woodcut' | 'fishing'
 * @param {string} actionId - 行为 ID
 * @returns {Object|null}
 */
function getActionConfig(actionType, actionId) {
  const list = getConfigByType(actionType);
  if (!list) return null;
  return list.find((item) => item.id === actionId) || null;
}

/**
 * 获取全部行为配置列表（供前端展示）
 * @returns {Object} { study, work, mining, woodcut, fishing }
 */
function getAllActionConfigs() {
  return {
    study: getStudyConfig(),
    work: getWorkConfig(),
    mining: getMiningConfig(),
    woodcut: getWoodcutConfig(),
    fishing: getFishingConfig(),
  };
}

/**
 * 获取 M1 需要的静态配置集合
 */
function getStaticConfigs() {
  return {
    game: getGameConfig(),
    actions: getAllActionConfigs(),
    skills: getSkillsConfig(),
    items: getItemsConfig(),
    shops: getShopsConfig(),
    recoveryActions: getRecoveryActionsConfig(),
  };
}

/**
 * 热更新全部游戏配置
 */
function reloadAllConfigs() {
  return configManager.reloadAll();
}

module.exports = {
  getGameConfig,
  getStudyConfig,
  getWorkConfig,
  getMiningConfig,
  getWoodcutConfig,
  getFishingConfig,
  getSkillsConfig,
  getItemsConfig,
  getShopsConfig,
  getRecoveryActionsConfig,
  getItemConfig,
  getShopConfig,
  getRecoveryActionConfig,
  getConfigByType,
  getActionConfig,
  getAllActionConfigs,
  getStaticConfigs,
  reloadAllConfigs,
};
