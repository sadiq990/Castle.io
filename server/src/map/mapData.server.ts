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

function randomPositions(count: number, rng: () => number, margin = 80) {
  return Array.from({ length: count }, (_, i) => ({
    id: `${i}`,
    position: {
      x: margin + rng() * (MAP - margin * 2),
      y: margin + rng() * (MAP - margin * 2),
    },
  }));
}

const rng = makeRng(42);
const TREE_COUNT   = 80;
const BRUSH_COUNT  = 60; // Just advancing RNG so it matches client sequence exactly
const STONE_COUNT  = 30;
const BERRY_COUNT  = 50;
const WATER_COUNT  = 2;

const rawTrees  = randomPositions(TREE_COUNT,  rng);
const rawBrush  = randomPositions(BRUSH_COUNT, rng);
const rawStones = randomPositions(STONE_COUNT, rng);
const rawBerries = randomPositions(BERRY_COUNT, rng);
const rawWaters  = randomPositions(WATER_COUNT, rng, 200);


export const SERVER_MAP_DATA = {
  mapSize: MAP,

  trees: rawTrees.map((t, i) => ({
    id: `tree-${i + 1}`,
    position: t.position,
  })) as TreeState[],

  stones: rawStones.map((s, i) => ({
    id: `stone-${i + 1}`,
    position: s.position,
  })) as StoneState[],


  castles: [
    { id: 'castle-1', position: { x: 500,       y: 500       }, ownerId: null },
    { id: 'castle-2', position: { x: MAP - 500, y: MAP - 500 }, ownerId: null },
  ] as CastleState[],

  playerSpawns: [
    { x: 400,       y: 400       },
    { x: MAP - 400, y: MAP - 400 },
    { x: 400,       y: MAP - 400 },
    { x: MAP - 400, y: 400       },
    { x: MAP / 2,   y: MAP / 2   },
  ] as Vector2[],
};

