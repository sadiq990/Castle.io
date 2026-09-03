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
import { handlePlayerDeath } from '../player/playerServer.js';
import { buildTower, updateTowersAndArrows } from '../towers/towerServer.js';

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

    // 1. Attack other players (Knock flag & deal 20 damage)
    for (const target of Object.values(this.state.players)) {
      if (target.id !== player.id && target.team !== player.team) {
        const dist = Math.hypot(target.position.x - player.position.x, target.position.y - player.position.y);
        if (dist <= 70) {
          // Melee Hit!
          target.hp = Math.max(0, (target.hp ?? 100) - 20);

          // Knock flag out of target's hands immediately!
          if (target.hasFlag) {
            target.hasFlag = false;
            target.speedMultiplier = 1.0;
            for (const flag of Object.values(this.state.ctf.flags)) {
              if (flag.carrierId === target.id) {
                flag.status = 'DROPPED';
                flag.carrierId = null;
                flag.dropTimer = 30;
              }
            }
            this.io.emit('flagNotification', {
              text: `⚔️ Zərbə! ${player.name || 'Oyunçu'} ${target.name || 'Düşmən'}dən bayrağı yerə saldı!`,
              color: '#EF4444',
            });
          }

          if (target.hp <= 0) {
            handlePlayerDeath(this.state, target, player.team, (notif) => {
              this.io.emit('flagNotification', notif);
            });
          }
          break;
        }
      }
    }

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

  handleBuildTower(playerId: string, position: { x: number; y: number }): void {
    const player = this.state.players[playerId];
    if (!player) return;

    const tower = buildTower(this.state, player, position);
    if (tower) {
      this.io.emit('towerBuilt', tower);
      const teamName = tower.team === 'blue' ? 'Mavi' : 'Qırmızı';
      this.io.emit('flagNotification', {
        text: `🏹 ${teamName} komandası Oxatan Qülləsi ucaltdı!`,
        color: tower.team === 'blue' ? '#3B82F6' : '#EF4444',
      });
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

    // 4. Update Archer Towers & Flying Arrows
    updateTowersAndArrows(
      this.state,
      dt,
      now,
      (notif) => this.io.emit('flagNotification', notif),
      (victim, killerTeam) => {
        handlePlayerDeath(this.state, victim, killerTeam, (notif) => this.io.emit('flagNotification', notif));
      }
    );

    // 5. Broadcast snapshot to all clients
    this.io.emit('worldState', this.state);
  }
}