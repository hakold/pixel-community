/**
 * 地图控制器
 * 管理员: CRUD / 客户端: 获取地图数据
 */
const mapService = require('../services/mapService');
const { success } = require('../utils/response');
const { AppError } = require('../middleware/errorHandler');

function wrapMapError(err) {
  if (err.message === '地图 ID 格式无效') {
    return new AppError(err.message, 400);
  }
  return err;
}

/** GET /api/maps — 列出全部地图（客户端用） */
function listMaps(_req, res, next) {
  try {
    const maps = mapService.listMaps();
    return success(res, maps);
  } catch (err) { next(wrapMapError(err)); }
}

/** GET /api/maps/:mapId — 获取单个地图 */
function getMap(req, res, next) {
  try {
    const cfg = mapService.getMap(req.params.mapId);
    if (!cfg) throw new AppError('地图不存在', 404);
    return success(res, cfg);
  } catch (err) { next(wrapMapError(err)); }
}

// ---- 管理员接口 ----

/** GET /api/admin/maps/:mapId — 管理员获取地图（含完整配置） */
function adminGetMap(req, res, next) {
  try {
    const cfg = mapService.getMap(req.params.mapId);
    if (!cfg) throw new AppError('地图不存在', 404);
    return success(res, cfg);
  } catch (err) { next(wrapMapError(err)); }
}

/** POST /api/admin/maps — 保存地图 */
function saveMap(req, res, next) {
  try {
    if (!req.body || !req.body.mapId) {
      throw new AppError('请提供完整的地图配置（含 mapId）');
    }
    const result = mapService.saveMap(req.body);
    return success(res, result, `地图 ${result.mapId} 已保存`);
  } catch (err) { next(wrapMapError(err)); }
}

/** DELETE /api/admin/maps/:mapId — 删除地图 */
function deleteMap(req, res, next) {
  try {
    const result = mapService.deleteMap(req.params.mapId);
    if (!result.ok) throw new AppError(result.message, 404);
    return success(res, result, `地图已删除`);
  } catch (err) { next(wrapMapError(err)); }
}

module.exports = { listMaps, getMap, adminGetMap, saveMap, deleteMap };
