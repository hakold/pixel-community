<template>
  <div class="game-canvas-wrapper" ref="wrapper">
    <canvas ref="canvasEl" class="game-canvas"></canvas>
  </div>
</template>

<script setup>
import { ref, onMounted, onUnmounted } from 'vue';
import { createGameApp } from '@/game/game-app.js';
import { loadGameplayConfig, loadMapBundle } from '@/game/map-loader.js';
import { createNetworkManager } from '@/game/network.js';
import { useUserStore } from '@/stores/user';
import { WS_URL } from '@/config';

const emit = defineEmits(['status-change', 'action-zone', 'chat']);

const wrapper = ref(null);
const canvasEl = ref(null);

const MIN_DISPLAY_WIDTH = 640;
const PADDING = 8;

let gameApp = null;
let network = null;
let resizeObserver = null;

function applyCanvasSize() {
  const container = wrapper.value;
  const canvas = canvasEl.value;
  if (!container || !canvas) return;

  const internalW = canvas.width;
  const internalH = canvas.height;
  if (!internalW || !internalH) return;

  const containerW = container.clientWidth;
  const containerH = container.clientHeight;
  const availW = Math.max(0, containerW - PADDING * 2);
  const availH = Math.max(0, containerH - PADDING * 2);
  const fitScale = Math.min(availW / internalW, availH / internalH);

  let displayW;
  if (availW >= MIN_DISPLAY_WIDTH) {
    displayW = Math.floor(internalW * fitScale);
  } else {
    displayW = Math.floor(internalW * (MIN_DISPLAY_WIDTH / internalW));
  }
  const displayH = Math.floor(internalH * (displayW / internalW));
  canvas.style.width = displayW + 'px';
  canvas.style.height = displayH + 'px';
}

onMounted(async () => {
  const canvas = canvasEl.value;
  if (!canvas) return;

  try {
    // 1. 先连接 WebSocket
    const userStore = useUserStore();
    const token = userStore.token;
    if (token) {
      const wsUrl = `${WS_URL}?token=${encodeURIComponent(token)}`;
      network = createNetworkManager({
        url: wsUrl,
        token,
        onEvent: (msg) => handleNetworkEvent(msg)
      });
    }

    // 2. 加载配置和地图
    const gameplayConfig = await loadGameplayConfig('/data/gameplay.json');
    const mapBundle = await loadMapBundle({
      mapId: gameplayConfig.startMapId,
      gameplayConfig
    });

    // 3. 创建游戏应用 — 回调中通过 network 发送 WS 消息
    gameApp = createGameApp({
      canvas,
      gameplayConfig,
      mapBundleLoader: ({ mapId }) => loadMapBundle({ mapId, gameplayConfig }),
      initialMapBundle: mapBundle,
      onStatusChange: (status) => emit('status-change', status),
      onActionZone: (zone) => emit('action-zone', zone),
      onPlayerMove: (pos) => {
        if (network) network.send('move', { x: pos.x, y: pos.y, state: 'move' });
      },
      onMapChange: (evt) => {
        if (evt.type === 'enter' && network) {
          network.send('join_room', { roomId: evt.mapId, x: evt.x, y: evt.y });
        }
      }
    });

    // 4. 启动游戏 — 会触发 onMapChange → join_room
    gameApp.start();
    applyCanvasSize();

    resizeObserver = new ResizeObserver(() => applyCanvasSize());
    resizeObserver.observe(wrapper.value);
  } catch (err) {
    console.error('[GameCanvas] 启动失败:', err);
  }
});

onUnmounted(() => {
  if (resizeObserver) { resizeObserver.disconnect(); resizeObserver = null; }
  if (network) { network.disconnect(); network = null; }
  if (gameApp) { gameApp.destroy(); gameApp = null; }
});

// ========== WebSocket 事件处理 ==========

function handleNetworkEvent(msg) {
  switch (msg.type) {
    case 'connected':
      break;

    case 'room_joined':
      if (msg.payload?.players?.length) {
        gameApp?.setRemotePlayers(msg.payload.players);
      }
      break;

    case 'player_joined':
      gameApp?.addRemotePlayer(msg.payload);
      break;

    case 'player_left':
      gameApp?.removeRemotePlayer(msg.payload?.playerId);
      break;

    case 'player_moved':
      if (msg.payload) {
        gameApp?.setRemotePlayerTarget(msg.payload.playerId, msg.payload.x, msg.payload.y);
      }
      break;

    case 'chat_broadcast':
      emit('chat', msg.payload);
      break;

    case 'pong':
      break;

    case 'error':
      console.warn('[WS] 服务端错误:', msg.payload?.message);
      break;
  }
}

function sendChat(message) {
  if (network) network.send('chat', { message });
}

defineExpose({ sendChat });
</script>

<style scoped>
.game-canvas-wrapper {
  width: 100%;
  height: 100%;
  overflow: auto;
  display: flex;
  align-items: center;
  justify-content: center;
  background: #5b8c5a;
  padding: 8px;
}

.game-canvas {
  display: block;
  flex-shrink: 0;
  image-rendering: auto;
}
</style>
