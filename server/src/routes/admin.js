/**
 * 管理后台路由 — 仅绑定路径与控制器
 *
 * 注意：当前阶段未实现管理员权限校验
 * 后续阶段建议添加 adminAuth 中间件
 */
const express = require('express');
const adminController = require('../controllers/adminController');

const router = express.Router();

// 配置管理
router.get('/config/status', adminController.getConfigStatus);
router.post('/config/reload', adminController.reloadAllConfigs);
router.post('/config/reload/:namespace', adminController.reloadOneConfig);
router.get('/config/:namespace', adminController.getConfigByNamespace);

module.exports = router;
