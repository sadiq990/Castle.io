import type { TreeState } from 'shared/types/entities.js';

export type { TreeState };

export function createTree(id: string, x: number, y: number): TreeState {
  return { id, position: { x, y } };
}
