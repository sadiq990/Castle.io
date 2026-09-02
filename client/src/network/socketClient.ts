// Socket.IO client connection.
// Connects to the server at the configured URL.
// Exposes the socket for worldSync.ts and the game loop.

import { io, type Socket } from 'socket.io-client';
import type { ClientToServerEvents, ServerToClientEvents } from 'shared/types/network.js';
import { APP_CONFIG } from '../config/appConfig.js';

export type GameSocket = Socket<ServerToClientEvents, ClientToServerEvents>;

let _socket: GameSocket | null = null;

export function connectToServer(): GameSocket {
  if (_socket) return _socket;

  _socket = io(APP_CONFIG.SERVER_URL, {
    reconnectionAttempts: 10,
    reconnectionDelay: 1000,
  });

  return _socket;
}

export function getSocket(): GameSocket | null {
  return _socket;
}
