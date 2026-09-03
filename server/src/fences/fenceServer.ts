import type { FenceState, FenceType, GameWorldState, PlayerState, Team, Vector2 } from 'shared/types/entities.js';

export const FENCE_CONFIGS: Record<FenceType, { costWood: number; costStone: number; hp: number; damagePerHit: number }> = {
  WOOD: { costWood: 5, costStone: 0, hp: 30, damagePerHit: 15 },
  STONE: { costWood: 0, costStone: 10, hp: 100, damagePerHit: 25 },
};

let nextFenceId = 1;

export function canBuildFence(
  world: GameWorldState,
  player: PlayerState,
  type: FenceType,
  pos: Vector2
): { success: boolean; reason?: string } {
  const config = FENCE_CONFIGS[type];
  const resources = player.resources ?? { wood: 0, stone: 0 };

  if (resources.wood < config.costWood || resources.stone < config.costStone) {
    return { success: false, reason: 'Kifayət qədər resurs yoxdur!' };
  }

  // Check overlap with existing fences (min 25 units)
  for (const f of Object.values(world.fences)) {
    if (!f.isBroken && Math.hypot(f.position.x - pos.x, f.position.y - pos.y) < 26) {
      return { success: false, reason: 'Burada artıq divar var!' };
    }
  }

  // Check overlap with castles (min 130 units)
  for (const c of world.castles) {
    if (Math.hypot(c.position.x - pos.x, c.position.y - pos.y) < 130) {
      return { success: false, reason: 'Qala həyətində divar tikilə bilməz!' };
    }
  }

  return { success: true };
}

export function buildFence(
  world: GameWorldState,
  player: PlayerState,
  type: FenceType,
  position: Vector2,
  rotation: number
): FenceState | null {
  const check = canBuildFence(world, player, type, position);
  if (!check.success) return null;

  const config = FENCE_CONFIGS[type];
  if (!player.resources) player.resources = { wood: 0, stone: 0 };
  player.resources.wood -= config.costWood;
  player.resources.stone -= config.costStone;

  const id = `fence-${nextFenceId++}`;
  const fence: FenceState = {
    id,
    type,
    team: player.team,
    position: { ...position },
    rotation,
    hp: config.hp,
    maxHp: config.hp,
    isBroken: false,
  };

  world.fences[id] = fence;
  return fence;
}

export function handleFenceAttack(
  world: GameWorldState,
  player: PlayerState,
  fenceId: string,
  notify: (data: { text: string; color: string }) => void
): { hit: boolean; damaged?: boolean; destroyed?: boolean } {
  const fence = world.fences[fenceId];
  if (!fence || fence.isBroken) return { hit: false };

  // Only damage opponent fences
  if (fence.team === player.team) return { hit: false };

  // Attack range check (~65 units)
  const dist = Math.hypot(fence.position.x - player.position.x, fence.position.y - player.position.y);
  if (dist > 75) return { hit: false };

  // Both teams can attack and breach opponent fences!
  const config = FENCE_CONFIGS[fence.type];
  const damage = player.hasFlag ? config.damagePerHit * 1.5 : config.damagePerHit;
  fence.hp = Math.max(0, fence.hp - damage);

  if (fence.hp <= 0) {
    fence.isBroken = true;
    fence.brokenAt = Date.now();
    const teamName = fence.team === 'blue' ? 'Mavi' : 'Qırmızı';
    notify({
      text: `🔨 ${teamName} komandasının ${fence.type === 'WOOD' ? 'taxta' : 'daş'} divarı dağıdıldı!`,
      color: fence.team === 'blue' ? '#3B82F6' : '#EF4444',
    });
    return { hit: true, damaged: true, destroyed: true };
  }

  return { hit: true, damaged: true, destroyed: false };
}

// Cleanup broken fences after 60 seconds
export function updateFences(world: GameWorldState): void {
  const now = Date.now();
  for (const [id, fence] of Object.entries(world.fences)) {
    if (fence.isBroken && fence.brokenAt && now - fence.brokenAt > 60000) {
      delete world.fences[id];
    }
  }
}