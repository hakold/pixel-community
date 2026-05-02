/**
 * 等距投影工具
 * 格坐标 ↔ 屏幕坐标 互转
 */
export function createProjection(gridConfig) {
  const halfTileWidth = gridConfig.tileWidth / 2;
  const halfTileHeight = gridConfig.tileHeight / 2;
  const originX = gridConfig.width * halfTileWidth + gridConfig.originOffsetX;
  const originY = gridConfig.originOffsetY;

  return {
    halfTileWidth,
    halfTileHeight,
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
