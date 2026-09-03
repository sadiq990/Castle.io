import type { FenceState, GameWorldState, PlayerState, Team, Vector2 } from './entities.js';

export interface MovementInput {
  dx: number; // normalized -1 to 1
  dy: number; // normalized -1 to 1
}

export type ClientToServerEvents = {
  playerJoin: (name: string) => void;
  playerMove: (input: MovementInput) => void;
  playerAttack: () => void;
  buildFence: (data: { type: 'WOOD' | 'STONE'; position: Vector2; rotation: number }) => void;
  attackFence: (fenceId: string) => void;
};

export type ServerToClientEvents = {
  worldState: (state: GameWorldState) => void;
  playerJoined: (player: PlayerState) => void;
  playerLeft: (playerId: string) => void;
  flagNotification: (data: { text: string; color: string }) => void;
  fenceBuilt: (fence: FenceState) => void;
  fenceDamaged: (data: { fenceId: string; hp: number; damage: number }) => void;
  fenceDestroyed: (data: { fenceId: string; team: Team }) => void;
};

export type InterServerEvents = Record<string, never>;
export type SocketData = {
  playerId: string;
};