// Server-side map data — mirrors the client map config.
// Placed here so server can initialize the world without importing client code.
// Uses the exact same seed logic as client/src/map/map.config.ts to ensure match.

import type { TreeState, StoneState, CastleState, Vector2 } from 'shared/types/entities.js';

const MAP = 3000;

function makeRng(seed: number) {
  let s = seed;
  return (): number => {
    s |= 0; s = s + 0x6d2b79f5 | 0;
    let t = Math.imul(s ^ s >>> 15, 1 | s);
    t = t + Math.imul(t ^ t >>> 7, 61 | t) ^ t;
    return ((t ^ t >>> 14) >>> 0) / 4294967296;
  };
}

const WATER_LAKES = [
  { id: 'water-1', position: { x: 950, y: 1150 }, radius: 250 },
  { id: 'water-2', position: { x: 2100, y: 1950 }, radius: 270 },
] as const;

function isBlocked(x: number, y: number, buffer = 60): boolean {
  for (const lake of WATER_LAKES) {
    const dx = x - lake.position.x;
    const dy = y - lake.position.y;
    if (Math.hypot(dx, dy) < lake.radius + buffer) {
      return true;
    }
  }

  if (Math.hypot(x - 500, y - 500) < 220 || Math.hypot(x - (MAP - 500), y - (MAP - 500)) < 220) {
    return true;
  }

  return false;
}

function randomFilteredPositions(
  count: number,
  rng: () => number,
  margin = 100,
  waterBuffer = 70,
): Array<{ id: string; position: Vector2 }> {
  const result: Array<{ id: string; position: Vector2 }> = [];
  let attempts = 0;
  const maxAttempts = count * 60;

  while (result.length < count && attempts < maxAttempts) {
    attempts++;
    const x = margin + rng() * (MAP - margin * 2);
    const y = margin + rng() * (MAP - margin * 2);

    if (!isBlocked(x, y, waterBuffer)) {
      result.push({
        id: `${result.length + 1}`,
        position: { x, y },
      });
    }
  }
  return result;
}

const rng = makeRng(42);

const TREE_COUNT     = 220;
const BRUSH_COUNT    = 85;
const STONE_COUNT    = 45;
const BERRY_COUNT    = 50;
const MOUNTAIN_COUNT = 28;

// Must match client call order to preserve PRNG sequence
const _rawMountains = randomFilteredPositions(MOUNTAIN_COUNT, rng, 160, 160);
const rawTrees      = randomFilteredPositions(TREE_COUNT,     rng, 80,  60);
const _rawBrush     = randomFilteredPositions(BRUSH_COUNT,    rng, 80,  40);
const rawStones     = randomFilteredPositions(STONE_COUNT,    rng, 80,  60);
const _rawBerries   = randomFilteredPositions(BERRY_COUNT,   rng, 80,  40);

export const SERVER_MAP_DATA = {
  mapSize: MAP,

  trees: rawTrees.map(t => ({
    id: `tree-${t.id}`,
    position: t.position,
  })) as TreeState[],

  stones: rawStones.map(s => ({
    id: `stone-${s.id}`,
    position: s.position,
  })) as StoneState[],

  castles: [
    { id: 'castle-1', position: { x: 500,       y: 500       }, team: 'blue', ownerId: null },
    { id: 'castle-2', position: { x: MAP - 500, y: MAP - 500 }, team: 'red',  ownerId: null },
  ] as CastleState[],

  playerSpawns: [
    { x: 400,       y: 400       },
    { x: MAP - 400, y: MAP - 400 },
    { x: 400,       y: MAP - 400 },
    { x: MAP - 400, y: 400       },
    { x: MAP / 2,   y: MAP / 2   },
  ] as Vector2[],
};