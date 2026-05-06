<template>
  <div class="action-popup-overlay" v-if="visible">
    <div class="action-popup">
      <!-- 标题 -->
      <div class="popup-header">
        <span class="zone-icon">{{ zoneIcon }}</span>
        <span class="zone-name">{{ zone?.label || '' }}</span>
        <span class="zone-type">{{ typeLabel(zone?.actionType) }}</span>
        <button class="popup-close" @click="emit('close')" title="关闭">✕</button>
      </div>

      <!-- 错误提示 -->
      <div v-if="actionError" class="action-error">{{ actionError }}</div>

      <!-- 已有任务提示 -->
      <div v-if="actionStore.hasTask" class="busy-hint">
        正在进行 {{ actionStore.task?.actionName }}，完成后可开始新任务
      </div>

      <!-- 行动列表 -->
      <div class="action-options" v-else>
        <div
          v-for="item in zoneActions"
          :key="item.id"
          class="action-row"
          :class="{ locked: !checkReqs(item).valid }"
        >
          <div class="action-row-info">
            <span class="action-name">{{ item.name }}</span>
            <span class="action-cost">精力 {{ item.energyCost || 0 }}</span>
            <span class="action-duration">· {{ formatTime(item.duration) }}</span>
          </div>
          <div class="action-row-reqs" v-if="item.requirements && Object.keys(item.requirements).length">
            <span
              v-for="(rv, rk) in item.requirements"
              :key="rk"
              class="req-tag"
              :class="{ met: checkReqItem(rk, rv), unmet: !checkReqItem(rk, rv) }"
            >{{ reqName(rk) }} {{ rv }}</span>
          </div>
          <button
            class="btn-start-action"
            :disabled="!checkReqs(item).valid || startingId === item.id"
            @click="handleStart(item)"
          >
            {{ startingId === item.id ? '...' : (!checkReqs(item).valid ? checkReqs(item).reason : '开始') }}
          </button>
        </div>

        <p v-if="!zoneActions.length" class="no-actions">暂无可用的行为</p>
      </div>

      <!-- 提示 -->
      <p class="popup-hint">离开此区域关闭</p>
    </div>
  </div>
</template>

<script setup>
import { computed, ref, onMounted, watch } from 'vue';
import { useActionStore } from '@/stores/action';
import { useUserStore } from '@/stores/user';

const props = defineProps({
  zone: { type: Object, default: null }
});

const emit = defineEmits(['start', 'close']);

const actionStore = useActionStore();
const userStore = useUserStore();

const actionError = ref('');

const visible = computed(() => !!props.zone);

onMounted(async () => {
  // 确保行为列表已加载
  if (!actionStore.actionList.study?.length) {
    await actionStore.fetchActionList();
  }
});

// 当 zone 变化时，确保数据已加载
watch(() => props.zone, async (z) => {
  if (z && !actionStore.actionList.study?.length) {
    await actionStore.fetchActionList();
  }
});

const zoneIcon = computed(() => {
  const icons = { study: '📚', work: '💼', mining: '⛏', woodcut: '🪓', fishing: '🎣' };
  return icons[props.zone?.actionType] || '📍';
});

const zoneActions = computed(() => {
  if (!props.zone) return [];
  return actionStore.actionList[props.zone.actionType] || [];
});

// ---------- 需求检查 ----------

function getPlayerEducation() {
  const skills = userStore.player?.skills || [];
  const studySkill = skills.find((s) => s.skillId?.startsWith('study_'));
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

// ---------- 操作 ----------

let startingId = null;

async function handleStart(item) {
  actionError.value = '';
  startingId = item.id;
  try {
    await actionStore.startAction(props.zone.actionType, item.id);
    emit('start');
  } catch {
    actionError.value = actionStore.error || '开始失败，请重试';
  } finally {
    startingId = null;
  }
}

// 关闭/切换区域时清除错误
watch(visible, (v) => { if (!v) actionError.value = ''; });

// ---------- 格式化 ----------

function typeLabel(t) {
  const map = { study: '学习', work: '打工', mining: '挖矿', woodcut: '伐木', fishing: '钓鱼' };
  return map[t] || t;
}

function reqName(k) {
  const map = { level: '等级', gold: '金币', education: '学历', strength: '武力', intelligence: '智力', charm: '魅力' };
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
.action-popup-overlay {
  position: absolute;
  bottom: 48px;
  left: 50%;
  transform: translateX(-50%);
  z-index: 20;
  pointer-events: none;
}

.action-popup {
  pointer-events: auto;
  width: 340px;
  max-height: 440px;
  overflow-y: auto;
  background: rgba(26, 26, 46, 0.96);
  border: 1px solid rgba(233, 69, 96, 0.25);
  border-radius: 10px;
  padding: 18px 20px;
  box-shadow: 0 8px 32px rgba(0, 0, 0, 0.5);
}

.popup-header {
  display: flex;
  align-items: center;
  gap: 8px;
  margin-bottom: 12px;
  padding-bottom: 10px;
  border-bottom: 1px solid rgba(255, 255, 255, 0.08);
}

.popup-close {
  margin-left: auto;
  width: 24px;
  height: 24px;
  padding: 0;
  font-size: 14px;
  line-height: 1;
  color: rgba(255, 255, 255, 0.4);
  background: rgba(255, 255, 255, 0.06);
  border: 1px solid rgba(255, 255, 255, 0.08);
  border-radius: 4px;
  cursor: pointer;
  flex-shrink: 0;
}
.popup-close:hover { color: #e94560; background: rgba(233, 69, 96, 0.15); }

.zone-icon { font-size: 20px; }

.zone-name {
  font-size: 16px;
  color: #fff;
  font-weight: bold;
}

.zone-type {
  font-size: 11px;
  padding: 2px 8px;
  background: rgba(233, 69, 96, 0.15);
  border-radius: 4px;
  color: #e94560;
  margin-left: auto;
}

/* 错误提示 */
.action-error {
  font-size: 11px;
  color: #ff6b6b;
  background: rgba(255, 107, 107, 0.1);
  padding: 8px 10px;
  border-radius: 4px;
  margin-bottom: 12px;
  text-align: center;
}

/* 已有任务 */
.busy-hint {
  font-size: 12px;
  color: #f0c040;
  text-align: center;
  padding: 16px 0;
}

/* 行动列表 */
.action-options {
  display: flex;
  flex-direction: column;
  gap: 8px;
}

.action-row {
  padding: 10px;
  background: rgba(255, 255, 255, 0.04);
  border: 1px solid rgba(255, 255, 255, 0.06);
  border-radius: 6px;
}

.action-row.locked { opacity: 0.55; }

.action-row-info {
  display: flex;
  align-items: center;
  gap: 6px;
  margin-bottom: 4px;
}

.action-name {
  font-size: 13px;
  color: #fff;
  font-weight: bold;
}

.action-cost {
  font-size: 10px;
  color: #f0c040;
}

.action-duration {
  font-size: 10px;
  color: rgba(255, 255, 255, 0.4);
}

.action-row-reqs {
  display: flex;
  flex-wrap: wrap;
  gap: 3px;
  margin-bottom: 6px;
}

.req-tag {
  font-size: 10px;
  padding: 1px 5px;
  border-radius: 3px;
}

.req-tag.met { color: #4ecb71; background: rgba(78, 203, 113, 0.1); }
.req-tag.unmet { color: #e94560; background: rgba(233, 69, 96, 0.1); }

.btn-start-action {
  width: 100%;
  height: 26px;
  font-size: 12px;
  font-weight: bold;
  color: #fff;
  background: rgba(233, 69, 96, 0.25);
  border: 1px solid rgba(233, 69, 96, 0.3);
  border-radius: 4px;
  cursor: pointer;
  transition: all 0.15s;
}

.btn-start-action:hover:not(:disabled) {
  background: rgba(233, 69, 96, 0.45);
}

.btn-start-action:disabled {
  opacity: 0.5;
  cursor: not-allowed;
}

.no-actions {
  font-size: 12px;
  color: rgba(255, 255, 255, 0.3);
  text-align: center;
  padding: 12px;
}

.popup-hint {
  margin-top: 10px;
  font-size: 10px;
  color: rgba(255, 255, 255, 0.25);
  text-align: center;
}
</style>
