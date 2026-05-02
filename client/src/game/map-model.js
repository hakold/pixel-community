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
    originOffsetY: rawConfig.grid.originOffsetY
  };

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
    grid,
    player: rawConfig.player,
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
    isWalkable(x, y) {
      return WALKABLE_TILES.has(this.getTile(x, y));
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
    grass: TILE.GRASS,
    road: TILE.ROAD,
    interior: TILE.INTERIOR,
    building: TILE.BUILDING,
    door: TILE.DOOR
  };
}
