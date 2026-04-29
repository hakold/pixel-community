/**
 * 认证控制器
 * 请求参数校验 → 调用 Service → 返回响应
 */
const authService = require('../services/authService');
const { success } = require('../utils/response');
const { AppError } = require('../middleware/errorHandler');

/**
 * POST /api/auth/register — 注册 + 创角
 */
async function register(req, res, next) {
  try {
    const { username, password, characterName, gender } = req.body;

    if (!username || !password || !characterName || !gender) {
      throw new AppError('请填写完整的注册信息');
    }
    if (username.length < 3 || username.length > 20) {
      throw new AppError('用户名长度需在 3-20 个字符之间');
    }
    if (password.length < 6) {
      throw new AppError('密码长度不能少于 6 位');
    }
    if (characterName.length < 1 || characterName.length > 12) {
      throw new AppError('角色名长度需在 1-12 个字符之间');
    }
    if (!['male', 'female'].includes(gender)) {
      throw new AppError('性别参数无效');
    }

    const { player, token } = await authService.register({
      username, password, characterName, gender,
    });

    return success(res, { player, token }, '注册成功', 201);
  } catch (err) {
    next(err);
  }
}

/**
 * POST /api/auth/login — 登录
 */
async function login(req, res, next) {
  try {
    const { username, password } = req.body;

    if (!username || !password) {
      throw new AppError('请输入用户名和密码');
    }

    const { player, token, offlineResult } = await authService.login({
      username, password,
    });

    return success(res, { player, token, offlineResult }, '登录成功');
  } catch (err) {
    if (err.message === '用户名或密码错误') {
      return next(new AppError(err.message, 401));
    }
    next(err);
  }
}

/**
 * GET /api/auth/me — 获取当前玩家信息
 */
async function getMe(req, res, next) {
  try {
    const player = await authService.getProfile(req.player.id);
    return success(res, { player }, '获取成功');
  } catch (err) {
    next(err);
  }
}

module.exports = { register, login, getMe };
