// Client-side game state — the single source of truth for what to render.
// Server-authoritative state is merged into this via worldSync.ts.
// Local player movement prediction also updates this.

import type { GameWorldState, PlayerState, TreeState, StoneState, GoldState, CastleState } from 'shared/types/entities.js';
import { DEFAULT_MAP_SIZE } from 'shared/constants/game.constants.js';

export interface GameClientState {
  players: Record<string, PlayerState>;
  trees: TreeState[];
  brushes: { id: string; position: { x: number; y: number } }[];
  berries: { id: string; position: { x: number; y: number } }[];
  waters: { id: string; position: { x: number; y: number } }[];
  stones: StoneState[];

  castles: CastleState[];
  mapSize: number;
  localPlayerId: string | null;
}

export function createGameClientState(): GameClientState {
  return {
    players: {},
    trees: [],
    brushes: [],
    berries: [],
    waters: [],
    stones: [],

    castles: [],
    mapSize: DEFAULT_MAP_SIZE,
    localPlayerId: null,
  };
}

export function applyWorldState(state: GameClientState, world: GameWorldState): void {
  state.players = { ...world.players };
  state.trees = world.trees;
  state.stones = world.stones;

  state.castles = world.castles;
  state.mapSize = world.mapSize;
}
