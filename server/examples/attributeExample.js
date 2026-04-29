/**
 * attributeService 示例调用
 *
 * 演示属性计算系统的核心功能：
 *   1. 心情 → 倍率映射
 *   2. 属性衰减计算
 *   3. 行为前置条件校验
 *   4. 奖励结算
 *
 * 运行方式：node examples/attributeExample.js
 */

// ---------- 模拟环境 ----------
// 配置管理器需要初始化，此处直接构造最小运行环境
const path = require('path');
const configManager = require('../src/config/configManager');

const CONFIG_DIR = path.join(__dirname, '..', 'config');
configManager.init(CONFIG_DIR);

const attributeService = require('../src/services/attributeService');

// ---------- 模拟玩家对象 ----------
const mockPlayer = {
  level: 5,
  exp: 250,
  lifeAttributes: {
    energy: 80,
    mood: 75,
    hunger: 60,
    health: 90,
    clean: 50,
    strength: 8,
    intelligence: 12,
    charm: 6,
  },
  battleAttributes: {
    attack: 20,
    defense: 18,
    speed: 14,
    dodge: 5,
    hp: 150,
    maxHp: 150,
  },
  currency: {
    gold: 500,
    coupon: 10,
    achievementPoint: 0,
  },
  skills: [
    { skillId: 'study_preschool', level: 1 },
    { skillId: 'study_elementary', level: 1 },
  ],
  inventory: [],
};

// ===================== 1. 心情 → 倍率映射 =====================
console.log('═══════════════════════════════════════════');
console.log('  1. 心情 → 收益倍率映射');
console.log('═══════════════════════════════════════════');

const testMoods = [10, 30, 50, 70, 90];
for (const mood of testMoods) {
  const level = attributeService.calculateMoodLevel(mood);
  const multiplier = attributeService.getMoodMultiplier(mood);
  console.log(`  心情 ${mood} → 等级: ${level.padEnd(10)} → 倍率: ${multiplier}x`);
}

// 便捷方法：一次获取完整信息
console.log('\n  getMoodInfo(75):', attributeService.getMoodInfo(75));
console.log('  getMoodInfo(15):', attributeService.getMoodInfo(15));

// ===================== 2. 属性衰减计算 =====================
console.log('\n═══════════════════════════════════════════');
console.log('  2. 属性衰减计算（30 分钟）');
console.log('═══════════════════════════════════════════');

const decay = attributeService.calculateAttributeDecay(mockPlayer.lifeAttributes, 30);
console.log('  衰减量:', decay);

// 应用衰减到玩家
const playerCopy = JSON.parse(JSON.stringify(mockPlayer));
const updatedAttrs = attributeService.applyAttributeDecay(playerCopy, 30);
console.log('  应用后 lifeAttributes:', updatedAttrs);

// ===================== 3. 行为前置条件校验 =====================
console.log('\n═══════════════════════════════════════════');
console.log('  3. 行为前置条件校验');
console.log('═══════════════════════════════════════════');

// 3a. 纯 requirements 校验
const studyConfig = {
  name: '中学',
  id: 'middle_school',
  energyCost: 10,
  duration: 120,
  requirements: {
    level: 3,
    education: 'elementary',
    gold: 50,
  },
};

const mineConfig = {
  name: '挖金矿',
  id: 'gold',
  energyCost: 15,
  duration: 90,
  requirements: {
    level: 10,
    strength: 15,
  },
};

// 可执行
const check1 = attributeService.validateRequirements(mockPlayer, studyConfig.requirements);
console.log('  中学要求 (玩家 Lv5, 有 elementary):', check1.valid ? '√ 通过' : '× ' + check1.reason);

// 等级不足
const check2 = attributeService.validateRequirements(mockPlayer, mineConfig.requirements);
console.log('  金矿要求 (需 Lv10 + 武力15):', check2.valid ? '√ 通过' : '× ' + check2.reason);

// 3b. 精力检查
const energyCheck1 = attributeService.checkEnergy(mockPlayer, 10);
const energyCheck2 = attributeService.checkEnergy(mockPlayer, 200);
console.log('  精力检查 (需10/当前80):', energyCheck1.valid ? '√ 通过' : '× ' + energyCheck1.reason);
console.log('  精力检查 (需200/当前80):', energyCheck2.valid ? '√ 通过' : '× ' + energyCheck2.reason);

// 3c. 综合校验 (精力 + 前置条件)
const canStudy = attributeService.canPerformAction(mockPlayer, studyConfig);
const canMine = attributeService.canPerformAction(mockPlayer, mineConfig);
console.log('  综合-中学:', canStudy.valid ? '√ 可执行' : '× ' + canStudy.reason);
console.log('  综合-金矿:', canMine.valid ? '√ 可执行' : '× ' + canMine.reason);

// ===================== 4. 经验曲线 =====================
console.log('\n═══════════════════════════════════════════');
console.log('  4. 经验曲线（升级所需总经验）');
console.log('═══════════════════════════════════════════');

for (let lv = 1; lv <= 10; lv++) {
  console.log(`  Lv${String(lv).padEnd(3)} → Lv${String(lv + 1).padEnd(3)}: 需累计 ${attributeService.calculateExpForLevel(lv + 1)} EXP`);
}

// ===================== 5. 奖励结算（心情倍率影响） =====================
console.log('\n═══════════════════════════════════════════');
console.log('  5. 奖励结算');
console.log('═══════════════════════════════════════════');

const rewards = {
  exp: 50,
  gold: 30,
  attributes: { intelligence: 2 },
  items: [{ itemId: 'book', count: 1, weight: 30 }],
};

// 心情好 (75 → good → 1.1x)
const p1 = JSON.parse(JSON.stringify(mockPlayer));
const result1 = attributeService.applyRewards(p1, rewards, attributeService.getMoodMultiplier(75));
console.log('  心情 75 (倍率 1.1x):', JSON.stringify(result1, null, 2));

// 心情差 (25 → bad → 0.9x)
const p2 = JSON.parse(JSON.stringify(mockPlayer));
const result2 = attributeService.applyRewards(p2, rewards, attributeService.getMoodMultiplier(25));
console.log('  心情 25 (倍率 0.9x):', JSON.stringify(result2, null, 2));

// ===================== 6. 升级检查 =====================
console.log('\n═══════════════════════════════════════════');
console.log('  6. 升级检查（累计 1000 EXP）');
console.log('═══════════════════════════════════════════');

const p3 = JSON.parse(JSON.stringify(mockPlayer));
p3.exp = 1000;
const levelUps = attributeService.checkAndLevelUp(p3);
console.log('  经验 1000 → 升了', levelUps, '级 → 当前等级:', p3.level);
console.log('  战斗属性: atk=', p3.battleAttributes.attack, 'def=', p3.battleAttributes.defense, 'maxHp=', p3.battleAttributes.maxHp);

console.log('\n═══════════════════════════════════════════');
console.log('  示例结束');
console.log('═══════════════════════════════════════════');
