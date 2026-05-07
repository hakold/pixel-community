const express = require('express');
const recoveryController = require('../controllers/recoveryController');
const authMiddleware = require('../middleware/auth');

const router = express.Router();

router.use(authMiddleware);

router.get('/list', recoveryController.listRecoveryActions);
router.post('/perform', recoveryController.performRecoveryAction);

module.exports = router;
