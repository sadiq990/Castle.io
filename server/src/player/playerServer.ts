// Server-side player lifecycle: join, leave, move.
// All player state mutations happen here.

import type { PlayerState, GameWorldState, Team, Vector2 } from 'shared/types/entities.js';
import type { MovementInput } from 'shared/types/network.js';
import { DEFAULT_PLAYER_SPEED } from 'shared/constants/game.constants.js';

export function addPlayer(world: GameWorldState, id: string, name: string): PlayerState {
  // Balanced team assignment: blue vs red
  const players = Object.values(world.players);
  const blueCount = players.filter(p => p.team === 'blue').length;
  const redCount = players.filter(p => p.team === 'red').length;

  const team: Team = blueCount <= redCount ? 'blue' : 'red';
  const color = team === 'blue' ? '#2E6FE0' : '#D9302F';

  // Spawn near team castle with small scatter
  const baseSpawn: Vector2 = team === 'blue'
    ? { x: 400, y: 400 }
    : { x: 2600, y: 2600 };

  const spawnOffset = (Math.random() - 0.5) * 80;
  const position: Vector2 = {
    x: Math.max(100, Math.min(world.mapSize - 100, baseSpawn.x + spawnOffset)),
    y: Math.max(100, Math.min(world.mapSize - 100, baseSpawn.y + spawnOffset)),
  };

  const newPlayer: PlayerState = {
    id,
    name,
    position,
    color,
    team,
    hasFlag: false,
    speedMultiplier: 1.0,
    waterSpeedMultiplier: 1.0,
    resources: { wood: 10, stone: 5 },
    facing: 0,
  };

  world.players[id] = newPlayer;
  return newPlayer;
}

export function removePlayer(world: GameWorldState, id: string): void {
  const player = world.players[id];
  if (player && player.hasFlag) {
    // Drop any carried flag
    for (const flag of Object.values(world.ctf.flags)) {
      if (flag.carrierId === id) {
        flag.status = 'DROPPED';
        flag.carrierId = null;
        flag.dropTimer = 30;
      }
    }
  }

  delete world.players[id];
}

const WATER_LAKES = [
  { x: 950, y: 1150, radius: 250 },
  { x: 2100, y: 1950, radius: 270 },
];

export function applyMovementInput(
  world: GameWorldState,
  playerId: string,
  input: MovementInput,
  dt: number,
): void {
  const player = world.players[playerId];
  if (!player) return;

  const dx = Math.max(-1, Math.min(1, input.dx));
  const dy = Math.max(-1, Math.min(1, input.dy));

  const len = Math.sqrt(dx * dx + dy * dy);
  if (len < 0.01) return;

  const nx = dx / len;
  const ny = dy / len;

  player.facing = Math.atan2(ny, nx);

  // 1. Water Slowdown Check (0.5x in water, smooth lerp over 0.3s)
  let inWater = false;
  for (const lake of WATER_LAKES) {
    if (Math.hypot(player.position.x - lake.x, player.position.y - lake.y) < lake.radius) {
      inWater = true;
      break;
    }
  }

  const targetWaterSpeed = inWater ? 0.5 : 1.0;
  const currentWaterMultiplier = player.waterSpeedMultiplier ?? 1.0;
  const lerpFactor = Math.min(1.0, dt / 0.3);
  player.waterSpeedMultiplier = currentWaterMultiplier + (targetWaterSpeed - currentWaterMultiplier) * lerpFactor;

  // 2. Combined speed
  const currentSpeed = DEFAULT_PLAYER_SPEED * (player.speedMultiplier ?? 1.0) * player.waterSpeedMultiplier;

  const nextX = Math.max(0, Math.min(world.mapSize, player.position.x + nx * currentSpeed * dt));
  const nextY = Math.max(0, Math.min(world.mapSize, player.position.y + ny * currentSpeed * dt));

  // 3. Collision with unbroken fences
  let blocked = false;
  if (world.fences) {
    for (const fence of Object.values(world.fences)) {
      if (!fence.isBroken) {
        if (Math.hypot(nextX - fence.position.x, nextY - fence.position.y) < 24) {
          blocked = true;
          break;
        }
      }
    }
  }

  if (!blocked) {
    player.position.x = nextX;
    player.position.y = nextY;
  }
}