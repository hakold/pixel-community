/**
 * WebSocket 实时通信服务
 *
 * 功能：
 *   — JWT 身份认证
 *   — 房间管理（加入/离开）
 *   — 玩家移动/状态实时广播
 *   — 心跳保活 + 断线清理
 */
const jwt = require('jsonwebtoken');
const { WebSocketServer } = require('ws');
const config = require('../config');
const roomManager = require('./roomManager');

/**
 * 初始化 WebSocket 服务
 * @param {import('http').Server} httpServer - HTTP Server 实例
 * @returns {WebSocketServer}
 */
function initWebSocket(httpServer) {
  const wss = new WebSocketServer({ server: httpServer });

  wss.on('connection', (ws, req) => {
    console.log(`[WS] 收到连接: ip=${req.socket.remoteAddress || 'unknown'} url=${req.url || '/'}`);
    // ---- Step 1: JWT 认证 ----
    const token = extractToken(req);
    let player = null;

    if (token) {
      try {
        const decoded = jwt.verify(token, config.jwt.secret);
        player = {
          id: decoded.id,
          username: decoded.username,
          characterName: decoded.characterName,
        };
      } catch (_err) {
        ws.send(msg('error', { message: '认证令牌无效或已过期' }));
        ws.close(4001, '认证失败');
        return;
      }
    }

    if (!player) {
      ws.send(msg('error', { message: '未提供认证令牌，请通过 ?token= 参数传递' }));
      ws.close(4001, '未认证');
      return;
    }

    // 挂载玩家信息到连接对象
    ws.playerId = player.id;
    ws.characterName = player.characterName;

    console.log(`[WS] 玩家连接: ${player.characterName} (${player.id})`);

    // ---- Step 2: 心跳初始化 ----
    ws.isAlive = true;
    ws.on('pong', () => {
      ws.isAlive = true;
    });

    // 发送连接成功
    sendTo(ws, 'connected', {
      playerId: player.id,
      characterName: player.characterName,
      message: `欢迎回来，${player.characterName}`,
    });

    // ---- Step 3: 消息路由 ----
    ws.on('message', (data) => {
      try {
        const message = JSON.parse(data.toString());
        console.log(`[WS] 收到消息: player=${ws.characterName} type=${message.type}`);
        routeMessage(ws, wss, message);
      } catch (_err) {
        sendTo(ws, 'error', { message: '消息格式错误，需要 JSON' });
      }
    });

    // ---- Step 4: 断线清理 ----
    ws.on('close', () => {
      const info = roomManager.leaveRoom(ws.playerId);
      if (info) {
        console.log(`[WS] 玩家离开: ${ws.characterName} 离开房间 ${info.roomId}`);
        // 广播给房间内其他玩家
        broadcastToRoom(wss, info.roomId, 'player_left', {
          playerId: ws.playerId,
        });
      }
      console.log(`[WS] 连接断开: ${ws.characterName}`);
    });

    ws.on('error', (err) => {
      console.error(`[WS] 连接错误 (${ws.characterName}):`, err.message);
    });
  });

  // ---- Step 5: 全局心跳检测 ----
  const heartbeatTimer = setInterval(() => {
    wss.clients.forEach((ws) => {
      if (ws.isAlive === false) {
        console.log('[WS] 心跳超时，断开连接');
        return ws.terminate();
      }
      ws.isAlive = false;
      ws.ping();
    });
  }, config.ws.heartbeatInterval);

  wss.on('close', () => {
    clearInterval(heartbeatTimer);
    roomManager.clearAll();
  });

  console.log('[WS] WebSocket 服务已启动 (支持房间+移动同步)');
  return wss;
}

// ===================== 消息路由 =====================

/**
 * 路由客户端消息到对应处理器
 */
function routeMessage(ws, wss, message) {
  const { type, payload } = message;

  switch (type) {
    case 'ping':
      sendTo(ws, 'pong', { time: Date.now() });
      break;

    case 'join_room':
      handleJoinRoom(ws, wss, payload);
      break;

    case 'move':
      handleMove(ws, wss, payload);
      break;

    case 'chat':
      handleChat(ws, wss, payload);
      break;

    default:
      sendTo(ws, 'error', { message: `未知消息类型: ${type}` });
  }
}

// ===================== 消息处理器 =====================

/**
 * 加入房间
 * payload: { roomId }
 */
function handleJoinRoom(ws, wss, payload) {
  if (!payload || !payload.roomId) {
    return sendTo(ws, 'error', { message: '请指定 roomId' });
  }

  const { roomId } = payload;
  console.log(`[WS] join_room: player=${ws.characterName} room=${roomId} pos=(${payload.x ?? 0},${payload.y ?? 0})`);

  // 离开旧房间（如有），广播离开消息
  const prevInfo = roomManager.leaveRoom(ws.playerId);
  if (prevInfo) {
    console.log(`[WS] 切换房间: player=${ws.characterName} from=${prevInfo.roomId} to=${roomId}`);
    broadcastToRoom(wss, prevInfo.roomId, 'player_left', {
      playerId: ws.playerId,
    });
  }

  // 加入新房间
  const otherPlayers = roomManager.joinRoom(roomId, {
    playerId: ws.playerId,
    characterName: ws.characterName,
    x: payload.x || 0,
    y: payload.y || 0,
    state: 'idle',
  });

  // 告知加入者：房间内已有玩家
  sendTo(ws, 'room_joined', {
    roomId,
    players: otherPlayers,
  });

  // 广播给房间内其他人：新玩家加入
  broadcastToRoom(wss, roomId, 'player_joined', {
    playerId: ws.playerId,
    characterName: ws.characterName,
    x: payload.x || 0,
    y: payload.y || 0,
    state: 'idle',
  }, ws.playerId);

  console.log(`[WS] ${ws.characterName} 加入房间 ${roomId}（已有 ${otherPlayers.length} 人）`);
}

/**
 * 移动/状态变更
 * payload: { x, y, state }
 */
function handleMove(ws, wss, payload) {
  if (!payload) {
    return sendTo(ws, 'error', { message: '请提供移动数据' });
  }

  const updated = roomManager.updatePlayerState(ws.playerId, {
    x: payload.x,
    y: payload.y,
    state: payload.state,
  });

  if (!updated) {
    return sendTo(ws, 'error', { message: '你不在任何房间中，请先 join_room' });
  }

  // 广播给同房间其他玩家
  const roomId = roomManager.getPlayerRoom(ws.playerId);
  console.log(`[WS] move: player=${ws.characterName} room=${roomId} -> (${updated.x},${updated.y}) state=${updated.state}`);
  broadcastToRoom(wss, roomId, 'player_moved', {
    playerId: ws.playerId,
    x: updated.x,
    y: updated.y,
    state: updated.state,
  }, ws.playerId);
}

/**
 * 聊天消息
 * payload: { message }
 */
function handleChat(ws, wss, payload) {
  if (!payload || !payload.message || !payload.message.trim()) {
    return sendTo(ws, 'error', { message: '消息不能为空' });
  }

  const roomId = roomManager.getPlayerRoom(ws.playerId);
  if (!roomId) {
    console.warn(`[WS] chat dropped: player=${ws.characterName} reason=no_room`);
    return sendTo(ws, 'error', { message: '你不在任何房间中，无法发送消息' });
  }

  console.log(`[WS] chat: player=${ws.characterName} room=${roomId} message=${JSON.stringify(payload.message.trim())}`);

  broadcastToRoom(wss, roomId, 'chat_broadcast', {
    playerId: ws.playerId,
    characterName: ws.characterName,
    message: payload.message.trim(),
    time: Date.now(),
  }, ws.playerId);
}

// ===================== 广播工具 =====================

/**
 * 向房间内所有玩家广播消息
 * @param {WebSocketServer} wss
 * @param {string} roomId
 * @param {string} type
 * @param {Object} payload
 * @param {string} [excludePlayerId] 排除的玩家 ID
 */
function broadcastToRoom(wss, roomId, type, payload, excludePlayerId) {
  const roomPlayers = roomManager.getRoomPlayers(roomId);
  const playerIds = new Set(roomPlayers.map((p) => p.playerId));
  if (excludePlayerId) playerIds.delete(excludePlayerId);

  const data = JSON.stringify({ type, payload });
  const recipients = [];

  wss.clients.forEach((client) => {
    if (client.playerId && playerIds.has(client.playerId) && client.readyState === 1) {
      recipients.push(client.characterName || client.playerId);
      client.send(data);
    }
  });

  console.log(
    `[WS] broadcast: type=${type} room=${roomId} recipients=${recipients.length ? recipients.join(',') : '(none)'} exclude=${excludePlayerId || '(none)'}`
  );
}

/**
 * 向单个客户端发送消息
 */
function sendTo(ws, type, payload) {
  if (ws.readyState === 1) {
    ws.send(JSON.stringify({ type, payload }));
  }
}

/**
 * 快捷构造消息对象
 */
function msg(type, payload) {
  return JSON.stringify({ type, payload });
}

/**
 * 从 URL 提取 token 参数
 */
function extractToken(req) {
  const params = new URLSearchParams(req.url.split('?')[1] || '');
  return params.get('token') || null;
}

module.exports = { initWebSocket };
