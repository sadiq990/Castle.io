// Server entrypoint — minimal bootstrapper.
// Sets up the Socket.IO server on port 3000.
// Add more initialization here (DB, HTTP routes) as the game grows.

import { createSocketServer } from './network/socketServer.js';

const PORT = parseInt(process.env['PORT'] ?? '3000', 10);

createSocketServer(PORT);

console.log('[Server] io-game server started');
