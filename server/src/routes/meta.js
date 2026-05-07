const express = require('express');
const metaController = require('../controllers/metaController');

const router = express.Router();

router.get('/bootstrap', metaController.getBootstrap);

module.exports = router;
