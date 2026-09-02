// Shared entity types — read by both client and server
// These are the canonical data contracts. Never import client or server code here.

export interface Vector2 {
  x: number;
  y: number;
}

export interface PlayerState {
  id: string;
  name: string;
  position: Vector2;
  color: string;
  /** Direction the player is facing, in radians. 0 = right. */
  facing: number;
  // Future: health?: number; speed?: number;
}

export interface TreeState {
  id: string;
  position: Vector2;
  // Future: health?: number; woodAmount?: number;
}

export interface StoneState {
  id: string;
  position: Vector2;
  // Future: health?: number; stoneAmount?: number;
}

export interface GoldState {
  id: string;
  position: Vector2;
  // Future: amount?: number;
}

export interface CastleState {
  id: string;
  position: Vector2;
  ownerId: string | null;
  // Future: health?: number; level?: number;
}

export interface GameWorldState {
  players: Record<string, PlayerState>;
  trees: TreeState[];
  stones: StoneState[];
  castles: CastleState[];
  mapSize: number;
}
