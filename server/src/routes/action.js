/**
 * 行为路由 — 仅绑定路径与控制器
 */
const express = require('express');
const actionController = require('../controllers/actionController');
const authMiddleware = require('../middleware/auth');

const router = express.Router();

// 全部需要认证
router.use(authMiddleware);

router.get('/list', actionController.listActions);
router.post('/start', actionController.startAction);
router.get('/status', actionController.getStatus);
router.post('/collect', actionController.collectAction);
router.post('/cancel', actionController.cancelAction);

module.exports = router;
