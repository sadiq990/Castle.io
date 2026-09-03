import * as THREE from 'three';
import type { SceneManager } from '../core/SceneManager.js';
import type { ArrowState, Team, TowerState, Vector2 } from 'shared/types/entities.js';
import { getTerrainHeight } from '../terrain/TerrainGenerator.js';
import { deductPlayerResources, getPlayerResources } from '../resources/ResourceManager.js';
import { getSocket } from '../network/socketClient.js';
import { showCTFToast } from '../ui/flagUI.js';

interface LocalTower extends TowerState {
  mesh?: THREE.Group;
}

const towers = new Map<string, LocalTower>();
const arrowMeshes = new Map<string, THREE.Group>();

// ── 3D WATCHTOWER MESH ──────────────────────────────────────────
export function createWatchtowerMesh(team: Team): THREE.Group {
  const group = new THREE.Group();
  const teamColor = team === 'blue' ? 0x2563eb : 0xdc2626;

  // 1. Heavy Stone Base
  const stoneMat = new THREE.MeshStandardMaterial({
    color: 0x64748b, // Slate stone
    roughness: 0.88,
    metalness: 0.1,
    flatShading: true,
  });
  const towerBody = new THREE.Mesh(
    new THREE.CylinderGeometry(8.5, 12.5, 48, 8),
    stoneMat
  );
  towerBody.position.y = 24;
  towerBody.castShadow = true;
  towerBody.receiveShadow = true;
  group.add(towerBody);

  // 2. Wooden Observation Platform & Floor
  const woodMat = new THREE.MeshStandardMaterial({ color: 0x78350f, roughness: 0.85 });
  const platform = new THREE.Mesh(
    new THREE.CylinderGeometry(13.5, 13.5, 3.5, 8),
    woodMat
  );
  platform.position.y = 48;
  platform.castShadow = true;
  group.add(platform);

  // 3. Stone Battlements / Merlons
  for (let i = 0; i < 8; i++) {
    if (i % 2 === 0) {
      const angle = (i / 8) * Math.PI * 2;
      const merlon = new THREE.Mesh(new THREE.BoxGeometry(4.5, 5, 2.5), stoneMat);
      merlon.position.set(Math.cos(angle) * 12.5, 52, Math.sin(angle) * 12.5);
      merlon.rotation.y = -angle + Math.PI / 2;
      merlon.castShadow = true;
      group.add(merlon);
    }
  }

  // 4. Team Banner Ring
  const bannerMat = new THREE.MeshStandardMaterial({ color: teamColor, roughness: 0.5 });
  const banner = new THREE.Mesh(new THREE.CylinderGeometry(9.2, 9.2, 4.5, 8), bannerMat);
  banner.position.y = 36;
  group.add(banner);

  // 5. Standing Archer (Villager with Bow)
  const archerGroup = new THREE.Group();
  archerGroup.name = 'archer';
  archerGroup.position.y = 50;

  // Archer Body
  const archerBody = new THREE.Mesh(
    new THREE.CapsuleGeometry(3.5, 6, 4, 8),
    new THREE.MeshStandardMaterial({ color: 0xa16207, roughness: 0.8 })
  );
  archerBody.position.y = 4.5;
  archerBody.castShadow = true;
  archerGroup.add(archerBody);

  // Archer Hood / Hat
  const hood = new THREE.Mesh(
    new THREE.ConeGeometry(5, 4, 8),
    new THREE.MeshStandardMaterial({ color: teamColor, roughness: 0.7 })
  );
  hood.position.y = 9.5;
  archerGroup.add(hood);

  // Archer Wooden Bow (Curved arc)
  const bow = new THREE.Mesh(
    new THREE.TorusGeometry(3.5, 0.45, 4, 12, Math.PI * 0.9),
    new THREE.MeshStandardMaterial({ color: 0x451a03, roughness: 0.8 })
  );
  bow.position.set(0, 5, 4.5);
  bow.rotation.y = Math.PI / 2;
  archerGroup.add(bow);

  group.add(archerGroup);
  return group;
}

// ── 3D FLYING ARROW MESH ─────────────────────────────────────────
function createArrowMesh(): THREE.Group {
  const group = new THREE.Group();

  // Wooden shaft
  const shaft = new THREE.Mesh(
    new THREE.CylinderGeometry(0.35, 0.35, 10, 5),
    new THREE.MeshStandardMaterial({ color: 0x78350f, roughness: 0.8 })
  );
  shaft.rotation.x = Math.PI / 2;
  group.add(shaft);

  // Metallic arrowhead
  const head = new THREE.Mesh(
    new THREE.ConeGeometry(1.0, 2.5, 4),
    new THREE.MeshStandardMaterial({ color: 0x94a3b8, metalness: 0.8, roughness: 0.3 })
  );
  head.rotation.x = -Math.PI / 2;
  head.position.z = 5.5;
  group.add(head);

  // White feather fletching
  const feather = new THREE.Mesh(
    new THREE.BoxGeometry(0.2, 1.8, 2.5),
    new THREE.MeshStandardMaterial({ color: 0xf8fafc, roughness: 0.9 })
  );
  feather.position.z = -4.5;
  group.add(feather);

  return group;
}

// ── BUILD ATTEMPT ────────────────────────────────────────────────
export function attemptBuildTower(
  sceneManager: SceneManager,
  playerPos: Vector2,
  playerFacing: number,
  team: Team
): boolean {
  const res = getPlayerResources();
  if (res.wood < 15 || res.stone < 15) {
    showCTFToast('❌ Qüllə üçün 15 Odun və 15 Daş lazımdır!', '#EF4444');
    return false;
  }

  const buildPos: Vector2 = {
    x: playerPos.x + Math.cos(playerFacing) * 55,
    y: playerPos.y + Math.sin(playerFacing) * 55,
  };

  // Deduct
  deductPlayerResources(15, 15);

  const socket = getSocket();
  if (socket?.connected) {
    socket.emit('buildTower', buildPos);
  }

  showCTFToast('🏹 Oxatan Qülləsi tikildi!', '#10B981');
  return true;
}

// ── SYNC & ANIMATION ─────────────────────────────────────────────
export function syncTowersAndArrows3D(
  sceneManager: SceneManager,
  worldTowers?: Record<string, TowerState>,
  worldArrows?: ArrowState[]
): void {
  // 1. Sync Towers
  if (worldTowers) {
    for (const [id, tower] of Object.entries(worldTowers)) {
      let t = towers.get(id);
      if (!t) {
        const mesh = createWatchtowerMesh(tower.team);
        const y = getTerrainHeight(tower.position.x, tower.position.y);
        mesh.position.set(tower.position.x, y, tower.position.y);
        sceneManager.scene.add(mesh);

        t = { ...tower, mesh };
        towers.set(id, t);
      } else {
        t.hp = tower.hp;
        t.isDestroyed = tower.isDestroyed;
      }
    }
  }

  // 2. Sync Flying Arrows
  const activeArrowIds = new Set<string>();
  if (worldArrows) {
    for (const arrow of worldArrows) {
      activeArrowIds.add(arrow.id);
      let mesh = arrowMeshes.get(arrow.id);
      if (!mesh) {
        mesh = createArrowMesh();
        sceneManager.scene.add(mesh);
        arrowMeshes.set(arrow.id, mesh);
      }

      const y = getTerrainHeight(arrow.position.x, arrow.position.y) + 26 - Math.pow((arrow.progress - 0.5) * 2, 2) * 10;
      mesh.position.set(arrow.position.x, y, arrow.position.y);

      // Orient arrow towards target
      const dx = arrow.targetPos.x - arrow.startPos.x;
      const dz = arrow.targetPos.y - arrow.startPos.y;
      mesh.rotation.y = Math.atan2(dx, dz);
    }
  }

  // Remove despawned arrows
  for (const [id, mesh] of arrowMeshes.entries()) {
    if (!activeArrowIds.has(id)) {
      sceneManager.scene.remove(mesh);
      arrowMeshes.delete(id);
    }
  }
}