import { TILE } from "./tile-types.js";

/**
 * 无状态渲染器 — 按场景快照绘制 Canvas
 * 角色按 Y 坐标深度排序保证遮挡正确
 */
export function createRenderer({ canvas, mapModel, projection, visualConfig }) {
  const ctx = canvas.getContext("2d");
  const { grid } = mapModel;
  const halfTileWidth = projection.halfTileWidth;
  const halfTileHeight = projection.halfTileHeight;

  canvas.width = grid.width * grid.tileWidth + grid.originOffsetX * 2;
  canvas.height = grid.height * grid.tileHeight + 520;

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

  function drawTile(x, y, tile) {
    const screen = projection.gridToScreen(x, y);
    if (tile === TILE.GRASS) {
      drawDiamond(screen.x, screen.y, "#97c977", "rgba(53, 85, 33, 0.2)");
      drawDiamond(screen.x, screen.y + 2, "rgba(255,255,255,0.03)", "transparent");
    }
    if (tile === TILE.ROAD) {
      drawDiamond(screen.x, screen.y, "#e6d8bc", "rgba(102, 84, 61, 0.18)");
    }
    if (tile === TILE.INTERIOR) {
      drawDiamond(screen.x, screen.y, "#f2e5cc", "rgba(124, 96, 69, 0.18)");
    }
    if (tile === TILE.BUILDING) {
      drawBlock(screen.x, screen.y, { top: "#b8795a", left: "#8f563f", right: "#744130" });
    }
    if (tile === TILE.DOOR) {
      drawBlock(screen.x, screen.y, { top: "#d8c4a0", left: "#9a7a5b", right: "#7d5f44" }, true);
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

  function drawActor(actor, isPlayer = false) {
    const screen = projection.gridToScreen(actor.worldX, actor.worldY);
    const bodyX = screen.x;
    const bodyY = screen.y - 4;
    const bodyColor = actor.bodyColor;
    const hairColor = actor.hairColor;

    // 阴影
    ctx.fillStyle = "rgba(60, 44, 26, 0.18)";
    ctx.beginPath();
    ctx.ellipse(bodyX, bodyY + 34, 18, 10, 0, 0, Math.PI * 2);
    ctx.fill();

    // 头
    ctx.fillStyle = "#f4d8b2";
    ctx.beginPath();
    ctx.arc(bodyX, bodyY - 18, 16, 0, Math.PI * 2);
    ctx.fill();

    // 身体
    ctx.fillStyle = bodyColor;
    ctx.beginPath();
    ctx.moveTo(bodyX, bodyY - 2);
    ctx.lineTo(bodyX + 20, bodyY + 14);
    ctx.lineTo(bodyX, bodyY + 30);
    ctx.lineTo(bodyX - 20, bodyY + 14);
    ctx.closePath();
    ctx.fill();

    // 腿
    ctx.fillStyle = "#3b2921";
    ctx.fillRect(bodyX - 9, bodyY + 26, 7, 18);
    ctx.fillRect(bodyX + 2, bodyY + 26, 7, 18);

    // 头发
    ctx.fillStyle = hairColor;
    ctx.beginPath();
    ctx.arc(bodyX, bodyY - 22, 17, Math.PI, Math.PI * 2);
    ctx.fill();

    // 名字标签
    if (visualConfig.showActorLabels) {
      ctx.fillStyle = "rgba(255, 255, 255, 0.92)";
      ctx.fillRect(bodyX - 24, bodyY - 54, 48, 18);
      ctx.strokeStyle = "rgba(93, 74, 48, 0.16)";
      ctx.strokeRect(bodyX - 24, bodyY - 54, 48, 18);
      ctx.fillStyle = isPlayer ? "#d26d3d" : "#5a4e3f";
      ctx.font = "12px sans-serif";
      ctx.textAlign = "center";
      ctx.fillText(actor.nickname, bodyX, bodyY - 41);
    }
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
