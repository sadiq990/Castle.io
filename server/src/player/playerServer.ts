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
  const currentSpeed = DEFAULT_PLAYER_SPEED * (player.speedMultiplier ?? 1.0);

  player.position.x = Math.max(0, Math.min(world.mapSize, player.position.x + nx * currentSpeed * dt));
  player.position.y = Math.max(0, Math.min(world.mapSize, player.position.y + ny * currentSpeed * dt));
}