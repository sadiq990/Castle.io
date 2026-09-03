import type { GameWorldState, PlayerState } from './entities.js';

export interface MovementInput {
  dx: number; // normalized -1 to 1
  dy: number; // normalized -1 to 1
}

export type ClientToServerEvents = {
  playerJoin: (name: string) => void;
  playerMove: (input: MovementInput) => void;
  playerAttack: () => void;
};

export type ServerToClientEvents = {
  worldState: (state: GameWorldState) => void;
  playerJoined: (player: PlayerState) => void;
  playerLeft: (playerId: string) => void;
  flagNotification: (data: { text: string; color: string }) => void;
};

export type InterServerEvents = Record<string, never>;
export type SocketData = {
  playerId: string;
};