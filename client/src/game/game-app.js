import { createProjection } from "./isometric.js";
import { createMapModel } from "./map-model.js";
import { findPath } from "./pathfinding.js";
import { createRenderer } from "./renderer.js";

/**
 * 游戏运行时
 * 管理场景状态、输入、移动、地图切换、远程玩家
 */
export function createGameApp({ canvas, gameplayConfig, mapBundleLoader, initialMapBundle, tileManifest, characterManifest, onStatusChange, onActionZone, onPlayerMove, onMapChange }) {
  let scene = createScene(initialMapBundle);
  let lastFrameTime = performance.now();
  let hoverTile = null;
  let isTransitioning = false;
  let currentZone = null;
  let prevTileX = scene.player.tileX;
  let prevTileY = scene.player.tileY;

  // 状态信息（供 Vue 读取）
  let status = {
    playerPosition: "",
    hoverTile: "",
    pathInfo: "",
    mapName: ""
  };

  function emitStatus() {
    if (onStatusChange) onStatusChange({ ...status });
  }

  function createScene(mapBundle) {
    const mapModel = createMapModel(mapBundle.mapConfig);
    const projection = createProjection(mapModel.grid);
    const renderer = createRenderer({
      canvas, mapModel, projection,
      visualConfig: gameplayConfig.visuals,
      tileManifest,
      characterManifest
    });
    const player = createPlayerState(mapModel, gameplayConfig);
    const dummies = createDummyActors(mapBundle.mapConfig, gameplayConfig);
    const remotePlayers = [];
    return { mapId: mapModel.mapId, mapModel, projection, renderer, player, dummies, remotePlayers };
  }

  function createPlayerState(mapModel, config) {
    return {
      actorId: "player_self",
      nickname: "你",
      tileX: mapModel.player.spawnX,
      tileY: mapModel.player.spawnY,
      worldX: mapModel.player.spawnX,
      worldY: mapModel.player.spawnY,
      moveSpeedTilesPerSecond:
        mapModel.player.moveSpeedTilesPerSecond ?? config.player.baseMoveSpeedTilesPerSecond,
      bodyColor: config.player.selfBodyColor,
      hairColor: config.player.selfHairColor,
      path: [],
      lastStepDirection: "down"
    };
  }

  function createDummyActors(mapConfig, config) {
    return (mapConfig.dummies ?? []).map((dummyConfig, index) => ({
      actorId: dummyConfig.actorId ?? `dummy_${index + 1}`,
      nickname: dummyConfig.nickname ?? `居民${index + 1}`,
      tileX: dummyConfig.spawnX,
      tileY: dummyConfig.spawnY,
      worldX: dummyConfig.spawnX,
      worldY: dummyConfig.spawnY,
      moveSpeedTilesPerSecond:
        dummyConfig.moveSpeedTilesPerSecond ?? config.dummy.defaultMoveSpeedTilesPerSecond,
      bodyColor: dummyConfig.bodyColor ?? config.dummy.bodyPalette[index % config.dummy.bodyPalette.length],
      hairColor: dummyConfig.hairColor ?? config.dummy.hairPalette[index % config.dummy.hairPalette.length],
      behavior: dummyConfig.behavior ?? "idle",
      patrolLoop: dummyConfig.patrolLoop ?? [],
      patrolIndex: 0,
      idleCooldownSeconds: 0.8 + index * 0.2,
      path: [],
      lastStepDirection: "down"
    }));
  }

  function getTileFromPointer(event) {
    const rect = canvas.getBoundingClientRect();
    const scaleX = canvas.width / rect.width;
    const scaleY = canvas.height / rect.height;
    const screenX = (event.clientX - rect.left) * scaleX;
    const screenY = (event.clientY - rect.top) * scaleY;
    const tile = scene.projection.screenToGrid(screenX, screenY);
    if (!scene.mapModel.isInsideBounds(tile.x, tile.y)) return null;
    return tile;
  }

  function updateActorMovement(actor, deltaSeconds) {
    if (actor.path.length === 0) {
      actor.tileX = Math.round(actor.worldX);
      actor.tileY = Math.round(actor.worldY);
      return false;
    }
    const nextStep = actor.path[0];
    const dx = nextStep.x - actor.worldX;
    const dy = nextStep.y - actor.worldY;
    const distance = Math.hypot(dx, dy);
    if (distance < 0.02) {
      actor.worldX = nextStep.x;
      actor.worldY = nextStep.y;
      actor.tileX = nextStep.x;
      actor.tileY = nextStep.y;
      actor.path.shift();
      return true;
    }
    const stepDistance = Math.min(actor.moveSpeedTilesPerSecond * deltaSeconds, distance);
    actor.worldX += (dx / distance) * stepDistance;
    actor.worldY += (dy / distance) * stepDistance;
    actor.lastStepDirection = dx > 0 ? "right" : dx < 0 ? "left" : dy > 0 ? "down" : "up";
    return false;
  }

  function updateDummyBehavior(dummy, deltaSeconds) {
    const arrivedAtStep = updateActorMovement(dummy, deltaSeconds);
    if (dummy.path.length > 0 || dummy.behavior !== "patrol") return;
    dummy.idleCooldownSeconds -= deltaSeconds;
    if (dummy.idleCooldownSeconds > 0 && !arrivedAtStep) return;
    const target = dummy.patrolLoop[dummy.patrolIndex];
    dummy.patrolIndex = (dummy.patrolIndex + 1) % dummy.patrolLoop.length;
    dummy.idleCooldownSeconds = gameplayConfig.dummy.patrolPauseSeconds;
    if (!target) return;
    const path = findPath({
      startX: dummy.tileX, startY: dummy.tileY,
      targetX: target.x, targetY: target.y,
      isWalkable: (x, y) => scene.mapModel.isWalkable(x, y)
    });
    if (path) dummy.path = path;
  }

  async function tryEnterPortal() {
    if (isTransitioning) return;
    const portal = scene.mapModel.findPortalAt(scene.player.tileX, scene.player.tileY);
    if (!portal) return;
    isTransitioning = true;
    status.pathInfo = `切换地图：${scene.mapModel.name} → ${portal.targetMapId}`;
    emitStatus();

    // 离开旧地图
    if (onMapChange) onMapChange({ type: 'leave', mapId: scene.mapId });

    const nextBundle = await mapBundleLoader({ mapId: portal.targetMapId });
    scene = createScene(nextBundle);
    scene.player.tileX = portal.targetX;
    scene.player.tileY = portal.targetY;
    scene.player.worldX = portal.targetX;
    scene.player.worldY = portal.targetY;
    scene.player.path = [];
    prevTileX = scene.player.tileX;
    prevTileY = scene.player.tileY;
    hoverTile = null;
    currentZone = null;
    if (onActionZone) onActionZone(null);
    status.mapName = scene.mapModel.name;
    status.hoverTile = "";
    status.pathInfo = `已进入 ${scene.mapModel.name}`;
    emitStatus();

    // 进入新地图
    if (onMapChange) onMapChange({ type: 'enter', mapId: scene.mapId, x: scene.player.tileX, y: scene.player.tileY });

    isTransitioning = false;
  }

  function handlePointerMove(event) {
    hoverTile = getTileFromPointer(event);
    if (hoverTile) {
      const tileType = scene.mapModel.getTile(hoverTile.x, hoverTile.y);
      const portal = scene.mapModel.findPortalAt(hoverTile.x, hoverTile.y);
      const zone = scene.mapModel.findActionZoneAt(hoverTile.x, hoverTile.y);
      let parts = [`(${hoverTile.x}, ${hoverTile.y}) ${tileType}`];
      if (zone) parts.push(`[${zone.label}]`);
      if (portal) parts.push(`→ ${portal.targetMapId}`);
      status.hoverTile = parts.join(" ");
    } else {
      status.hoverTile = "-";
    }
    emitStatus();
  }

  function handlePointerLeave() {
    hoverTile = null;
    status.hoverTile = "-";
    emitStatus();
  }

  function handleClick(event) {
    if (isTransitioning) return;
    const tile = getTileFromPointer(event);
    if (!tile) return;
    const path = findPath({
      startX: scene.player.tileX, startY: scene.player.tileY,
      targetX: tile.x, targetY: tile.y,
      isWalkable: (x, y) => scene.mapModel.isWalkable(x, y)
    });
    if (!path) {
      status.pathInfo = "该格子不可到达";
      emitStatus();
      return;
    }
    scene.player.path = path;
    status.pathInfo = path.length === 0 ? "已在目标格" : `移动中，还剩 ${path.length} 步`;
    emitStatus();
  }

  function tick(now) {
    const deltaSeconds = (now - lastFrameTime) / 1000;
    lastFrameTime = now;

    const arrived = updateActorMovement(scene.player, deltaSeconds);
    if (arrived && scene.player.path.length === 0) {
      status.pathInfo = "已到达";
      emitStatus();
      tryEnterPortal();
    } else if (scene.player.path.length > 0) {
      status.pathInfo = `移动中，还剩 ${scene.player.path.length} 步`;
      emitStatus();
    }

    // 检测玩家格坐标变化 → 通知外部（用于 WS 广播）
    if (scene.player.tileX !== prevTileX || scene.player.tileY !== prevTileY) {
      prevTileX = scene.player.tileX;
      prevTileY = scene.player.tileY;
      if (onPlayerMove) onPlayerMove({ x: scene.player.tileX, y: scene.player.tileY });
    }

    for (const dummy of scene.dummies) {
      updateDummyBehavior(dummy, deltaSeconds);
    }

    // 远程玩家移动动画
    for (const rp of scene.remotePlayers) {
      updateActorMovement(rp, deltaSeconds);
    }

    status.playerPosition = `(${scene.player.tileX}, ${scene.player.tileY}) / ${scene.mapModel.name}`;
    emitStatus();

    // 行为区进出检测
    const zone = scene.mapModel.findActionZoneAt(scene.player.tileX, scene.player.tileY);
    if (zone?.id !== currentZone?.id) {
      currentZone = zone || null;
      if (onActionZone) onActionZone(currentZone);
    }

    scene.renderer.render({
      hoverTile,
      player: scene.player,
      dummies: scene.dummies,
      remotePlayers: scene.remotePlayers
    });
    requestAnimationFrame(tick);
  }

  // ---- 公开 API ----

  function addRemotePlayer(info) {
    // 移除旧数据（如有）
    scene.remotePlayers = scene.remotePlayers.filter((rp) => rp.actorId !== info.playerId);
    scene.remotePlayers.push({
      actorId: info.playerId,
      nickname: info.characterName || info.playerId,
      tileX: info.x,
      tileY: info.y,
      worldX: info.x,
      worldY: info.y,
      moveSpeedTilesPerSecond: gameplayConfig.player.baseMoveSpeedTilesPerSecond,
      bodyColor: "#6ea4bf",
      hairColor: "#2f4858",
      path: [],
      lastStepDirection: "down"
    });
  }

  function removeRemotePlayer(playerId) {
    scene.remotePlayers = scene.remotePlayers.filter((rp) => rp.actorId !== playerId);
  }

  function setRemotePlayerTarget(playerId, x, y) {
    const rp = scene.remotePlayers.find((p) => p.actorId === playerId);
    if (!rp) return;
    // 创建单步路径让角色插值走过去
    rp.path = [{ x, y }];
  }

  function setRemotePlayers(players) {
    scene.remotePlayers = players.map((info) => ({
      actorId: info.playerId,
      nickname: info.characterName || info.playerId,
      tileX: info.x,
      tileY: info.y,
      worldX: info.x,
      worldY: info.y,
      moveSpeedTilesPerSecond: gameplayConfig.player.baseMoveSpeedTilesPerSecond,
      bodyColor: "#6ea4bf",
      hairColor: "#2f4858",
      path: [],
      lastStepDirection: "down"
    }));
  }

  return {
    start() {
      canvas.addEventListener("mousemove", handlePointerMove);
      canvas.addEventListener("mouseleave", handlePointerLeave);
      canvas.addEventListener("click", handleClick);
      status.mapName = scene.mapModel.name;
      status.pathInfo = getPortalHintText();
      emitStatus();
      requestAnimationFrame(tick);
      // 初始地图进入
      if (onMapChange) onMapChange({ type: 'enter', mapId: scene.mapId, x: scene.player.tileX, y: scene.player.tileY });
    },
    destroy() {
      canvas.removeEventListener("mousemove", handlePointerMove);
      canvas.removeEventListener("mouseleave", handlePointerLeave);
      canvas.removeEventListener("click", handleClick);
    },
    getStatus() {
      return { ...status };
    },
    addRemotePlayer,
    removeRemotePlayer,
    setRemotePlayerTarget,
    setRemotePlayers
  };

  function getPortalHintText() {
    if (scene.mapModel.portals.length === 0) return "当前地图没有配置入口";
    return "入口: " + scene.mapModel.portals.map((p) => `${p.id} (${p.x},${p.y})`).join(", ");
  }
}
