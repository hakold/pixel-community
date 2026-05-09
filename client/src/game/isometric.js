/**
 * 投影工具
 * 兼容等距地图与蓝图背景图地图。
 */
export function createProjection(gridConfig) {
  if (gridConfig.projectionType === "orthogonal") {
    return createOrthogonalProjection(gridConfig);
  }
  return createIsometricProjection(gridConfig);
}

function createIsometricProjection(gridConfig) {
  const halfTileWidth = gridConfig.tileWidth / 2;
  const halfTileHeight = gridConfig.tileHeight / 2;
  const originX = gridConfig.width * halfTileWidth + gridConfig.originOffsetX;
  const originY = gridConfig.originOffsetY;

  return {
    type: "isometric",
    halfTileWidth,
    halfTileHeight,
    tileWidth: gridConfig.tileWidth,
    tileHeight: gridConfig.tileHeight,
    originX,
    originY,
    gridToScreen(x, y) {
      return {
        x: originX + (x - y) * halfTileWidth,
        y: originY + (x + y) * halfTileHeight
      };
    },
    screenToGrid(screenX, screenY) {
      const localX = screenX - originX;
      const localY = screenY - originY;
      const gridX = (localX / halfTileWidth + localY / halfTileHeight) / 2;
      const gridY = (localY / halfTileHeight - localX / halfTileWidth) / 2;
      return { x: Math.floor(gridX), y: Math.floor(gridY) };
    }
  };
}

function createOrthogonalProjection(gridConfig) {
  const tileWidth = gridConfig.tileWidth;
  const tileHeight = gridConfig.tileHeight;
  const halfTileWidth = tileWidth / 2;
  const halfTileHeight = tileHeight / 2;
  const originX = gridConfig.originOffsetX ?? 0;
  const originY = gridConfig.originOffsetY ?? 0;

  return {
    type: "orthogonal",
    halfTileWidth,
    halfTileHeight,
    tileWidth,
    tileHeight,
    originX,
    originY,
    gridToScreen(x, y) {
      return {
        x: originX + x * tileWidth + halfTileWidth,
        y: originY + y * tileHeight + halfTileHeight
      };
    },
    screenToGrid(screenX, screenY) {
      const localX = screenX - originX;
      const localY = screenY - originY;
      return {
        x: Math.floor(localX / tileWidth),
        y: Math.floor(localY / tileHeight)
      };
    }
  };
}
