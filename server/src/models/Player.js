/**
 * Player 数据模型
 * 定义玩家/角色的完整数据结构
 */
const mongoose = require('mongoose');

// 生活属性 Schema
const lifeAttributesSchema = new mongoose.Schema(
  {
    energy: { type: Number, default: 100, min: 0, max: 100 },       // 精力
    mood: { type: Number, default: 100, min: 0, max: 100 },         // 心情
    hunger: { type: Number, default: 100, min: 0, max: 100 },       // 饥饿
    health: { type: Number, default: 100, min: 0, max: 100 },       // 健康
    clean: { type: Number, default: 100, min: 0, max: 100 },        // 清洁
    strength: { type: Number, default: 5, min: 0 },                 // 武力
    intelligence: { type: Number, default: 5, min: 0 },             // 智力
    charm: { type: Number, default: 5, min: 0 },                    // 魅力
  },
  { _id: false }
);

// 战斗属性 Schema
const battleAttributesSchema = new mongoose.Schema(
  {
    attack: { type: Number, default: 10, min: 0 },   // 攻击
    defense: { type: Number, default: 10, min: 0 },  // 防御
    speed: { type: Number, default: 10, min: 0 },    // 速度
    dodge: { type: Number, default: 5, min: 0 },     // 闪避
    hp: { type: Number, default: 100, min: 0 },      // 当前生命值
    maxHp: { type: Number, default: 100, min: 1 },   // 最大生命值
  },
  { _id: false }
);

// 货币 Schema
const currencySchema = new mongoose.Schema(
  {
    gold: { type: Number, default: 0, min: 0 },               // 金币
    coupon: { type: Number, default: 0, min: 0 },            // 点券
    achievementPoint: { type: Number, default: 0, min: 0 },  // 成就点
  },
  { _id: false }
);

// 技能 Schema
const skillSchema = new mongoose.Schema(
  {
    skillId: { type: String, required: true },  // 技能配置ID
    level: { type: Number, default: 1, min: 1, max: 10 }, // 技能等级
  },
  { _id: false }
);

// 背包物品 Schema
const inventoryItemSchema = new mongoose.Schema(
  {
    itemId: { type: String, required: true }, // 物品配置ID
    count: { type: Number, default: 1, min: 0 }, // 数量
  },
  { _id: false }
);

// 玩家主 Schema
const playerSchema = new mongoose.Schema(
  {
    // 账号信息
    username: { type: String, required: true, unique: true, minlength: 3, maxlength: 20 },
    password: { type: String, required: true },

    // 角色信息
    characterName: { type: String, required: true, minlength: 1, maxlength: 12 },
    gender: { type: String, required: true, enum: ['male', 'female'] },

    // 等级系统
    level: { type: Number, default: 1, min: 1, max: 100 },
    exp: { type: Number, default: 0, min: 0 },

    // 生活属性
    lifeAttributes: { type: lifeAttributesSchema, default: () => ({}) },

    // 战斗属性
    battleAttributes: { type: battleAttributesSchema, default: () => ({}) },

    // 技能列表
    skills: { type: [skillSchema], default: [] },

    // 背包
    inventory: { type: [inventoryItemSchema], default: [] },

    // 货币
    currency: { type: currencySchema, default: () => ({}) },

    // 地图位置 (实时存储在 Redis，这里做持久化备份)
    lastMapId: { type: String, default: 'plaza_01' },
    lastPosition: {
      x: { type: Number, default: 0 },
      y: { type: Number, default: 0 },
    },

    // 在线状态
    isOnline: { type: Boolean, default: false },
    lastLoginAt: { type: Date, default: null },
    lastLogoutAt: { type: Date, default: null },
  },
  {
    timestamps: true, // 自动管理 createdAt / updatedAt
    versionKey: false, // 不生成 __v 字段
  }
);

// 序列化时删除 password 字段
playerSchema.set('toJSON', {
  transform(doc, ret) {
    delete ret.password;
    return ret;
  },
});

module.exports = mongoose.model('Player', playerSchema);
