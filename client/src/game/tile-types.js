export const TILE = {
  GRASS: "grass",
  ROAD: "road",
  INTERIOR: "interior",
  BUILDING: "building",
  DOOR: "door"
};

export const WALKABLE_TILES = new Set([
  TILE.ROAD,
  TILE.INTERIOR,
  TILE.DOOR
]);
