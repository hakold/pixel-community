<template>
  <div class="game-page">
    <!-- ===== 顶部导航 ===== -->
    <header class="game-header">
      <h1 class="game-logo">像素社区</h1>
      <span class="room-name" v-if="currentRoom">{{ currentRoom }}</span>
      <div class="header-right">
        <span class="player-name">{{ userStore.player?.characterName }}</span>
        <span class="level-badge">Lv.{{ userStore.player?.level }}</span>
        <button class="btn-logout" @click="handleLogout">退出</button>
      </div>
    </header>

    <!-- ===== 中部：左面板 + 地图 ===== -->
    <div class="game-body">
      <!-- 左侧面板 -->
      <aside class="left-panel">
        <!-- 角色信息 -->
        <div class="panel-block">
          <h3>角色信息</h3>
          <div class="info-grid">
            <div class="info-item"><span class="label">角色名</span><span class="value">{{ userStore.player?.characterName }}</span></div>
            <div class="info-item"><span class="label">等级</span><span class="value">Lv.{{ userStore.player?.level }}</span></div>
            <div class="info-item">
              <span class="label">经验</span>
              <span class="value">{{ userStore.player?.exp }}</span>
            </div>
            <div class="info-item"><span class="label">金币</span><span class="value">{{ userStore.player?.currency?.gold }}</span></div>
            <div class="info-item"><span class="label">点券</span><span class="value">{{ userStore.player?.currency?.coupon }}</span></div>
          </div>
        </div>

        <!-- 生活属性 -->
        <div class="panel-block">
          <h3>生活属性</h3>
          <div class="attr-list">
            <div class="attr-bar">
              <span class="attr-label">精力</span>
              <div class="bar-track"><div class="bar-fill energy" :style="{ width: attr('energy') + '%' }"></div></div>
              <span class="attr-val">{{ attr('energy') }}</span>
            </div>
            <div class="attr-bar">
              <span class="attr-label">心情</span>
              <div class="bar-track"><div class="bar-fill mood" :style="{ width: attr('mood') + '%' }"></div></div>
              <span class="attr-val">{{ attr('mood') }}</span>
            </div>
            <div class="attr-bar">
              <span class="attr-label">饥饿</span>
              <div class="bar-track"><div class="bar-fill hunger" :style="{ width: attr('hunger') + '%' }"></div></div>
              <span class="attr-val">{{ attr('hunger') }}</span>
            </div>
            <div class="attr-bar">
              <span class="attr-label">健康</span>
              <div class="bar-track"><div class="bar-fill health" :style="{ width: attr('health') + '%' }"></div></div>
              <span class="attr-val">{{ attr('health') }}</span>
            </div>
            <div class="attr-bar">
              <span class="attr-label">清洁</span>
              <div class="bar-track"><div class="bar-fill clean" :style="{ width: attr('clean') + '%' }"></div></div>
              <span class="attr-val">{{ attr('clean') }}</span>
            </div>
          </div>
        </div>

        <!-- 三维属性 -->
        <div class="panel-block">
          <h3>三维属性</h3>
          <div class="info-grid">
            <div class="info-item"><span class="label">武力</span><span class="value">{{ attr('strength') }}</span></div>
            <div class="info-item"><span class="label">智力</span><span class="value">{{ attr('intelligence') }}</span></div>
            <div class="info-item"><span class="label">魅力</span><span class="value">{{ attr('charm') }}</span></div>
          </div>
        </div>

        <!-- 战斗属性 -->
        <div class="panel-block">
          <h3>战斗属性</h3>
          <div class="info-grid">
            <div class="info-item"><span class="label">攻击</span><span class="value">{{ userStore.player?.battleAttributes?.attack }}</span></div>
            <div class="info-item"><span class="label">防御</span><span class="value">{{ userStore.player?.battleAttributes?.defense }}</span></div>
            <div class="info-item"><span class="label">速度</span><span class="value">{{ userStore.player?.battleAttributes?.speed }}</span></div>
            <div class="info-item"><span class="label">生命</span><span class="value">{{ userStore.player?.battleAttributes?.hp }} / {{ userStore.player?.battleAttributes?.maxHp }}</span></div>
          </div>
        </div>

      </aside>

      <!-- 中间地图 -->
      <section class="map-area">
        <GameCanvas ref="gameCanvasRef" @status-change="onMapStatus" @action-zone="onActionZone" @chat="onChatMessage" />
        <div class="map-status" v-if="mapStatus">
          <span class="map-name">{{ mapStatus.mapName }}</span>
          <span class="map-coords">{{ mapStatus.playerPosition }}</span>
          <span class="map-path">{{ mapStatus.pathInfo }}</span>
        </div>
        <ActionPopup :zone="activeZone" @start="onActionStarted" />
      </section>

      <!-- 右侧聊天室 -->
      <aside class="right-panel">
        <div class="chat-panel">
          <div class="panel-head">
            <h3>聊天室</h3>
            <span class="panel-tip">{{ currentRoom || '未进入房间' }}</span>
          </div>
          <div class="chat-messages" ref="chatBox">
            <div v-for="(m, i) in chatMessages" :key="i" class="chat-msg">
              <span class="chat-sender" :class="{ me: m.me }">{{ m.me ? '你' : m.characterName }}</span>
              <span class="chat-text">{{ m.message }}</span>
            </div>
            <p v-if="!chatMessages.length" class="chat-placeholder">还没有消息，来说点什么吧</p>
          </div>
          <form class="chat-input-row" @submit.prevent="sendChatMessage">
            <input
              class="chat-input"
              v-model="chatInput"
              type="text"
              placeholder="说点什么..."
              maxlength="200"
            />
            <button class="chat-send" type="submit" :disabled="!chatInput.trim()">发送</button>
          </form>
        </div>
      </aside>
    </div>

    <!-- ===== 底部挂机状态条 ===== -->
    <footer class="status-bar" :class="[actionThemeClass, actionVariantClass]">
      <div class="status-strip">
        <div class="status-strip-head">
          <div class="status-copy">
            <span class="status-kicker">挂机场景</span>
            <strong class="status-name">{{ actionSceneLabel }}</strong>
            <span class="status-desc">{{ actionStatusText }}</span>
          </div>
          <div class="status-meta">
            <span class="status-percent">{{ actionProgressPercent }}%</span>
            <span class="status-timer">{{ actionTimerText }}</span>
          </div>
        </div>

        <div class="status-stage">
          <div class="status-stage-bg">
            <div class="status-stage-pattern"></div>
            <div class="status-scenery">
              <span class="scenery-prop prop-a"></span>
              <span class="scenery-prop prop-b"></span>
              <span class="scenery-prop prop-c"></span>
            </div>
            <div class="status-ground">
              <span class="ground-strip strip-a"></span>
              <span class="ground-strip strip-b"></span>
              <span class="ground-strip strip-c"></span>
            </div>
            <div class="status-finish-marker">
              <span class="finish-pole"></span>
              <span class="finish-flag"></span>
              <span class="finish-base"></span>
            </div>
          </div>
          <div class="status-track">
            <div class="status-track-fill" :style="{ width: `${actionProgressPercent}%` }"></div>
            <div class="status-track-label start">0%</div>
            <div class="status-track-label end">100%</div>
            <div class="status-actor" :class="[actionPhaseClass, actionPoseClass]" :style="{ left: `${actionProgressPercent}%` }">
              <div class="status-actor-shadow"></div>
              <div class="status-actor-sprite">
                <span class="actor-head"></span>
                <span class="actor-arm arm-a"></span>
                <span class="actor-arm arm-b"></span>
                <span class="actor-body"></span>
                <span class="actor-leg leg-a"></span>
                <span class="actor-leg leg-b"></span>
              </div>
            </div>
          </div>
        </div>

        <div class="status-strip-foot">
          <span class="status-hint">{{ actionSceneHint }}</span>
          <div class="status-actions" v-if="actionStore.hasTask">
            <button
              v-if="actionReadyToCollect"
              class="status-btn collect"
              :disabled="actionStore.loading"
              @click="handleCollect"
            >领取奖励</button>
            <button
              v-else
              class="status-btn cancel"
              :disabled="actionStore.loading"
              @click="handleCancel"
            >取消挂机</button>
          </div>
        </div>
      </div>
    </footer>

    <!-- ===== 奖励结算弹窗 ===== -->
    <div v-if="actionStore.collectResult" class="reward-overlay" @click.self="actionStore.clearCollectResult()">
      <div class="reward-modal">
        <h2>结算完成</h2>
        <p class="reward-title">{{ actionStore.collectResult.actionName }}</p>
        <div class="reward-details">
          <div class="reward-row" v-if="actionStore.collectResult.rewards.expGained">
            <span class="rw-label">经验</span><span class="rw-value exp">+{{ actionStore.collectResult.rewards.expGained }}</span>
          </div>
          <div class="reward-row" v-if="actionStore.collectResult.rewards.goldGained">
            <span class="rw-label">金币</span><span class="rw-value gold">+{{ actionStore.collectResult.rewards.goldGained }}</span>
          </div>
          <div class="reward-row" v-for="(val, key) in actionStore.collectResult.rewards.attrGains" :key="key">
            <span class="rw-label">{{ attrName(key) }}</span><span class="rw-value attr">+{{ val }}</span>
          </div>
          <div class="reward-row" v-for="item in actionStore.collectResult.rewards.itemsGained" :key="item.itemId">
            <span class="rw-label">物品</span><span class="rw-value item">{{ item.itemId }} x{{ item.count }}</span>
          </div>
          <div class="reward-row" v-if="actionStore.collectResult.rewards.leveledUp">
            <span class="rw-label">升级</span><span class="rw-value lvlup">Lv.{{ actionStore.collectResult.rewards.newLevel }}</span>
          </div>
        </div>
        <div class="reward-mood">
          心情: {{ actionStore.collectResult.moodLevel }} (x{{ actionStore.collectResult.moodMultiplier }})
        </div>
        <button class="btn-confirm" @click="actionStore.clearCollectResult()">确定</button>
      </div>
    </div>
  </div>
</template>

<script setup>
import { computed, ref, onMounted, onUnmounted } from 'vue';
import { useRouter } from 'vue-router';
import { useUserStore } from '@/stores/user';
import { useActionStore } from '@/stores/action';
import GameCanvas from '@/components/GameCanvas.vue';
import ActionPopup from '@/components/ActionPopup.vue';

const router = useRouter();
const userStore = useUserStore();
const actionStore = useActionStore();

const currentRoom = ref('');
const mapStatus = ref(null);
const activeZone = ref(null);
let zoneSuppressed = false;

// 聊天
const gameCanvasRef = ref(null);
const chatMessages = ref([]);
const chatInput = ref('');
const chatBox = ref(null);

// ========== 本地帧进度（前端表现层） ==========
const localProgress = ref(0);
const localRemaining = ref(0);
const syncedMilestones = ref(new Set());
const currentPoseVariant = ref('idle');
const currentProgressRange = ref(-1); // -1=idle, 0=0-30%, 1=31-60%, 2=61-100%
let rafId = null;

// 每种行为的预设动画池：{ [actionType]: { 0: [v1,v2,v3], 1: [v1,v2,v3], 2: [v1,v2,v3] } }
const poseVariants = {
  study: {
    0: ['read-1', 'read-2', 'read-3'],
    1: ['write-1', 'write-2', 'write-3'],
    2: ['review-1', 'review-2', 'review-3'],
  },
  mining: {
    0: ['swing-1', 'swing-2', 'swing-3'],
    1: ['dig-1', 'dig-2', 'dig-3'],
    2: ['inspect-1', 'inspect-2', 'inspect-3'],
  },
  woodcut: {
    0: ['chop-1', 'chop-2', 'chop-3'],
    1: ['saw-1', 'saw-2', 'saw-3'],
    2: ['lift-1', 'lift-2', 'lift-3'],
  },
  fishing: {
    0: ['cast-1', 'cast-2', 'cast-3'],
    1: ['wait-1', 'wait-2', 'wait-3'],
    2: ['pull-1', 'pull-2', 'pull-3'],
  },
  work: {
    0: ['operate-1', 'operate-2', 'operate-3'],
    1: ['build-1', 'build-2', 'build-3'],
    2: ['carry-1', 'carry-2', 'carry-3'],
  },
};

function pickRandomVariant(actionType, range) {
  const pool = poseVariants[actionType]?.[range];
  if (!pool || !pool.length) return 'idle';
  return pool[Math.floor(Math.random() * pool.length)];
}

function getProgressRange(pct) {
  if (pct < 30) return 0;
  if (pct < 60) return 1;
  return 2;
}

function updatePoseVariant(progress) {
  const pct = progress * 100;
  const range = getProgressRange(pct);

  if (range !== currentProgressRange.value) {
    currentProgressRange.value = range;
    const actionType = actionStore.task?.actionType;
    currentPoseVariant.value = pickRandomVariant(actionType, range);
  }
}

function resetPoseVariant() {
  currentPoseVariant.value = 'idle';
  currentProgressRange.value = -1;
}

function deriveLocalProgress() {
  const task = actionStore.task;
  if (!task || !task.startTime || !task.duration) return 0;
  const startMs = new Date(task.startTime).getTime();
  const durationMs = task.duration * 1000;
  const elapsed = Date.now() - startMs;
  return Math.max(0, Math.min(1, elapsed / durationMs));
}

function tick() {
  if (!actionStore.hasTask) {
    localProgress.value = 0;
    localRemaining.value = 0;
    syncedMilestones.value = new Set();
    resetPoseVariant();
    rafId = requestAnimationFrame(tick);
    return;
  }

  const progress = deriveLocalProgress();
  localProgress.value = progress;
  updatePoseVariant(progress);

  const task = actionStore.task;
  const remaining = task
    ? Math.max(0, Math.ceil(task.duration - (Date.now() - new Date(task.startTime).getTime()) / 1000))
    : 0;
  localRemaining.value = remaining;

  // 里程碑同步：25%, 50%, 75%, 100%
  const milestones = [0.25, 0.5, 0.75, 1.0];
  for (const m of milestones) {
    if (progress >= m && !syncedMilestones.value.has(m)) {
      syncedMilestones.value.add(m);
      actionStore.fetchTaskStatus();
      break;
    }
  }

  rafId = requestAnimationFrame(tick);
}

function startLocalProgress() {
  stopLocalProgress();
  syncedMilestones.value = new Set();
  resetPoseVariant();
  rafId = requestAnimationFrame(tick);
}

function stopLocalProgress() {
  if (rafId) {
    cancelAnimationFrame(rafId);
    rafId = null;
  }
}

// 页面重新获得焦点时同步
function handleVisibilityChange() {
  if (document.visibilityState === 'visible' && actionStore.hasTask) {
    actionStore.fetchTaskStatus();
  }
}

// ========== 计算属性 ==========
const actionProgressPercent = computed(() => {
  const p = actionStore.hasTask ? localProgress.value : (actionStore.progress || 0);
  return Math.max(0, Math.min(100, Math.round(p * 100)));
});
const actionPhase = computed(() => {
  if (!actionStore.hasTask) return 'idle';
  if (localProgress.value >= 1 || actionStore.isComplete) return 'complete';
  return 'running';
});
const actionPhaseClass = computed(() => `is-${actionPhase.value}`);
const actionThemeClass = computed(() => `theme-${actionStore.task?.actionType || 'idle'}`);
const actionVariantClass = computed(() => `variant-${actionStore.task?.actionType || 'idle'}`);
const actionReadyToCollect = computed(() => actionStore.hasTask && (localProgress.value >= 1 || actionStore.isComplete));
const actionPoseClass = computed(() => {
  if (!actionStore.hasTask) return 'pose-idle';
  if (localProgress.value >= 1 || actionStore.isComplete) return 'pose-celebrate';
  const actionType = actionStore.task?.actionType || 'idle';
  return `pose-${actionType}-${currentPoseVariant.value}`;
});
const actionSceneLabel = computed(() => {
  if (!actionStore.hasTask) return '当前空闲';
  return actionStore.task?.actionName || `${typeLabel(actionStore.task?.actionType)}中`;
});
const actionStatusText = computed(() => {
  if (!actionStore.hasTask) return '尚未开始挂机，进入可交互区域后可在这里观看进度演出。';
  if (actionPhase.value === 'complete') return '已完成本轮挂机，角色已到达终点，等待领取奖励。';
  return `${typeLabel(actionStore.task?.actionType)}进行中，角色会随着真实进度持续向右移动。`;
});
const actionTimerText = computed(() => {
  if (!actionStore.hasTask) return '--:--';
  if (actionPhase.value === 'complete') return '可领取';
  return formatClock(localRemaining.value);
});
const actionSceneHint = computed(() => {
  if (!actionStore.hasTask) return activeZone.value ? `当前可触发：${activeZone.value.label}` : '站到玩法格子上后，这里会切换成对应场景背景与动作表现。';
  if (actionPhase.value === 'complete') return '后端已完成结算等待阶段，前端只保留结果前的表演与领取态展示。';
  return `剩余 ${formatTime(localRemaining.value)} · 总时长按 0% 到 100% 统一映射。`;
});

function onChatMessage(msg) {
  // 过滤自己发的消息（服务端已排除广播，此处兜底）
  if (msg.playerId === userStore.playerId) return;
  chatMessages.value.push({
    characterName: msg.characterName,
    message: msg.message,
    me: false
  });
  setTimeout(() => {
    if (chatBox.value) chatBox.value.scrollTop = chatBox.value.scrollHeight;
  }, 50);
}

function sendChatMessage() {
  const text = chatInput.value.trim();
  if (!text) return;
  // 本地显示
  chatMessages.value.push({
    characterName: userStore.player?.characterName || '',
    message: text,
    me: true
  });
  chatInput.value = '';
  // 发送
  gameCanvasRef.value?.sendChat?.(text);
  // 滚动
  setTimeout(() => {
    if (chatBox.value) chatBox.value.scrollTop = chatBox.value.scrollHeight;
  }, 50);
}

function onMapStatus(s) {
  mapStatus.value = s;
  currentRoom.value = s.mapName || '';
}

function onActionZone(zone) {
  if (zoneSuppressed && zone) return;
  if (!zone) zoneSuppressed = false;
  activeZone.value = zone;
}

function onActionStarted() {
  zoneSuppressed = true;
  activeZone.value = null;
  startLocalProgress();
}

// ---------- 生命周期 ----------
onMounted(async () => {
  await actionStore.fetchTaskStatus();
  if (actionStore.hasTask) {
    actionStore.startPolling();
    startLocalProgress();
  }
  document.addEventListener('visibilitychange', handleVisibilityChange);
});

onUnmounted(() => {
  actionStore.stopPolling();
  stopLocalProgress();
  document.removeEventListener('visibilitychange', handleVisibilityChange);
});

// ---------- 工具函数 ----------
function attr(key) {
  return userStore.player?.lifeAttributes?.[key] ?? 0;
}

function handleLogout() {
  userStore.doLogout();
  router.replace('/login');
}

async function handleCollect() {
  try { await actionStore.collectAction(); stopLocalProgress(); } catch { /* store handles */ }
}

async function handleCancel() {
  try { await actionStore.cancelAction(); stopLocalProgress(); } catch { /* store handles */ }
}

function typeLabel(t) {
  const map = { study: '学习', work: '打工', mining: '挖矿', woodcut: '伐木', fishing: '钓鱼' };
  return map[t] || t;
}

function attrName(k) {
  const map = { strength: '武力', intelligence: '智力', charm: '魅力' };
  return map[k] || k;
}

function formatTime(seconds) {
  if (!seconds || seconds <= 0) return '0秒';
  const h = Math.floor(seconds / 3600);
  const m = Math.floor((seconds % 3600) / 60);
  const s = seconds % 60;
  if (h > 0) return `${h}时${m}分`;
  if (m > 0) return s > 0 ? `${m}分${s}秒` : `${m}分`;
  return `${s}秒`;
}

function formatClock(seconds) {
  const safeSeconds = Math.max(0, seconds || 0);
  const m = Math.floor(safeSeconds / 60);
  const s = safeSeconds % 60;
  return `${String(m).padStart(2, '0')}:${String(s).padStart(2, '0')}`;
}
</script>

<style scoped>
/* ===== 整体布局 ===== */
.game-page {
  width: 100vw;
  height: 100vh;
  display: flex;
  flex-direction: column;
  background: linear-gradient(135deg, #16213e 0%, #1a1a2e 50%, #0f3460 100%);
  color: #e0e0e0;
  overflow: hidden;
}

/* ===== 顶部导航 ===== */
.game-header {
  display: flex;
  align-items: center;
  padding: 0 20px;
  height: 48px;
  background: rgba(0, 0, 0, 0.35);
  border-bottom: 1px solid rgba(255, 255, 255, 0.06);
  flex-shrink: 0;
  gap: 16px;
}

.game-logo {
  font-size: 18px;
  color: #e94560;
  letter-spacing: 4px;
}

.room-name {
  font-size: 12px;
  color: rgba(255, 255, 255, 0.4);
  padding: 2px 10px;
  background: rgba(255, 255, 255, 0.05);
  border-radius: 4px;
}

.header-right {
  margin-left: auto;
  display: flex;
  align-items: center;
  gap: 10px;
}

.player-name { font-size: 13px; color: #fff; }

.level-badge {
  font-size: 11px;
  padding: 2px 8px;
  background: rgba(233, 69, 96, 0.15);
  border: 1px solid rgba(233, 69, 96, 0.2);
  border-radius: 8px;
  color: #e94560;
}

.btn-logout {
  padding: 4px 12px;
  font-size: 11px;
  color: rgba(255, 255, 255, 0.5);
  background: rgba(255, 255, 255, 0.06);
  border: 1px solid rgba(255, 255, 255, 0.08);
  border-radius: 4px;
  cursor: pointer;
}
.btn-logout:hover { color: #e94560; border-color: #e94560; }

/* ===== 中部：左面板 + 地图 ===== */
.game-body {
  flex: 1;
  display: flex;
  overflow: hidden;
}

/* ===== 左侧面板 ===== */
.left-panel {
  width: 260px;
  flex-shrink: 0;
  overflow-y: auto;
  padding: 12px;
  display: flex;
  flex-direction: column;
  gap: 10px;
  background: rgba(0, 0, 0, 0.15);
  border-right: 1px solid rgba(255, 255, 255, 0.06);
}

.right-panel {
  width: 280px;
  flex-shrink: 0;
  overflow: hidden;
  padding: 0;
  display: flex;
  border-left: 1px solid rgba(255, 255, 255, 0.06);
}

.panel-block {
  background: rgba(255, 255, 255, 0.04);
  border: 1px solid rgba(255, 255, 255, 0.06);
  border-radius: 8px;
  padding: 12px;
}

.panel-block h3 {
  font-size: 12px;
  color: rgba(255, 255, 255, 0.5);
  margin-bottom: 10px;
  padding-bottom: 6px;
  border-bottom: 1px solid rgba(255, 255, 255, 0.06);
  text-transform: uppercase;
  letter-spacing: 1px;
}

.panel-head {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 8px;
  margin-bottom: 8px;
  padding: 12px 12px 8px;
  border-bottom: 1px solid rgba(255, 255, 255, 0.06);
}

.panel-head h3 {
  margin: 0;
  padding: 0;
  border: none;
}

.panel-tip {
  min-width: 0;
  font-size: 10px;
  color: rgba(255, 255, 255, 0.35);
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
  text-align: right;
}

.info-grid {
  display: flex;
  flex-direction: column;
  gap: 6px;
}

.info-item {
  display: flex;
  justify-content: space-between;
  font-size: 12px;
}

.info-item .label { color: rgba(255, 255, 255, 0.45); }
.info-item .value { color: #e0e0e0; }

/* 属性条 */
.attr-list {
  display: flex;
  flex-direction: column;
  gap: 8px;
}

.attr-bar {
  display: flex;
  align-items: center;
  gap: 8px;
  font-size: 11px;
}

.attr-label {
  width: 28px;
  color: rgba(255, 255, 255, 0.5);
  text-align: right;
  flex-shrink: 0;
}

.bar-track {
  flex: 1;
  height: 10px;
  background: rgba(255, 255, 255, 0.06);
  border-radius: 5px;
  overflow: hidden;
}

.bar-fill {
  height: 100%;
  border-radius: 5px;
  transition: width 0.5s;
}

.bar-fill.energy { background: #f0c040; }
.bar-fill.mood { background: #e94560; }
.bar-fill.hunger { background: #f09040; }
.bar-fill.health { background: #4ecb71; }
.bar-fill.clean { background: #40a0f0; }

.attr-val {
  width: 22px;
  font-size: 11px;
  color: #fff;
  text-align: left;
  flex-shrink: 0;
}

/* ===== 中间地图区 ===== */
.map-area {
  flex: 1;
  position: relative;
  overflow: hidden;
}

.map-status {
  position: absolute;
  bottom: 8px;
  left: 8px;
  right: 8px;
  display: flex;
  gap: 16px;
  padding: 4px 12px;
  font-size: 11px;
  color: rgba(255, 255, 255, 0.7);
  background: rgba(0, 0, 0, 0.55);
  border-radius: 4px;
  pointer-events: none;
  z-index: 10;
}

.map-name {
  color: #f0c040;
  font-weight: bold;
}

.map-coords {
  color: rgba(255, 255, 255, 0.6);
}

.map-path {
  color: rgba(255, 255, 255, 0.4);
  margin-left: auto;
}

/* ===== 右侧聊天室 ===== */
.chat-panel {
  width: 100%;
  display: flex;
  flex-direction: column;
  min-height: 0;
  padding: 0;
}

.chat-messages {
  flex: 1;
  min-height: 0;
  padding: 12px 12px 10px;
  overflow-y: auto;
  display: flex;
  flex-direction: column;
  gap: 4px;
}

.chat-placeholder {
  font-size: 12px;
  color: rgba(255, 255, 255, 0.2);
  text-align: center;
  padding-top: 20px;
}

.chat-msg {
  font-size: 12px;
  line-height: 1.5;
  display: flex;
  align-items: flex-start;
  gap: 6px;
}

.chat-sender {
  color: #4ecb71;
  flex-shrink: 0;
}

.chat-sender.me {
  color: #f0c040;
}

.chat-text {
  color: rgba(255, 255, 255, 0.75);
  white-space: pre-wrap;
  word-break: break-word;
  overflow-wrap: anywhere;
}

.chat-input-row {
  display: flex;
  gap: 8px;
  padding: 8px 12px 12px;
  border-top: 1px solid rgba(255, 255, 255, 0.05);
}

.chat-input {
  flex: 1;
  height: 32px;
  padding: 0 12px;
  font-size: 13px;
  color: #fff;
  background: rgba(255, 255, 255, 0.06);
  border: 1px solid rgba(255, 255, 255, 0.1);
  border-radius: 4px;
  outline: none;
}
.chat-input:disabled { opacity: 0.4; }
.chat-input::placeholder { color: rgba(255, 255, 255, 0.2); }

.chat-send {
  padding: 0 16px;
  font-size: 12px;
  color: #fff;
  background: rgba(233, 69, 96, 0.3);
  border: none;
  border-radius: 4px;
  cursor: pointer;
}
.chat-send:hover:not(:disabled) { background: rgba(233, 69, 96, 0.5); }
.chat-send:disabled { opacity: 0.3; cursor: not-allowed; }

/* ===== 底部挂机状态条 ===== */
.status-bar {
  height: 150px;
  flex-shrink: 0;
  padding: 12px;
  background: rgba(0, 0, 0, 0.26);
  border-top: 1px solid rgba(255, 255, 255, 0.06);
}

.status-strip {
  height: 100%;
  min-width: 0;
  padding: 12px 16px;
  background:
    linear-gradient(180deg, rgba(255, 255, 255, 0.06), rgba(255, 255, 255, 0.03)),
    linear-gradient(90deg, rgba(13, 21, 38, 0.92), rgba(22, 38, 66, 0.92));
  border: 1px solid rgba(255, 255, 255, 0.06);
  border-radius: 8px;
  display: flex;
  flex-direction: column;
  gap: 8px;
  overflow: hidden;
}

.status-strip-head {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 16px;
}

.status-copy {
  min-width: 0;
  display: flex;
  flex-direction: column;
  gap: 2px;
}

.status-kicker {
  font-size: 10px;
  letter-spacing: 1.4px;
  text-transform: uppercase;
  color: rgba(255, 255, 255, 0.42);
}

.status-name {
  font-size: 16px;
  color: #f4f4f4;
  font-weight: 700;
}

.status-desc {
  font-size: 11px;
  color: rgba(255, 255, 255, 0.46);
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
}

.status-meta {
  display: flex;
  align-items: baseline;
  gap: 12px;
  flex-shrink: 0;
}

.status-percent {
  font-size: 24px;
  line-height: 1;
  font-weight: 700;
  color: #f0c040;
}

.status-timer {
  min-width: 56px;
  text-align: right;
  font-size: 14px;
  font-variant-numeric: tabular-nums;
  color: #f4f4f4;
}

.status-stage {
  position: relative;
  flex: 1;
  min-height: 0;
  border-radius: 6px;
  overflow: hidden;
  border: 1px solid rgba(255, 255, 255, 0.05);
}

.status-stage-bg {
  position: absolute;
  inset: 0;
  background:
    radial-gradient(circle at 20% 30%, rgba(255, 255, 255, 0.16), transparent 26%),
    linear-gradient(180deg, rgba(255, 255, 255, 0.06), transparent 42%),
    linear-gradient(180deg, rgba(33, 53, 91, 0.96), rgba(18, 27, 47, 0.98));
}

.status-stage-pattern {
  position: absolute;
  inset: 0;
  background-image:
    linear-gradient(90deg, rgba(255, 255, 255, 0.04) 1px, transparent 1px),
    linear-gradient(0deg, rgba(255, 255, 255, 0.03) 1px, transparent 1px);
  background-size: 48px 100%, 100% 24px;
  opacity: 0.5;
}

.status-track {
  position: absolute;
  left: 18px;
  right: 18px;
  bottom: 14px;
  height: 22px;
  border-radius: 999px;
  background: rgba(7, 10, 20, 0.58);
  box-shadow: inset 0 0 0 1px rgba(255, 255, 255, 0.06);
}

.status-track-fill {
  position: absolute;
  inset: 0 auto 0 0;
  border-radius: inherit;
  background: linear-gradient(90deg, rgba(78, 203, 113, 0.28), rgba(240, 192, 64, 0.8));
  transition: width 0.3s linear;
}

.status-track-label {
  position: absolute;
  bottom: 100%;
  margin-bottom: 6px;
  font-size: 10px;
  color: rgba(255, 255, 255, 0.4);
}

.status-track-label.start {
  left: 0;
}

.status-track-label.end {
  right: 0;
}

.status-actor {
  position: absolute;
  bottom: 12px;
  width: 30px;
  height: 44px;
  transform: translateX(-50%);
  transition: left 0.3s linear;
  pointer-events: none;
}

.status-actor-shadow {
  position: absolute;
  left: 50%;
  bottom: 0;
  width: 22px;
  height: 6px;
  transform: translateX(-50%);
  border-radius: 50%;
  background: rgba(3, 6, 12, 0.45);
}

.status-actor-sprite {
  position: absolute;
  left: 50%;
  bottom: 4px;
  width: 20px;
  height: 32px;
  transform: translateX(-50%);
}

.actor-head,
.actor-body,
.actor-leg {
  position: absolute;
  display: block;
  background: currentColor;
}

.actor-head {
  left: 6px;
  top: 0;
  width: 8px;
  height: 8px;
  border-radius: 2px;
  color: #f4d0a6;
}

.actor-body {
  left: 5px;
  top: 9px;
  width: 10px;
  height: 12px;
  border-radius: 2px;
  color: #7cd6ff;
}

.actor-leg {
  top: 20px;
  width: 4px;
  height: 10px;
  border-radius: 2px;
  color: #f0c040;
  transform-origin: top center;
}

.leg-a {
  left: 5px;
}

.leg-b {
  right: 5px;
}

.actor-arm {
  position: absolute;
  top: 9px;
  width: 3px;
  height: 12px;
  border-radius: 2px;
  color: #f4d0a6;
  transform-origin: top center;
}

.arm-a {
  left: 2px;
}

.arm-b {
  right: 2px;
}

/* ===== 场景装饰与环境 ===== */
.status-scenery {
  position: absolute;
  inset: 0;
  pointer-events: none;
}
.scenery-prop {
  position: absolute;
  display: block;
  opacity: 0.35;
  color: rgba(255, 255, 255, 0.5);
}
.scenery-prop.prop-a {
  left: 12%;
  bottom: 34%;
  width: 22px;
  height: 18px;
  border-radius: 3px;
  background: currentColor;
}
.scenery-prop.prop-b {
  left: 48%;
  bottom: 30%;
  width: 14px;
  height: 22px;
  border-radius: 2px;
  background: currentColor;
}
.scenery-prop.prop-c {
  left: 76%;
  bottom: 36%;
  width: 18px;
  height: 14px;
  border-radius: 3px;
  background: currentColor;
}

/* ===== 地面条 ===== */
.status-ground {
  position: absolute;
  left: 0;
  right: 0;
  bottom: 0;
  height: 28px;
  pointer-events: none;
}
.ground-strip {
  position: absolute;
  left: 0;
  right: 0;
  display: block;
}
.ground-strip.strip-a {
  bottom: 0;
  height: 8px;
  background: rgba(0, 0, 0, 0.35);
}
.ground-strip.strip-b {
  bottom: 8px;
  height: 4px;
  background: rgba(255, 255, 255, 0.06);
}
.ground-strip.strip-c {
  bottom: 12px;
  height: 3px;
  background: rgba(255, 255, 255, 0.03);
}

/* ===== 终点标记 ===== */
.status-finish-marker {
  position: absolute;
  right: 14px;
  bottom: 14px;
  width: 16px;
  height: 44px;
  pointer-events: none;
}
.finish-pole {
  position: absolute;
  left: 50%;
  bottom: 0;
  width: 2px;
  height: 100%;
  background: rgba(255, 255, 255, 0.5);
  transform: translateX(-50%);
}
.finish-flag {
  position: absolute;
  left: 50%;
  top: 2px;
  width: 10px;
  height: 7px;
  background: #f0c040;
  border-radius: 1px;
  animation: flag-wave 0.8s ease-in-out infinite alternate;
}
.finish-base {
  position: absolute;
  left: 50%;
  bottom: 0;
  width: 8px;
  height: 4px;
  background: rgba(255, 255, 255, 0.3);
  transform: translateX(-50%);
  border-radius: 1px;
}

@keyframes flag-wave {
  from { transform: rotate(-3deg); }
  to { transform: rotate(3deg); }
}

@keyframes actor-bob {
  0%, 100% { transform: translateX(-50%) translateY(0); }
  50% { transform: translateX(-50%) translateY(-2px); }
}

@keyframes leg-swing-a {
  from { transform: rotate(14deg); }
  to { transform: rotate(-18deg); }
}

@keyframes leg-swing-b {
  from { transform: rotate(-18deg); }
  to { transform: rotate(14deg); }
}

@keyframes actor-arrived {
  0%, 100% { transform: translateX(-50%) translateY(0); }
  50% { transform: translateX(-50%) translateY(-4px); }
}

.is-running .status-actor-sprite {
  animation: actor-bob 0.9s ease-in-out infinite;
}

.is-running .leg-a {
  animation: leg-swing-a 0.45s ease-in-out infinite alternate;
}

.is-running .leg-b {
  animation: leg-swing-b 0.45s ease-in-out infinite alternate;
}

.is-complete .status-actor-sprite {
  animation: actor-arrived 1.2s ease-in-out infinite;
}

/* ===== 各玩法类型主题色 ===== */

/* --- 场景背景主题 --- */
.theme-idle .status-stage-bg {
  background:
    radial-gradient(circle at 20% 30%, rgba(255, 255, 255, 0.12), transparent 26%),
    linear-gradient(180deg, rgba(255, 255, 255, 0.05), transparent 42%),
    linear-gradient(180deg, rgba(28, 37, 58, 0.96), rgba(16, 23, 38, 0.98));
}

.theme-study .status-stage-bg {
  background:
    radial-gradient(circle at 18% 28%, rgba(255, 236, 185, 0.26), transparent 28%),
    linear-gradient(180deg, rgba(255, 249, 220, 0.08), transparent 42%),
    linear-gradient(180deg, rgba(70, 82, 113, 0.95), rgba(42, 49, 76, 0.98));
}

.theme-mining .status-stage-bg {
  background:
    radial-gradient(circle at 22% 26%, rgba(185, 203, 223, 0.18), transparent 26%),
    linear-gradient(180deg, rgba(255, 255, 255, 0.04), transparent 42%),
    linear-gradient(180deg, rgba(62, 70, 85, 0.95), rgba(32, 37, 48, 0.98));
}

.theme-woodcut .status-stage-bg {
  background:
    radial-gradient(circle at 20% 28%, rgba(172, 227, 149, 0.2), transparent 26%),
    linear-gradient(180deg, rgba(255, 255, 255, 0.05), transparent 42%),
    linear-gradient(180deg, rgba(57, 91, 67, 0.95), rgba(28, 48, 32, 0.98));
}

.theme-fishing .status-stage-bg {
  background:
    radial-gradient(circle at 24% 24%, rgba(196, 242, 255, 0.24), transparent 24%),
    linear-gradient(180deg, rgba(255, 255, 255, 0.05), transparent 42%),
    linear-gradient(180deg, rgba(48, 101, 127, 0.95), rgba(25, 58, 83, 0.98));
}

.theme-work .status-stage-bg {
  background:
    radial-gradient(circle at 18% 28%, rgba(255, 208, 160, 0.22), transparent 28%),
    linear-gradient(180deg, rgba(255, 255, 255, 0.05), transparent 42%),
    linear-gradient(180deg, rgba(102, 74, 53, 0.95), rgba(60, 41, 28, 0.98));
}

/* --- 角色身体颜色 --- */
.variant-study .actor-body { color: #b8a9c9; }
.variant-mining .actor-body { color: #b0b0b0; }
.variant-woodcut .actor-body { color: #a5d6a7; }
.variant-fishing .actor-body { color: #81d4fa; }
.variant-work .actor-body { color: #ffab91; }

.variant-study .actor-head { color: #e8d5b7; }
.variant-mining .actor-head { color: #e0c9a6; }
.variant-woodcut .actor-head { color: #e6cfa0; }
.variant-fishing .actor-head { color: #e8d0b0; }
.variant-work .actor-head { color: #e0c0a0; }

/* --- 场景道具颜色 --- */
.variant-study .scenery-prop { color: #b8a080; }
.variant-mining .scenery-prop { color: #8a8a8a; }
.variant-woodcut .scenery-prop { color: #6d8c50; }
.variant-fishing .scenery-prop { color: #6ba3b8; }
.variant-work .scenery-prop { color: #a08060; }

/* --- 地面颜色 --- */
.variant-study .ground-strip.strip-a { background: rgba(55, 45, 35, 0.45); }
.variant-mining .ground-strip.strip-a { background: rgba(45, 45, 50, 0.45); }
.variant-woodcut .ground-strip.strip-a { background: rgba(28, 42, 18, 0.45); }
.variant-fishing .ground-strip.strip-a { background: rgba(18, 42, 56, 0.45); }
.variant-work .ground-strip.strip-a { background: rgba(48, 30, 18, 0.45); }

/* --- 进度条颜色 --- */
.variant-study .status-track-fill { background: linear-gradient(90deg, rgba(184, 169, 201, 0.3), rgba(255, 236, 185, 0.8)); }
.variant-mining .status-track-fill { background: linear-gradient(90deg, rgba(176, 176, 176, 0.3), rgba(255, 213, 128, 0.8)); }
.variant-woodcut .status-track-fill { background: linear-gradient(90deg, rgba(165, 214, 167, 0.3), rgba(220, 237, 150, 0.8)); }
.variant-fishing .status-track-fill { background: linear-gradient(90deg, rgba(129, 212, 250, 0.3), rgba(196, 242, 255, 0.8)); }
.variant-work .status-track-fill { background: linear-gradient(90deg, rgba(255, 171, 145, 0.3), rgba(255, 208, 160, 0.8)); }

/* ===== 角色动作动画库 ===== */

/* --- IDLE --- */
.pose-idle .status-actor-sprite { animation: idle-breathe 2.5s ease-in-out infinite; }
@keyframes idle-breathe { 0%,100%{transform:translateX(-50%)translateY(0)} 50%{transform:translateX(-50%)translateY(-2px)} }

/* --- CELEBRATE --- */
.pose-celebrate .status-actor-sprite { animation: cele-jump 0.55s ease-in-out infinite; }
.pose-celebrate .arm-a { animation: cele-arm-a 0.55s ease-in-out infinite; }
.pose-celebrate .arm-b { animation: cele-arm-b 0.55s ease-in-out infinite; }
@keyframes cele-jump { 0%,100%{transform:translateX(-50%)translateY(0)} 40%{transform:translateX(-50%)translateY(-7px)} 60%{transform:translateX(-50%)translateY(-7px)} }
@keyframes cele-arm-a { 0%,100%{transform:rotate(-65deg)} 50%{transform:rotate(65deg)} }
@keyframes cele-arm-b { 0%,100%{transform:rotate(65deg)} 50%{transform:rotate(-65deg)} }

/* === STUDY 学习: read-1~3 / write-1~3 / review-1~3 === */
.pose-study-read-1 .status-actor-sprite { animation: s-r1-bob 2s ease-in-out infinite; }
.pose-study-read-1 .arm-a { animation: s-r1-arm 2s ease-in-out infinite; }
@keyframes s-r1-bob { 0%,100%{transform:translateX(-50%)translateY(0)} 50%{transform:translateX(-50%)translateY(-2px)} }
@keyframes s-r1-arm { 0%,100%{transform:rotate(-6deg)} 50%{transform:rotate(6deg)} }

.pose-study-read-2 .status-actor-sprite { animation: s-r2-bob 1.4s ease-in-out infinite; }
.pose-study-read-2 .arm-a { animation: s-r2-arm 1.4s ease-in-out infinite; }
@keyframes s-r2-bob { 0%,100%{transform:translateX(-50%)translateY(0)} 50%{transform:translateX(-50%)translateY(-3px)} }
@keyframes s-r2-arm { 0%{transform:rotate(-3deg)} 33%{transform:rotate(8deg)} 66%{transform:rotate(-4deg)} 100%{transform:rotate(-3deg)} }

.pose-study-read-3 .status-actor-sprite { animation: s-r3-bob 1s ease-in-out infinite; }
.pose-study-read-3 .arm-a { animation: s-r3-arm 1s ease-in-out infinite; }
@keyframes s-r3-bob { 0%,100%{transform:translateX(-50%)translateY(0)} 50%{transform:translateX(-50%)translateY(-1px)} }
@keyframes s-r3-arm { 0%,100%{transform:rotate(-10deg)} 50%{transform:rotate(12deg)} }

.pose-study-write-1 .status-actor-sprite { animation: s-w1-bob 2.2s ease-in-out infinite; }
.pose-study-write-1 .arm-a { animation: s-w1-arm 2.2s ease-in-out infinite; }
@keyframes s-w1-bob { 0%,100%{transform:translateX(-50%)translateY(0)} 50%{transform:translateX(-50%)translateY(-2px)} }
@keyframes s-w1-arm { 0%{transform:rotate(5deg)} 40%{transform:rotate(-20deg)} 60%{transform:rotate(-20deg)} 100%{transform:rotate(5deg)} }

.pose-study-write-2 .status-actor-sprite { animation: s-w2-bob 0.7s ease-in-out infinite; }
.pose-study-write-2 .arm-a { animation: s-w2-arm 0.7s ease-in-out infinite; }
@keyframes s-w2-bob { 0%,100%{transform:translateX(-50%)translateY(0)} 25%,75%{transform:translateX(-50%)translateY(-3px)} }
@keyframes s-w2-arm { 0%{transform:rotate(-5deg)} 30%{transform:rotate(18deg)} 60%{transform:rotate(-10deg)} 100%{transform:rotate(-5deg)} }

.pose-study-write-3 .status-actor-sprite { animation: s-w3-bob 1s ease-in-out infinite; }
.pose-study-write-3 .arm-a { animation: s-w3-arm 1s ease-in-out infinite; }
.pose-study-write-3 .arm-b { animation: s-w3-armb 1s ease-in-out infinite; }
@keyframes s-w3-bob { 0%,100%{transform:translateX(-50%)translateY(0)} 50%{transform:translateX(-50%)translateY(-2px)} }
@keyframes s-w3-arm { 0%,100%{transform:rotate(5deg)} 50%{transform:rotate(-10deg)} }
@keyframes s-w3-armb { 0%,100%{transform:rotate(-5deg)} 50%{transform:rotate(8deg)} }

.pose-study-review-1 .status-actor-sprite { animation: s-v1-bob 1.6s ease-in-out infinite; }
.pose-study-review-1 .arm-a { animation: s-v1-arm 1.6s ease-in-out infinite; }
@keyframes s-v1-bob { 0%,100%{transform:translateX(-50%)translateY(0)} 50%{transform:translateX(-50%)translateY(-3px)} }
@keyframes s-v1-arm { 0%,100%{transform:rotate(-5deg)} 50%{transform:rotate(10deg)} }

.pose-study-review-2 .status-actor-sprite { animation: s-v2-bob 1s ease-in-out infinite; }
.pose-study-review-2 .arm-a { animation: s-v2-arm 1s ease-in-out infinite; }
@keyframes s-v2-bob { 0%,100%{transform:translateX(-50%)translateY(0)} 50%{transform:translateX(-50%)translateY(-2px)} }
@keyframes s-v2-arm { 0%{transform:rotate(-3deg)} 25%{transform:rotate(15deg)} 50%{transform:rotate(-8deg)} 75%{transform:rotate(12deg)} 100%{transform:rotate(-3deg)} }

.pose-study-review-3 .status-actor-sprite { animation: s-v3-bob 2s ease-in-out infinite; }
.pose-study-review-3 .arm-a { animation: s-v3-arm 2s ease-in-out infinite; }
.pose-study-review-3 .arm-b { animation: s-v3-armb 2s ease-in-out infinite; }
@keyframes s-v3-bob { 0%,100%{transform:translateX(-50%)translateY(0)} 50%{transform:translateX(-50%)translateY(-4px)} }
@keyframes s-v3-arm { 0%,100%{transform:rotate(-8deg)} 50%{transform:rotate(8deg)} }
@keyframes s-v3-armb { 0%,100%{transform:rotate(6deg)} 50%{transform:rotate(-6deg)} }

/* === MINING 挖矿: swing-1~3 / dig-1~3 / inspect-1~3 === */
.pose-mining-swing-1 .status-actor-sprite { animation: m-s1-bob 0.9s ease-in-out infinite; }
.pose-mining-swing-1 .arm-a { animation: m-s1-arm 0.9s ease-in-out infinite; }
@keyframes m-s1-bob { 0%,100%{transform:translateX(-50%)translateY(0)} 30%{transform:translateX(-50%)translateY(-3px)} }
@keyframes m-s1-arm { 0%{transform:rotate(10deg)} 50%{transform:rotate(-35deg)} 100%{transform:rotate(10deg)} }

.pose-mining-swing-2 .status-actor-sprite { animation: m-s2-bob 1.1s ease-in-out infinite; }
.pose-mining-swing-2 .arm-a { animation: m-s2-arm 1.1s ease-in-out infinite; }
@keyframes m-s2-bob { 0%,100%{transform:translateX(-50%)translateY(0)} 30%{transform:translateX(-50%)translateY(-5px)} }
@keyframes m-s2-arm { 0%{transform:rotate(15deg)} 50%{transform:rotate(-55deg)} 100%{transform:rotate(15deg)} }

.pose-mining-swing-3 .status-actor-sprite { animation: m-s3-bob 0.75s ease-in-out infinite; }
.pose-mining-swing-3 .arm-a { animation: m-s3-arm 0.75s ease-in-out infinite; }
.pose-mining-swing-3 .arm-b { animation: m-s3-armb 0.75s ease-in-out infinite; }
@keyframes m-s3-bob { 0%,100%{transform:translateX(-50%)translateY(0)} 30%{transform:translateX(-50%)translateY(-4px)} }
@keyframes m-s3-arm { 0%{transform:rotate(5deg)} 50%{transform:rotate(-45deg)} 100%{transform:rotate(5deg)} }
@keyframes m-s3-armb { 0%,100%{transform:rotate(-10deg)} 50%{transform:rotate(15deg)} }

.pose-mining-dig-1 .status-actor-sprite { animation: m-d1-bob 0.8s ease-in-out infinite; }
.pose-mining-dig-1 .arm-a { animation: m-d1-arm 0.8s ease-in-out infinite; }
@keyframes m-d1-bob { 0%,100%{transform:translateX(-50%)translateY(0)} 50%{transform:translateX(-50%)translateY(-3px)} }
@keyframes m-d1-arm { 0%{transform:rotate(-10deg)} 50%{transform:rotate(-50deg)} 100%{transform:rotate(-10deg)} }

.pose-mining-dig-2 .status-actor-sprite { animation: m-d2-bob 0.6s ease-in-out infinite; }
.pose-mining-dig-2 .arm-a { animation: m-d2-arm 0.6s ease-in-out infinite; }
@keyframes m-d2-bob { 0%,100%{transform:translateX(-50%)translateY(0)} 30%{transform:translateX(-50%)translateY(-5px)} }
@keyframes m-d2-arm { 0%{transform:rotate(20deg)} 50%{transform:rotate(-40deg)} 100%{transform:rotate(20deg)} }

.pose-mining-dig-3 .status-actor-sprite { animation: m-d3-bob 0.45s ease-in-out infinite; }
.pose-mining-dig-3 .arm-a { animation: m-d3-arm 0.45s ease-in-out infinite; }
@keyframes m-d3-bob { 0%,100%{transform:translateX(-50%)translateY(0)} 50%{transform:translateX(-50%)translateY(-3px)} }
@keyframes m-d3-arm { 0%{transform:rotate(5deg)} 50%{transform:rotate(-30deg)} 100%{transform:rotate(5deg)} }

.pose-mining-inspect-1 .status-actor-sprite { animation: m-i1-bob 1.8s ease-in-out infinite; }
.pose-mining-inspect-1 .arm-a { animation: m-i1-arm 1.8s ease-in-out infinite; }
@keyframes m-i1-bob { 0%,100%{transform:translateX(-50%)translateY(0)} 50%{transform:translateX(-50%)translateY(-2px)} }
@keyframes m-i1-arm { 0%{transform:rotate(-20deg)} 40%{transform:rotate(30deg)} 60%{transform:rotate(30deg)} 100%{transform:rotate(-20deg)} }

.pose-mining-inspect-2 .status-actor-sprite { animation: m-i2-bob 1.2s ease-in-out infinite; }
.pose-mining-inspect-2 .arm-a { animation: m-i2-arm 1.2s ease-in-out infinite; }
@keyframes m-i2-bob { 0%,100%{transform:translateX(-50%)translateY(0)} 50%{transform:translateX(-50%)translateY(-2px)} }
@keyframes m-i2-arm { 0%,100%{transform:rotate(-15deg)} 25%{transform:rotate(5deg)} 50%{transform:rotate(-5deg)} 75%{transform:rotate(5deg)} }

.pose-mining-inspect-3 .status-actor-sprite { animation: m-i3-bob 1.5s ease-in-out infinite; }
.pose-mining-inspect-3 .arm-a { animation: m-i3-arm 1.5s ease-in-out infinite; }
.pose-mining-inspect-3 .arm-b { animation: m-i3-armb 1.5s ease-in-out infinite; }
@keyframes m-i3-bob { 0%,100%{transform:translateX(-50%)translateY(0)} 50%{transform:translateX(-50%)translateY(-3px)} }
@keyframes m-i3-arm { 0%{transform:rotate(-10deg)} 50%{transform:rotate(-30deg)} 100%{transform:rotate(-10deg)} }
@keyframes m-i3-armb { 0%{transform:rotate(5deg)} 50%{transform:rotate(-15deg)} 100%{transform:rotate(5deg)} }

/* === WOODCUT 伐木: chop-1~3 / saw-1~3 / lift-1~3 === */
.pose-woodcut-chop-1 .status-actor-sprite { animation: w-c1-bob 0.8s ease-in-out infinite; }
.pose-woodcut-chop-1 .arm-a { animation: w-c1-arm 0.8s ease-in-out infinite; }
@keyframes w-c1-bob { 0%,100%{transform:translateX(-50%)translateY(0)} 30%{transform:translateX(-50%)translateY(-4px)} }
@keyframes w-c1-arm { 0%{transform:rotate(15deg)} 55%{transform:rotate(-55deg)} 100%{transform:rotate(15deg)} }

.pose-woodcut-chop-2 .status-actor-sprite { animation: w-c2-bob 1s ease-in-out infinite; }
.pose-woodcut-chop-2 .arm-a { animation: w-c2-arm 1s ease-in-out infinite; }
@keyframes w-c2-bob { 0%,100%{transform:translateX(-50%)translateY(0)} 30%{transform:translateX(-50%)translateY(-5px)} }
@keyframes w-c2-arm { 0%{transform:rotate(5deg)} 50%{transform:rotate(-65deg)} 100%{transform:rotate(5deg)} }

.pose-woodcut-chop-3 .status-actor-sprite { animation: w-c3-bob 1.3s ease-in-out infinite; }
.pose-woodcut-chop-3 .arm-a { animation: w-c3-arm 1.3s ease-in-out infinite; }
.pose-woodcut-chop-3 .arm-b { animation: w-c3-armb 1.3s ease-in-out infinite; }
@keyframes w-c3-bob { 0%,100%{transform:translateX(-50%)translateY(0)} 20%{transform:translateX(-50%)translateY(-6px)} }
@keyframes w-c3-arm { 0%{transform:rotate(20deg)} 45%{transform:rotate(-60deg)} 55%{transform:rotate(-60deg)} 100%{transform:rotate(20deg)} }
@keyframes w-c3-armb { 0%,100%{transform:rotate(-5deg)} 45%{transform:rotate(10deg)} 55%{transform:rotate(10deg)} }

.pose-woodcut-saw-1 .status-actor-sprite { animation: w-s1-bob 1.8s ease-in-out infinite; }
.pose-woodcut-saw-1 .arm-a { animation: w-s1-arm 1.8s ease-in-out infinite; }
@keyframes w-s1-bob { 0%,100%{transform:translateX(-50%)translateY(0)} 50%{transform:translateX(-50%)translateY(-2px)} }
@keyframes w-s1-arm { 0%{transform:rotate(5deg)} 50%{transform:rotate(-25deg)} 100%{transform:rotate(5deg)} }

.pose-woodcut-saw-2 .status-actor-sprite { animation: w-s2-bob 1s ease-in-out infinite; }
.pose-woodcut-saw-2 .arm-a { animation: w-s2-arm 1s ease-in-out infinite; }
@keyframes w-s2-bob { 0%,100%{transform:translateX(-50%)translateY(0)} 50%{transform:translateX(-50%)translateY(-3px)} }
@keyframes w-s2-arm { 0%{transform:rotate(5deg)} 50%{transform:rotate(-35deg)} 100%{transform:rotate(5deg)} }

.pose-woodcut-saw-3 .status-actor-sprite { animation: w-s3-bob 1.2s ease-in-out infinite; }
.pose-woodcut-saw-3 .arm-a { animation: w-s3-arm 1.2s ease-in-out infinite; }
.pose-woodcut-saw-3 .arm-b { animation: w-s3-armb 1.2s ease-in-out infinite; }
@keyframes w-s3-bob { 0%,100%{transform:translateX(-50%)translateY(0)} 50%{transform:translateX(-50%)translateY(-3px)} }
@keyframes w-s3-arm { 0%{transform:rotate(5deg)} 50%{transform:rotate(-25deg)} 100%{transform:rotate(5deg)} }
@keyframes w-s3-armb { 0%{transform:rotate(-5deg)} 50%{transform:rotate(25deg)} 100%{transform:rotate(-5deg)} }

.pose-woodcut-lift-1 .status-actor-sprite { animation: w-l1-bob 1.5s ease-in-out infinite; }
.pose-woodcut-lift-1 .arm-a { animation: w-l1-arm 1.5s ease-in-out infinite; }
.pose-woodcut-lift-1 .arm-b { animation: w-l1-armb 1.5s ease-in-out infinite; }
@keyframes w-l1-bob { 0%,100%{transform:translateX(-50%)translateY(0)} 40%{transform:translateX(-50%)translateY(-4px)} 60%{transform:translateX(-50%)translateY(-4px)} }
@keyframes w-l1-arm { 0%{transform:rotate(-20deg)} 50%{transform:rotate(-35deg)} 100%{transform:rotate(-20deg)} }
@keyframes w-l1-armb { 0%{transform:rotate(-15deg)} 50%{transform:rotate(-30deg)} 100%{transform:rotate(-15deg)} }

.pose-woodcut-lift-2 .status-actor-sprite { animation: w-l2-bob 1.8s ease-in-out infinite; }
.pose-woodcut-lift-2 .arm-a { animation: w-l2-arm 1.8s ease-in-out infinite; }
@keyframes w-l2-bob { 0%,100%{transform:translateX(-50%)translateY(0)} 50%{transform:translateX(-50%)translateY(-3px)} }
@keyframes w-l2-arm { 0%{transform:rotate(-10deg)} 40%{transform:rotate(25deg)} 60%{transform:rotate(25deg)} 100%{transform:rotate(-10deg)} }

.pose-woodcut-lift-3 .status-actor-sprite { animation: w-l3-bob 1.4s ease-in-out infinite; }
.pose-woodcut-lift-3 .arm-a { animation: w-l3-arm 1.4s ease-in-out infinite; }
@keyframes w-l3-bob { 0%,100%{transform:translateX(-50%)translateY(0)} 50%{transform:translateX(-50%)translateY(-2px)} }
@keyframes w-l3-arm { 0%,100%{transform:rotate(-15deg)} 25%{transform:rotate(5deg)} 50%{transform:rotate(-5deg)} 75%{transform:rotate(5deg)} }

/* === FISHING 钓鱼: cast-1~3 / wait-1~3 / pull-1~3 === */
.pose-fishing-cast-1 .status-actor-sprite { animation: f-c1-bob 1.6s ease-in-out infinite; }
.pose-fishing-cast-1 .arm-a { animation: f-c1-arm 1.6s ease-in-out infinite; }
@keyframes f-c1-bob { 0%,100%{transform:translateX(-50%)translateY(0)} 40%{transform:translateX(-50%)translateY(-3px)} }
@keyframes f-c1-arm { 0%{transform:rotate(10deg)} 30%{transform:rotate(-45deg)} 55%{transform:rotate(-45deg)} 80%{transform:rotate(15deg)} 100%{transform:rotate(10deg)} }

.pose-fishing-cast-2 .status-actor-sprite { animation: f-c2-bob 1.3s ease-in-out infinite; }
.pose-fishing-cast-2 .arm-a { animation: f-c2-arm 1.3s ease-in-out infinite; }
@keyframes f-c2-bob { 0%,100%{transform:translateX(-50%)translateY(0)} 40%{transform:translateX(-50%)translateY(-4px)} }
@keyframes f-c2-arm { 0%{transform:rotate(-5deg)} 30%{transform:rotate(-50deg)} 55%{transform:rotate(-50deg)} 80%{transform:rotate(5deg)} 100%{transform:rotate(-5deg)} }

.pose-fishing-cast-3 .status-actor-sprite { animation: f-c3-bob 2s ease-in-out infinite; }
.pose-fishing-cast-3 .arm-a { animation: f-c3-arm 2s ease-in-out infinite; }
@keyframes f-c3-bob { 0%,100%{transform:translateX(-50%)translateY(0)} 50%{transform:translateX(-50%)translateY(-2px)} }
@keyframes f-c3-arm { 0%{transform:rotate(10deg)} 25%{transform:rotate(-25deg)} 55%{transform:rotate(-25deg)} 75%{transform:rotate(12deg)} 100%{transform:rotate(10deg)} }

.pose-fishing-wait-1 .status-actor-sprite { animation: f-w1-bob 2.8s ease-in-out infinite; }
@keyframes f-w1-bob { 0%,100%{transform:translateX(-50%)translateY(0)} 50%{transform:translateX(-50%)translateY(-1px)} }

.pose-fishing-wait-2 .status-actor-sprite { animation: f-w2-bob 1s ease-in-out infinite; }
.pose-fishing-wait-2 .arm-a { animation: f-w2-arm 1s ease-in-out infinite; }
@keyframes f-w2-bob { 0%,100%{transform:translateX(-50%)translateY(0)} 50%{transform:translateX(-50%)translateY(-3px)} }
@keyframes f-w2-arm { 0%,100%{transform:rotate(-5deg)} 50%{transform:rotate(10deg)} }

.pose-fishing-wait-3 .status-actor-sprite { animation: f-w3-bob 2s ease-in-out infinite; }
.pose-fishing-wait-3 .arm-a { animation: f-w3-arm 2s ease-in-out infinite; }
@keyframes f-w3-bob { 0%,100%{transform:translateX(-50%)translateY(0)} 50%{transform:translateX(-50%)translateY(-2px)} }
@keyframes f-w3-arm { 0%,100%{transform:rotate(-8deg)} 50%{transform:rotate(8deg)} }

.pose-fishing-pull-1 .status-actor-sprite { animation: f-p1-bob 0.6s ease-in-out infinite; }
.pose-fishing-pull-1 .arm-a { animation: f-p1-arm 0.6s ease-in-out infinite; }
.pose-fishing-pull-1 .arm-b { animation: f-p1-armb 0.6s ease-in-out infinite; }
@keyframes f-p1-bob { 0%,100%{transform:translateX(-50%)translateY(0)} 50%{transform:translateX(-50%)translateY(-6px)} }
@keyframes f-p1-arm { 0%{transform:rotate(5deg)} 40%{transform:rotate(-40deg)} 60%{transform:rotate(-40deg)} 100%{transform:rotate(5deg)} }
@keyframes f-p1-armb { 0%{transform:rotate(-5deg)} 40%{transform:rotate(40deg)} 60%{transform:rotate(40deg)} 100%{transform:rotate(-5deg)} }

.pose-fishing-pull-2 .status-actor-sprite { animation: f-p2-bob 1.2s ease-in-out infinite; }
.pose-fishing-pull-2 .arm-a { animation: f-p2-arm 1.2s ease-in-out infinite; }
@keyframes f-p2-bob { 0%,100%{transform:translateX(-50%)translateY(0)} 50%{transform:translateX(-50%)translateY(-4px)} }
@keyframes f-p2-arm { 0%{transform:rotate(5deg)} 50%{transform:rotate(-30deg)} 100%{transform:rotate(5deg)} }

.pose-fishing-pull-3 .status-actor-sprite { animation: f-p3-bob 0.5s ease-in-out infinite; }
.pose-fishing-pull-3 .arm-a { animation: f-p3-arm 0.5s ease-in-out infinite; }
@keyframes f-p3-bob { 0%,100%{transform:translateX(-50%)translateY(0)} 50%{transform:translateX(-50%)translateY(-2px)} }
@keyframes f-p3-arm { 0%{transform:rotate(-5deg)} 25%{transform:rotate(-20deg)} 50%{transform:rotate(-5deg)} 75%{transform:rotate(-20deg)} 100%{transform:rotate(-5deg)} }

/* === WORK 打工: operate-1~3 / build-1~3 / carry-1~3 === */
.pose-work-operate-1 .status-actor-sprite { animation: wk-o1-bob 1.8s ease-in-out infinite; }
.pose-work-operate-1 .arm-a { animation: wk-o1-arm 1.8s ease-in-out infinite; }
.pose-work-operate-1 .arm-b { animation: wk-o1-armb 1.8s ease-in-out infinite; }
@keyframes wk-o1-bob { 0%,100%{transform:translateX(-50%)translateY(0)} 50%{transform:translateX(-50%)translateY(-2px)} }
@keyframes wk-o1-arm { 0%,100%{transform:rotate(-8deg)} 50%{transform:rotate(8deg)} }
@keyframes wk-o1-armb { 0%,100%{transform:rotate(6deg)} 50%{transform:rotate(-6deg)} }

.pose-work-operate-2 .status-actor-sprite { animation: wk-o2-bob 0.7s ease-in-out infinite; }
.pose-work-operate-2 .arm-a { animation: wk-o2-arm 0.7s ease-in-out infinite; }
@keyframes wk-o2-bob { 0%,100%{transform:translateX(-50%)translateY(0)} 30%{transform:translateX(-50%)translateY(-4px)} }
@keyframes wk-o2-arm { 0%{transform:rotate(10deg)} 50%{transform:rotate(-45deg)} 100%{transform:rotate(10deg)} }

.pose-work-operate-3 .status-actor-sprite { animation: wk-o3-bob 0.5s ease-in-out infinite; }
.pose-work-operate-3 .arm-a { animation: wk-o3-arm 0.5s ease-in-out infinite; }
@keyframes wk-o3-bob { 0%,100%{transform:translateX(-50%)translateY(0)} 50%{transform:translateX(-50%)translateY(-2px)} }
@keyframes wk-o3-arm { 0%{transform:rotate(-5deg)} 25%{transform:rotate(12deg)} 50%{transform:rotate(-8deg)} 75%{transform:rotate(10deg)} 100%{transform:rotate(-5deg)} }

.pose-work-build-1 .status-actor-sprite { animation: wk-b1-bob 1.5s ease-in-out infinite; }
.pose-work-build-1 .arm-a { animation: wk-b1-arm 1.5s ease-in-out infinite; }
.pose-work-build-1 .arm-b { animation: wk-b1-armb 1.5s ease-in-out infinite; }
@keyframes wk-b1-bob { 0%,100%{transform:translateX(-50%)translateY(0)} 50%{transform:translateX(-50%)translateY(-2px)} }
@keyframes wk-b1-arm { 0%,100%{transform:rotate(-10deg)} 50%{transform:rotate(12deg)} }
@keyframes wk-b1-armb { 0%,100%{transform:rotate(8deg)} 50%{transform:rotate(-10deg)} }

.pose-work-build-2 .status-actor-sprite { animation: wk-b2-bob 0.9s ease-in-out infinite; }
.pose-work-build-2 .arm-a { animation: wk-b2-arm 0.9s ease-in-out infinite; }
@keyframes wk-b2-bob { 0%,100%{transform:translateX(-50%)translateY(0)} 50%{transform:translateX(-50%)translateY(-3px)} }
@keyframes wk-b2-arm { 0%{transform:rotate(-5deg)} 30%{transform:rotate(-25deg)} 60%{transform:rotate(-5deg)} 80%{transform:rotate(-25deg)} }

.pose-work-build-3 .status-actor-sprite { animation: wk-b3-bob 2s ease-in-out infinite; }
.pose-work-build-3 .arm-a { animation: wk-b3-arm 2s ease-in-out infinite; }
@keyframes wk-b3-bob { 0%,100%{transform:translateX(-50%)translateY(0)} 50%{transform:translateX(-50%)translateY(-2px)} }
@keyframes wk-b3-arm { 0%{transform:rotate(0deg)} 25%{transform:rotate(15deg)} 50%{transform:rotate(0deg)} 75%{transform:rotate(-10deg)} 100%{transform:rotate(0deg)} }

.pose-work-carry-1 .status-actor-sprite { animation: wk-c1-bob 1.4s ease-in-out infinite; }
.pose-work-carry-1 .arm-a { animation: wk-c1-arm 1.4s ease-in-out infinite; }
.pose-work-carry-1 .arm-b { animation: wk-c1-armb 1.4s ease-in-out infinite; }
@keyframes wk-c1-bob { 0%,100%{transform:translateX(-50%)translateY(0)} 40%{transform:translateX(-50%)translateY(-4px)} 60%{transform:translateX(-50%)translateY(-4px)} }
@keyframes wk-c1-arm { 0%,100%{transform:rotate(-15deg)} 50%{transform:rotate(-30deg)} }
@keyframes wk-c1-armb { 0%,100%{transform:rotate(-10deg)} 50%{transform:rotate(-25deg)} }

.pose-work-carry-2 .status-actor-sprite { animation: wk-c2-bob 1.2s ease-in-out infinite; }
.pose-work-carry-2 .arm-a { animation: wk-c2-arm 1.2s ease-in-out infinite; }
.pose-work-carry-2 .arm-b { animation: wk-c2-armb 1.2s ease-in-out infinite; }
@keyframes wk-c2-bob { 0%,100%{transform:translateX(-50%)translateY(0)} 50%{transform:translateX(-50%)translateY(-3px)} }
@keyframes wk-c2-arm { 0%{transform:rotate(5deg)} 50%{transform:rotate(-15deg)} 100%{transform:rotate(5deg)} }
@keyframes wk-c2-armb { 0%{transform:rotate(-5deg)} 50%{transform:rotate(15deg)} 100%{transform:rotate(-5deg)} }

.pose-work-carry-3 .status-actor-sprite { animation: wk-c3-bob 1.6s ease-in-out infinite; }
.pose-work-carry-3 .arm-a { animation: wk-c3-arm 1.6s ease-in-out infinite; }
@keyframes wk-c3-bob { 0%,100%{transform:translateX(-50%)translateY(0)} 50%{transform:translateX(-50%)translateY(-4px)} }
@keyframes wk-c3-arm { 0%{transform:rotate(-5deg)} 40%{transform:rotate(30deg)} 60%{transform:rotate(30deg)} 100%{transform:rotate(-5deg)} }

.status-strip-foot {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 16px;
}

.status-hint {
  min-width: 0;
  font-size: 11px;
  color: rgba(255, 255, 255, 0.44);
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
}

.status-actions {
  display: flex;
  gap: 8px;
  flex-shrink: 0;
}

.status-btn {
  height: 28px;
  padding: 0 14px;
  font-size: 12px;
  border-radius: 999px;
  border: 1px solid transparent;
  cursor: pointer;
}

.status-btn.collect {
  color: #1a1a2e;
  background: linear-gradient(135deg, #f0c040, #e0a020);
}

.status-btn.cancel {
  color: rgba(255, 255, 255, 0.7);
  background: rgba(255, 255, 255, 0.06);
  border-color: rgba(255, 255, 255, 0.08);
}

.status-btn:disabled {
  opacity: 0.45;
  cursor: not-allowed;
}

/* ===== 奖励弹窗 ===== */
.reward-overlay {
  position: fixed;
  inset: 0;
  background: rgba(0, 0, 0, 0.7);
  display: flex;
  align-items: center;
  justify-content: center;
  z-index: 100;
}

.reward-modal {
  width: 300px;
  background: #1a1a2e;
  border: 2px solid rgba(240, 192, 64, 0.3);
  border-radius: 12px;
  padding: 24px 20px;
  text-align: center;
}

.reward-modal h2 {
  font-size: 16px;
  color: #f0c040;
  margin-bottom: 4px;
}

.reward-title {
  font-size: 12px;
  color: rgba(255, 255, 255, 0.5);
  margin-bottom: 16px;
}

.reward-details {
  display: flex;
  flex-direction: column;
  gap: 6px;
  margin-bottom: 12px;
}

.reward-row {
  display: flex;
  justify-content: space-between;
  padding: 0 16px;
  font-size: 13px;
}

.rw-label { color: rgba(255, 255, 255, 0.5); }
.rw-value.exp { color: #f0c040; }
.rw-value.gold { color: #f0c040; }
.rw-value.attr { color: #40a0f0; }
.rw-value.item { color: #4ecb71; }
.rw-value.lvlup { color: #e94560; font-weight: bold; }

.reward-mood {
  font-size: 11px;
  color: rgba(255, 255, 255, 0.4);
  margin-bottom: 16px;
}

.btn-confirm {
  width: 100%;
  height: 34px;
  font-size: 13px;
  color: #1a1a2e;
  background: #f0c040;
  border: none;
  border-radius: 6px;
  cursor: pointer;
  font-weight: bold;
}
.btn-confirm:hover { opacity: 0.9; }
</style>
