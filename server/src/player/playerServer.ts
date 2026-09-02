// Server-side player lifecycle: join, leave, move.
// All player state mutations happen here.
// Input validation: clamp dx/dy to [-1, 1].

import type { PlayerState, GameWorldState, Vector2 } from 'shared/types/entities.js';
import type { MovementInput } from 'shared/types/network.js';
import { DEFAULT_PLAYER_SPEED, PLAYER_COLORS } from 'shared/constants/game.constants.js';
import { SERVER_MAP_DATA } from '../map/mapData.server.js';

let spawnIndex = 0;

export function addPlayer(world: GameWorldState, id: string, name: string): PlayerState {
  const spawns = SERVER_MAP_DATA.playerSpawns;
  const position: Vector2 = { ...spawns[spawnIndex % spawns.length]! };
  spawnIndex++;

  const color = PLAYER_COLORS[Object.keys(world.players).length % PLAYER_COLORS.length] ?? '#ffffff';

  const newPlayer: PlayerState = {
    id: id,
    name: name,
    position,
    color,
    facing: 0,
  };

  world.players[id] = newPlayer;
  return newPlayer;
}

export function removePlayer(world: GameWorldState, id: string): void {
  // eslint-disable-next-line @typescript-eslint/no-dynamic-delete
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

  // Clamp to prevent cheating
  const dx = Math.max(-1, Math.min(1, input.dx));
  const dy = Math.max(-1, Math.min(1, input.dy));

  const len = Math.sqrt(dx * dx + dy * dy);
  if (len < 0.01) return;

  const nx = dx / len;
  const ny = dy / len;

  player.facing = Math.atan2(ny, nx);
  player.position.x = Math.max(0, Math.min(world.mapSize, player.position.x + nx * DEFAULT_PLAYER_SPEED * dt));
  player.position.y = Math.max(0, Math.min(world.mapSize, player.position.y + ny * DEFAULT_PLAYER_SPEED * dt));
}
