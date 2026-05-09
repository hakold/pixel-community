<template>
  <div class="editor-page">
    <!-- 顶部栏 -->
    <header class="editor-header">
      <h1>地图编辑器</h1>
      <div class="header-actions">
        <select v-model="selectedMapId" @change="loadSelectedMap">
          <option value="">-- 选择地图 --</option>
          <option v-for="m in mapList" :key="m.mapId" :value="m.mapId">{{ m.name }} ({{ m.mapId }})</option>
        </select>
        <button @click="createNewMap">新建</button>
        <button @click="saveMap" :disabled="saving">{{ saving ? '保存中...' : '保存到服务器' }}</button>
        <label class="btn-upload">导入 JSON<input type="file" accept=".json" @change="importJson" hidden></label>
        <button @click="exportJson">导出 JSON</button>
        <router-link to="/game" class="btn-back">返回游戏</router-link>
      </div>
    </header>

    <!-- 主体 -->
    <div class="editor-body">
      <!-- 画布区 -->
      <section class="canvas-section">
        <div class="toolbar">
          <span class="tool-label">图层:</span>
          <button class="brush-btn" :class="{ active: activeLayer === 'tile' }" @click="setActiveLayer('tile')">地块</button>
          <button class="brush-btn" :class="{ active: activeLayer === 'collision' }" @click="setActiveLayer('collision')">碰撞</button>
          <span class="tool-label">笔刷:</span>
          <button v-for="t in tileTypes" :key="t.code"
            class="brush-btn"
            v-show="activeLayer === 'tile'"
            :class="{ active: !pickMode && activeLayer === 'tile' && brush === t.code }"
            :style="{ borderColor: !pickMode && activeLayer === 'tile' && brush === t.code ? t.color : 'transparent' }"
            @click="setBrush(t.code)">
            <span class="brush-dot" :style="{ background: t.color }"></span>{{ t.label }}
          </button>
          <button
            v-for="option in collisionBrushes"
            :key="option.value"
            v-show="activeLayer === 'collision'"
            class="brush-btn"
            :class="{ active: !pickMode && activeLayer === 'collision' && collisionBrush === option.value }"
            :style="{ borderColor: !pickMode && activeLayer === 'collision' && collisionBrush === option.value ? option.color : 'transparent' }"
            @click="setCollisionBrush(option.value)"
          >
            <span class="brush-dot" :style="{ background: option.color }"></span>{{ option.label }}
          </button>
          <span v-if="pickMode" class="pick-badge">
            点选模式: {{ pickMode.label }}
            <button class="btn-sm" @click="clearPick">取消</button>
          </span>
        </div>
        <div class="canvas-wrap" ref="canvasWrap">
          <canvas ref="canvasEl"
            @mousedown="onMouseDown" @mousemove="onMouseMove"
            @mouseup="onMouseUp" @mouseleave="onMouseUp"
            @contextmenu.prevent></canvas>
        </div>
        <p class="editor-status">{{ status }}</p>
      </section>

      <!-- 属性面板 -->
      <aside class="props-panel">
        <div class="prop-group">
          <h3>地图属性</h3>
          <label>ID <input v-model="mapConfig.mapId" @input="dirty = true"></label>
          <label>名称 <input v-model="mapConfig.name" @input="dirty = true"></label>
          <label>
            渲染模式
            <select v-model="mapConfig.renderMode" @change="handleVisualConfigChange">
              <option value="isometric">普通网格</option>
              <option value="blueprint">蓝图背景图</option>
            </select>
          </label>
          <label v-if="mapConfig.renderMode === 'blueprint'">背景图 <input v-model="mapConfig.background.image" @input="handleVisualConfigChange"></label>
          <label>宽 <input type="number" v-model.number="mapConfig.grid.width" min="1" max="100" @change="resizeGrid"></label>
          <label>高 <input type="number" v-model.number="mapConfig.grid.height" min="1" max="100" @change="resizeGrid"></label>
        </div>

        <div class="prop-group">
          <h3>碰撞</h3>
          <div class="mini-actions">
            <button class="btn-sm" @click="rebuildCollisionFromTiles">按地块重建</button>
            <button class="btn-sm" @click="fillCollision(0)">全设可走</button>
            <button class="btn-sm" @click="fillCollision(1)">全设阻挡</button>
          </div>
          <p class="prop-hint">碰撞层独立于 tile，可直接决定角色能否走到该格。</p>
        </div>

        <div class="prop-group">
          <h3>玩家</h3>
          <label>出生 X <input type="number" v-model.number="mapConfig.player.spawnX" min="0"></label>
          <label>出生 Y <input type="number" v-model.number="mapConfig.player.spawnY" min="0"></label>
          <button class="btn-sm" @click="startPick('spawn', '出生点')">在画布上点选出生点</button>
        </div>

        <div class="prop-group">
          <h3>传送点 <button class="btn-sm" @click="addPortal">+</button></h3>
          <div v-for="(p, i) in mapConfig.portals" :key="i" class="item-row">
            <input v-model="p.id" size="8" placeholder="ID" @input="dirty = true">
            <input type="number" v-model.number="p.x" size="3" placeholder="X" @input="dirty = true">
            <input type="number" v-model.number="p.y" size="3" placeholder="Y" @input="dirty = true">
            <button class="btn-sm" @click="startPick('portal', '传送点入口', i)">点选</button>
            <input v-model="p.targetMapId" size="10" placeholder="目标地图" @input="dirty = true">
            <input type="number" v-model.number="p.targetX" size="3" placeholder="TX" @input="dirty = true">
            <input type="number" v-model.number="p.targetY" size="3" placeholder="TY" @input="dirty = true">
            <button class="btn-sm btn-del" @click="removePortal(i)">x</button>
          </div>
        </div>

        <div class="prop-group">
          <h3>假人 <button class="btn-sm" @click="addDummy">+</button></h3>
          <div v-for="(d, i) in mapConfig.dummies" :key="i" class="item-row">
            <input v-model="d.actorId" size="8" placeholder="ID" @input="dirty = true">
            <input v-model="d.nickname" size="6" placeholder="昵称" @input="dirty = true">
            <input type="number" v-model.number="d.spawnX" size="3" placeholder="X" @input="dirty = true">
            <input type="number" v-model.number="d.spawnY" size="3" placeholder="Y" @input="dirty = true">
            <button class="btn-sm" @click="startPick('dummy', '假人站位', i)">点选</button>
            <select v-model="d.behavior" @change="dirty = true">
              <option value="idle">idle</option>
              <option value="patrol">patrol</option>
            </select>
            <button class="btn-sm btn-del" @click="removeDummy(i)">x</button>
          </div>
        </div>

        <div class="prop-group">
          <h3>行为区 <button class="btn-sm" @click="addZone">+</button></h3>
          <div v-for="(z, i) in mapConfig.actionZones" :key="i" class="item-row">
            <input v-model="z.id" size="8" placeholder="ID" @input="dirty = true">
            <input v-model="z.label" size="6" placeholder="标签" @input="dirty = true">
            <select v-model="z.actionType" @change="dirty = true">
              <option value="study">学习</option>
              <option value="work">打工</option>
              <option value="mining">挖矿</option>
              <option value="woodcut">伐木</option>
              <option value="fishing">钓鱼</option>
            </select>
            <button class="btn-sm" @click="startPick('zone', '行为区', i)">点选格子</button>
            <span class="zone-tiles-hint">{{ z.tiles?.length || 0 }} 格</span>
            <button class="btn-sm btn-del" @click="removeZone(i)">x</button>
          </div>
        </div>
      </aside>
    </div>
  </div>
</template>

<script setup>
import { ref, reactive, onMounted, nextTick } from 'vue';
import { API_BASE_URL } from '@/config';

const CELL = 24;
const WALKABLE_TILE_CODES = new Set(['f']);

const tileTypes = [
  { code: 'f', label: '地面', color: '#f2e5cc' },
  { code: 'w', label: '墙', color: '#d7dbe1' },
  { code: 'g', label: '草地', color: '#88c05d' }
];
const collisionBrushes = [
  { value: 0, label: '可走', color: 'rgba(78,203,113,0.95)' },
  { value: 1, label: '阻挡', color: 'rgba(233,69,96,0.95)' }
];

const mapList = ref([]);
const selectedMapId = ref('');
const brush = ref('f');
const collisionBrush = ref(1);
const activeLayer = ref('tile');
const status = ref('就绪');
const saving = ref(false);
const dirty = ref(false);
const canvasEl = ref(null);
const canvasWrap = ref(null);
let painting = false;
let backgroundImage = null;
let backgroundImageSrc = '';

const pickMode = ref(null); // null | { kind, label, index }

const mapConfig = reactive({
  mapId: '', name: '',
  renderMode: 'isometric',
  background: { image: '', width: 0, height: 0, showGrid: false, showBlockedMask: false, fallbackColor: '#7aa56d' },
  grid: { width: 16, height: 16, tileWidth: 96, tileHeight: 48, blockHeight: 54, originOffsetX: 120, originOffsetY: 120 },
  player: { spawnX: 8, spawnY: 8, moveSpeedTilesPerSecond: 5 },
  legend: { f: 'ground', w: 'wall', g: 'grass' },
  portals: [], dummies: [], actionZones: [], tiles: [], collisionMask: []
});

onMounted(async () => { await loadMapList(); });

async function loadMapList() {
  try {
    const res = await fetch(`${API_BASE_URL}/maps`, { headers: authHeaders() });
    mapList.value = (await res.json()).data || [];
  } catch (e) { status.value = '加载地图列表失败: ' + e.message; }
}

async function loadSelectedMap() {
  if (!selectedMapId.value) return;
  try {
    const res = await fetch(`${API_BASE_URL}/maps/${selectedMapId.value}`, { headers: authHeaders() });
    const data = (await res.json()).data;
    Object.assign(mapConfig, normalizeMap(data));
    dirty.value = false; pickMode.value = null;
    await nextTick(); renderGrid();
    status.value = `已加载: ${mapConfig.name}`;
  } catch (e) { status.value = '加载失败: ' + e.message; }
}

async function saveMap() {
  saving.value = true;
  try {
    const res = await fetch(`${API_BASE_URL.replace('/api', '')}/api/admin/maps`, {
      method: 'POST',
      headers: { ...authHeaders(), 'Content-Type': 'application/json' },
      body: JSON.stringify(JSON.parse(JSON.stringify(mapConfig)))
    });
    const data = await res.json();
    if (data.code === 0) { dirty.value = false; status.value = `已保存: ${mapConfig.name}`; await loadMapList(); }
    else { status.value = '保存失败: ' + data.message; }
  } catch (e) { status.value = '保存失败: ' + e.message; }
  finally { saving.value = false; }
}

function createNewMap() {
  const id = 'new_map_' + Date.now();
  Object.assign(mapConfig, blankMap(id));
  selectedMapId.value = id; dirty.value = true; pickMode.value = null;
  nextTick(() => renderGrid());
  status.value = '已创建新地图';
}

function importJson(e) {
  const file = e.target.files?.[0];
  if (!file) return;
  const reader = new FileReader();
  reader.onload = () => {
    Object.assign(mapConfig, normalizeMap(JSON.parse(reader.result)));
    selectedMapId.value = mapConfig.mapId; dirty.value = true; pickMode.value = null;
    nextTick(() => renderGrid());
    status.value = `已导入: ${mapConfig.name}`;
  };
  reader.readAsText(file); e.target.value = '';
}

function exportJson() {
  const blob = new Blob([JSON.stringify(JSON.parse(JSON.stringify(mapConfig)), null, 2)], { type: 'application/json' });
  const a = document.createElement('a');
  a.href = URL.createObjectURL(blob); a.download = `${mapConfig.mapId}.json`; a.click();
}

// ---- 画布 ----
function renderGrid() {
  const canvas = canvasEl.value;
  if (!canvas) return;
  const w = mapConfig.grid.width, h = mapConfig.grid.height;
  const metrics = getCanvasMetrics();
  canvas.width = metrics.canvasWidth;
  canvas.height = metrics.canvasHeight;
  const ctx = canvas.getContext('2d');
  ensureBackgroundImage();

  if (mapConfig.renderMode === 'blueprint') {
    if (backgroundImage && backgroundImage.complete && backgroundImage.naturalWidth > 0) {
      ctx.drawImage(backgroundImage, 0, 0, canvas.width, canvas.height);
    } else {
      ctx.fillStyle = mapConfig.background?.fallbackColor || '#7aa56d';
      ctx.fillRect(0, 0, canvas.width, canvas.height);
    }
  } else {
    ctx.fillStyle = '#202636';
    ctx.fillRect(0, 0, canvas.width, canvas.height);
  }

  for (let y = 0; y < h; y++) {
    for (let x = 0; x < w; x++) {
      const rect = getCellRect(x, y, metrics);
      const code = mapConfig.tiles[y]?.[x] || 'g';
      const t = tileTypes.find(p => p.code === code) || tileTypes[0];
      const blocked = Number(mapConfig.collisionMask?.[y]?.[x]) === 1;

      if (mapConfig.renderMode !== 'blueprint') {
        ctx.fillStyle = t.color;
        ctx.fillRect(rect.x, rect.y, rect.w, rect.h);
      }

      if (activeLayer.value === 'collision') {
        ctx.fillStyle = blocked ? 'rgba(233,69,96,0.34)' : 'rgba(78,203,113,0.22)';
        ctx.fillRect(rect.x + 2, rect.y + 2, rect.w - 4, rect.h - 4);
      } else if (blocked) {
        ctx.fillStyle = 'rgba(233,69,96,0.18)';
        ctx.fillRect(rect.x + 2, rect.y + 2, rect.w - 4, rect.h - 4);
      }

      ctx.strokeStyle = mapConfig.renderMode === 'blueprint' ? 'rgba(255,255,255,0.16)' : 'rgba(0,0,0,0.08)';
      ctx.strokeRect(rect.x, rect.y, rect.w, rect.h);
    }
  }

  // 行为区标记
  for (const zone of mapConfig.actionZones || []) {
    const colors = { study: 'rgba(240,192,64,0.35)', work: 'rgba(78,203,113,0.35)', mining: 'rgba(192,192,192,0.35)', woodcut: 'rgba(240,144,64,0.35)', fishing: 'rgba(64,160,240,0.35)' };
    ctx.fillStyle = colors[zone.actionType] || 'rgba(255,255,255,0.2)';
    for (const [tx, ty] of zone.tiles || []) {
      const rect = getCellRect(tx, ty, metrics);
      ctx.fillRect(rect.x + 2, rect.y + 2, rect.w - 4, rect.h - 4);
    }
  }

  // 传送点
  ctx.fillStyle = 'rgba(210,109,61,0.5)';
  for (const p of mapConfig.portals) {
    const rect = getCellRect(p.x, p.y, metrics);
    ctx.fillRect(rect.x + 2, rect.y + 2, rect.w - 4, rect.h - 4);
  }

  // 假人
  for (const d of mapConfig.dummies) {
    const rect = getCellRect(d.spawnX, d.spawnY, metrics);
    const cx = rect.x + rect.w / 2, cy = rect.y + rect.h / 2;
    ctx.fillStyle = d.bodyColor || '#6ea4bf';
    ctx.beginPath(); ctx.arc(cx, cy, 5, 0, Math.PI * 2); ctx.fill();
  }

  // 出生点
  const spawnRect = getCellRect(mapConfig.player.spawnX, mapConfig.player.spawnY, metrics);
  const sx = spawnRect.x + spawnRect.w / 2, sy = spawnRect.y + spawnRect.h / 2;
  ctx.fillStyle = '#1e88e5';
  ctx.beginPath(); ctx.arc(sx, sy, 6, 0, Math.PI * 2); ctx.fill();
  ctx.fillStyle = '#fff'; ctx.font = 'bold 8px sans-serif'; ctx.textAlign = 'center'; ctx.textBaseline = 'middle';
  ctx.fillText('S', sx, sy);
}

function resizeGrid() {
  const w = mapConfig.grid.width, h = mapConfig.grid.height;
  while (mapConfig.tiles.length < h) mapConfig.tiles.push([]);
  mapConfig.tiles.length = h;
  for (let y = 0; y < h; y++) {
    while (mapConfig.tiles[y].length < w) mapConfig.tiles[y].push('f');
    mapConfig.tiles[y].length = w;
  }
  resizeCollisionMask(mapConfig);
  dirty.value = true;
  nextTick(() => renderGrid());
}

// ---- 点选模式 ----
function setActiveLayer(layer) {
  activeLayer.value = layer;
  renderGrid();
}
function setBrush(code) { pickMode.value = null; brush.value = code; }
function setCollisionBrush(value) { pickMode.value = null; collisionBrush.value = value; }
function startPick(kind, label, index) { pickMode.value = { kind, label, index }; status.value = `请在画布上点击 ${label}`; }
function clearPick() { pickMode.value = null; status.value = '已取消点选'; }

// ---- 鼠标 ----
function cellFromEvent(e) {
  const canvas = canvasEl.value;
  if (!canvas) return null;
  const rect = canvas.getBoundingClientRect();
  const metrics = getCanvasMetrics();
  const sx = canvas.width / rect.width, sy = canvas.height / rect.height;
  const px = (e.clientX - rect.left) * sx;
  const py = (e.clientY - rect.top) * sy;
  const x = Math.floor((px - metrics.offsetX) / metrics.cellWidth);
  const y = Math.floor((py - metrics.offsetY) / metrics.cellHeight);
  if (x < 0 || y < 0 || x >= mapConfig.grid.width || y >= mapConfig.grid.height) return null;
  return { x, y };
}

function applyPick(cell) {
  const pm = pickMode.value;
  if (!pm || !cell) return;
  if (pm.kind === 'spawn') {
    mapConfig.player.spawnX = cell.x; mapConfig.player.spawnY = cell.y;
    status.value = `出生点已设置为 (${cell.x}, ${cell.y})`;
  } else if (pm.kind === 'portal' && pm.index !== undefined) {
    mapConfig.portals[pm.index].x = cell.x; mapConfig.portals[pm.index].y = cell.y;
    status.value = `传送点入口已设置为 (${cell.x}, ${cell.y})`;
  } else if (pm.kind === 'dummy' && pm.index !== undefined) {
    mapConfig.dummies[pm.index].spawnX = cell.x; mapConfig.dummies[pm.index].spawnY = cell.y;
    status.value = `假人站位已设置为 (${cell.x}, ${cell.y})`;
  } else if (pm.kind === 'zone' && pm.index !== undefined) {
    const zone = mapConfig.actionZones[pm.index];
    const key = `${cell.x},${cell.y}`;
    const exists = zone.tiles.findIndex(([tx, ty]) => tx === cell.x && ty === cell.y);
    if (exists >= 0) {
      zone.tiles.splice(exists, 1);
      status.value = `已移除格子 (${cell.x}, ${cell.y})`;
    } else {
      zone.tiles.push([cell.x, cell.y]);
      status.value = `已添加格子 (${cell.x}, ${cell.y})`;
    }
  }
  dirty.value = true; renderGrid();
}

function onMouseDown(e) {
  if (pickMode.value) { applyPick(cellFromEvent(e)); return; }
  painting = true;
  const cell = cellFromEvent(e);
  if (cell) { applyActiveBrush(cell); }
}
function onMouseMove(e) {
  if (pickMode.value) return;
  if (!painting) return;
  const cell = cellFromEvent(e);
  if (cell) { applyActiveBrush(cell); }
}
function onMouseUp() { painting = false; }

// ---- 传送点/假人/行为区 CRUD ----
function addPortal() { mapConfig.portals.push({ id: 'portal_' + (mapConfig.portals.length + 1), x: 0, y: 0, targetMapId: mapConfig.mapId, targetX: 0, targetY: 0 }); dirty.value = true; }
function removePortal(i) { mapConfig.portals.splice(i, 1); dirty.value = true; }
function addDummy() { mapConfig.dummies.push({ actorId: 'dummy_' + (mapConfig.dummies.length + 1), nickname: '居民' + (mapConfig.dummies.length + 1), spawnX: 0, spawnY: 0, behavior: 'idle', patrolLoop: [], bodyColor: '#6ea4bf', hairColor: '#2f4858' }); dirty.value = true; }
function removeDummy(i) { mapConfig.dummies.splice(i, 1); dirty.value = true; }
function addZone() { mapConfig.actionZones.push({ id: 'zone_' + (mapConfig.actionZones.length + 1), label: '新区域', actionType: 'study', tiles: [] }); dirty.value = true; }
function removeZone(i) { mapConfig.actionZones.splice(i, 1); dirty.value = true; }

// ---- 工具 ----
function authHeaders() {
  const token = localStorage.getItem('token');
  return token ? { Authorization: `Bearer ${token}` } : {};
}

function normalizeMap(raw) {
  raw.renderMode ??= 'isometric';
  raw.background ??= { image: '', width: 0, height: 0, showGrid: false, showBlockedMask: false, fallbackColor: '#7aa56d' };
  raw.grid ??= { width: 16, height: 16, tileWidth: 96, tileHeight: 48, blockHeight: 54, originOffsetX: 120, originOffsetY: 120 };
  raw.grid.width ||= 16; raw.grid.height ||= 16;
  raw.player ??= { spawnX: 8, spawnY: 8, moveSpeedTilesPerSecond: 5 };
  raw.legend ??= { f: 'ground', w: 'wall', g: 'grass' };
  raw.portals ??= []; raw.dummies ??= []; raw.actionZones ??= [];
  raw.tiles ??= Array.from({ length: raw.grid.height }, () => Array(raw.grid.width).fill('f'));
  raw.tiles = normalizeTileGrid(raw);
  raw.legend = { f: 'ground', w: 'wall', g: 'grass' };
  resizeTiles(raw);
  raw.collisionMask = buildEditableCollisionMask(raw);
  return raw;
}

function resizeTiles(cfg) {
  while (cfg.tiles.length < cfg.grid.height) cfg.tiles.push([]);
  cfg.tiles.length = cfg.grid.height;
  for (let y = 0; y < cfg.grid.height; y++) {
    while (cfg.tiles[y].length < cfg.grid.width) cfg.tiles[y].push('f');
    cfg.tiles[y].length = cfg.grid.width;
  }
}

function blankMap(mapId) {
  return normalizeMap({ mapId, name: '新地图',
    grid: { width: 16, height: 16, tileWidth: 96, tileHeight: 48, blockHeight: 54, originOffsetX: 120, originOffsetY: 120 },
    player: { spawnX: 8, spawnY: 8, moveSpeedTilesPerSecond: 5 }, tiles: [] });
}

function normalizeTileGrid(cfg) {
  const legend = cfg.legend ?? {};
  return (cfg.tiles ?? []).map((row) => row.map((code) => normalizeTileCode(code, legend)));
}

function normalizeTileCode(code, legend) {
  const semantic = normalizeSemanticTileType(legend[code] ?? code);
  if (semantic === 'wall') return 'w';
  if (semantic === 'grass') return 'g';
  return 'f';
}

function normalizeSemanticTileType(type) {
  const value = String(type ?? '').toLowerCase();
  if (value === 'wall' || value === 'building' || value === 'door') return 'wall';
  if (value === 'grass') return 'grass';
  return 'ground';
}

function buildEditableCollisionMask(cfg) {
  const rawMask = cfg.collisionMask;
  if (!rawMask) {
    return cfg.tiles.map((row) => row.map((code) => (WALKABLE_TILE_CODES.has(code) ? 0 : 1)));
  }

  return Array.from({ length: cfg.grid.height }, (_, y) => {
    const row = rawMask[y];
    if (typeof row === 'string') {
      return row
        .slice(0, cfg.grid.width)
        .padEnd(cfg.grid.width, '1')
        .split('')
        .map((cell) => (cell === '0' ? 0 : 1));
    }
    return Array.from({ length: cfg.grid.width }, (_, x) => (Number(row?.[x]) === 0 ? 0 : 1));
  });
}

function resizeCollisionMask(cfg) {
  cfg.collisionMask ??= [];
  while (cfg.collisionMask.length < cfg.grid.height) cfg.collisionMask.push([]);
  cfg.collisionMask.length = cfg.grid.height;
  for (let y = 0; y < cfg.grid.height; y++) {
    while (cfg.collisionMask[y].length < cfg.grid.width) {
      const code = cfg.tiles[y]?.[cfg.collisionMask[y].length] ?? 'g';
      cfg.collisionMask[y].push(WALKABLE_TILE_CODES.has(code) ? 0 : 1);
    }
    cfg.collisionMask[y].length = cfg.grid.width;
  }
}

function applyActiveBrush(cell) {
  if (activeLayer.value === 'collision') {
    mapConfig.collisionMask[cell.y][cell.x] = collisionBrush.value;
    status.value = collisionBrush.value === 1
      ? `碰撞已设为阻挡 (${cell.x}, ${cell.y})`
      : `碰撞已设为可走 (${cell.x}, ${cell.y})`;
  } else {
    mapConfig.tiles[cell.y][cell.x] = brush.value;
    status.value = `地块已刷为 ${brush.value} (${cell.x}, ${cell.y})`;
  }
  dirty.value = true;
  renderGrid();
}

function rebuildCollisionFromTiles() {
  mapConfig.collisionMask = mapConfig.tiles.map((row) => row.map((code) => (WALKABLE_TILE_CODES.has(code) ? 0 : 1)));
  dirty.value = true;
  renderGrid();
  status.value = '已按当前地块重建碰撞层';
}

function fillCollision(value) {
  mapConfig.collisionMask = Array.from({ length: mapConfig.grid.height }, () =>
    Array.from({ length: mapConfig.grid.width }, () => value)
  );
  dirty.value = true;
  renderGrid();
  status.value = value === 1 ? '已全部设为阻挡' : '已全部设为可走';
}

function handleVisualConfigChange() {
  dirty.value = true;
  nextTick(() => renderGrid());
}

function getCanvasMetrics() {
  if (mapConfig.renderMode === 'blueprint') {
    return {
      cellWidth: mapConfig.grid.tileWidth,
      cellHeight: mapConfig.grid.tileHeight,
      offsetX: mapConfig.grid.originOffsetX || 0,
      offsetY: mapConfig.grid.originOffsetY || 0,
      canvasWidth: mapConfig.background?.width || (mapConfig.grid.width * mapConfig.grid.tileWidth + (mapConfig.grid.originOffsetX || 0) * 2),
      canvasHeight: mapConfig.background?.height || (mapConfig.grid.height * mapConfig.grid.tileHeight + (mapConfig.grid.originOffsetY || 0) * 2)
    };
  }

  return {
    cellWidth: CELL,
    cellHeight: CELL,
    offsetX: 0,
    offsetY: 0,
    canvasWidth: mapConfig.grid.width * CELL,
    canvasHeight: mapConfig.grid.height * CELL
  };
}

function getCellRect(x, y, metrics) {
  return {
    x: metrics.offsetX + x * metrics.cellWidth,
    y: metrics.offsetY + y * metrics.cellHeight,
    w: metrics.cellWidth,
    h: metrics.cellHeight
  };
}

function ensureBackgroundImage() {
  if (mapConfig.renderMode !== 'blueprint' || !mapConfig.background?.image) {
    backgroundImage = null;
    backgroundImageSrc = '';
    return;
  }
  if (backgroundImage && backgroundImageSrc === mapConfig.background.image) return;
  backgroundImageSrc = mapConfig.background.image;
  backgroundImage = new Image();
  backgroundImage.onload = () => renderGrid();
  backgroundImage.src = backgroundImageSrc;
}
</script>

<style scoped>
.editor-page { width: 100vw; height: 100vh; display: flex; flex-direction: column; background: #1a1a2e; color: #e0e0e0; }
.editor-header { display: flex; align-items: center; gap: 12px; padding: 8px 16px; background: rgba(0,0,0,0.3); border-bottom: 1px solid rgba(255,255,255,0.06); flex-shrink: 0; }
.editor-header h1 { font-size: 16px; color: #e94560; margin-right: 8px; }
.header-actions { display: flex; align-items: center; gap: 8px; flex-wrap: wrap; }
.header-actions select { height: 30px; background: rgba(255,255,255,0.06); color: #fff; border: 1px solid rgba(255,255,255,0.1); border-radius: 4px; padding: 0 8px; }
.header-actions button, .btn-upload { height: 30px; padding: 0 12px; font-size: 12px; color: #fff; background: rgba(255,255,255,0.08); border: 1px solid rgba(255,255,255,0.1); border-radius: 4px; cursor: pointer; }
.header-actions button:hover { background: rgba(255,255,255,0.14); }
.btn-back { color: rgba(255,255,255,0.5); text-decoration: none; font-size: 12px; }
.btn-back:hover { color: #e94560; }

.editor-body { flex: 1; display: flex; overflow: hidden; }
.canvas-section { flex: 1; display: flex; flex-direction: column; padding: 8px; overflow: hidden; }
.toolbar { display: flex; align-items: center; gap: 6px; margin-bottom: 8px; flex-shrink: 0; flex-wrap: wrap; }
.tool-label { font-size: 12px; color: rgba(255,255,255,0.5); }
.brush-btn { display: flex; align-items: center; gap: 4px; height: 26px; padding: 0 8px; font-size: 11px; color: rgba(255,255,255,0.6); background: rgba(255,255,255,0.04); border: 2px solid transparent; border-radius: 4px; cursor: pointer; }
.brush-btn:hover { color: #fff; }
.brush-btn.active { color: #fff; background: rgba(255,255,255,0.12); }
.brush-dot { width: 10px; height: 10px; border-radius: 2px; flex-shrink: 0; }
.pick-badge { font-size: 11px; color: #f0c040; display: flex; align-items: center; gap: 4px; margin-left: 8px; }
.canvas-wrap { flex: 1; overflow: auto; background: rgba(0,0,0,0.2); border-radius: 4px; }
.canvas-wrap canvas { display: block; }
.editor-status { font-size: 11px; color: rgba(255,255,255,0.4); padding: 4px 0; flex-shrink: 0; }

.props-panel { width: 320px; overflow-y: auto; padding: 12px; background: rgba(0,0,0,0.15); border-left: 1px solid rgba(255,255,255,0.06); }
.prop-group { margin-bottom: 14px; padding-bottom: 10px; border-bottom: 1px solid rgba(255,255,255,0.05); }
.prop-group h3 { font-size: 12px; color: rgba(255,255,255,0.5); margin-bottom: 6px; display: flex; align-items: center; gap: 8px; }
.prop-group label { display: block; font-size: 11px; color: rgba(255,255,255,0.5); margin-bottom: 4px; }
.prop-group input, .prop-group select { width: 100%; height: 26px; padding: 0 6px; margin-top: 2px; font-size: 12px; color: #fff; background: rgba(255,255,255,0.06); border: 1px solid rgba(255,255,255,0.1); border-radius: 4px; outline: none; }
.prop-group input[type=number] { width: 80px; display: inline; margin-right: 4px; }
.mini-actions { display: flex; gap: 6px; flex-wrap: wrap; margin-bottom: 8px; }
.prop-hint { font-size: 11px; color: rgba(255,255,255,0.36); line-height: 1.5; }

.item-row { display: flex; align-items: center; gap: 4px; flex-wrap: wrap; margin-bottom: 4px; padding: 4px; background: rgba(255,255,255,0.03); border-radius: 4px; font-size: 10px; }
.item-row input, .item-row select { width: auto !important; height: 22px; font-size: 10px; margin-top: 0 !important; }
.zone-tiles-hint { font-size: 10px; color: rgba(255,255,255,0.3); min-width: 24px; text-align: center; }

.btn-sm { height: 22px; padding: 0 6px; font-size: 10px; color: #fff; background: rgba(255,255,255,0.1); border: none; border-radius: 3px; cursor: pointer; white-space: nowrap; }
.btn-sm:hover { background: rgba(255,255,255,0.2); }
.btn-del { background: rgba(233,69,96,0.3); }
.btn-del:hover { background: rgba(233,69,96,0.6); }
</style>
