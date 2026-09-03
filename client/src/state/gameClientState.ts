import type { GameWorldState, PlayerState, TreeState, StoneState, CastleState, CTFState, FenceState, TowerState, ArrowState } from 'shared/types/entities.js';
import { DEFAULT_MAP_SIZE } from 'shared/constants/game.constants.js';

export interface GameClientState {
  players: Record<string, PlayerState>;
  trees: TreeState[];
  brushes: { id: string; position: { x: number; y: number } }[];
  berries: { id: string; position: { x: number; y: number } }[];
  waters: { id: string; position: { x: number; y: number }; radius?: number }[];
  mountains: { id: string; position: { x: number; y: number } }[];
  stones: StoneState[];
  castles: CastleState[];
  fences: Record<string, FenceState>;
  towers: Record<string, TowerState>;
  arrows: ArrowState[];
  ctf: CTFState;
  mapSize: number;
  localPlayerId: string | null;
}

export function createGameClientState(): GameClientState {
  return {
    players: {},
    trees: [],
    brushes: [],
    berries: [],
    mountains: [],
    waters: [],
    stones: [],
    castles: [],
    fences: {},
    towers: {},
    arrows: [],
    ctf: {
      flags: {
        blue: { team: 'blue', status: 'AT_HOME', position: { x: 500, y: 500 }, carrierId: null, homePosition: { x: 500, y: 500 }, dropTimer: 0 },
        red:  { team: 'red',  status: 'AT_HOME', position: { x: 2500, y: 2500 }, carrierId: null, homePosition: { x: 2500, y: 2500 }, dropTimer: 0 },
      },
      scores: { blue: 0, red: 0 },
      winner: null,
    },
    mapSize: DEFAULT_MAP_SIZE,
    localPlayerId: null,
  };
}

export function applyWorldState(state: GameClientState, world: GameWorldState): void {
  state.players = { ...world.players };
  state.trees = world.trees;
  state.stones = world.stones;
  state.castles = world.castles;
  if (world.fences) {
    state.fences = world.fences;
  }
  if (world.towers) {
    state.towers = world.towers;
  }
  if (world.arrows) {
    state.arrows = world.arrows;
  }
  if (world.ctf) {
    state.ctf = world.ctf;
  }
  state.mapSize = world.mapSize;
}