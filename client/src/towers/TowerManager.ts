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

// ── 3D WATCHTOWER MESH (Epic Medieval Fortress Outpost) ─────────
export function createWatchtowerMesh(team: Team): THREE.Group {
  const group = new THREE.Group();
  const isBlue = team === 'blue';

  const stoneColor = isBlue ? 0xb8c4cf : 0xc9b99a;
  const darkStone  = isBlue ? 0x8a9ba8 : 0xa08060;
  const roofColor  = isBlue ? 0x1e3a8a : 0x7f1d1d;
  const bannerColor= isBlue ? 0x3b82f6 : 0xef4444;
  const woodColor  = 0x4a3728;

  const stoneMat  = new THREE.MeshStandardMaterial({ color: stoneColor, roughness: 0.88, metalness: 0.04, flatShading: true });
  const darkMat   = new THREE.MeshStandardMaterial({ color: darkStone,  roughness: 0.92, metalness: 0.02, flatShading: true });
  const roofMat   = new THREE.MeshStandardMaterial({ color: roofColor,  roughness: 0.70, metalness: 0.08, flatShading: true });
  const woodMat   = new THREE.MeshStandardMaterial({ color: woodColor,  roughness: 0.88 });
  const bannerMat = new THREE.MeshStandardMaterial({ color: bannerColor, roughness: 0.7, metalness: 0.05 });

  // 1. Heavy Chamfered Octagonal Stone Base Plinth
  const plinth = new THREE.Mesh(new THREE.CylinderGeometry(15, 18, 14, 8), stoneMat);
  plinth.position.y = 7;
  plinth.castShadow = true;
  plinth.receiveShadow = true;
  group.add(plinth);

  // 2. Main Stone Tower Shaft
  const shaftH = 50;
  const shaft = new THREE.Mesh(new THREE.CylinderGeometry(12, 14.5, shaftH, 8), stoneMat);
  shaft.position.y = 14 + shaftH / 2;
  shaft.castShadow = true;
  shaft.receiveShadow = true;
  group.add(shaft);

  // 3. Narrow Arrow Slits (Embrasures) on 4 sides of the shaft
  const slitMat = new THREE.MeshStandardMaterial({ color: 0x18181b, roughness: 0.9 });
  for (let a = 0; a < 4; a++) {
    const angle = (a / 4) * Math.PI * 2;
    const slit = new THREE.Mesh(new THREE.BoxGeometry(2.2, 12, 1.5), slitMat);
    slit.position.set(Math.cos(angle) * 12.8, 38, Math.sin(angle) * 12.8);
    slit.rotation.y = -angle + Math.PI / 2;
    group.add(slit);
  }

  // 4. Overhanging Timber Support Corbels (Machicolations)
  const deckY = 64;
  for (let c = 0; c < 8; c++) {
    const angle = (c / 8) * Math.PI * 2;
    const bracket = new THREE.Mesh(new THREE.BoxGeometry(2.8, 8, 7), woodMat);
    bracket.position.set(Math.cos(angle) * 13.5, deckY - 4, Math.sin(angle) * 13.5);
    bracket.rotation.y = -angle + Math.PI / 2;
    bracket.rotation.x = 0.28;
    bracket.castShadow = true;
    group.add(bracket);
  }

  // 5. Timber Observation Deck Floor
  const platform = new THREE.Mesh(new THREE.CylinderGeometry(19, 19, 3.5, 8), woodMat);
  platform.position.y = deckY;
  platform.castShadow = true;
  platform.receiveShadow = true;
  group.add(platform);

  // 6. Stone Battlements / Merlons (8 protective teeth)
  for (let i = 0; i < 8; i++) {
    const angle = (i / 8) * Math.PI * 2;
    const merlon = new THREE.Mesh(new THREE.BoxGeometry(6.5, 9, 3.5), darkMat);
    merlon.position.set(Math.cos(angle) * 17.5, deckY + 5.5, Math.sin(angle) * 17.5);
    merlon.rotation.y = -angle + Math.PI / 2;
    merlon.castShadow = true;
    group.add(merlon);
  }

  // 7. Four Sturdy Timber Corner Posts holding the Spire Roof
  const postH = 26;
  const postOffsets: [number, number][] = [
    [-11, -11], [11, -11], [-11, 11], [11, 11]
  ];
  for (const [px, pz] of postOffsets) {
    const post = new THREE.Mesh(new THREE.BoxGeometry(2.4, postH, 2.4), woodMat);
    post.position.set(px, deckY + postH / 2, pz);
    post.castShadow = true;
    group.add(post);
  }

  // 8. Peaked Medieval Shingled Spire Roof (Conical Pyramidal)
  const roofH = 28;
  const roof = new THREE.Mesh(new THREE.ConeGeometry(22, roofH, 8), roofMat);
  roof.position.y = deckY + postH + roofH / 2;
  roof.castShadow = true;
  group.add(roof);

  // 9. Golden Finial / Spear Tip on Roof Apex
  const finial = new THREE.Mesh(new THREE.SphereGeometry(2.8, 6, 6), new THREE.MeshBasicMaterial({ color: 0xffd700 }));
  finial.position.y = deckY + postH + roofH + 2.0;
  group.add(finial);

  // 10. Team War Banner hanging down the front of the tower
  const banner = new THREE.Mesh(new THREE.BoxGeometry(8, 22, 1.2), bannerMat);
  banner.position.set(0, deckY - 10, 16.5);
  banner.castShadow = true;
  group.add(banner);

  // 11. Two Corner Torches on the parapet
  const torchPositions: [number, number][] = [[-15, 0], [15, 0]];
  for (const [tx, tz] of torchPositions) {
    const torchWood = new THREE.Mesh(new THREE.CylinderGeometry(0.8, 0.8, 8, 4), woodMat);
    torchWood.position.set(tx, deckY + 8, tz);
    group.add(torchWood);

    const flame = new THREE.Mesh(
      new THREE.SphereGeometry(2.6, 5, 5),
      new THREE.MeshBasicMaterial({ color: 0xf97316 })
    );
    flame.position.set(tx, deckY + 13, tz);
    flame.name = 'towerTorch';
    group.add(flame);
  }

  // 12. Standing Archer (Elite Marksman)
  const archerGroup = new THREE.Group();
  archerGroup.name = 'archer';
  archerGroup.position.set(0, deckY + 1.8, 0);

  // Archer Body (leather jerkin)
  const archerBody = new THREE.Mesh(
    new THREE.CapsuleGeometry(3.2, 7, 4, 8),
    new THREE.MeshStandardMaterial({ color: 0x78350f, roughness: 0.85 })
  );
  archerBody.position.y = 5.5;
  archerBody.castShadow = true;
  archerGroup.add(archerBody);

  // Archer Hood / Cloak (Team Color)
  const hood = new THREE.Mesh(
    new THREE.ConeGeometry(4.2, 5.5, 8),
    new THREE.MeshStandardMaterial({ color: bannerColor, roughness: 0.7 })
  );
  hood.position.y = 11.5;
  archerGroup.add(hood);

  // Archer Wooden Recurve Bow
  const bow = new THREE.Mesh(
    new THREE.TorusGeometry(4.2, 0.5, 4, 12, Math.PI * 0.95),
    new THREE.MeshStandardMaterial({ color: 0x3d2010, roughness: 0.8 })
  );
  bow.position.set(0, 6.5, 5.5);
  bow.rotation.y = Math.PI / 2;
  archerGroup.add(bow);

  // Quiver with arrows slung across back
  const quiver = new THREE.Mesh(
    new THREE.CylinderGeometry(1.2, 1.0, 8, 5),
    new THREE.MeshStandardMaterial({ color: 0x3e2723, roughness: 0.9 })
  );
  quiver.position.set(2.0, 7.0, -3.2);
  quiver.rotation.z = -0.3;
  quiver.rotation.x = 0.2;
  archerGroup.add(quiver);

  // Arrow feathers in quiver
  const feathers = new THREE.Mesh(
    new THREE.BoxGeometry(0.8, 3.0, 1.2),
    new THREE.MeshStandardMaterial({ color: 0xf8fafc, roughness: 0.9 })
  );
  feathers.position.set(2.8, 11.5, -3.8);
  archerGroup.add(feathers);

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
  targetPos: Vector2,
  team: Team
): boolean {
  const res = getPlayerResources();
  if (res.wood < 10 || res.stone < 10) {
    showCTFToast('❌ Qüllə üçün 10 Odun və 10 Daş lazımdır!', '#EF4444');
    return false;
  }

  // Check overlap with existing towers (min 35 units)
  for (const t of towers.values()) {
    if (!t.isDestroyed && Math.hypot(t.position.x - targetPos.x, t.position.y - targetPos.y) < 35) {
      showCTFToast('❌ Burada artıq qüllə var!', '#EF4444');
      return false;
    }
  }

  // Deduct
  deductPlayerResources(10, 10);

  const localId = `local-tower-${Date.now()}`;
  const mesh = createWatchtowerMesh(team);
  const y = getTerrainHeight(targetPos.x, targetPos.y);
  mesh.position.set(targetPos.x, y, targetPos.y);
  sceneManager.scene.add(mesh);

  towers.set(localId, {
    id: localId,
    team,
    position: { ...targetPos },
    hp: 120,
    maxHp: 120,
    lastFireTime: 0,
    range: 220,
    isDestroyed: false,
    mesh,
  });

  const socket = getSocket();
  if (socket?.connected) {
    socket.emit('buildTower', targetPos);
  }

  showCTFToast('🏹 Oxatan Qülləsi ucaldıldı!', '#10B981');
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

  // Animate torches & archers across all active towers
  const now = performance.now() * 0.001;
  for (const t of towers.values()) {
    if (!t.mesh || t.isDestroyed) continue;
    t.mesh.traverse((child) => {
      if (child.name === 'towerTorch') {
        const flicker = 0.85 + Math.sin(now * 8.5 + child.position.x * 2.0) * 0.2;
        child.scale.setScalar(flicker);
      } else if (child.name === 'archer') {
        child.rotation.y = Math.sin(now * 1.2 + t.position.x * 0.05) * 0.25;
      }
    });
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