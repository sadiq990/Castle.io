// Creates entity model instances from the static map config.
// This is the only place that reads map.config.ts and produces live entity arrays.

import type { TreeState, StoneState, CastleState } from 'shared/types/entities.js';
import { MAP_CONFIG } from './map.config.js';

export interface MapObjects {
  trees: TreeState[];
  brushes: { id: string; position: { x: number; y: number } }[];
  berries: { id: string; position: { x: number; y: number } }[];
  mountains: { id: string; position: { x: number; y: number } }[];
  waters: { id: string; position: { x: number; y: number }; radius?: number }[];
  stones: StoneState[];
  castles: CastleState[];
}

export function createMapObjects(): MapObjects {
  return {
    trees: MAP_CONFIG.trees.map(t => ({ id: t.id, position: { ...t.position } })),
    brushes: MAP_CONFIG.brushes.map(b => ({ id: b.id, position: { ...b.position } })),
    berries: MAP_CONFIG.berries.map(b => ({ id: b.id, position: { ...b.position } })),
    mountains: MAP_CONFIG.mountains.map(m => ({ id: m.id, position: { ...m.position } })),
    waters: MAP_CONFIG.waters.map(w => ({ id: w.id, position: { ...w.position }, radius: (w as any).radius })),
    stones: MAP_CONFIG.stones.map(s => ({ id: s.id, position: { ...s.position } })),
    castles: MAP_CONFIG.castles.map(c => ({ id: c.id, position: { ...c.position }, ownerId: c.ownerId })),
  };
}