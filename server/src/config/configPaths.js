const fs = require('fs');
const path = require('path');

const REPO_ROOT = path.join(__dirname, '..', '..', '..');
const GENERATED_CONFIG_DIR = path.join(REPO_ROOT, 'game-config', 'generated');
const LEGACY_CONFIG_DIR = path.join(REPO_ROOT, 'server', 'config');
const REQUIRED_GENERATED_FILES = [
  'game.json',
  'study.json',
  'work.json',
  'mining.json',
  'woodcut.json',
  'fishing.json',
  'skills.json',
  'items.json',
  'shops.json',
  'recoveryActions.json',
  'levelExp.json'
];

function resolveConfiguredDir() {
  if (!process.env.GAME_CONFIG_DIR) {
    return null;
  }
  return path.resolve(process.env.GAME_CONFIG_DIR);
}

function hasCompleteGeneratedConfigSet(dir) {
  return REQUIRED_GENERATED_FILES.every((filename) => {
    return fs.existsSync(path.join(dir, filename));
  });
}

function hasUsableMapsDir(dir) {
  const mapsDir = path.join(dir, 'maps');
  if (!fs.existsSync(mapsDir)) {
    return false;
  }

  return fs.readdirSync(mapsDir).some((filename) => filename.endsWith('.json'));
}

function getConfigDir() {
  const configuredDir = resolveConfiguredDir();
  if (configuredDir) {
    return configuredDir;
  }

  if (fs.existsSync(GENERATED_CONFIG_DIR) && hasCompleteGeneratedConfigSet(GENERATED_CONFIG_DIR)) {
    return GENERATED_CONFIG_DIR;
  }

  return LEGACY_CONFIG_DIR;
}

function getMapsDir() {
  const configuredDir = resolveConfiguredDir();
  if (configuredDir) {
    return path.join(configuredDir, 'maps');
  }

  if (hasCompleteGeneratedConfigSet(GENERATED_CONFIG_DIR) && hasUsableMapsDir(GENERATED_CONFIG_DIR)) {
    return path.join(GENERATED_CONFIG_DIR, 'maps');
  }

  return path.join(LEGACY_CONFIG_DIR, 'maps');
}

module.exports = {
  REPO_ROOT,
  GENERATED_CONFIG_DIR,
  LEGACY_CONFIG_DIR,
  REQUIRED_GENERATED_FILES,
  getConfigDir,
  getMapsDir
};
