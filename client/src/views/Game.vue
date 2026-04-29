<template>
  <div class="game-page">
    <!-- 顶部导航 -->
    <header class="game-header">
      <h1 class="game-logo">像素社区</h1>
      <div class="header-right">
        <span class="player-name">{{ userStore.player?.characterName }}</span>
        <span class="level-badge">Lv.{{ userStore.player?.level }}</span>
        <button class="btn-logout" @click="handleLogout">退出</button>
      </div>
    </header>

    <!-- 主体 -->
    <main class="game-main">
      <!-- 左侧：角色信息 -->
      <section class="panel player-info">
        <h2>角色信息</h2>
        <div class="info-grid">
          <div class="info-item">
            <span class="label">角色名</span>
            <span class="value">{{ userStore.player?.characterName }}</span>
          </div>
          <div class="info-item">
            <span class="label">等级</span>
            <span class="value">Lv.{{ userStore.player?.level }}</span>
          </div>
          <div class="info-item">
            <span class="label">经验</span>
            <span class="value">{{ userStore.player?.exp }}</span>
          </div>
          <div class="info-item">
            <span class="label">金币</span>
            <span class="value">{{ userStore.player?.currency?.gold }}</span>
          </div>
          <div class="info-item">
            <span class="label">点券</span>
            <span class="value">{{ userStore.player?.currency?.coupon }}</span>
          </div>
        </div>
      </section>

      <!-- 中间：属性面板 -->
      <section class="panel attr-panel">
        <h2>生活属性</h2>
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

        <h2 style="margin-top: 20px;">三维属性</h2>
        <div class="info-grid">
          <div class="info-item">
            <span class="label">武力</span>
            <span class="value">{{ attr('strength') }}</span>
          </div>
          <div class="info-item">
            <span class="label">智力</span>
            <span class="value">{{ attr('intelligence') }}</span>
          </div>
          <div class="info-item">
            <span class="label">魅力</span>
            <span class="value">{{ attr('charm') }}</span>
          </div>
        </div>

        <h2 style="margin-top: 20px;">战斗属性</h2>
        <div class="info-grid">
          <div class="info-item">
            <span class="label">攻击</span>
            <span class="value">{{ userStore.player?.battleAttributes?.attack }}</span>
          </div>
          <div class="info-item">
            <span class="label">防御</span>
            <span class="value">{{ userStore.player?.battleAttributes?.defense }}</span>
          </div>
          <div class="info-item">
            <span class="label">速度</span>
            <span class="value">{{ userStore.player?.battleAttributes?.speed }}</span>
          </div>
          <div class="info-item">
            <span class="label">生命</span>
            <span class="value">{{ userStore.player?.battleAttributes?.hp }} / {{ userStore.player?.battleAttributes?.maxHp }}</span>
          </div>
        </div>
      </section>

      <!-- 右侧：行为面板 -->
      <section class="panel action-section">
        <h2>挂机行为</h2>
        <ActionPanel />
      </section>
    </main>
  </div>
</template>

<script setup>
import { useRouter } from 'vue-router';
import { useUserStore } from '@/stores/user';
import ActionPanel from '@/components/ActionPanel.vue';

const router = useRouter();
const userStore = useUserStore();

function attr(key) {
  return userStore.player?.lifeAttributes?.[key] ?? 0;
}

function handleLogout() {
  userStore.doLogout();
  router.replace('/login');
}
</script>

<style scoped>
.game-page {
  width: 100vw;
  height: 100vh;
  display: flex;
  flex-direction: column;
  background: linear-gradient(135deg, #16213e 0%, #1a1a2e 50%, #0f3460 100%);
  color: #e0e0e0;
  overflow: hidden;
}

/* 顶部导航 */
.game-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 0 24px;
  height: 56px;
  background: rgba(0, 0, 0, 0.3);
  border-bottom: 1px solid rgba(255, 255, 255, 0.08);
  flex-shrink: 0;
}

.game-logo {
  font-size: 20px;
  color: #e94560;
  letter-spacing: 6px;
}

.header-right {
  display: flex;
  align-items: center;
  gap: 12px;
}

.player-name { font-size: 14px; color: #fff; }

.level-badge {
  font-size: 12px;
  padding: 2px 10px;
  background: rgba(233, 69, 96, 0.2);
  border: 1px solid rgba(233, 69, 96, 0.3);
  border-radius: 10px;
  color: #e94560;
}

.btn-logout {
  padding: 6px 16px;
  font-size: 12px;
  color: rgba(255, 255, 255, 0.6);
  background: rgba(255, 255, 255, 0.08);
  border: 1px solid rgba(255, 255, 255, 0.12);
  border-radius: 4px;
  cursor: pointer;
  transition: all 0.2s;
}

.btn-logout:hover { color: #e94560; border-color: #e94560; }

/* 主体 */
.game-main {
  flex: 1;
  display: flex;
  gap: 20px;
  padding: 24px;
  overflow: hidden;
}

.panel {
  background: rgba(255, 255, 255, 0.05);
  border: 1px solid rgba(255, 255, 255, 0.08);
  border-radius: 10px;
  padding: 20px;
}

.panel h2 {
  font-size: 15px;
  color: rgba(255, 255, 255, 0.7);
  margin-bottom: 16px;
  padding-bottom: 8px;
  border-bottom: 1px solid rgba(255, 255, 255, 0.08);
  flex-shrink: 0;
}

/* 角色信息 */
.player-info {
  width: 200px;
  flex-shrink: 0;
}

.info-grid {
  display: flex;
  flex-direction: column;
  gap: 10px;
}

.info-item {
  display: flex;
  justify-content: space-between;
  font-size: 13px;
}

.info-item .label { color: rgba(255, 255, 255, 0.5); }
.info-item .value { color: #fff; }

/* 属性面板 */
.attr-panel {
  flex: 1;
  overflow-y: auto;
}

.attr-list {
  display: flex;
  flex-direction: column;
  gap: 12px;
}

.attr-bar {
  display: flex;
  align-items: center;
  gap: 10px;
  font-size: 13px;
}

.attr-label {
  width: 36px;
  color: rgba(255, 255, 255, 0.6);
  text-align: right;
  flex-shrink: 0;
}

.bar-track {
  flex: 1;
  height: 14px;
  background: rgba(255, 255, 255, 0.08);
  border-radius: 7px;
  overflow: hidden;
}

.bar-fill {
  height: 100%;
  border-radius: 7px;
  transition: width 0.5s;
}

.bar-fill.energy { background: #f0c040; }
.bar-fill.mood { background: #e94560; }
.bar-fill.hunger { background: #f09040; }
.bar-fill.health { background: #4ecb71; }
.bar-fill.clean { background: #40a0f0; }

.attr-val {
  width: 28px;
  color: #fff;
  flex-shrink: 0;
}

/* 行为面板 */
.action-section {
  width: 360px;
  flex-shrink: 0;
  display: flex;
  flex-direction: column;
  overflow: hidden;
}
</style>
