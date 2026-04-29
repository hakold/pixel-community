<template>
  <div class="action-panel">
    <!-- ===== 当前任务进度条 (有任务时显示) ===== -->
    <div v-if="actionStore.hasTask" class="task-progress">
      <div class="task-header">
        <span class="task-name">{{ actionStore.task?.actionName }}</span>
        <span class="task-type-tag">{{ typeLabel(actionStore.task?.actionType) }}</span>
      </div>

      <div class="progress-bar-wrap">
        <div class="progress-bar">
          <div class="progress-fill" :style="{ width: (actionStore.progress * 100) + '%' }"></div>
        </div>
        <span class="progress-text">{{ Math.floor(actionStore.progress * 100) }}%</span>
      </div>

      <div class="task-times">
        <div class="time-item">
          <span class="time-label">已过</span>
          <span class="time-value">{{ formatTime(actionStore.task?.elapsed || 0) }}</span>
        </div>
        <div class="time-item">
          <span class="time-label">剩余</span>
          <span class="time-value">{{ formatTime(actionStore.task?.remaining || 0) }}</span>
        </div>
        <div class="time-item">
          <span class="time-label">总时长</span>
          <span class="time-value">{{ formatTime(actionStore.task?.duration || 0) }}</span>
        </div>
      </div>

      <div class="task-actions">
        <button
          v-if="actionStore.isComplete"
          class="btn-collect"
          :disabled="actionStore.loading"
          @click="handleCollect"
        >
          {{ actionStore.loading ? '结算中...' : '领取奖励' }}
        </button>
        <button
          v-else
          class="btn-cancel"
          :disabled="actionStore.loading"
          @click="handleCancel"
        >
          取消任务
        </button>
      </div>
    </div>

    <!-- ===== 行为类型标签 ===== -->
    <div class="type-tabs">
      <button
        v-for="t in types"
        :key="t.key"
        class="type-tab"
        :class="[t.key, { active: activeType === t.key }]"
        :disabled="actionStore.hasTask"
        @click="activeType = t.key"
      >
        {{ t.label }}
      </button>
    </div>

    <!-- ===== 行为列表 ===== -->
    <div class="action-list" v-if="!actionStore.hasTask">
      <div
        v-for="item in currentActions"
        :key="item.id"
        class="action-card"
        :class="{ locked: !checkReqs(item).valid }"
      >
        <div class="card-header">
          <span class="card-name">{{ item.name }}</span>
          <span class="card-cost">精力 {{ item.energyCost || 0 }}</span>
        </div>

        <p class="card-desc" v-if="item.description">{{ item.description }}</p>

        <div class="card-meta">
          <span class="meta-item">时长: {{ formatTime(item.duration) }}</span>
        </div>

        <!-- 需求清单 -->
        <div class="card-reqs" v-if="item.requirements && Object.keys(item.requirements).length">
          <span class="req-label">要求:</span>
          <span
            v-for="(rv, rk) in item.requirements"
            :key="rk"
            class="req-item"
            :class="{ met: checkReqItem(rk, rv), unmet: !checkReqItem(rk, rv) }"
          >
            {{ reqName(rk) }}{{ rv }}
          </span>
        </div>

        <!-- 奖励预览 -->
        <div class="card-rewards" v-if="item.rewards">
          <span class="reward-label">奖励:</span>
          <span v-if="item.rewards.exp" class="reward-item exp">EXP +{{ item.rewards.exp }}</span>
          <span v-if="item.rewards.gold" class="reward-item gold">金币 +{{ item.rewards.gold }}</span>
          <span v-if="item.rewards.attributes" class="reward-item attr">
            <template v-for="(av, ak) in item.rewards.attributes" :key="ak">
              {{ attrName(ak) }}+{{ av }}
            </template>
          </span>
        </div>

        <button
          class="btn-start"
          :disabled="!checkReqs(item).valid || actionStore.loading"
          @click="handleStart(item)"
        >
          {{ !checkReqs(item).valid ? checkReqs(item).reason : '开始' }}
        </button>
      </div>

      <p v-if="!currentActions.length" class="empty-hint">暂无可用行为</p>
    </div>

    <!-- ===== 任务进行中的行为列表占位 ===== -->
    <div v-else class="task-active-hint">
      <p>任务进行中，完成后可开始新任务</p>
    </div>

    <!-- ===== 奖励结算弹窗 ===== -->
    <div v-if="actionStore.collectResult" class="reward-overlay" @click.self="actionStore.clearCollectResult()">
      <div class="reward-modal">
        <h2>结算完成</h2>
        <p class="reward-title">{{ actionStore.collectResult.actionName }}</p>
        <div class="reward-details">
          <div class="reward-row" v-if="actionStore.collectResult.rewards.expGained">
            <span class="rw-label">经验</span>
            <span class="rw-value exp">+{{ actionStore.collectResult.rewards.expGained }}</span>
          </div>
          <div class="reward-row" v-if="actionStore.collectResult.rewards.goldGained">
            <span class="rw-label">金币</span>
            <span class="rw-value gold">+{{ actionStore.collectResult.rewards.goldGained }}</span>
          </div>
          <div class="reward-row" v-for="(val, key) in actionStore.collectResult.rewards.attrGains" :key="key">
            <span class="rw-label">{{ attrName(key) }}</span>
            <span class="rw-value attr">+{{ val }}</span>
          </div>
          <div class="reward-row" v-for="item in actionStore.collectResult.rewards.itemsGained" :key="item.itemId">
            <span class="rw-label">物品</span>
            <span class="rw-value item">{{ item.itemId }} x{{ item.count }}</span>
          </div>
          <div class="reward-row" v-if="actionStore.collectResult.rewards.leveledUp">
            <span class="rw-label">升级</span>
            <span class="rw-value lvlup">Lv.{{ actionStore.collectResult.rewards.newLevel }}</span>
          </div>
        </div>
        <div class="reward-mood">
          心情: {{ actionStore.collectResult.moodLevel }}
          (x{{ actionStore.collectResult.moodMultiplier }})
        </div>
        <button class="btn-confirm" @click="actionStore.clearCollectResult()">确定</button>
      </div>
    </div>

    <!-- 错误提示 -->
    <p v-if="actionStore.error" class="error-msg">{{ actionStore.error }}</p>
  </div>
</template>

<script setup>
import { ref, computed, onMounted, onUnmounted } from 'vue';
import { useActionStore } from '@/stores/action';
import { useUserStore } from '@/stores/user';

const actionStore = useActionStore();
const userStore = useUserStore();

const activeType = ref('study');

const types = [
  { key: 'study', label: '学习' },
  { key: 'work', label: '打工' },
  { key: 'mining', label: '挖矿' },
  { key: 'woodcut', label: '伐木' },
  { key: 'fishing', label: '钓鱼' },
];

const currentActions = computed(() => {
  return actionStore.actionList[activeType.value] || [];
});

// ---------- 初始化 ----------
onMounted(async () => {
  await actionStore.fetchActionList();
  await actionStore.fetchTaskStatus();
  if (actionStore.hasTask) {
    actionStore.startPolling();
  }
});

onUnmounted(() => {
  actionStore.stopPolling();
});

// ---------- 操作 ----------

async function handleStart(item) {
  try {
    await actionStore.startAction(activeType.value, item.id);
  } catch { /* store 已处理 */ }
}

async function handleCollect() {
  try {
    await actionStore.collectAction();
  } catch { /* store 已处理 */ }
}

async function handleCancel() {
  try {
    await actionStore.cancelAction();
  } catch { /* store 已处理 */ }
}

// ---------- 需求检查 ----------

function getPlayerEducation() {
  const skills = userStore.player?.skills || [];
  const studySkill = skills.find((s) => s.skillId && s.skillId.startsWith('study_'));
  return studySkill ? studySkill.skillId.replace('study_', '') : null;
}

function checkReqItem(key, required) {
  const p = userStore.player;
  if (!p) return false;
  switch (key) {
    case 'level': return p.level >= required;
    case 'gold': return (p.currency?.gold || 0) >= required;
    case 'education': return getPlayerEducation() === required;
    case 'strength':
    case 'intelligence':
    case 'charm':
      return (p.lifeAttributes?.[key] || 0) >= required;
    default: return true;
  }
}

function checkReqs(item) {
  if (!item.requirements) return { valid: true, reason: '' };
  for (const [key, val] of Object.entries(item.requirements)) {
    if (!checkReqItem(key, val)) {
      return { valid: false, reason: `需 ${reqName(key)}${val}` };
    }
  }
  return { valid: true, reason: '' };
}

// ---------- 格式化工具 ----------

function typeLabel(t) {
  const map = { study: '学习', work: '打工', mining: '挖矿', woodcut: '伐木', fishing: '钓鱼' };
  return map[t] || t;
}

function reqName(k) {
  const map = { level: '等级', gold: '金币', education: '学历', strength: '武力', intelligence: '智力', charm: '魅力' };
  return map[k] || k;
}

function attrName(k) {
  const map = { strength: '武力', intelligence: '智力', charm: '魅力', energy: '精力', mood: '心情', hunger: '饥饿', health: '健康', clean: '清洁' };
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
.action-panel {
  display: flex;
  flex-direction: column;
  gap: 12px;
  height: 100%;
}

/* ===== 任务进度条 ===== */
.task-progress {
  background: rgba(233, 69, 96, 0.08);
  border: 1px solid rgba(233, 69, 96, 0.2);
  border-radius: 8px;
  padding: 14px;
}

.task-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 10px;
}

.task-name {
  font-size: 14px;
  color: #fff;
  font-weight: bold;
}

.task-type-tag {
  font-size: 11px;
  padding: 2px 8px;
  background: rgba(233, 69, 96, 0.15);
  border-radius: 4px;
  color: #e94560;
}

.progress-bar-wrap {
  display: flex;
  align-items: center;
  gap: 10px;
  margin-bottom: 10px;
}

.progress-bar {
  flex: 1;
  height: 8px;
  background: rgba(255, 255, 255, 0.08);
  border-radius: 4px;
  overflow: hidden;
}

.progress-fill {
  height: 100%;
  background: linear-gradient(90deg, #e94560, #f0c040);
  border-radius: 4px;
  transition: width 1s linear;
}

.progress-text {
  font-size: 12px;
  color: rgba(255, 255, 255, 0.6);
  width: 36px;
  text-align: right;
}

.task-times {
  display: flex;
  gap: 16px;
  margin-bottom: 10px;
}

.time-item {
  display: flex;
  flex-direction: column;
  gap: 2px;
}

.time-label {
  font-size: 10px;
  color: rgba(255, 255, 255, 0.4);
}

.time-value {
  font-size: 13px;
  color: #fff;
  font-family: monospace;
}

.task-actions {
  display: flex;
  gap: 8px;
}

.btn-collect {
  flex: 1;
  height: 34px;
  font-size: 13px;
  font-weight: bold;
  color: #1a1a2e;
  background: linear-gradient(135deg, #f0c040, #e0a020);
  border: none;
  border-radius: 6px;
  cursor: pointer;
  animation: pulse 1.5s ease-in-out infinite;
}

@keyframes pulse {
  0%, 100% { opacity: 1; }
  50% { opacity: 0.7; }
}

.btn-collect:disabled {
  opacity: 0.5;
  animation: none;
}

.btn-cancel {
  flex: 1;
  height: 34px;
  font-size: 13px;
  color: rgba(255, 255, 255, 0.5);
  background: rgba(255, 255, 255, 0.06);
  border: 1px solid rgba(255, 255, 255, 0.1);
  border-radius: 6px;
  cursor: pointer;
}

.btn-cancel:hover { color: #e94560; border-color: #e94560; }

/* ===== 类型标签 ===== */
.type-tabs {
  display: flex;
  gap: 4px;
  flex-shrink: 0;
}

.type-tab {
  flex: 1;
  height: 30px;
  font-size: 12px;
  color: rgba(255, 255, 255, 0.5);
  background: rgba(255, 255, 255, 0.04);
  border: 1px solid rgba(255, 255, 255, 0.06);
  border-radius: 4px;
  cursor: pointer;
  transition: all 0.2s;
}

.type-tab:hover { color: #fff; }
.type-tab.active { color: #fff; border-color: currentColor; }
.type-tab.study.active { color: #f0c040; }
.type-tab.work.active { color: #4ecb71; }
.type-tab.mining.active { color: #c0c0c0; }
.type-tab.woodcut.active { color: #f09040; }
.type-tab.fishing.active { color: #40a0f0; }

.type-tab:disabled { opacity: 0.4; cursor: not-allowed; }

/* ===== 行为列表 ===== */
.action-list {
  flex: 1;
  overflow-y: auto;
  display: flex;
  flex-direction: column;
  gap: 8px;
}

.empty-hint {
  text-align: center;
  color: rgba(255, 255, 255, 0.3);
  font-size: 12px;
  padding: 20px;
}

/* ===== 行为卡片 ===== */
.action-card {
  background: rgba(255, 255, 255, 0.04);
  border: 1px solid rgba(255, 255, 255, 0.06);
  border-radius: 8px;
  padding: 12px;
  transition: border-color 0.2s;
}

.action-card:hover { border-color: rgba(255, 255, 255, 0.12); }
.action-card.locked { opacity: 0.5; }

.card-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 4px;
}

.card-name {
  font-size: 14px;
  color: #fff;
  font-weight: bold;
}

.card-cost {
  font-size: 11px;
  color: #f0c040;
}

.card-desc {
  font-size: 11px;
  color: rgba(255, 255, 255, 0.4);
  margin-bottom: 6px;
}

.card-meta {
  font-size: 11px;
  color: rgba(255, 255, 255, 0.5);
  margin-bottom: 6px;
}

.card-reqs, .card-rewards {
  display: flex;
  flex-wrap: wrap;
  align-items: center;
  gap: 4px;
  font-size: 11px;
  margin-bottom: 4px;
}

.req-label, .reward-label {
  color: rgba(255, 255, 255, 0.4);
  margin-right: 2px;
}

.req-item {
  padding: 1px 6px;
  border-radius: 3px;
}

.req-item.met { color: #4ecb71; background: rgba(78, 203, 113, 0.1); }
.req-item.unmet { color: #e94560; background: rgba(233, 69, 96, 0.1); }

.reward-item { padding: 1px 6px; border-radius: 3px; }
.reward-item.exp { color: #f0c040; }
.reward-item.gold { color: #f0c040; }
.reward-item.attr { color: #40a0f0; }

.btn-start {
  width: 100%;
  height: 32px;
  margin-top: 8px;
  font-size: 12px;
  font-weight: bold;
  color: #fff;
  background: rgba(233, 69, 96, 0.2);
  border: 1px solid rgba(233, 69, 96, 0.3);
  border-radius: 4px;
  cursor: pointer;
  transition: all 0.2s;
}

.btn-start:hover:not(:disabled) {
  background: rgba(233, 69, 96, 0.4);
}

.btn-start:disabled {
  opacity: 0.4;
  cursor: not-allowed;
}

/* ===== 任务进行中占位 ===== */
.task-active-hint {
  flex: 1;
  display: flex;
  align-items: center;
  justify-content: center;
}

.task-active-hint p {
  font-size: 12px;
  color: rgba(255, 255, 255, 0.3);
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
  width: 320px;
  background: #1a1a2e;
  border: 2px solid rgba(240, 192, 64, 0.3);
  border-radius: 12px;
  padding: 28px 24px;
  text-align: center;
}

.reward-modal h2 {
  font-size: 18px;
  color: #f0c040;
  margin-bottom: 4px;
}

.reward-title {
  font-size: 13px;
  color: rgba(255, 255, 255, 0.5);
  margin-bottom: 20px;
}

.reward-details {
  display: flex;
  flex-direction: column;
  gap: 8px;
  margin-bottom: 16px;
}

.reward-row {
  display: flex;
  justify-content: space-between;
  padding: 0 20px;
  font-size: 14px;
}

.rw-label { color: rgba(255, 255, 255, 0.5); }
.rw-value.exp { color: #f0c040; }
.rw-value.gold { color: #f0c040; }
.rw-value.attr { color: #40a0f0; }
.rw-value.item { color: #4ecb71; }
.rw-value.lvlup { color: #e94560; font-weight: bold; }

.reward-mood {
  font-size: 12px;
  color: rgba(255, 255, 255, 0.4);
  margin-bottom: 20px;
}

.btn-confirm {
  width: 100%;
  height: 38px;
  font-size: 14px;
  color: #1a1a2e;
  background: #f0c040;
  border: none;
  border-radius: 6px;
  cursor: pointer;
  font-weight: bold;
}

.btn-confirm:hover { opacity: 0.9; }

/* ===== 错误提示 ===== */
.error-msg {
  text-align: center;
  font-size: 12px;
  color: #e94560;
  padding: 4px;
}
</style>
