/**
 * BFS 寻路 — 每格同权，适合小地图原型阶段
 */
export function findPath({ startX, startY, targetX, targetY, isWalkable }) {
  if (!isWalkable(targetX, targetY)) return null;

  const directions = [
    { x: 1, y: 0 }, { x: -1, y: 0 },
    { x: 0, y: 1 }, { x: 0, y: -1 }
  ];

  const queue = [{ x: startX, y: startY }];
  const visited = new Set([`${startX},${startY}`]);
  const parents = new Map();

  while (queue.length > 0) {
    const current = queue.shift();
    if (current.x === targetX && current.y === targetY) {
      return rebuildPath({ parents, startX, startY, targetX, targetY });
    }
    for (const d of directions) {
      const nx = current.x + d.x;
      const ny = current.y + d.y;
      const key = `${nx},${ny}`;
      if (visited.has(key) || !isWalkable(nx, ny)) continue;
      visited.add(key);
      parents.set(key, `${current.x},${current.y}`);
      queue.push({ x: nx, y: ny });
    }
  }
  return null;
}

function rebuildPath({ parents, startX, startY, targetX, targetY }) {
  const path = [];
  let cursor = `${targetX},${targetY}`;
  while (cursor !== `${startX},${startY}`) {
    const [x, y] = cursor.split(",").map(Number);
    path.unshift({ x, y });
    cursor = parents.get(cursor);
  }
  return path;
}
