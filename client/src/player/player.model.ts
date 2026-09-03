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

const WATER_LAKES = [
  { x: 950, y: 1150, radius: 250 },
  { x: 2100, y: 1950, radius: 270 },
];

export function movePlayer(player: Player, dx: number, dy: number, dt: number, mapSize: number): void {
  const len = Math.sqrt(dx * dx + dy * dy);
  if (len === 0) return;

  const nx = dx / len;
  const ny = dy / len;

  player.facing = Math.atan2(ny, nx);

  // Water Slowdown (0.5x inside water, smooth lerp over 0.3s when exiting)
  let inWater = false;
  for (const lake of WATER_LAKES) {
    if (Math.hypot(player.position.x - lake.x, player.position.y - lake.y) < lake.radius) {
      inWater = true;
      break;
    }
  }

  const targetWater = inWater ? 0.5 : 1.0;
  const curWater = player.waterSpeedMultiplier ?? 1.0;
  player.waterSpeedMultiplier = curWater + (targetWater - curWater) * Math.min(1.0, dt / 0.3);

  const effSpeed = player.speed * (player.speedMultiplier ?? 1.0) * player.waterSpeedMultiplier;

  player.position.x = Math.max(0, Math.min(mapSize, player.position.x + nx * effSpeed * dt));
  player.position.y = Math.max(0, Math.min(mapSize, player.position.y + ny * effSpeed * dt));
}
