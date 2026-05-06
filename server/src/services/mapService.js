/**
 * 地图存储服务
 * 地图以 JSON 文件存储在 server/config/maps/ 目录
 */
const fs = require('fs');
const path = require('path');

const MAPS_DIR = path.join(__dirname, '..', '..', 'config', 'maps');
const MAP_ID_RE = /^[A-Za-z0-9_-]+$/;

/** 确保存储目录存在 */
function ensureDir() {
  if (!fs.existsSync(MAPS_DIR)) {
    fs.mkdirSync(MAPS_DIR, { recursive: true });
  }
}

function validateMapId(mapId) {
  if (!MAP_ID_RE.test(mapId)) {
    throw new Error('地图 ID 格式无效');
  }
}

function getMapFilepath(mapId) {
  validateMapId(mapId);
  return path.join(MAPS_DIR, `${mapId}.json`);
}

/**
 * 列出全部地图（仅返回 id + name + grid 摘要）
 * @returns {Array<{ mapId, name, width, height }>}
 */
function listMaps() {
  ensureDir();
  const files = fs.readdirSync(MAPS_DIR).filter((f) => f.endsWith('.json'));
  return files.map((f) => {
    const raw = fs.readFileSync(path.join(MAPS_DIR, f), 'utf-8');
    const cfg = JSON.parse(raw);
    return {
      mapId: cfg.mapId || f.replace('.json', ''),
      name: cfg.name || cfg.mapId,
      width: cfg.grid?.width || 0,
      height: cfg.grid?.height || 0
    };
  });
}

/**
 * 获取单个完整地图配置
 * @param {string} mapId
 * @returns {Object|null}
 */
function getMap(mapId) {
  ensureDir();
  const filepath = getMapFilepath(mapId);
  if (!fs.existsSync(filepath)) return null;
  return JSON.parse(fs.readFileSync(filepath, 'utf-8'));
}

/**
 * 保存地图配置（新增或更新）
 * @param {Object} mapConfig — 必须包含 mapId
 * @returns {{ ok: boolean, mapId: string }}
 */
function saveMap(mapConfig) {
  ensureDir();
  const mapId = mapConfig.mapId;
  if (!mapId) throw new Error('地图配置缺少 mapId');
  const filepath = getMapFilepath(mapId);
  fs.writeFileSync(filepath, JSON.stringify(mapConfig, null, 2), 'utf-8');
  return { ok: true, mapId };
}

/**
 * 删除地图
 * @param {string} mapId
 * @returns {{ ok: boolean }}
 */
function deleteMap(mapId) {
  ensureDir();
  const filepath = getMapFilepath(mapId);
  if (!fs.existsSync(filepath)) return { ok: false, message: '地图不存在' };
  fs.unlinkSync(filepath);
  return { ok: true };
}

module.exports = { listMaps, getMap, saveMap, deleteMap };
