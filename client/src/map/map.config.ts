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

// ── Fixed lake definitions to prevent overlap ──────────────────────────────
export const WATER_LAKES = [
  { id: 'water-1', position: { x: 950, y: 1150 }, radius: 250 },
  { id: 'water-2', position: { x: 2100, y: 1950 }, radius: 270 },
] as const;

function isBlocked(x: number, y: number, buffer = 60): boolean {
  // Lakes exclusion zone (water radius + buffer to ensure no trees or stones touch water)
  for (const lake of WATER_LAKES) {
    const dx = x - lake.position.x;
    const dy = y - lake.position.y;
    if (Math.hypot(dx, dy) < lake.radius + buffer) {
      return true;
    }
  }

  // Castles exclusion zone
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

// ── Generate all objects ──────────────────────────────────────────────────
const rng = makeRng(42); // fixed seed → identical layout every reload

const TREE_COUNT     = 220; // Increased for a rich, vibrant forest
const BRUSH_COUNT    = 85;
const STONE_COUNT    = 45;
const BERRY_COUNT    = 50;
const MOUNTAIN_COUNT = 28;  // Rolling hills ("təpələr")

// Generate hills with larger buffer so hills don't flood into water
const rawMountains = randomFilteredPositions(MOUNTAIN_COUNT, rng, 160, 160);
const rawTrees     = randomFilteredPositions(TREE_COUNT,     rng, 80,  60);
const rawBrush     = randomFilteredPositions(BRUSH_COUNT,    rng, 80,  40);
const rawStones    = randomFilteredPositions(STONE_COUNT,    rng, 80,  60);
const rawBerries   = randomFilteredPositions(BERRY_COUNT,   rng, 80,  40);

export const MAP_CONFIG = {
  mapSize: MAP,

  trees: rawTrees.map(t => ({
    id: `tree-${t.id}`,
    position: t.position,
  })) as ReadonlyArray<{ id: string; position: Vector2 }>,

  brushes: rawBrush.map(b => ({
    id: `brush-${b.id}`,
    position: b.position,
  })) as ReadonlyArray<{ id: string; position: Vector2 }>,

  berries: rawBerries.map(b => ({
    id: `berry-${b.id}`,
    position: b.position,
  })) as ReadonlyArray<{ id: string; position: Vector2 }>,

  mountains: rawMountains.map(m => ({
    id: `mountain-${m.id}`,
    position: m.position,
  })) as ReadonlyArray<{ id: string; position: Vector2 }>,

  waters: WATER_LAKES.map(w => ({
    id: w.id,
    position: { ...w.position },
    radius: w.radius,
  })) as ReadonlyArray<{ id: string; position: Vector2; radius: number }>,

  stones: rawStones.map(s => ({
    id: `stone-${s.id}`,
    position: s.position,
  })) as ReadonlyArray<{ id: string; position: Vector2 }>,

  castles: [
    { id: 'castle-1', position: { x: 500,       y: 500       }, team: 'blue', ownerId: null },
    { id: 'castle-2', position: { x: MAP - 500, y: MAP - 500 }, team: 'red',  ownerId: null },
  ] as ReadonlyArray<{ id: string; position: Vector2; team: 'blue' | 'red'; ownerId: string | null }>,

  playerSpawns: [
    { x: 400,       y: 400       },
    { x: MAP - 400, y: MAP - 400 },
    { x: 400,       y: MAP - 400 },
    { x: MAP - 400, y: 400       },
    { x: MAP / 2,   y: MAP / 2   },
  ] as ReadonlyArray<Vector2>,
} as const;