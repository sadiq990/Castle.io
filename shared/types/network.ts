import type { GameWorldState, PlayerState } from './entities.js';

export interface MovementInput {
  dx: number; // normalized -1 to 1
  dy: number; // normalized -1 to 1
}

export type ClientToServerEvents = {
  playerJoin: (name: string) => void;
  playerMove: (input: MovementInput) => void;
};

export type ServerToClientEvents = {
  worldState: (state: GameWorldState) => void;
  playerJoined: (player: PlayerState) => void;
  playerLeft: (playerId: string) => void;
};

// Extend as needed — these are the socket event contracts.
// Adding a new event: add here, then implement in socketServer.ts and socketClient.ts.
export type InterServerEvents = Record<string, never>;
export type SocketData = {
  playerId: string;
};
