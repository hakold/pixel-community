/**
 * WebSocket 实时系统 — 消息格式示例
 *
 * 运行方式：node examples/wsExample.js
 * （此脚本仅展示消息格式，不启动真实服务器）
 */

// ===================== 连接方式 =====================
console.log('═══════════════════════════════════════════════');
console.log('  连接方式');
console.log('═══════════════════════════════════════════════');

console.log(`
  客户端连接 URL：
    ws://localhost:3000?token=<JWT_TOKEN>

  JS 示例：
    const token = 'eyJhbGciOiJIUzI1NiIs...';
    const ws = new WebSocket(\`ws://localhost:3000?token=\${token}\`);
`);

// ===================== 消息协议 =====================
console.log('═══════════════════════════════════════════════');
console.log('  消息协议总览');
console.log('═══════════════════════════════════════════════');

const protocol = [
  { dir: 'C→S', type: 'ping',        desc: '客户端心跳',            auth: '否' },
  { dir: 'C→S', type: 'join_room',   desc: '加入房间',              auth: '是' },
  { dir: 'C→S', type: 'move',        desc: '移动/状态变更',          auth: '是' },
  { dir: 'S→C', type: 'connected',   desc: '连接成功（含玩家信息）',  auth: '-' },
  { dir: 'S→C', type: 'pong',        desc: '心跳回复',              auth: '-' },
  { dir: 'S→C', type: 'room_joined', desc: '加入房间成功（含玩家列表）', auth: '-' },
  { dir: 'S→C', type: 'player_joined', desc: '有人加入房间',         auth: '-' },
  { dir: 'S→C', type: 'player_left',   desc: '有人离开房间',         auth: '-' },
  { dir: 'S→C', type: 'player_moved',  desc: '有人移动',            auth: '-' },
  { dir: 'S→C', type: 'error',         desc: '错误消息',            auth: '-' },
];

console.log('  方向     类型             说明                    需认证');
console.log('  ─────── ──────────────── ─────────────────────── ─────');
for (const p of protocol) {
  console.log(`  ${p.dir.padEnd(8)} ${p.type.padEnd(17)} ${p.desc.padEnd(24)} ${p.auth}`);
}

// ===================== 详细消息格式 =====================
console.log('\n═══════════════════════════════════════════════');
console.log('  详细消息格式');
console.log('═══════════════════════════════════════════════');

console.log(`
  ┌─────────────────────────────────────────────────────────┐
  │ 1. 连接成功 (S→C)                                        │
  ├─────────────────────────────────────────────────────────┤
  │ {                                                       │
  │   "type": "connected",                                  │
  │   "payload": {                                          │
  │     "playerId": "663f1a2b...",                          │
  │     "characterName": "小明",                              │
  │     "message": "欢迎回来，小明"                            │
  │   }                                                     │
  │ }                                                       │
  └─────────────────────────────────────────────────────────┘

  ┌─────────────────────────────────────────────────────────┐
  │ 2. 加入房间 (C→S)                                        │
  ├─────────────────────────────────────────────────────────┤
  │ {                                                       │
  │   "type": "join_room",                                  │
  │   "payload": {                                          │
  │     "roomId": "plaza_01",                               │
  │     "x": 100,          // 可选，初始坐标                    │
  │     "y": 200           // 可选，初始坐标                    │
  │   }                                                     │
  │ }                                                       │
  └─────────────────────────────────────────────────────────┘

  ┌─────────────────────────────────────────────────────────┐
  │ 3. 加入成功，返回房间内已有玩家 (S→C)                       │
  ├─────────────────────────────────────────────────────────┤
  │ {                                                       │
  │   "type": "room_joined",                                │
  │   "payload": {                                          │
  │     "roomId": "plaza_01",                               │
  │     "players": [                                        │
  │       {                                                 │
  │         "playerId": "663f1b2c...",                      │
  │         "characterName": "小红",                          │
  │         "x": 150,                                       │
  │         "y": 300,                                       │
  │         "state": "idle",                                │
  │         "joinedAt": 1777473000000                       │
  │       }                                                 │
  │     ]                                                   │
  │   }                                                     │
  │ }                                                       │
  └─────────────────────────────────────────────────────────┘

  ┌─────────────────────────────────────────────────────────┐
  │ 4. 新玩家加入广播 (S→C) [发给房间内其他人]                  │
  ├─────────────────────────────────────────────────────────┤
  │ {                                                       │
  │   "type": "player_joined",                              │
  │   "payload": {                                          │
  │     "playerId": "663f1a2b...",                          │
  │     "characterName": "小明",                              │
  │     "x": 100,                                           │
  │     "y": 200,                                           │
  │     "state": "idle"                                     │
  │   }                                                     │
  │ }                                                       │
  └─────────────────────────────────────────────────────────┘

  ┌─────────────────────────────────────────────────────────┐
  │ 5. 移动/状态变更 (C→S)                                    │
  ├─────────────────────────────────────────────────────────┤
  │ {                                                       │
  │   "type": "move",                                       │
  │   "payload": {                                          │
  │     "x": 120,          // 新 X 坐标                       │
  │     "y": 250,          // 新 Y 坐标                       │
  │     "state": "move"    // idle | move | sit              │
  │   }                                                     │
  │ }                                                       │
  └─────────────────────────────────────────────────────────┘

  ┌─────────────────────────────────────────────────────────┐
  │ 6. 移动广播 (S→C) [发给房间内其他人]                        │
  ├─────────────────────────────────────────────────────────┤
  │ {                                                       │
  │   "type": "player_moved",                               │
  │   "payload": {                                          │
  │     "playerId": "663f1a2b...",                          │
  │     "x": 120,                                           │
  │     "y": 250,                                           │
  │     "state": "move"                                     │
  │   }                                                     │
  │ }                                                       │
  └─────────────────────────────────────────────────────────┘

  ┌─────────────────────────────────────────────────────────┐
  │ 7. 玩家离开广播 (S→C) [发给房间内其他人]                    │
  ├─────────────────────────────────────────────────────────┤
  │ {                                                       │
  │   "type": "player_left",                                │
  │   "payload": {                                          │
  │     "playerId": "663f1a2b..."                           │
  │   }                                                     │
  │ }                                                       │
  └─────────────────────────────────────────────────────────┘

  ┌─────────────────────────────────────────────────────────┐
  │ 8. 心跳 (C→S / S→C)                                      │
  ├─────────────────────────────────────────────────────────┤
  │ C→S: { "type": "ping" }                                 │
  │ S→C: { "type": "pong", "payload": { "time": 1777473... }}│
  └─────────────────────────────────────────────────────────┘

  ┌─────────────────────────────────────────────────────────┐
  │ 9. 错误 (S→C)                                            │
  ├─────────────────────────────────────────────────────────┤
  │ {                                                       │
  │   "type": "error",                                      │
  │   "payload": {                                          │
  │     "message": "你不在任何房间中，请先 join_room"           │
  │   }                                                     │
  │ }                                                       │
  └─────────────────────────────────────────────────────────┘
`);

// ===================== 典型交互流程 =====================
console.log('═══════════════════════════════════════════════');
console.log('  典型交互流程（两人进入广场）');
console.log('═══════════════════════════════════════════════');

console.log(`
  时间线 (小明先进入，小红后进入)：

  Step 1: 小明连接
    C→S: (WebSocket connect with ?token=XiaoMing_JWT)

  Step 2: 服务器确认
    S→C: connected { playerId: "u1", characterName: "小明" }

  Step 3: 小明进入广场
    C→S: join_room { roomId: "plaza_01", x: 0, y: 0 }

  Step 4: 服务器确认（广场只有小明）
    S→C: room_joined { roomId: "plaza_01", players: [] }

  ─────────── 小明已在广场等待 ───────────

  Step 5: 小红连接
    C→S: (WebSocket connect with ?token=XiaoHong_JWT)

  Step 6: 服务器确认
    S→C: connected { playerId: "u2", characterName: "小红" }

  Step 7: 小红进入广场
    C→S: join_room { roomId: "plaza_01", x: 50, y: 30 }

  Step 8: 服务器告知小红广场里已有小明
    S→C: room_joined { roomId: "plaza_01", players: [{ playerId:"u1", characterName:"小明", x:0, y:0, state:"idle" }] }

  Step 9: 服务器告知小明：小红进来了
    S→C: player_joined { playerId: "u2", characterName: "小红", x: 50, y: 30, state: "idle" }
      ↑ 此消息发给小明

  ─────────── 两人都在广场 ───────────

  Step 10: 小明向右移动
    C→S: move { x: 10, y: 0, state: "move" }

  Step 11: 服务器广播小明的移动给小红
    S→C: player_moved { playerId: "u1", x: 10, y: 0, state: "move" }
      ↑ 此消息发给小红

  Step 12: 小红坐下
    C→S: move { x: 50, y: 30, state: "sit" }

  Step 13: 服务器广播小红的状态给小明
    S→C: player_moved { playerId: "u2", x: 50, y: 30, state: "sit" }
      ↑ 此消息发给小明

  Step 14: 小红断开连接
    (WebSocket close)

  Step 15: 服务器告知小明：小红离开了
    S→C: player_left { playerId: "u2" }
      ↑ 此消息发给小明
`);

// ===================== 前端接收示例 =====================
console.log('═══════════════════════════════════════════════');
console.log('  前端 WebSocket 连接示例 (JavaScript)');
console.log('═══════════════════════════════════════════════');

console.log(`
  // 获取 token（登录后存储在 localStorage）
  const token = localStorage.getItem('token');

  // 建立连接
  const ws = new WebSocket(\`ws://localhost:3000?token=\${token}\`);

  // 存储其他玩家状态
  const remotePlayers = new Map();

  ws.onopen = () => {
    console.log('WebSocket 已连接');
  };

  ws.onmessage = (event) => {
    const { type, payload } = JSON.parse(event.data);

    switch (type) {
      case 'connected':
        console.log('已认证:', payload.characterName);
        // 进入默认房间
        ws.send(JSON.stringify({
          type: 'join_room',
          payload: { roomId: 'plaza_01', x: 0, y: 0 }
        }));
        break;

      case 'room_joined':
        // 加载房间内已有玩家
        payload.players.forEach(p => remotePlayers.set(p.playerId, p));
        renderAllPlayers(remotePlayers);
        break;

      case 'player_joined':
        // 新玩家进入
        remotePlayers.set(payload.playerId, payload);
        addPlayerSprite(payload);
        break;

      case 'player_left':
        // 玩家离开
        remotePlayers.delete(payload.playerId);
        removePlayerSprite(payload.playerId);
        break;

      case 'player_moved':
        // 玩家移动
        const p = remotePlayers.get(payload.playerId);
        if (p) {
          p.x = payload.x;
          p.y = payload.y;
          p.state = payload.state;
        }
        updatePlayerSprite(payload);
        break;

      case 'pong':
        // 心跳回复，可忽略
        break;

      case 'error':
        console.error('服务端错误:', payload.message);
        break;
    }
  };

  ws.onclose = () => {
    console.log('WebSocket 已断开');
  };

  // 本地移动时发送
  function onLocalMove(x, y, state) {
    ws.send(JSON.stringify({
      type: 'move',
      payload: { x, y, state }
    }));
  }
`);

console.log('\n═══════════════════════════════════════════════');
console.log('  消息格式示例结束');
console.log('═══════════════════════════════════════════════');
