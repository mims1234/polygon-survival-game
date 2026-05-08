export const TILE_TYPES = {
  GRASS: "grass",
  DIRT: "dirt",
  ROCK: "rock",
  WATER: "water",
  FOREST: "forest",
};

export const TILE_ORDER = [
  TILE_TYPES.GRASS,
  TILE_TYPES.DIRT,
  TILE_TYPES.ROCK,
  TILE_TYPES.WATER,
  TILE_TYPES.FOREST,
];

export const TILE_COLORS = {
  [TILE_TYPES.GRASS]: 0x74b15b,
  [TILE_TYPES.DIRT]: 0x9d7042,
  [TILE_TYPES.ROCK]: 0x848b95,
  [TILE_TYPES.WATER]: 0x4c95d9,
  [TILE_TYPES.FOREST]: 0x4d8b47,
};

function fract(value) {
  return value - Math.floor(value);
}

function hash2D(x, y, seed) {
  const value = Math.sin(x * 127.1 + y * 311.7 + seed * 91.3) * 43758.5453123;
  return fract(value);
}

function smoothNoise(x, y, seed) {
  const x0 = Math.floor(x);
  const y0 = Math.floor(y);
  const tx = x - x0;
  const ty = y - y0;

  const a = hash2D(x0, y0, seed);
  const b = hash2D(x0 + 1, y0, seed);
  const c = hash2D(x0, y0 + 1, seed);
  const d = hash2D(x0 + 1, y0 + 1, seed);

  const ux = tx * tx * (3 - 2 * tx);
  const uy = ty * ty * (3 - 2 * ty);

  const ab = a + (b - a) * ux;
  const cd = c + (d - c) * ux;
  return ab + (cd - ab) * uy;
}

export function biomeAt(x, y, size, seed = 17) {
  const nx = x / size;
  const ny = y / size;
  const elevation =
    smoothNoise(nx * 3.6, ny * 3.6, seed) * 0.55 +
    smoothNoise(nx * 7.4, ny * 7.4, seed + 5) * 0.3 +
    smoothNoise(nx * 13.3, ny * 13.3, seed + 11) * 0.15;

  const moisture =
    smoothNoise(nx * 4.4 + 10, ny * 4.4 + 12, seed + 13) * 0.7 +
    smoothNoise(nx * 10.5 + 7, ny * 10.5 + 4, seed + 19) * 0.3;

  if (elevation < 0.3) {
    return TILE_TYPES.WATER;
  }

  if (elevation > 0.7) {
    return TILE_TYPES.ROCK;
  }

  if (moisture > 0.62) {
    return TILE_TYPES.FOREST;
  }

  if (elevation < 0.42) {
    return TILE_TYPES.DIRT;
  }

  return TILE_TYPES.GRASS;
}
