/**
 * 玩家路由 — 仅绑定路径与控制器
 */
const express = require('express');
const playerController = require('../controllers/playerController');
const authMiddleware = require('../middleware/auth');

const router = express.Router();

// 全部需要认证
router.use(authMiddleware);

router.get('/profile', playerController.getProfile);
router.get('/attributes', playerController.getAttributes);
router.get('/inventory', playerController.getInventory);
router.get('/skills', playerController.getSkills);

module.exports = router;
