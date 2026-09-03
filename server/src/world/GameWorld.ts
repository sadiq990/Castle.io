// Authoritative game world.
// Owns the canonical GameWorldState and the fixed-rate tick loop.
// Server broadcasts worldState to all clients on every tick.

import type { Server } from 'socket.io';
import type { ClientToServerEvents, ServerToClientEvents, InterServerEvents, SocketData } from 'shared/types/network.js';
import type { GameWorldState } from 'shared/types/entities.js';
import { TICK_RATE } from 'shared/constants/game.constants.js';
import { createInitialWorld } from './worldFactory.js';
import { applyMovementInput } from '../player/playerServer.js';
import { updateCTF, handlePlayerAttack } from '../ctf/flagServer.js';

type IoServer = Server<ClientToServerEvents, ServerToClientEvents, InterServerEvents, SocketData>;

/** Pending movement inputs keyed by player ID */
const pendingInputs = new Map<string, { dx: number; dy: number }>();

export class GameWorld {
  private state: GameWorldState;
  private io: IoServer;
  private tickInterval: NodeJS.Timeout | null = null;
  private lastTickTime: number = Date.now();

  constructor(io: IoServer) {
    this.io = io;
    this.state = createInitialWorld();
  }

  getState(): GameWorldState {
    return this.state;
  }

  queueInput(playerId: string, dx: number, dy: number): void {
    pendingInputs.set(playerId, { dx, dy });
  }

  handleAttack(playerId: string): void {
    handlePlayerAttack(this.state, playerId, (notif) => {
      this.io.emit('flagNotification', notif);
    });
  }

  start(): void {
    const tickMs = 1000 / TICK_RATE;
    this.lastTickTime = Date.now();
    this.tickInterval = setInterval(() => this.tick(), tickMs);
    console.log(`[GameWorld] Tick loop started at ${TICK_RATE} TPS with CTF Flag System`);
  }

  stop(): void {
    if (this.tickInterval) {
      clearInterval(this.tickInterval);
      this.tickInterval = null;
    }
  }

  private tick(): void {
    const now = Date.now();
    const dt = (now - this.lastTickTime) / 1000;
    this.lastTickTime = now;

    // 1. Apply movement inputs
    for (const [playerId, input] of pendingInputs) {
      applyMovementInput(this.state, playerId, input, dt);
    }

    // 2. Authoritative CTF Flag State Machine update
    updateCTF(this.state, dt, (notif) => {
      this.io.emit('flagNotification', notif);
    });

    // 3. Broadcast snapshot to all clients
    this.io.emit('worldState', this.state);
  }
}