import type { CastleState } from 'shared/types/entities.js';

export type { CastleState };

export function createCastle(id: string, x: number, y: number, ownerId: string | null = null): CastleState {
  return { id, position: { x, y }, ownerId };
}
