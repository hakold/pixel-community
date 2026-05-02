/**
 * 地图路由
 * 客户端: GET /api/maps + GET /api/maps/:mapId
 * 管理员: CRUD /api/admin/maps
 */
const express = require('express');
const mapController = require('../controllers/mapController');
const authMiddleware = require('../middleware/auth');

const router = express.Router();

// 客户端地图接口（需要认证）
router.get('/', authMiddleware, mapController.listMaps);
router.get('/:mapId', authMiddleware, mapController.getMap);

module.exports = router;
