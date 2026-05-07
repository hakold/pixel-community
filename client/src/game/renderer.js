import { TILE } from "./tile-types.js";

/**
 * 无状态渲染器 — 按场景快照绘制 Canvas
 * 角色按 Y 坐标深度排序保证遮挡正确
 *
 * 地块渲染由 tileManifest 驱动：
 *   - sprite 存在且加载成功 → ctx.drawImage()
 *   - 否则 → procedural fallback（diamond / block）
 */
export function createRenderer({ canvas, mapModel, projection, visualConfig, tileManifest, characterManifest }) {
  const ctx = canvas.getContext("2d");
  const { grid } = mapModel;
  const halfTileWidth = projection.halfTileWidth;
  const halfTileHeight = projection.halfTileHeight;

  canvas.width = grid.width * grid.tileWidth + grid.originOffsetX * 2;
  canvas.height = grid.height * grid.tileHeight + 520;

  // ---- sprite 预加载 ----
  const imageCache = {};

  function preloadSprites(manifest, entriesKey) {
    if (manifest && manifest[entriesKey]) {
      for (const [, cfg] of Object.entries(manifest[entriesKey])) {
        if (cfg.sprite && !imageCache[cfg.sprite]) {
          const img = new Image();
          img.src = cfg.sprite;
          imageCache[cfg.sprite] = img;
        }
      }
    }
  }
  preloadSprites(tileManifest, 'tiles');
  preloadSprites(characterManifest, 'characters');

  // ---- procedural 绘制工具 ----

  function drawDiamond(centerX, centerY, fillStyle, strokeStyle) {
    ctx.beginPath();
    ctx.moveTo(centerX, centerY);
    ctx.lineTo(centerX + halfTileWidth, centerY + halfTileHeight);
    ctx.lineTo(centerX, centerY + grid.tileHeight);
    ctx.lineTo(centerX - halfTileWidth, centerY + halfTileHeight);
    ctx.closePath();
    ctx.fillStyle = fillStyle;
    ctx.fill();
    ctx.strokeStyle = strokeStyle;
    ctx.stroke();
  }

  function drawBlock(centerX, centerY, colors, isDoor = false) {
    const topY = centerY - grid.blockHeight;

    // 顶面
    ctx.beginPath();
    ctx.moveTo(centerX, topY);
    ctx.lineTo(centerX + halfTileWidth, topY + halfTileHeight);
    ctx.lineTo(centerX, topY + grid.tileHeight);
    ctx.lineTo(centerX - halfTileWidth, topY + halfTileHeight);
    ctx.closePath();
    ctx.fillStyle = colors.top;
    ctx.fill();
    ctx.strokeStyle = "rgba(68, 42, 29, 0.35)";
    ctx.stroke();

    // 左面
    ctx.beginPath();
    ctx.moveTo(centerX - halfTileWidth, topY + halfTileHeight);
    ctx.lineTo(centerX, topY + grid.tileHeight);
    ctx.lineTo(centerX, centerY + grid.tileHeight);
    ctx.lineTo(centerX - halfTileWidth, centerY + halfTileHeight);
    ctx.closePath();
    ctx.fillStyle = colors.left;
    ctx.fill();

    // 右面
    ctx.beginPath();
    ctx.moveTo(centerX, topY + grid.tileHeight);
    ctx.lineTo(centerX + halfTileWidth, topY + halfTileHeight);
    ctx.lineTo(centerX + halfTileWidth, centerY + halfTileHeight);
    ctx.lineTo(centerX, centerY + grid.tileHeight);
    ctx.closePath();
    ctx.fillStyle = colors.right;
    ctx.fill();

    if (isDoor) {
      ctx.fillStyle = "#563427";
      ctx.fillRect(centerX - 12, centerY + 2, 24, 32);
      ctx.fillStyle = "#d4b07f";
      ctx.beginPath();
      ctx.arc(centerX + 7, centerY + 18, 2.5, 0, Math.PI * 2);
      ctx.fill();
    }
  }

  // ---- manifest 驱动的 tile 渲染 ----

  function drawTileConfig(centerX, centerY, config) {
    // 优先 sprite
    if (config.sprite) {
      const img = imageCache[config.sprite];
      if (img && img.complete && img.naturalWidth > 0) {
        const anchorX = centerX - img.naturalWidth * (config.anchor?.x ?? 0.5);
        const anchorY = centerY - img.naturalHeight * (config.anchor?.y ?? 0.5);
        ctx.drawImage(img, anchorX, anchorY);
        return;
      }
    }

    // procedural fallback
    if (!config.render) return;
    const { mode, colors } = config.render;

    if (mode === "diamond") {
      drawDiamond(centerX, centerY, colors.fill, colors.stroke);
      if (colors.highlight) {
        drawDiamond(centerX, centerY + 2, colors.highlight, "transparent");
      }
    } else if (mode === "block") {
      const isDoor = colors.top === "#d8c4a0";
      drawBlock(centerX, centerY, colors, isDoor);
    }
  }

  // 硬编码 procedural 保底 —— manifest 加载失败时也能正常渲染
  const HARD_FALLBACK = {
    grass:   { render: { mode: "diamond", colors: { fill: "#97c977", stroke: "rgba(53, 85, 33, 0.2)", highlight: "rgba(255,255,255,0.03)" } } },
    road:    { render: { mode: "diamond", colors: { fill: "#e6d8bc", stroke: "rgba(102, 84, 61, 0.18)" } } },
    interior:{ render: { mode: "diamond", colors: { fill: "#f2e5cc", stroke: "rgba(124, 96, 69, 0.18)" } } },
    building:{ render: { mode: "block",   colors: { top: "#b8795a", left: "#8f563f", right: "#744130" } } },
    door:    { render: { mode: "block",   colors: { top: "#d8c4a0", left: "#9a7a5b", right: "#7d5f44" } } }
  };

  function getTileConfig(tileType) {
    // manifest 优先
    if (tileManifest && tileManifest.tiles && tileManifest.tiles[tileType]) {
      return tileManifest.tiles[tileType];
    }
    // 硬兜底
    return HARD_FALLBACK[tileType] ?? null;
  }

  function drawTile(x, y, tile) {
    const screen = projection.gridToScreen(x, y);
    const config = getTileConfig(tile);
    if (config) {
      drawTileConfig(screen.x, screen.y, config);
    }
  }

  function drawPortalMarkers() {
    for (const portal of mapModel.portals) {
      const screen = projection.gridToScreen(portal.x, portal.y);
      ctx.beginPath();
      ctx.ellipse(screen.x, screen.y + grid.tileHeight - 6, 18, 8, 0, 0, Math.PI * 2);
      ctx.fillStyle = "rgba(210, 109, 61, 0.28)";
      ctx.fill();

      ctx.beginPath();
      ctx.arc(screen.x, screen.y + grid.tileHeight - 14, 7, 0, Math.PI * 2);
      ctx.fillStyle = "rgba(210, 109, 61, 0.88)";
      ctx.fill();

      ctx.fillStyle = "#ffffff";
      ctx.font = "bold 10px sans-serif";
      ctx.textAlign = "center";
      ctx.textBaseline = "middle";
      ctx.fillText("门", screen.x, screen.y + grid.tileHeight - 14);
    }
  }

  function drawGroundLayer() {
    for (let y = 0; y < grid.height; y += 1) {
      for (let x = 0; x < grid.width; x += 1) {
        const tile = mapModel.tiles[y][x];
        if (tile !== TILE.BUILDING && tile !== TILE.DOOR) {
          drawTile(x, y, tile);
        }
      }
    }
  }

  function drawRaisedLayer() {
    for (let y = 0; y < grid.height; y += 1) {
      for (let x = 0; x < grid.width; x += 1) {
        const tile = mapModel.tiles[y][x];
        if (tile === TILE.BUILDING || tile === TILE.DOOR) {
          drawTile(x, y, tile);
        }
      }
    }
  }

  function drawHover(hoverTile) {
    if (!hoverTile) return;
    const screen = projection.gridToScreen(hoverTile.x, hoverTile.y);
    drawDiamond(screen.x, screen.y, "rgba(255, 227, 122, 0.38)", "rgba(214, 146, 31, 0.95)");
  }

  function drawPathPreview(path) {
    for (const step of path) {
      const screen = projection.gridToScreen(step.x, step.y);
      drawDiamond(screen.x, screen.y + 6, "rgba(100, 189, 219, 0.24)", "rgba(100, 189, 219, 0.4)");
    }
  }

  function getCharacterConfig(actorId, isPlayer) {
    if (characterManifest && characterManifest.characters) {
      // 精确 actorId 匹配
      if (characterManifest.characters[actorId]) return characterManifest.characters[actorId];
      // 玩家兜底
      if (isPlayer && characterManifest.characters['player_self']) return characterManifest.characters['player_self'];
      // NPC / remote 兜底
      const fallbackKey = actorId.startsWith('dummy_') ? 'npc_default' : 'remote_player';
      if (characterManifest.characters[fallbackKey]) return characterManifest.characters[fallbackKey];
    }
    return null;
  }

  function drawActorLabel(bodyX, bodyY, nickname, isPlayer) {
    if (!visualConfig.showActorLabels) return;
    ctx.fillStyle = "rgba(255, 255, 255, 0.67)";
    ctx.fillRect(bodyX - 45, bodyY - 78, 90, 26);
    ctx.strokeStyle = "rgba(93, 74, 48, 0.16)";
    ctx.strokeRect(bodyX - 45, bodyY - 78, 90, 26);
    ctx.fillStyle = isPlayer ? "#d26d3d" : "#5a4e3f";
    ctx.font = "bold 18px sans-serif";
    ctx.textAlign = "center";
    ctx.textBaseline = "middle";
    ctx.fillText(nickname, bodyX, bodyY - 65);
  }

  function drawActor(actor, isPlayer = false) {
    const screen = projection.gridToScreen(actor.worldX, actor.worldY);
    const bodyX = screen.x;
    const bodyY = screen.y - 4;

    // sprite 优先
    const charConfig = getCharacterConfig(actor.actorId, isPlayer);
    if (charConfig && charConfig.sprite) {
      const img = imageCache[charConfig.sprite];
      if (img && img.complete && img.naturalWidth > 0) {
        const anchorX = bodyX - img.naturalWidth * (charConfig.anchor?.x ?? 0.5);
        const anchorY = bodyY - img.naturalHeight * (charConfig.anchor?.y ?? 1.0);
        ctx.drawImage(img, anchorX, anchorY);
        drawActorLabel(bodyX, bodyY, actor.nickname, isPlayer);
        return;
      }
    }

    // procedural 保底
    const bodyColor = actor.bodyColor;
    const hairColor = actor.hairColor;

    ctx.fillStyle = "rgba(60, 44, 26, 0.18)";
    ctx.beginPath();
    ctx.ellipse(bodyX, bodyY + 34, 18, 10, 0, 0, Math.PI * 2);
    ctx.fill();

    ctx.fillStyle = "#f4d8b2";
    ctx.beginPath();
    ctx.arc(bodyX, bodyY - 18, 16, 0, Math.PI * 2);
    ctx.fill();

    ctx.fillStyle = bodyColor;
    ctx.beginPath();
    ctx.moveTo(bodyX, bodyY - 2);
    ctx.lineTo(bodyX + 20, bodyY + 14);
    ctx.lineTo(bodyX, bodyY + 30);
    ctx.lineTo(bodyX - 20, bodyY + 14);
    ctx.closePath();
    ctx.fill();

    ctx.fillStyle = "#3b2921";
    ctx.fillRect(bodyX - 9, bodyY + 26, 7, 18);
    ctx.fillRect(bodyX + 2, bodyY + 26, 7, 18);

    ctx.fillStyle = hairColor;
    ctx.beginPath();
    ctx.arc(bodyX, bodyY - 22, 17, Math.PI, Math.PI * 2);
    ctx.fill();

    drawActorLabel(bodyX, bodyY, actor.nickname, isPlayer);
  }

  function drawActors(scene) {
    const actors = [scene.player, ...scene.dummies, ...(scene.remotePlayers || [])]
      .slice()
      .sort((a, b) => a.worldY - b.worldY);
    for (const actor of actors) {
      const isLocalPlayer = actor.actorId === scene.player.actorId;
      drawActor(actor, isLocalPlayer);
    }
  }

  return {
    render(scene) {
      ctx.clearRect(0, 0, canvas.width, canvas.height);
      drawGroundLayer();
      drawPathPreview(scene.player.path);
      drawHover(scene.hoverTile);
      drawRaisedLayer();
      drawPortalMarkers();
      drawActors(scene);
    }
  };
}
