import type { GoldState } from 'shared/types/entities.js';

export type { GoldState };

export function createGold(id: string, x: number, y: number): GoldState {
  return { id, position: { x, y } };
}
