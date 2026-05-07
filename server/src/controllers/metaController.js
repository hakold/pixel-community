const path = require('path');
const fs = require('fs');
const { getStaticConfigs } = require('../config/gameConfig');
const { success } = require('../utils/response');

const { REPO_ROOT } = require('../config/configPaths');

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

/**
 * GET /api/meta/tile-manifest — 返回地块视觉清单
 */
function getTileManifest(_req, res, next) {
  try {
    const manifestPath = path.join(REPO_ROOT, 'game-config', 'art', 'tile-manifest.json');
    const raw = fs.readFileSync(manifestPath, 'utf-8');
    return success(res, JSON.parse(raw), '获取成功');
  } catch (err) {
    next(err);
  }
}

/**
 * GET /api/meta/character-manifest — 返回角色视觉清单
 */
function getCharacterManifest(_req, res, next) {
  try {
    const manifestPath = path.join(REPO_ROOT, 'game-config', 'art', 'character-manifest.json');
    const raw = fs.readFileSync(manifestPath, 'utf-8');
    return success(res, JSON.parse(raw), '获取成功');
  } catch (err) {
    next(err);
  }
}

module.exports = {
  getBootstrap,
  getTileManifest,
  getCharacterManifest
};
