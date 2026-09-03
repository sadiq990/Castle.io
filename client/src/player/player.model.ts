// Player data model — pure data, no rendering, no network.

import type { PlayerState, Vector2 } from 'shared/types/entities.js';
import { DEFAULT_PLAYER_SPEED } from 'shared/constants/game.constants.js';

export interface Player extends PlayerState {
  speed: number;
}

export function createLocalPlayer(id: string, position: Vector2, color: string, name = ''): Player {
  return {
    id,
    name,
    position: { ...position },
    color,
    team: 'blue',
    hasFlag: false,
    speedMultiplier: 1.0,
    facing: 0,
    speed: DEFAULT_PLAYER_SPEED,
  };
}

export function movePlayer(player: Player, dx: number, dy: number, dt: number, mapSize: number): void {
  const len = Math.sqrt(dx * dx + dy * dy);
  if (len === 0) return;

  const nx = dx / len;
  const ny = dy / len;

  player.facing = Math.atan2(ny, nx);
  player.position.x = Math.max(0, Math.min(mapSize, player.position.x + nx * player.speed * dt));
  player.position.y = Math.max(0, Math.min(mapSize, player.position.y + ny * player.speed * dt));
}
