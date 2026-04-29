/**
 * 管理员控制器
 * 提供配置管理、服务状态查询等后台接口
 */
const configManager = require('../config/configManager');
const { success } = require('../utils/response');
const { AppError } = require('../middleware/errorHandler');

/**
 * GET /api/admin/config/status — 查看所有配置加载状态
 */
function getConfigStatus(_req, res, next) {
  try {
    const status = configManager.getStatus();
    const manifest = configManager.getManifest();

    return success(res, {
      totalNamespaces: Object.keys(manifest).length,
      manifest,
      status,
    }, '获取成功');
  } catch (err) {
    next(err);
  }
}

/**
 * POST /api/admin/config/reload — 热更新全部配置
 */
function reloadAllConfigs(_req, res, next) {
  try {
    const result = configManager.reloadAll();
    const message = result.ok ? '全部配置已热更新' : '部分配置更新失败，请查看 results';
    return success(res, result, message);
  } catch (err) {
    next(err);
  }
}

/**
 * POST /api/admin/config/reload/:namespace — 热更新单个配置
 */
function reloadOneConfig(req, res, next) {
  try {
    const { namespace } = req.params;

    if (!namespace) {
      throw new AppError('请指定 namespace');
    }

    const result = configManager.reload(namespace);
    if (!result.ok) {
      throw new AppError(result.message);
    }

    return success(res, result, result.message);
  } catch (err) {
    next(err);
  }
}

/**
 * GET /api/admin/config/:namespace — 查看单个 namespace 的完整配置
 */
function getConfigByNamespace(req, res, next) {
  try {
    const { namespace } = req.params;
    const data = configManager.get(namespace);

    if (data === null) {
      throw new AppError(`namespace [${namespace}] 不存在`, 404);
    }

    return success(res, data, '获取成功');
  } catch (err) {
    next(err);
  }
}

module.exports = {
  getConfigStatus,
  reloadAllConfigs,
  reloadOneConfig,
  getConfigByNamespace,
};
