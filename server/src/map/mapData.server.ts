// Server-side map data — mirrors the client map config.
// Placed here so server can initialize the world without importing client code.
// Uses the exact same seed logic as client/src/map/map.config.ts to ensure match.

import type { TreeState, StoneState, CastleState, Vector2 } from 'shared/types/entities.js';
import { DEFAULT_MAP_SIZE } from 'shared/constants/game.constants.js';

const MAP = DEFAULT_MAP_SIZE;

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
  { id: 'water-1', position: { x: 1300, y: 1600 }, radius: 290 },
  { id: 'water-2', position: { x: 3200, y: 2900 }, radius: 310 },
  { id: 'water-3', position: { x: 2250, y: 1000 }, radius: 220 },
] as const;

function isBlocked(x: number, y: number, buffer = 60): boolean {
  for (const lake of WATER_LAKES) {
    const dx = x - lake.position.x;
    const dy = y - lake.position.y;
    if (Math.hypot(dx, dy) < lake.radius + buffer) {
      return true;
    }
  }

  // Castles at 700, 700 and MAP - 700, MAP - 700
  if (Math.hypot(x - 700, y - 700) < 260 || Math.hypot(x - (MAP - 700), y - (MAP - 700)) < 260) {
    return true;
  }

  // Central Ancient Shrine at 2250, 2250
  if (Math.hypot(x - 2250, y - 2250) < 140) {
    return true;
  }

  return false;
}

function randomFilteredPositions(
  count: number,
  rng: () => number,
  margin = 120,
  waterBuffer = 80,
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

const TREE_COUNT     = 320;
const BRUSH_COUNT    = 110;
const STONE_COUNT    = 60;
const BERRY_COUNT    = 70;
const MOUNTAIN_COUNT = 40;

// Must match client call order to preserve PRNG sequence
const _rawMountains = randomFilteredPositions(MOUNTAIN_COUNT, rng, 200, 200);
const rawTrees      = randomFilteredPositions(TREE_COUNT,     rng, 100, 70);
const _rawBrush     = randomFilteredPositions(BRUSH_COUNT,    rng, 100, 50);
const rawStones     = randomFilteredPositions(STONE_COUNT,    rng, 100, 70);
const _rawBerries   = randomFilteredPositions(BERRY_COUNT,   rng, 100, 50);

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
    { id: 'castle-1', position: { x: 700,       y: 700       }, team: 'blue', ownerId: null },
    { id: 'castle-2', position: { x: MAP - 700, y: MAP - 700 }, team: 'red',  ownerId: null },
  ] as CastleState[],

  playerSpawns: [
    { x: 600,       y: 600       },
    { x: MAP - 600, y: MAP - 600 },
    { x: 600,       y: MAP - 600 },
    { x: MAP - 600, y: 600       },
    { x: MAP / 2,   y: MAP / 2   },
  ] as Vector2[],
};