// Socket.IO connection handling and room setup.
// Manages player join/leave lifecycle.
// Flow: client connects → sends playerJoin(name) → server adds player to world.

import { createServer } from 'http';
import { Server } from 'socket.io';
import type { ClientToServerEvents, ServerToClientEvents, InterServerEvents, SocketData } from 'shared/types/network.js';
import { GameWorld } from '../world/GameWorld.js';
import { addPlayer, removePlayer } from '../player/playerServer.js';
import { handlePlayerMove, handlePlayerAttack } from './eventHandlers.js';

export function createSocketServer(port: number): void {
  const httpServer = createServer();
  const io = new Server<ClientToServerEvents, ServerToClientEvents, InterServerEvents, SocketData>(httpServer, {
    cors: {
      origin: '*', // LAN only — restrict in production
      methods: ['GET', 'POST'],
    },
  });

  const world = new GameWorld(io);
  world.start();

  io.on('connection', socket => {
    const playerId = socket.id;
    socket.data.playerId = playerId;

    console.log(`[Socket] Client connected: ${playerId} (waiting for playerJoin)`);

    // Wait for the client to send their chosen username before adding them to the world.
    socket.once('playerJoin', (rawName: string) => {
      // Sanitize: trim, limit to 20 chars, fallback to "Player"
      const name = (rawName ?? '').toString().trim().slice(0, 20) || 'Player';

      console.log(`[Socket] Player joined with name "${name}": ${playerId}`);

      // Add player to world
      const playerState = addPlayer(world.getState(), playerId, name);

      // Tell everyone (including sender) about the new player
      io.emit('playerJoined', playerState);

      // Send current full world state to the new player
      socket.emit('worldState', world.getState());

      // Register handlers only after join
      socket.on('playerMove', input => handlePlayerMove(socket, world, input));
      socket.on('playerAttack', () => handlePlayerAttack(socket, world));
    });

    socket.on('disconnect', () => {
      console.log(`[Socket] Player disconnected: ${playerId}`);
      removePlayer(world.getState(), playerId);
      io.emit('playerLeft', playerId);
    });
  });

  httpServer.listen(port, () => {
    console.log(`[Server] Socket.IO server running on port ${port}`);
  });
}

