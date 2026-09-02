// Map configuration — ONLY edit this file to change map layout.
// Object positions are procedurally seeded for a full 3000×3000 map.
// Adjust counts at the top to tune density.

import type { Vector2 } from 'shared/types/entities.js';
import { DEFAULT_MAP_SIZE } from 'shared/constants/game.constants.js';

const MAP = DEFAULT_MAP_SIZE; // 3000

// ── Simple deterministic seeded RNG (mulberry32) ──────────────────────────
function makeRng(seed: number) {
  let s = seed;
  return (): number => {
    s |= 0; s = s + 0x6d2b79f5 | 0;
    let t = Math.imul(s ^ s >>> 15, 1 | s);
    t = t + Math.imul(t ^ t >>> 7, 61 | t) ^ t;
    return ((t ^ t >>> 14) >>> 0) / 4294967296;
  };
}

function randomPositions(
  count: number,
  rng: () => number,
  margin = 80,
): Array<{ id: string; position: Vector2 }> {
  return Array.from({ length: count }, (_, i) => ({
    id: `${i}`,                          // placeholder — replaced below with proper ids
    position: {
      x: margin + rng() * (MAP - margin * 2),
      y: margin + rng() * (MAP - margin * 2),
    },
  }));
}

// ── Generate all objects ──────────────────────────────────────────────────
const rng = makeRng(42); // fixed seed → same layout every reload

const TREE_COUNT   = 80;
const BRUSH_COUNT  = 60;
const STONE_COUNT  = 30;
const BERRY_COUNT  = 50;
const WATER_COUNT  = 2;

const rawTrees  = randomPositions(TREE_COUNT,  rng);
const rawBrush  = randomPositions(BRUSH_COUNT, rng);
const rawStones = randomPositions(STONE_COUNT, rng);
const rawBerries = randomPositions(BERRY_COUNT, rng);
const rawWaters  = randomPositions(WATER_COUNT, rng, 200); // larger margin for lakes


export const MAP_CONFIG = {
  mapSize: MAP,

  trees: rawTrees.map((t, i) => ({
    id: `tree-${i + 1}`,
    position: t.position,
  })) as ReadonlyArray<{ id: string; position: Vector2 }>,

  brushes: rawBrush.map((b, i) => ({
    id: `brush-${i + 1}`,
    position: b.position,
  })) as ReadonlyArray<{ id: string; position: Vector2 }>,

  berries: rawBerries.map((b, i) => ({
    id: `berry-${i + 1}`,
    position: b.position,
  })) as ReadonlyArray<{ id: string; position: Vector2 }>,

  waters: rawWaters.map((w, i) => ({
    id: `water-${i + 1}`,
    position: w.position,
  })) as ReadonlyArray<{ id: string; position: Vector2 }>,

  stones: rawStones.map((s, i) => ({
    id: `stone-${i + 1}`,
    position: s.position,
  })) as ReadonlyArray<{ id: string; position: Vector2 }>,


  castles: [
    { id: 'castle-1', position: { x: 500,       y: 500       }, ownerId: null },
    { id: 'castle-2', position: { x: MAP - 500, y: MAP - 500 }, ownerId: null },
  ] as ReadonlyArray<{ id: string; position: Vector2; ownerId: string | null }>,

  playerSpawns: [
    { x: 400,       y: 400       },
    { x: MAP - 400, y: MAP - 400 },
    { x: 400,       y: MAP - 400 },
    { x: MAP - 400, y: 400       },
    { x: MAP / 2,   y: MAP / 2   },
  ] as ReadonlyArray<Vector2>,
} as const;

