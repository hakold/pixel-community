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
  const isBlueprintMap = mapModel.renderMode === "blueprint";
  const halfTileWidth = projection.halfTileWidth;
  const halfTileHeight = projection.halfTileHeight;

  if (isBlueprintMap) {
    canvas.width = mapModel.background?.width ?? (grid.width * grid.tileWidth + grid.originOffsetX * 2);
    canvas.height = mapModel.background?.height ?? (grid.height * grid.tileHeight + grid.originOffsetY * 2);
  } else {
    canvas.width = grid.width * grid.tileWidth + grid.originOffsetX * 2;
    canvas.height = grid.height * grid.tileHeight + 520;
  }

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
  if (mapModel.background?.image && !imageCache[mapModel.background.image]) {
    const img = new Image();
    img.src = mapModel.background.image;
    imageCache[mapModel.background.image] = img;
  }

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
        const spriteScale = config.spriteScale ?? 1;
        const drawWidth = img.naturalWidth * spriteScale;
        const drawHeight = img.naturalHeight * spriteScale;
        const baseY = config.layer === "raised"
          ? centerY + grid.tileHeight
          : centerY;
        const anchorX = centerX - drawWidth * (config.anchor?.x ?? 0.5);
        const anchorY = baseY - drawHeight * (config.anchor?.y ?? 0.5);
        ctx.drawImage(img, anchorX, anchorY, drawWidth, drawHeight);
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
    grass:  { render: { mode: "diamond", colors: { fill: "#88c05d", stroke: "rgba(53, 85, 33, 0.2)", highlight: "rgba(255,255,255,0.03)" } } },
    ground: { render: { mode: "diamond", colors: { fill: "#f2e5cc", stroke: "rgba(124, 96, 69, 0.18)" } } },
    wall:   { render: { mode: "block",   colors: { top: "#d7dbe1", left: "#aeb5bf", right: "#9199a5" } } }
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

  function drawBlueprintBackground() {
    const backgroundConfig = mapModel.background ?? {};
    const img = backgroundConfig.image ? imageCache[backgroundConfig.image] : null;
    if (img && img.complete && img.naturalWidth > 0) {
      ctx.drawImage(img, 0, 0, canvas.width, canvas.height);
      return;
    }

    ctx.fillStyle = backgroundConfig.fallbackColor ?? "#7aa56d";
    ctx.fillRect(0, 0, canvas.width, canvas.height);
  }

  function drawBlueprintGridOverlay() {
    const backgroundConfig = mapModel.background ?? {};
    if (!backgroundConfig.showGrid && !backgroundConfig.showBlockedMask) return;

    for (let y = 0; y < grid.height; y += 1) {
      for (let x = 0; x < grid.width; x += 1) {
        const screen = projection.gridToScreen(x, y);
        const rectX = screen.x - halfTileWidth;
        const rectY = screen.y - halfTileHeight;

        if (backgroundConfig.showBlockedMask && !mapModel.isWalkable(x, y)) {
          ctx.fillStyle = "rgba(78, 40, 28, 0.22)";
          ctx.fillRect(rectX, rectY, grid.tileWidth, grid.tileHeight);
        }

        if (backgroundConfig.showGrid) {
          ctx.strokeStyle = "rgba(255, 255, 255, 0.12)";
          ctx.strokeRect(rectX, rectY, grid.tileWidth, grid.tileHeight);
        }
      }
    }
  }

  function drawBlueprintCell(x, y, fillStyle, strokeStyle) {
    const screen = projection.gridToScreen(x, y);
    const rectX = screen.x - halfTileWidth;
    const rectY = screen.y - halfTileHeight;
    ctx.fillStyle = fillStyle;
    ctx.fillRect(rectX + 2, rectY + 2, grid.tileWidth - 4, grid.tileHeight - 4);
    if (strokeStyle) {
      ctx.strokeStyle = strokeStyle;
      ctx.lineWidth = 2;
      ctx.strokeRect(rectX + 2, rectY + 2, grid.tileWidth - 4, grid.tileHeight - 4);
      ctx.lineWidth = 1;
    }
  }

  function getPortalStyle(portal) {
    const palette = {
      study: { fill: "rgba(240, 192, 64, 0.92)", shadow: "rgba(120, 84, 8, 0.35)" },
      work: { fill: "rgba(78, 203, 113, 0.92)", shadow: "rgba(16, 92, 41, 0.35)" },
      mining: { fill: "rgba(167, 176, 190, 0.95)", shadow: "rgba(63, 70, 82, 0.35)" },
      woodcut: { fill: "rgba(225, 137, 73, 0.95)", shadow: "rgba(120, 55, 19, 0.35)" },
      fishing: { fill: "rgba(84, 179, 230, 0.95)", shadow: "rgba(14, 85, 120, 0.35)" },
      recovery: { fill: "rgba(229, 100, 122, 0.95)", shadow: "rgba(111, 26, 42, 0.35)" },
      shop: { fill: "rgba(194, 133, 255, 0.95)", shadow: "rgba(82, 39, 124, 0.35)" },
      default: { fill: "rgba(210, 109, 61, 0.92)", shadow: "rgba(110, 50, 28, 0.35)" }
    };
    return palette[portal.actionType] ?? palette[portal.portalType] ?? palette.default;
  }

  function drawPortalMarkers() {
    const pulse = (Math.sin(performance.now() / 220) + 1) / 2;
    if (isBlueprintMap) {
      for (const portal of mapModel.portals) {
        const screen = projection.gridToScreen(portal.x, portal.y);
        const style = getPortalStyle(portal);
        const shortLabel = portal.shortLabel ?? portal.label?.slice(0, 1) ?? "门";

        ctx.beginPath();
        ctx.ellipse(screen.x, screen.y + halfTileHeight + 8, 16, 7, 0, 0, Math.PI * 2);
        ctx.fillStyle = style.shadow;
        ctx.fill();

        ctx.beginPath();
        ctx.arc(screen.x, screen.y + 2, 16, 0, Math.PI * 2);
        ctx.fillStyle = style.fill;
        ctx.fill();

        ctx.beginPath();
        ctx.arc(screen.x, screen.y + 2, 22 + pulse * 6, 0, Math.PI * 2);
        ctx.strokeStyle = `rgba(255, 255, 255, ${0.18 + pulse * 0.16})`;
        ctx.lineWidth = 3;
        ctx.stroke();
        ctx.lineWidth = 1;

        ctx.fillStyle = "#fffdf6";
        ctx.font = "bold 14px sans-serif";
        ctx.textAlign = "center";
        ctx.textBaseline = "middle";
        ctx.fillText(shortLabel, screen.x, screen.y + 2);

        if (portal.label) {
          ctx.fillStyle = "rgba(33, 28, 24, 0.78)";
          ctx.fillRect(screen.x - 36, screen.y - 34, 72, 20);
          ctx.fillStyle = "#fffdf6";
          ctx.font = "12px sans-serif";
          ctx.fillText(portal.label, screen.x, screen.y - 24);
        }
      }
      return;
    }

    for (const portal of mapModel.portals) {
      const screen = projection.gridToScreen(portal.x, portal.y);
      ctx.beginPath();
      ctx.ellipse(screen.x, screen.y + grid.tileHeight - 6, 20 + pulse * 4, 9 + pulse * 2, 0, 0, Math.PI * 2);
      ctx.fillStyle = `rgba(210, 109, 61, ${0.22 + pulse * 0.18})`;
      ctx.fill();

      ctx.beginPath();
      ctx.arc(screen.x, screen.y + grid.tileHeight - 14, 8, 0, Math.PI * 2);
      ctx.fillStyle = "rgba(210, 109, 61, 0.92)";
      ctx.fill();

      ctx.beginPath();
      ctx.arc(screen.x, screen.y + grid.tileHeight - 14, 13 + pulse * 4, 0, Math.PI * 2);
      ctx.strokeStyle = `rgba(255, 255, 255, ${0.18 + pulse * 0.18})`;
      ctx.lineWidth = 2;
      ctx.stroke();
      ctx.lineWidth = 1;

      ctx.fillStyle = "#ffffff";
      ctx.font = "bold 10px sans-serif";
      ctx.textAlign = "center";
      ctx.textBaseline = "middle";
      ctx.fillText("传", screen.x, screen.y + grid.tileHeight - 14);
    }
  }

  function drawGroundLayer() {
    if (isBlueprintMap) return;
    for (let y = 0; y < grid.height; y += 1) {
      for (let x = 0; x < grid.width; x += 1) {
        const tile = mapModel.tiles[y][x];
        if (tile !== TILE.WALL) {
          drawTile(x, y, tile);
        }
      }
    }
  }

  function drawRaisedLayer() {
    if (isBlueprintMap) return;
    for (let y = 0; y < grid.height; y += 1) {
      for (let x = 0; x < grid.width; x += 1) {
        const tile = mapModel.tiles[y][x];
        if (tile === TILE.WALL) {
          drawTile(x, y, tile);
        }
      }
    }
  }

  function drawHover(hoverTile) {
    if (!hoverTile) return;
    const screen = projection.gridToScreen(hoverTile.x, hoverTile.y);
    if (isBlueprintMap) {
      drawBlueprintCell(hoverTile.x, hoverTile.y, "rgba(255, 227, 122, 0.18)", "rgba(214, 146, 31, 0.95)");
      return;
    }
    drawDiamond(screen.x, screen.y, "rgba(255, 227, 122, 0.38)", "rgba(214, 146, 31, 0.95)");
  }

  function drawPathPreview(path) {
    if (isBlueprintMap) {
      for (const step of path) {
        drawBlueprintCell(step.x, step.y, "rgba(100, 189, 219, 0.18)", "rgba(100, 189, 219, 0.34)");
      }
      return;
    }
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
    const bodyY = isBlueprintMap
      ? screen.y + halfTileHeight - 4
      : screen.y - 4;

    // sprite 优先
    const charConfig = getCharacterConfig(actor.actorId, isPlayer);
    if (charConfig && charConfig.sprite) {
      const img = imageCache[charConfig.sprite];
      if (img && img.complete && img.naturalWidth > 0) {
        const spriteScale = charConfig.spriteScale ?? 1;
        const drawWidth = img.naturalWidth * spriteScale;
        const drawHeight = img.naturalHeight * spriteScale;
        const anchorX = bodyX - drawWidth * (charConfig.anchor?.x ?? 0.5);
        const anchorY = bodyY - drawHeight * (charConfig.anchor?.y ?? 1.0);
        ctx.drawImage(img, anchorX, anchorY, drawWidth, drawHeight);
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
      if (isBlueprintMap) {
        drawBlueprintBackground();
        drawBlueprintGridOverlay();
      }
      drawGroundLayer();
      drawPathPreview(scene.player.path);
      drawHover(scene.hoverTile);
      drawRaisedLayer();
      drawPortalMarkers();
      drawActors(scene);
    }
  };
}
