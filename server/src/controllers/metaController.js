const { getStaticConfigs } = require('../config/gameConfig');
const { success } = require('../utils/response');

/**
 * GET /api/meta/bootstrap — 返回运行时静态配置集合
 */
function getBootstrap(_req, res, next) {
  try {
    return success(res, getStaticConfigs(), '获取成功');
  } catch (err) {
    next(err);
  }
}

module.exports = {
  getBootstrap
};
