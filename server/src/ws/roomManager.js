/**
 * 房间管理器
 *
 * 管理玩家与房间的关系，负责：
 *   — 房间创建/删除
 *   — 玩家加入/离开
 *   — 玩家位置与状态更新
 *   — 房间内玩家列表查询
 *
 * 纯内存存储，无外部依赖。
 */

// roomId → { players: Map<playerId, PlayerState> }
const rooms = new Map();

// playerId → roomId（反向索引，O(1) 查找玩家所在房间）
const playerRooms = new Map();

/**
 * 创建房间（若已存在则忽略）
 * @param {string} roomId - 房间 ID（对应地图 ID，如 'plaza_01'）
 * @returns {Map} 房间的 players Map
 */
function createRoom(roomId) {
  if (!rooms.has(roomId)) {
    rooms.set(roomId, { players: new Map() });
  }
  return rooms.get(roomId).players;
}

/**
 * 玩家加入房间
 * @param {string} roomId - 目标房间 ID
 * @param {Object} playerInfo - { playerId, characterName, x, y, state }
 * @returns {Object} 房间内其他玩家列表 [{ playerId, characterName, x, y, state }]
 */
function joinRoom(roomId, playerInfo) {
  // 若已在其他房间，先离开
  if (playerRooms.has(playerInfo.playerId)) {
    leaveRoom(playerInfo.playerId);
  }

  // 确保房间存在
  let room = rooms.get(roomId);
  if (!room) {
    createRoom(roomId);
    room = rooms.get(roomId);
  }

  // 加入新房间
  const playerState = {
    playerId: playerInfo.playerId,
    characterName: playerInfo.characterName,
    x: playerInfo.x || 0,
    y: playerInfo.y || 0,
    state: playerInfo.state || 'idle',
    joinedAt: Date.now(),
  };

  room.players.set(playerInfo.playerId, playerState);
  playerRooms.set(playerInfo.playerId, roomId);

  // 返回房间内其他玩家（排除自身）
  return Array.from(room.players.values()).filter(
    (p) => p.playerId !== playerInfo.playerId
  );
}

/**
 * 玩家离开房间
 * @param {string} playerId - 玩家 ID
 * @returns {{ roomId: string, playerState: Object|null } | null} 离开前的房间信息
 */
function leaveRoom(playerId) {
  const roomId = playerRooms.get(playerId);
  if (!roomId) return null;

  const room = rooms.get(roomId);
  const playerState = room ? room.players.get(playerId) : null;

  if (room) {
    room.players.delete(playerId);
    // 房间为空时自动清理
    if (room.players.size === 0) {
      rooms.delete(roomId);
    }
  }

  playerRooms.delete(playerId);

  return { roomId, playerState };
}

/**
 * 更新玩家位置和状态
 * @param {string} playerId - 玩家 ID
 * @param {number} x - X 坐标
 * @param {number} y - Y 坐标
 * @param {string} state - 'idle' | 'move' | 'sit'
 * @returns {Object|null} 更新后的玩家状态，玩家不在任何房间返回 null
 */
function updatePlayerState(playerId, { x, y, state }) {
  const roomId = playerRooms.get(playerId);
  if (!roomId) return null;

  const room = rooms.get(roomId);
  if (!room) return null;

  const player = room.players.get(playerId);
  if (!player) return null;

  if (x !== undefined) player.x = x;
  if (y !== undefined) player.y = y;
  if (state !== undefined) player.state = state;

  return player;
}

/**
 * 获取玩家当前所在房间 ID
 * @param {string} playerId - 玩家 ID
 * @returns {string|null}
 */
function getPlayerRoom(playerId) {
  return playerRooms.get(playerId) || null;
}

/**
 * 获取玩家当前状态
 * @param {string} playerId - 玩家 ID
 * @returns {Object|null}
 */
function getPlayerState(playerId) {
  const roomId = playerRooms.get(playerId);
  if (!roomId) return null;

  const room = rooms.get(roomId);
  return room ? room.players.get(playerId) || null : null;
}

/**
 * 获取房间内所有玩家
 * @param {string} roomId - 房间 ID
 * @returns {Array} 玩家列表
 */
function getRoomPlayers(roomId) {
  const room = rooms.get(roomId);
  if (!room) return [];
  return Array.from(room.players.values());
}

/**
 * 获取房间数量统计
 * @returns {{ rooms: number, players: number }}
 */
function getStats() {
  let totalPlayers = 0;
  for (const room of rooms.values()) {
    totalPlayers += room.players.size;
  }
  return { rooms: rooms.size, players: totalPlayers };
}

/**
 * 获取所有在线玩家 ID 列表
 * @returns {Array<string>}
 */
function getAllOnlinePlayerIds() {
  return Array.from(playerRooms.keys());
}

/**
 * 移除所有玩家的在线状态（服务关闭时调用）
 * @returns {Array<string>} 所有被移除的 playerId
 */
function clearAll() {
  const allPlayerIds = Array.from(playerRooms.keys());
  rooms.clear();
  playerRooms.clear();
  return allPlayerIds;
}

module.exports = {
  createRoom,
  joinRoom,
  leaveRoom,
  updatePlayerState,
  getPlayerRoom,
  getPlayerState,
  getRoomPlayers,
  getAllOnlinePlayerIds,
  getStats,
  clearAll,
};
