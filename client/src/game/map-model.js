import { TILE, WALKABLE_TILES } from "./tile-types.js";

/**
 * 将原始 JSON 配置标准化为运行时 MapModel
 */
export function createMapModel(rawConfig) {
  const tileLookup = normalizeLegend(rawConfig.legend);
  const tiles = rawConfig.tiles.map((row) => row.map((tileCode) => tileLookup[tileCode] ?? tileCode));
  const grid = {
    width: rawConfig.grid.width,
    height: rawConfig.grid.height,
    tileWidth: rawConfig.grid.tileWidth,
    tileHeight: rawConfig.grid.tileHeight,
    blockHeight: rawConfig.grid.blockHeight,
    originOffsetX: rawConfig.grid.originOffsetX,
    originOffsetY: rawConfig.grid.originOffsetY,
    projectionType: rawConfig.grid.projectionType ?? (rawConfig.renderMode === "blueprint" ? "orthogonal" : "isometric")
  };
  const collisionMask = normalizeCollisionMask({
    rawMask: rawConfig.collisionMask,
    width: grid.width,
    height: grid.height,
    tiles
  });

  // 构建行为区查找表 (tileKey → zone)
  const zoneLookup = new Map();
  const actionZones = (rawConfig.actionZones ?? []).map((zone) => {
    for (const [tx, ty] of zone.tiles) {
      zoneLookup.set(`${tx},${ty}`, zone);
    }
    return zone;
  });

  return {
    mapId: rawConfig.mapId,
    name: rawConfig.name,
    renderMode: rawConfig.renderMode ?? "isometric",
    background: rawConfig.background ?? null,
    grid,
    player: rawConfig.player,
    collisionMask,
    portals: rawConfig.portals ?? [],
    dummies: rawConfig.dummies ?? [],
    actionZones,
    tiles,
    isInsideBounds(x, y) {
      return x >= 0 && y >= 0 && x < grid.width && y < grid.height;
    },
    getTile(x, y) {
      if (!this.isInsideBounds(x, y)) return null;
      return tiles[y][x];
    },
    isBlocked(x, y) {
      if (!this.isInsideBounds(x, y)) return true;
      if (!collisionMask) return !WALKABLE_TILES.has(this.getTile(x, y));
      return collisionMask[y][x] === 1;
    },
    isWalkable(x, y) {
      return !this.isBlocked(x, y);
    },
    findPortalAt(x, y) {
      return this.portals.find((portal) => portal.x === x && portal.y === y) ?? null;
    },
    findActionZoneAt(x, y) {
      return zoneLookup.get(`${x},${y}`) ?? null;
    }
  };
}

function normalizeLegend(rawLegend) {
  return {
    ...(rawLegend ?? {}),
    ground: TILE.GROUND,
    wall: TILE.WALL,
    grass: TILE.GRASS,
    road: TILE.GROUND,
    interior: TILE.GROUND,
    building: TILE.WALL,
    door: TILE.WALL
  };
}

function normalizeCollisionMask({ rawMask, width, height, tiles }) {
  if (!rawMask) {
    return buildCollisionMaskFromTiles({ width, height, tiles });
  }

  return Array.from({ length: height }, (_, y) => {
    const row = rawMask[y];
    if (typeof row === "string") {
      return row
        .slice(0, width)
        .padEnd(width, "1")
        .split("")
        .map((cell) => (cell === "0" ? 0 : 1));
    }

    return Array.from({ length: width }, (_, x) => (Number(row?.[x]) === 0 ? 0 : 1));
  });
}

function buildCollisionMaskFromTiles({ width, height, tiles }) {
  return Array.from({ length: height }, (_, y) =>
    Array.from({ length: width }, (_, x) => (WALKABLE_TILES.has(tiles[y]?.[x]) ? 0 : 1))
  );
}
