/**
 * ConfigManager — 游戏配置系统核心模块
 *
 * 职责：
 *   1. 启动时一次性加载全部 JSON 配置到内存
 *   2. 提供统一的 get(namespace) / getValue(path) 读取接口
 *   3. 支持运行时热更新（按 namespace 或全部重载）
 *   4. 对外暴露加载状态（供 admin 接口查询）
 *
 * 使用方式：
 *   const cm = require('./configManager');
 *   cm.init(CONFIG_DIR, MANIFEST);
 *   const game = cm.get('game');
 *   const exp  = cm.getValue('game.player.initialLevel');
 */

const fs = require('fs');
const path = require('path');

/** 配置清单：namespace → 文件名 */
const DEFAULT_MANIFEST = {
  game: 'game.json',
  study: 'study.json',
  work: 'work.json',
  mining: 'mining.json',
  woodcut: 'woodcut.json',
  fishing: 'fishing.json',
  skills: 'skills.json',
  levelExp: 'levelExp.json',
};

// ---------- 内部状态 ----------

/** @type {string} 配置文件目录绝对路径 */
let configDir = '';

/** @type {Map<string, Object|Array>} namespace → 解析后的配置数据 */
const store = new Map();

/** @type {Map<string, { filename: string, size: number, loadedAt: string }>} namespace → 元信息 */
const meta = new Map();

/** @type {Object} 当前的 manifest（允许扩展） */
let manifest = {};

// ---------- 内部工具 ----------

/**
 * 读取并解析单个 JSON 文件
 * @param {string} filepath - 文件的绝对路径
 * @returns {Object|Array}
 * @throws {Error} 文件不存在 / JSON 语法错误
 */
function readJSON(filepath) {
  if (!fs.existsSync(filepath)) {
    throw new Error(`配置文件不存在: ${filepath}`);
  }
  const raw = fs.readFileSync(filepath, 'utf-8');
  return JSON.parse(raw);
}

/**
 * 解析点号分隔的路径取值
 * @example getNestedValue(obj, 'a.b.c') → obj.a.b.c
 */
function getNestedValue(obj, pathStr) {
  return pathStr.split('.').reduce((cur, key) => {
    if (cur === null || cur === undefined) return undefined;
    return cur[key];
  }, obj);
}

// ===================== 公开 API =====================

/**
 * 初始化配置管理器（服务启动时调用一次）
 * @param {string} dir - 配置文件所在目录的绝对路径
 * @param {Object} [customManifest] - 自定义 namespace→filename 映射
 * @returns {Object} { ok: true, namespaces: string[] }
 */
function init(dir, customManifest) {
  configDir = dir;
  manifest = customManifest || DEFAULT_MANIFEST;

  const loaded = [];
  const failed = [];

  for (const [ns, filename] of Object.entries(manifest)) {
    try {
      loadOne(ns, filename);
      loaded.push(ns);
    } catch (err) {
      failed.push({ ns, filename, error: err.message });
      console.error(`[ConfigManager] 加载失败 [${ns}]: ${err.message}`);
    }
  }

  console.log(`[ConfigManager] 初始化完成: ${loaded.length}/${Object.keys(manifest).length} 个配置已加载`);
  if (failed.length) {
    console.warn(`[ConfigManager] 未加载: ${failed.map((f) => f.ns).join(', ')}`);
  }

  return { ok: failed.length === 0, loaded, failed };
}

/**
 * 加载单个 namespace（内部使用，也可用于动态新增配置）
 * @param {string} ns - namespace
 * @param {string} [filename] - 文件名（省略则从 manifest 取）
 */
function loadOne(ns, filename) {
  const fname = filename || manifest[ns];
  if (!fname) throw new Error(`namespace [${ns}] 未在 manifest 中注册`);

  const filepath = path.join(configDir, fname);
  const data = readJSON(filepath);
  const stat = fs.statSync(filepath);

  store.set(ns, data);
  meta.set(ns, {
    filename: fname,
    size: stat.size,
    loadedAt: new Date().toISOString(),
  });
}

/**
 * 获取指定 namespace 的完整配置
 * @param {string} ns - namespace（如 'game'、'education'）
 * @returns {Object|Array|null} 配置数据，不存在返回 null
 */
function get(ns) {
  return store.has(ns) ? store.get(ns) : null;
}

/**
 * 按点号路径读取嵌套值
 * @example getValue('game.player.maxLevel') → 100
 * @param {string} path - 格式 "namespace.key1.key2..."
 * @returns {*} 配置值，路径不存在返回 undefined
 */
function getValue(path) {
  const dotIdx = path.indexOf('.');
  if (dotIdx === -1) return get(path); // 只有 namespace，返回整个配置

  const ns = path.slice(0, dotIdx);
  const rest = path.slice(dotIdx + 1);
  const data = get(ns);
  if (!data) return undefined;

  return getNestedValue(data, rest);
}

/**
 * 热更新单个 namespace
 * @param {string} ns - namespace
 * @returns {{ ok: boolean, ns: string, message: string }}
 */
function reload(ns) {
  if (!manifest[ns]) {
    return { ok: false, ns, message: `namespace [${ns}] 未注册` };
  }

  try {
    loadOne(ns, manifest[ns]);
    console.log(`[ConfigManager] 热更新成功: ${ns}`);
    return { ok: true, ns, message: `${ns} 已更新` };
  } catch (err) {
    console.error(`[ConfigManager] 热更新失败 [${ns}]: ${err.message}`);
    return { ok: false, ns, message: err.message };
  }
}

/**
 * 热更新全部配置
 * @returns {{ ok: boolean, results: Array }}
 */
function reloadAll() {
  const results = [];
  for (const ns of Object.keys(manifest)) {
    results.push(reload(ns));
  }

  const allOk = results.every((r) => r.ok);
  console.log(`[ConfigManager] 全部重载: ${allOk ? '成功' : '部分失败'}`);
  return { ok: allOk, results };
}

/**
 * 获取所有 namespace 的加载状态（供 admin 接口查询）
 * @returns {Array<{ ns, filename, size, loadedAt }>}
 */
function getStatus() {
  const status = [];
  for (const [ns, info] of meta.entries()) {
    status.push({
      ns,
      filename: info.filename,
      size: info.size,
      loadedAt: info.loadedAt,
    });
  }
  return status;
}

/**
 * 返回已注册的 manifest（所有 namespace 列表）
 */
function getManifest() {
  return { ...manifest };
}

/**
 * 动态注册一个新的 namespace（扩展用）
 * @param {string} ns - 新 namespace
 * @param {string} filename - 对应的 JSON 文件名
 * @returns {{ ok: boolean, message: string }}
 */
function register(ns, filename) {
  if (manifest[ns]) {
    return { ok: false, message: `namespace [${ns}] 已存在` };
  }

  const filepath = path.join(configDir, filename);
  if (!fs.existsSync(filepath)) {
    return { ok: false, message: `文件不存在: ${filename}` };
  }

  manifest[ns] = filename;
  try {
    loadOne(ns, filename);
    console.log(`[ConfigManager] 动态注册: ${ns} → ${filename}`);
    return { ok: true, message: `${ns} 已注册并加载` };
  } catch (err) {
    delete manifest[ns];
    return { ok: false, message: err.message };
  }
}

module.exports = {
  init,
  get,
  getValue,
  reload,
  reloadAll,
  getStatus,
  getManifest,
  register,
};
