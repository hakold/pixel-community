const express = require('express');
const metaController = require('../controllers/metaController');

const router = express.Router();

router.get('/bootstrap', metaController.getBootstrap);
router.get('/tile-manifest', metaController.getTileManifest);
router.get('/character-manifest', metaController.getCharacterManifest);

module.exports = router;
