const fs = require('fs');
const path = require('path');

const REPO_ROOT = path.join(__dirname, '..', '..');
const EXCEL_DIR = path.join(REPO_ROOT, 'game-config', 'excel');
const GENERATED_DIR = path.join(REPO_ROOT, 'game-config', 'generated');
const LEGACY_CONFIG_DIR = path.join(REPO_ROOT, 'server', 'config');

function ensureDir(dir) {
  fs.mkdirSync(dir, { recursive: true });
}

function readText(filepath) {
  return fs.readFileSync(filepath, 'utf-8').replace(/^\uFEFF/, '');
}

function splitCsvLine(line) {
  const values = [];
  let current = '';
  let inQuotes = false;

  for (let index = 0; index < line.length; index += 1) {
    const char = line[index];
    const next = line[index + 1];

    if (char === '"') {
      if (inQuotes && next === '"') {
        current += '"';
        index += 1;
      } else {
        inQuotes = !inQuotes;
      }
      continue;
    }

    if (char === ',' && !inQuotes) {
      values.push(current);
      current = '';
      continue;
    }

    current += char;
  }

  values.push(current);
  return values;
}

function parseCsv(text) {
  const normalized = text.replace(/\r\n/g, '\n').replace(/\r/g, '\n');
  const lines = normalized
    .split('\n')
    .map((line) => line.trimEnd())
    .filter((line) => line && !line.startsWith('#'));

  if (!lines.length) {
    return [];
  }

  const headers = splitCsvLine(lines[0]).map((header) => header.trim());
  return lines.slice(1).map((line, lineIndex) => {
    const cells = splitCsvLine(line);
    const row = {};

    headers.forEach((header, cellIndex) => {
      row[header] = (cells[cellIndex] || '').trim();
    });

    row.__line = lineIndex + 2;
    return row;
  });
}

function readCsvObjects(filename) {
  const filepath = path.join(EXCEL_DIR, filename);
  if (!fs.existsSync(filepath)) {
    throw new Error(`缺少导表源文件: ${filepath}`);
  }
  return parseCsv(readText(filepath));
}

function parseTypedValue(type, rawValue, lineNumber) {
  if (type === 'string') {
    return rawValue;
  }

  if (type === 'number') {
    const value = Number(rawValue);
    if (Number.isNaN(value)) {
      throw new Error(`第 ${lineNumber} 行 number 解析失败: ${rawValue}`);
    }
    return value;
  }

  if (type === 'boolean') {
    if (rawValue === 'true') return true;
    if (rawValue === 'false') return false;
    throw new Error(`第 ${lineNumber} 行 boolean 解析失败: ${rawValue}`);
  }

  if (type === 'json') {
    return JSON.parse(rawValue);
  }

  throw new Error(`第 ${lineNumber} 行存在未知 type: ${type}`);
}

function setNestedValue(target, pathStr, value) {
  const keys = pathStr.split('.');
  let current = target;

  for (let index = 0; index < keys.length - 1; index += 1) {
    const key = keys[index];
    if (current[key] === undefined) {
      current[key] = {};
    }
    current = current[key];
  }

  current[keys[keys.length - 1]] = value;
}

function parseOptionalNumber(rawValue, fieldName, lineNumber) {
  if (!rawValue) {
    return null;
  }

  const value = Number(rawValue);
  if (Number.isNaN(value)) {
    throw new Error(`第 ${lineNumber} 行字段 ${fieldName} 不是合法数字: ${rawValue}`);
  }
  return value;
}

function addNumberIfPresent(target, key, rawValue, lineNumber, fieldName) {
  const value = parseOptionalNumber(rawValue, fieldName, lineNumber);
  if (value !== null) {
    target[key] = value;
  }
}

function buildGameConfig(rows) {
  const result = {};

  rows.forEach((row) => {
    if (!row.path) {
      throw new Error(`game_global.csv 第 ${row.__line} 行缺少 path`);
    }
    if (!row.type) {
      throw new Error(`game_global.csv 第 ${row.__line} 行缺少 type`);
    }

    setNestedValue(
      result,
      row.path,
      parseTypedValue(row.type, row.value || '', row.__line)
    );
  });

  return result;
}

function groupDropRows(rows) {
  const grouped = new Map();

  rows.forEach((row) => {
    if (!row.actionType || !row.actionId || !row.itemId) {
      throw new Error(`action_drop_items.csv 第 ${row.__line} 行缺少必要字段`);
    }

    const count = parseOptionalNumber(row.count, 'count', row.__line);
    const weight = parseOptionalNumber(row.weight, 'weight', row.__line);
    const key = `${row.actionType}:${row.actionId}`;

    const list = grouped.get(key) || [];
    list.push({
      itemId: row.itemId,
      count: count === null ? 1 : count,
      weight: weight === null ? 0 : weight
    });
    grouped.set(key, list);
  });

  return grouped;
}

function buildRequirements(row) {
  const requirements = {};

  addNumberIfPresent(requirements, 'level', row.req_level, row.__line, 'req_level');
  addNumberIfPresent(requirements, 'gold', row.req_gold, row.__line, 'req_gold');
  addNumberIfPresent(requirements, 'strength', row.req_strength, row.__line, 'req_strength');
  addNumberIfPresent(requirements, 'intelligence', row.req_intelligence, row.__line, 'req_intelligence');
  addNumberIfPresent(requirements, 'charm', row.req_charm, row.__line, 'req_charm');

  if (row.req_education) {
    requirements.education = row.req_education;
  }

  return requirements;
}

function buildActionRewards(row) {
  const rewards = {};

  addNumberIfPresent(rewards, 'exp', row.reward_exp, row.__line, 'reward_exp');
  addNumberIfPresent(rewards, 'gold', row.reward_gold, row.__line, 'reward_gold');

  return rewards;
}

function buildActionConfigs(actionRows, dropRows) {
  const dropsByAction = groupDropRows(dropRows);
  const buckets = {
    study: [],
    work: [],
    mining: [],
    woodcut: [],
    fishing: []
  };

  actionRows.forEach((row) => {
    if (!row.actionType || !row.id || !row.name) {
      throw new Error(`actions.csv 第 ${row.__line} 行缺少必要字段`);
    }

    if (!buckets[row.actionType]) {
      throw new Error(`actions.csv 第 ${row.__line} 行 actionType 无效: ${row.actionType}`);
    }

    const duration = parseOptionalNumber(row.duration_sec, 'duration_sec', row.__line);
    const energyCost = parseOptionalNumber(row.energy_cost, 'energy_cost', row.__line);

    if (duration === null || energyCost === null) {
      throw new Error(`actions.csv 第 ${row.__line} 行缺少 duration_sec 或 energy_cost`);
    }

    const config = {
      id: row.id,
      name: row.name,
      description: row.description || '',
      requirements: buildRequirements(row),
      duration,
      energyCost
    };

    if (row.actionType === 'study') {
      const stage = parseOptionalNumber(row.stage, 'stage', row.__line);
      const rewards = buildActionRewards(row);
      const attributes = {};

      addNumberIfPresent(attributes, 'strength', row.reward_attr_strength, row.__line, 'reward_attr_strength');
      addNumberIfPresent(attributes, 'intelligence', row.reward_attr_intelligence, row.__line, 'reward_attr_intelligence');
      addNumberIfPresent(attributes, 'charm', row.reward_attr_charm, row.__line, 'reward_attr_charm');

      config.stage = stage === null ? 0 : stage;
      config.rewards = rewards;
      if (Object.keys(attributes).length > 0) {
        config.rewards.attributes = attributes;
      }
      config.unlocks = row.unlocks
        ? row.unlocks.split('|').map((item) => item.trim()).filter(Boolean)
        : [];
    } else if (row.actionType === 'work') {
      config.category = row.category || 'default';
      config.rewards = buildActionRewards(row);
    } else {
      const dropKey = `${row.actionType}:${row.id}`;
      config.rewards = {
        exp: parseOptionalNumber(row.reward_exp, 'reward_exp', row.__line) || 0,
        items: dropsByAction.get(dropKey) || []
      };
    }

    buckets[row.actionType].push(config);
  });

  return buckets;
}

function buildLevelExpConfig(gameConfig) {
  const curve = gameConfig.expCurve || {};
  const maxLevel = gameConfig.player?.maxLevel;

  if (curve.type !== 'exponential') {
    throw new Error(`当前仅支持 exponential 经验曲线，收到: ${curve.type}`);
  }

  if (!maxLevel || !curve.baseExp || !curve.growthFactor) {
    throw new Error('生成 levelExp.json 失败，game_global.csv 缺少经验曲线字段');
  }

  const table = { 1: 0 };
  let totalExp = 0;

  for (let level = 2; level <= maxLevel; level += 1) {
    totalExp += Math.floor(curve.baseExp * Math.pow(curve.growthFactor, level - 1));
    table[level] = totalExp;
  }

  return {
    description: `等级经验表 — 每级所需累计经验，指数增长 baseExp=${curve.baseExp}, factor=${curve.growthFactor}`,
    maxLevel,
    curve: {
      type: curve.type,
      baseExp: curve.baseExp,
      growthFactor: curve.growthFactor
    },
    table
  };
}

function parsePipeList(rawValue) {
  if (!rawValue) {
    return [];
  }

  return rawValue
    .split('|')
    .map((item) => item.trim())
    .filter(Boolean);
}

function buildSkillsConfig(rows) {
  return {
    skills: rows.map((row) => {
      if (!row.id || !row.name || !row.category) {
        throw new Error(`skills.csv 第 ${row.__line} 行缺少必要字段`);
      }

      const skill = {
        id: row.id,
        name: row.name,
        category: row.category,
        description: row.description || '',
        maxLevel: parseOptionalNumber(row.max_level, 'max_level', row.__line) || 1,
        levelUpCost: {
          type: row.level_cost_type || 'exp',
          values: parsePipeList(row.level_costs).map((value) => Number(value))
        }
      };

      if (skill.levelUpCost.values.some((value) => Number.isNaN(value))) {
        throw new Error(`skills.csv 第 ${row.__line} 行 level_costs 解析失败`);
      }

      if (row.type) {
        skill.type = row.type;
      }

      addNumberIfPresent(skill, 'baseDamage', row.base_damage, row.__line, 'base_damage');
      addNumberIfPresent(skill, 'damagePerLevel', row.damage_per_level, row.__line, 'damage_per_level');
      addNumberIfPresent(skill, 'baseHeal', row.base_heal, row.__line, 'base_heal');
      addNumberIfPresent(skill, 'healPerLevel', row.heal_per_level, row.__line, 'heal_per_level');
      addNumberIfPresent(skill, 'cooldown', row.cooldown, row.__line, 'cooldown');
      addNumberIfPresent(skill, 'stunChance', row.stun_chance, row.__line, 'stun_chance');
      addNumberIfPresent(skill, 'stunChancePerLevel', row.stun_chance_per_level, row.__line, 'stun_chance_per_level');

      if (row.aoe) {
        skill.aoe = parseTypedValue('boolean', row.aoe, row.__line);
      }

      const effects = {};
      addNumberIfPresent(effects, 'hunger', row.effect_hunger, row.__line, 'effect_hunger');
      addNumberIfPresent(effects, 'charisma', row.effect_charisma, row.__line, 'effect_charisma');
      addNumberIfPresent(effects, 'strength', row.effect_strength, row.__line, 'effect_strength');
      addNumberIfPresent(effects, 'attack', row.effect_attack, row.__line, 'effect_attack');
      addNumberIfPresent(effects, 'defense', row.effect_defense, row.__line, 'effect_defense');
      addNumberIfPresent(effects, 'speed', row.effect_speed, row.__line, 'effect_speed');
      addNumberIfPresent(effects, 'intelligence', row.effect_intelligence, row.__line, 'effect_intelligence');

      if (Object.keys(effects).length > 0) {
        skill.effects = { perLevel: effects };
      }

      return skill;
    })
  };
}

function buildItemsConfig(rows) {
  return rows.map((row) => {
    if (!row.item_id || !row.name || !row.type) {
      throw new Error(`items.csv 第 ${row.__line} 行缺少必要字段`);
    }

    const item = {
      itemId: row.item_id,
      name: row.name,
      type: row.type,
      description: row.description || ''
    };

    if (row.quality) {
      item.quality = row.quality;
    }

    addNumberIfPresent(item, 'maxStack', row.max_stack, row.__line, 'max_stack');
    addNumberIfPresent(item, 'sellPrice', row.sell_price, row.__line, 'sell_price');
    addNumberIfPresent(item, 'buyPrice', row.buy_price, row.__line, 'buy_price');

    if (row.use_effect_type) {
      item.useEffect = {
        type: row.use_effect_type
      };
      addNumberIfPresent(item.useEffect, 'value', row.use_effect_value, row.__line, 'use_effect_value');
    }

    if (row.tags) {
      item.tags = parsePipeList(row.tags);
    }

    return item;
  });
}

function buildShopsConfig(rows) {
  const shops = new Map();

  rows.forEach((row) => {
    if (!row.shop_id || !row.shop_name || !row.item_id) {
      throw new Error(`shops.csv 第 ${row.__line} 行缺少必要字段`);
    }

    const shop = shops.get(row.shop_id) || {
      id: row.shop_id,
      name: row.shop_name,
      currency: row.currency || 'gold',
      entries: []
    };

    shop.entries.push({
      itemId: row.item_id,
      price: parseOptionalNumber(row.price, 'price', row.__line) || 0,
      stock: parseOptionalNumber(row.stock, 'stock', row.__line),
      unlockLevel: parseOptionalNumber(row.unlock_level, 'unlock_level', row.__line)
    });

    shops.set(row.shop_id, shop);
  });

  return Array.from(shops.values());
}

function buildRecoveryActionsConfig(rows) {
  return rows.map((row) => {
    if (!row.id || !row.name || !row.recovery_type) {
      throw new Error(`recovery_actions.csv 第 ${row.__line} 行缺少必要字段`);
    }

    const action = {
      id: row.id,
      name: row.name,
      recoveryType: row.recovery_type,
      description: row.description || ''
    };

    if (row.facility) {
      action.facility = row.facility;
    }

    if (row.zone_id) {
      action.zoneId = row.zone_id;
    }

    addNumberIfPresent(action, 'duration', row.duration_sec, row.__line, 'duration_sec');
    addNumberIfPresent(action, 'costGold', row.cost_gold, row.__line, 'cost_gold');

    const effects = {};
    addNumberIfPresent(effects, 'energy', row.recover_energy, row.__line, 'recover_energy');
    addNumberIfPresent(effects, 'hunger', row.recover_hunger, row.__line, 'recover_hunger');
    addNumberIfPresent(effects, 'clean', row.recover_clean, row.__line, 'recover_clean');
    addNumberIfPresent(effects, 'mood', row.recover_mood, row.__line, 'recover_mood');
    addNumberIfPresent(effects, 'health', row.recover_health, row.__line, 'recover_health');
    action.effects = effects;

    const requirements = {};
    addNumberIfPresent(requirements, 'level', row.req_level, row.__line, 'req_level');
    if (Object.keys(requirements).length > 0) {
      action.requirements = requirements;
    }

    return action;
  });
}

function writeJson(filename, data) {
  ensureDir(GENERATED_DIR);
  fs.writeFileSync(
    path.join(GENERATED_DIR, filename),
    `${JSON.stringify(data, null, 2)}\n`,
    'utf-8'
  );
}

function bootstrapMapsIfMissing() {
  const sourceDir = path.join(LEGACY_CONFIG_DIR, 'maps');
  const targetDir = path.join(GENERATED_DIR, 'maps');

  if (!fs.existsSync(sourceDir)) {
    return;
  }

  ensureDir(targetDir);
  const existingJson = fs.readdirSync(targetDir).filter((name) => name.endsWith('.json'));
  if (existingJson.length > 0) {
    return;
  }

  fs.readdirSync(sourceDir)
    .filter((name) => name.endsWith('.json'))
    .forEach((name) => {
      fs.copyFileSync(path.join(sourceDir, name), path.join(targetDir, name));
    });
}

function main() {
  ensureDir(GENERATED_DIR);

  const gameRows = readCsvObjects('game_global.csv');
  const actionRows = readCsvObjects('actions.csv');
  const dropRows = readCsvObjects('action_drop_items.csv');
  const skillRows = readCsvObjects('skills.csv');
  const itemRows = readCsvObjects('items.csv');
  const shopRows = readCsvObjects('shops.csv');
  const recoveryRows = readCsvObjects('recovery_actions.csv');

  const gameConfig = buildGameConfig(gameRows);
  const actionConfigs = buildActionConfigs(actionRows, dropRows);
  const levelExpConfig = buildLevelExpConfig(gameConfig);
  const skillsConfig = buildSkillsConfig(skillRows);
  const itemsConfig = buildItemsConfig(itemRows);
  const shopsConfig = buildShopsConfig(shopRows);
  const recoveryActionsConfig = buildRecoveryActionsConfig(recoveryRows);

  writeJson('game.json', gameConfig);
  writeJson('study.json', actionConfigs.study);
  writeJson('work.json', actionConfigs.work);
  writeJson('mining.json', actionConfigs.mining);
  writeJson('woodcut.json', actionConfigs.woodcut);
  writeJson('fishing.json', actionConfigs.fishing);
  writeJson('levelExp.json', levelExpConfig);
  writeJson('skills.json', skillsConfig);
  writeJson('items.json', itemsConfig);
  writeJson('shops.json', shopsConfig);
  writeJson('recoveryActions.json', recoveryActionsConfig);
  bootstrapMapsIfMissing();

  console.log('[config:build] 已生成配置到 game-config/generated');
  console.log(`[config:build] study=${actionConfigs.study.length}, work=${actionConfigs.work.length}, mining=${actionConfigs.mining.length}, woodcut=${actionConfigs.woodcut.length}, fishing=${actionConfigs.fishing.length}, skills=${skillsConfig.skills.length}, items=${itemsConfig.length}, shops=${shopsConfig.length}, recovery=${recoveryActionsConfig.length}`);
}

main();
