import type { ArrowState, GameWorldState, PlayerState, Team, TowerState, Vector2 } from 'shared/types/entities.js';

let nextTowerId = 1;
let nextArrowId = 1;

export const TOWER_COST = { wood: 10, stone: 10 };

export function canBuildTower(
  world: GameWorldState,
  player: PlayerState,
  pos: Vector2
): { success: boolean; reason?: string } {
  const res = player.resources ?? { wood: 0, stone: 0 };
  if (res.wood < TOWER_COST.wood || res.stone < TOWER_COST.stone) {
    return { success: false, reason: 'Kifayət qədər resurs yoxdur! (10 Odun, 10 Daş lazımdır)' };
  }

  // Check overlap with existing towers (min 35 units)
  for (const t of Object.values(world.towers)) {
    if (!t.isDestroyed && Math.hypot(t.position.x - pos.x, t.position.y - pos.y) < 35) {
      return { success: false, reason: 'Burada artıq qüllə var!' };
    }
  }

  return { success: true };
}

export function buildTower(
  world: GameWorldState,
  player: PlayerState,
  position: Vector2
): TowerState | null {
  const check = canBuildTower(world, player, position);
  if (!check.success) return null;

  if (!player.resources) player.resources = { wood: 0, stone: 0 };
  player.resources.wood -= TOWER_COST.wood;
  player.resources.stone -= TOWER_COST.stone;

  const id = `tower-${nextTowerId++}`;
  const tower: TowerState = {
    id,
    team: player.team,
    position: { ...position },
    hp: 120,
    maxHp: 120,
    lastFireTime: 0,
    range: 220,
    isDestroyed: false,
  };

  world.towers[id] = tower;
  return tower;
}

export function updateTowersAndArrows(
  world: GameWorldState,
  dt: number,
  now: number,
  notify: (data: { text: string; color: string }) => void,
  onPlayerKilled: (victim: PlayerState, killerTeam: Team) => void
): void {
  if (!world.towers) world.towers = {};
  if (!world.arrows) world.arrows = [];

  // 1. Tower Target Scanning & Shooting
  for (const tower of Object.values(world.towers)) {
    if (tower.isDestroyed) continue;

    if (now - tower.lastFireTime >= 1800) { // Fires every 1.8s
      // Find nearest enemy player in range
      let target: PlayerState | null = null;
      let minDist = tower.range;

      for (const p of Object.values(world.players)) {
        if (p.team !== tower.team) {
          const dist = Math.hypot(p.position.x - tower.position.x, p.position.y - tower.position.y);
          if (dist < minDist) {
            minDist = dist;
            target = p;
          }
        }
      }

      if (target) {
        tower.lastFireTime = now;
        // Spawn flying arrow
        world.arrows.push({
          id: `arrow-${nextArrowId++}`,
          startPos: { ...tower.position },
          targetPos: { ...target.position },
          position: { ...tower.position },
          team: tower.team,
          progress: 0,
        });
      }
    }
  }

  // 2. Flying Arrows Update
  for (let i = world.arrows.length - 1; i >= 0; i--) {
    const arrow = world.arrows[i]!;
    arrow.progress += dt * 3.2; // ~0.3s flight duration

    arrow.position.x = arrow.startPos.x + (arrow.targetPos.x - arrow.startPos.x) * Math.min(1.0, arrow.progress);
    arrow.position.y = arrow.startPos.y + (arrow.targetPos.y - arrow.startPos.y) * Math.min(1.0, arrow.progress);

    if (arrow.progress >= 1.0) {
      // Impact! Check hit on enemy players near impact point
      for (const p of Object.values(world.players)) {
        if (p.team !== arrow.team) {
          if (Math.hypot(p.position.x - arrow.targetPos.x, p.position.y - arrow.targetPos.y) < 32) {
            p.hp = Math.max(0, (p.hp ?? 100) - 25);
            if (p.hp <= 0) {
              onPlayerKilled(p, arrow.team);
            }
            break;
          }
        }
      }
      world.arrows.splice(i, 1);
    }
  }
}