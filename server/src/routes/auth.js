/**
 * 认证路由 — 仅绑定路径与控制器
 */
const express = require('express');
const authController = require('../controllers/authController');
const authMiddleware = require('../middleware/auth');

const router = express.Router();

// 公开接口
router.post('/register', authController.register);
router.post('/login', authController.login);

// 需认证
router.get('/me', authMiddleware, authController.getMe);

module.exports = router;
