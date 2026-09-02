// Applies incoming server state to the local game client state.
// Handles worldState, playerJoined, and playerLeft events.
// This is the only module that reads server socket events.

import type { GameSocket } from './socketClient.js';
import type { GameClientState } from '../state/gameClientState.js';
import { applyWorldState } from '../state/gameClientState.js';

export function initWorldSync(socket: GameSocket, state: GameClientState): void {
  socket.on('worldState', world => {
    applyWorldState(state, world);
  });

  socket.on('playerJoined', player => {
    state.players[player.id] = player;
    console.log(`[WorldSync] Player joined: ${player.id}`);
  });

  socket.on('playerLeft', playerId => {
    // eslint-disable-next-line @typescript-eslint/no-dynamic-delete
    delete state.players[playerId];
    console.log(`[WorldSync] Player left: ${playerId}`);
  });
}
