// Maps socket events to world mutations.
// Each handler is a pure function: (socket, world, event data) → side effects.
// Adding a new event: add a handler here and register it in socketServer.ts.

import type { Socket } from 'socket.io';
import type { ClientToServerEvents, ServerToClientEvents, InterServerEvents, SocketData } from 'shared/types/network.js';
import type { MovementInput } from 'shared/types/network.js';
import type { GameWorld } from '../world/GameWorld.js';

type GameSocket = Socket<ClientToServerEvents, ServerToClientEvents, InterServerEvents, SocketData>;

export function handlePlayerMove(socket: GameSocket, world: GameWorld, input: MovementInput): void {
  const playerId = socket.data.playerId;
  if (!playerId) return;
  world.queueInput(playerId, input.dx, input.dy);
}
