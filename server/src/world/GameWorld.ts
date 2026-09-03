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
import { buildFence, handleFenceAttack, updateFences } from '../fences/fenceServer.js';

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
    const player = this.state.players[playerId];
    if (!player) return;

    // 1. Attack other players (knock flag)
    handlePlayerAttack(this.state, playerId, (notif) => {
      this.io.emit('flagNotification', notif);
    });

    // 2. Attack nearby opponent fence
    if (this.state.fences) {
      for (const fence of Object.values(this.state.fences)) {
        if (!fence.isBroken && fence.team !== player.team) {
          const dist = Math.hypot(fence.position.x - player.position.x, fence.position.y - player.position.y);
          if (dist <= 75) {
            const res = handleFenceAttack(this.state, player, fence.id, (notif) => {
              this.io.emit('flagNotification', notif);
            });
            if (res.damaged) {
              this.io.emit('fenceDamaged', { fenceId: fence.id, hp: fence.hp, damage: 15 });
            }
            if (res.destroyed) {
              this.io.emit('fenceDestroyed', { fenceId: fence.id, team: fence.team });
            }
            break;
          }
        }
      }
    }
  }

  handleBuildFence(playerId: string, data: { type: 'WOOD' | 'STONE'; position: { x: number; y: number }; rotation: number }): void {
    const player = this.state.players[playerId];
    if (!player) return;

    const fence = buildFence(this.state, player, data.type, data.position, data.rotation);
    if (fence) {
      this.io.emit('fenceBuilt', fence);
    }
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

    // 3. Update Fences (cleanup broken after 60s)
    updateFences(this.state);

    // 4. Broadcast snapshot to all clients
    this.io.emit('worldState', this.state);
  }
}