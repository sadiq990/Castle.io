// Shared entity types — read by both client and server
// These are the canonical data contracts. Never import client or server code here.

export interface Vector2 {
  x: number;
  y: number;
}

export type Team = 'blue' | 'red';

export interface PlayerState {
  id: string;
  name: string;
  position: Vector2;
  color: string;
  team: Team;
  hasFlag: boolean;
  speedMultiplier: number;
  /** Direction the player is facing, in radians. 0 = right. */
  facing: number;
}

export interface TreeState {
  id: string;
  position: Vector2;
}

export interface StoneState {
  id: string;
  position: Vector2;
}

export interface CastleState {
  id: string;
  position: Vector2;
  team: Team;
  ownerId: string | null;
}

export type FlagStatus = 'AT_HOME' | 'CARRIED' | 'DROPPED';

export interface FlagState {
  team: Team;
  status: FlagStatus;
  position: Vector2;
  carrierId: string | null;
  homePosition: Vector2;
  dropTimer: number; // Seconds remaining if DROPPED
}

export interface CTFState {
  flags: Record<Team, FlagState>;
  scores: Record<Team, number>;
  winner: Team | null;
}

export interface GameWorldState {
  players: Record<string, PlayerState>;
  trees: TreeState[];
  stones: StoneState[];
  castles: CastleState[];
  ctf: CTFState;
  mapSize: number;
}