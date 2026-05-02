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

        <!-- 挂机任务 (仅进行中显示) -->
        <div class="panel-block task-block" v-if="actionStore.hasTask">
          <h3>挂机中</h3>
          <div class="task-info">
            <span class="task-name">{{ actionStore.task?.actionName }}</span>
            <span class="task-type">{{ typeLabel(actionStore.task?.actionType) }}</span>
          </div>
          <div class="progress-bar-wrap">
            <div class="progress-bar">
              <div class="progress-fill" :style="{ width: (actionStore.progress * 100) + '%' }"></div>
            </div>
            <span class="progress-text">{{ Math.floor(actionStore.progress * 100) }}%</span>
          </div>
          <div class="task-time">剩余: {{ formatTime(actionStore.task?.remaining || 0) }}</div>
          <div class="task-actions">
            <button
              v-if="actionStore.isComplete"
              class="btn-collect"
              :disabled="actionStore.loading"
              @click="handleCollect"
            >领取奖励</button>
            <button
              v-else
              class="btn-cancel"
              :disabled="actionStore.loading"
              @click="handleCancel"
            >取消</button>
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
    </div>

    <!-- ===== 底部聊天室 ===== -->
    <footer class="chat-bar">
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
import { ref, onMounted, onUnmounted } from 'vue';
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
}

// ---------- 生命周期 ----------
onMounted(async () => {
  await actionStore.fetchTaskStatus();
  if (actionStore.hasTask) {
    actionStore.startPolling();
  }
});

onUnmounted(() => {
  actionStore.stopPolling();
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
  try { await actionStore.collectAction(); } catch { /* store handles */ }
}

async function handleCancel() {
  try { await actionStore.cancelAction(); } catch { /* store handles */ }
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

/* 挂机任务 */
.task-block {
  border-color: rgba(233, 69, 96, 0.15);
}

.task-info {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 8px;
}

.task-name {
  font-size: 13px;
  color: #fff;
  font-weight: bold;
}

.task-type {
  font-size: 10px;
  padding: 1px 6px;
  background: rgba(233, 69, 96, 0.1);
  border-radius: 3px;
  color: #e94560;
}

.progress-bar-wrap {
  display: flex;
  align-items: center;
  gap: 8px;
  margin-bottom: 6px;
}

.progress-bar {
  flex: 1;
  height: 6px;
  background: rgba(255, 255, 255, 0.08);
  border-radius: 3px;
  overflow: hidden;
}

.progress-fill {
  height: 100%;
  background: linear-gradient(90deg, #e94560, #f0c040);
  border-radius: 3px;
  transition: width 1s linear;
}

.progress-text {
  font-size: 10px;
  color: rgba(255, 255, 255, 0.5);
  width: 30px;
  text-align: right;
}

.task-time {
  font-size: 11px;
  color: rgba(255, 255, 255, 0.4);
  margin-bottom: 8px;
}

.task-actions {
  display: flex;
  gap: 6px;
}

.btn-collect {
  flex: 1;
  height: 28px;
  font-size: 12px;
  font-weight: bold;
  color: #1a1a2e;
  background: linear-gradient(135deg, #f0c040, #e0a020);
  border: none;
  border-radius: 4px;
  cursor: pointer;
  animation: pulse 1.5s ease-in-out infinite;
}

@keyframes pulse {
  0%, 100% { opacity: 1; }
  50% { opacity: 0.7; }
}

.btn-cancel {
  flex: 1;
  height: 28px;
  font-size: 12px;
  color: rgba(255, 255, 255, 0.4);
  background: rgba(255, 255, 255, 0.04);
  border: 1px solid rgba(255, 255, 255, 0.08);
  border-radius: 4px;
  cursor: pointer;
}
.btn-cancel:hover { color: #e94560; border-color: #e94560; }

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

/* ===== 底部聊天室 ===== */
.chat-bar {
  height: 150px;
  flex-shrink: 0;
  display: flex;
  flex-direction: column;
  background: rgba(0, 0, 0, 0.3);
  border-top: 1px solid rgba(255, 255, 255, 0.06);
}

.chat-messages {
  flex: 1;
  padding: 10px 16px;
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
}

.chat-sender {
  color: #4ecb71;
  margin-right: 6px;
}

.chat-sender.me {
  color: #f0c040;
}

.chat-text {
  color: rgba(255, 255, 255, 0.75);
}

.chat-input-row {
  display: flex;
  gap: 8px;
  padding: 8px 12px;
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
