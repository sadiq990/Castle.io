import type { CastleState, Team } from 'shared/types/entities.js';

export type { CastleState };

export function createCastle(id: string, x: number, y: number, team: Team = 'blue', ownerId: string | null = null): CastleState {
  return { id, position: { x, y }, team, ownerId };
}
