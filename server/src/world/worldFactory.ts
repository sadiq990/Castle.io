// Creates the initial GameWorldState from the server map data.
// This is the only place that initializes the world from config.

import type { GameWorldState } from 'shared/types/entities.js';
import { SERVER_MAP_DATA } from '../map/mapData.server.js';

export function createInitialWorld(): GameWorldState {
  return {
    players: {},
    trees: SERVER_MAP_DATA.trees.map(t => ({ ...t, position: { ...t.position } })),
    stones: SERVER_MAP_DATA.stones.map(s => ({ ...s, position: { ...s.position } })),
    castles: SERVER_MAP_DATA.castles.map(c => ({ ...c, position: { ...c.position } })),
    mapSize: SERVER_MAP_DATA.mapSize,
  };
}
