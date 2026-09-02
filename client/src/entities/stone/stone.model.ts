import type { StoneState } from 'shared/types/entities.js';

export type { StoneState };

export function createStone(id: string, x: number, y: number): StoneState {
  return { id, position: { x, y } };
}
