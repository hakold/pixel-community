/**
 * 认证业务逻辑层
 * 处理注册、登录等核心逻辑
 */
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const Player = require('../models/Player');
const config = require('../config');
const { getGameConfig } = require('../config/gameConfig');
const actionService = require('./actionService');
const attributeService = require('./attributeService');

const SALT_ROUNDS = 10;

/**
 * 生成 JWT Token
 * @param {Object} player - 玩家文档
 * @returns {string} JWT token
 */
function generateToken(player) {
  return jwt.sign(
    {
      id: player._id,
      username: player.username,
      characterName: player.characterName,
    },
    config.jwt.secret,
    { expiresIn: config.jwt.expiresIn }
  );
}

/**
 * 从游戏配置获取初始属性
 * @returns {Object} { attributes, battleAttributes, currency }
 */
function getInitialStats() {
  const gameConfig = getGameConfig();
  return {
    lifeAttributes: { ...gameConfig.player.initialLifeAttributes },
    battleAttributes: { ...gameConfig.player.initialBattleAttributes },
    currency: { ...gameConfig.player.initialCurrency },
    hp: gameConfig.player.initialBattleAttributes.maxHp,
  };
}

/**
 * 用户注册（含创建角色）
 * @param {Object} params
 * @param {string} params.username - 用户名
 * @param {string} params.password - 密码
 * @param {string} params.characterName - 角色名
 * @param {string} params.gender - 性别 (male/female)
 * @returns {Promise<Object>} { player, token }
 * @throws {Error} 用户名已存在 / 角色名已存在
 */
async function register({ username, password, characterName, gender }) {
  // 检查用户名是否已存在
  const existingUser = await Player.findOne({ username });
  if (existingUser) {
    throw new Error('用户名已被注册');
  }

  // 检查角色名是否已存在
  const existingName = await Player.findOne({ characterName });
  if (existingName) {
    throw new Error('角色名已被使用');
  }

  // 密码加密
  const hashedPassword = await bcrypt.hash(password, SALT_ROUNDS);

  // 获取初始属性
  const { lifeAttributes, battleAttributes, currency } = getInitialStats();

  // 创建玩家
  const player = await Player.create({
    username,
    password: hashedPassword,
    characterName,
    gender,
    lifeAttributes: {
      ...lifeAttributes,
    },
    battleAttributes: {
      ...battleAttributes,
      hp: battleAttributes.maxHp,
    },
    currency,
  });

  // 生成 token
  const token = generateToken(player);

  return { player, token };
}

/**
 * 用户登录
 * @param {Object} params
 * @param {string} params.username - 用户名
 * @param {string} params.password - 密码
 * @returns {Promise<Object>} { player, token }
 * @throws {Error} 用户名或密码错误
 */
async function login({ username, password }) {
  // 查找用户（明确查询 password 字段，因为 toJSON 默认排除）
  const player = await Player.findOne({ username }).select('+password');
  if (!player) {
    throw new Error('用户名或密码错误');
  }

  // 验证密码
  const isValid = await bcrypt.compare(password, player.password);
  if (!isValid) {
    throw new Error('用户名或密码错误');
  }

  // 处理离线结算
  let offlineResult = null;
  if (player.lastLogoutAt) {
    try {
      offlineResult = await actionService.settleOfflineAction(
        player._id,
        player.lastLogoutAt
      );
    } catch (err) {
      console.error('[Auth] 离线结算异常:', err.message);
    }
  }

  // 更新登录时间
  player.lastLoginAt = new Date();
  player.isOnline = true;
  await player.save();

  // 生成 token
  const token = generateToken(player);

  return { player, token, offlineResult };
}

/**
 * 获取玩家信息
 * @param {string} playerId - 玩家 ID
 * @returns {Promise<Object>} 玩家文档
 */
async function getProfile(playerId) {
  const player = await Player.findById(playerId);
  if (!player) {
    throw new Error('玩家不存在');
  }
  return player;
}

module.exports = { register, login, getProfile };
