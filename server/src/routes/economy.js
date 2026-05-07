const express = require('express');
const economyController = require('../controllers/economyController');
const authMiddleware = require('../middleware/auth');

const router = express.Router();

router.use(authMiddleware);

router.get('/shops', economyController.listShops);
router.post('/buy', economyController.buyItem);
router.post('/sell', economyController.sellItem);

module.exports = router;
