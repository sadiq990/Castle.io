import * as THREE from 'three';
import type { SceneManager } from '../core/SceneManager.js';
import type { FenceState, FenceType, Team, Vector2 } from 'shared/types/entities.js';
import { getTerrainHeight } from '../terrain/TerrainGenerator.js';
import { deductPlayerResources, getPlayerResources } from '../resources/ResourceManager.js';
import { getSocket } from '../network/socketClient.js';
import { showCTFToast } from '../ui/flagUI.js';

interface LocalFence extends FenceState {
  mesh?: THREE.Group;
  shakeTime?: number;
  collapseProgress?: number;
}

const fences = new Map<string, LocalFence>();
let activeBuildType: FenceType | null = null;
let ghostMesh: THREE.Group | null = null;
let sceneManagerRef: SceneManager | null = null;

export function setSceneManagerForFences(sm: SceneManager): void {
  sceneManagerRef = sm;
}

export function getActiveBuildType(): FenceType | null {
  return activeBuildType;
}

export function setActiveBuildType(type: FenceType | null): void {
  activeBuildType = type;
  if (!activeBuildType && ghostMesh) {
    ghostMesh.visible = false;
  }
}

// ── 3D FENCE MESH GENERATORS ──────────────────────────────────────
function createWoodFenceMesh(): THREE.Group {
  const group = new THREE.Group();
  const woodMat = new THREE.MeshStandardMaterial({
    color: 0x8b5a2b, // Warm timber brown
    roughness: 0.85,
    metalness: 0.05,
  });

  // 3 Vertical pointed wooden posts
  const postGeo = new THREE.CylinderGeometry(2.0, 2.4, 22, 6);
  postGeo.translate(0, 11, 0);

  const postPositions = [-14, 0, 14];
  for (const px of postPositions) {
    const post = new THREE.Mesh(postGeo, woodMat);
    post.position.x = px;
    post.castShadow = true;
    post.receiveShadow = true;

    // Pointed top tip
    const tipGeo = new THREE.ConeGeometry(2.4, 4, 6);
    const tip = new THREE.Mesh(tipGeo, woodMat);
    tip.position.set(px, 24, 0);
    tip.castShadow = true;
    group.add(tip);

    group.add(post);
  }

  // 2 Horizontal cross rails
  const railGeo = new THREE.BoxGeometry(32, 2.8, 2.2);
  const topRail = new THREE.Mesh(railGeo, woodMat);
  topRail.position.set(0, 16, 0);
  topRail.castShadow = true;
  group.add(topRail);

  const bottomRail = new THREE.Mesh(railGeo, woodMat);
  bottomRail.position.set(0, 7, 0);
  bottomRail.castShadow = true;
  group.add(bottomRail);

  return group;
}

function createStoneFenceMesh(): THREE.Group {
  const group = new THREE.Group();
  const stoneMat = new THREE.MeshStandardMaterial({
    color: 0x8a8a8a, // Heavy stone grey
    roughness: 0.9,
    metalness: 0.05,
    flatShading: true,
  });

  // Main Stone Wall Body
  const wallGeo = new THREE.BoxGeometry(34, 18, 8);
  wallGeo.translate(0, 9, 0);
  const wall = new THREE.Mesh(wallGeo, stoneMat);
  wall.castShadow = true;
  wall.receiveShadow = true;
  group.add(wall);

  // 3 Merlons (battlements) on top
  const merlonGeo = new THREE.BoxGeometry(7, 5, 8.2);
  merlonGeo.translate(0, 20.5, 0);
  const merlonPositions = [-12, 0, 12];
  for (const mx of merlonPositions) {
    const merlon = new THREE.Mesh(merlonGeo, stoneMat);
    merlon.position.x = mx;
    merlon.castShadow = true;
    group.add(merlon);
  }

  return group;
}

// ── PARTICLE BURST ON HIT ─────────────────────────────────────────
function spawnDebrisParticles(scene: THREE.Scene, pos: Vector2, isWood: boolean): void {
  const count = 8;
  const geo = isWood ? new THREE.BoxGeometry(1.5, 1.5, 3) : new THREE.DodecahedronGeometry(1.8, 0);
  const mat = new THREE.MeshStandardMaterial({
    color: isWood ? 0x8b5a2b : 0x78716c,
    roughness: 0.9,
  });

  for (let i = 0; i < count; i++) {
    const p = new THREE.Mesh(geo, mat);
    const groundY = getTerrainHeight(pos.x, pos.y) + 10;
    p.position.set(
      pos.x + (Math.random() - 0.5) * 12,
      groundY + Math.random() * 8,
      pos.y + (Math.random() - 0.5) * 12
    );
    scene.add(p);

    // Fade out and remove
    setTimeout(() => {
      scene.remove(p);
    }, 650);
  }
}

// ── BUILD ATTEMPT ─────────────────────────────────────────────────
// ── SMART SNAPPING CALCULATION ────────────────────────────────────
export function getSnappedFencePlacement(
  mouseWorldPos: Vector2,
  team: Team
): { position: Vector2; rotation: number; isSnapped: boolean } {
  let nearestFriendly: LocalFence | null = null;
  let minSnapDist = 48;

  for (const f of fences.values()) {
    if (!f.isBroken && f.team === team) {
      const d = Math.hypot(f.position.x - mouseWorldPos.x, f.position.y - mouseWorldPos.y);
      if (d < minSnapDist) {
        minSnapDist = d;
        nearestFriendly = f;
      }
    }
  }

  if (nearestFriendly) {
    const snapDir = Math.atan2(mouseWorldPos.y - nearestFriendly.position.y, mouseWorldPos.x - nearestFriendly.position.x);
    // Align with wall segment (31 units apart)
    return {
      position: {
        x: nearestFriendly.position.x + Math.cos(snapDir) * 31,
        y: nearestFriendly.position.y + Math.sin(snapDir) * 31,
      },
      rotation: nearestFriendly.rotation,
      isSnapped: true,
    };
  }

  return {
    position: { ...mouseWorldPos },
    rotation: 0,
    isSnapped: false,
  };
}

// ── LIVE HOLOGRAPHIC GHOST PREVIEW ────────────────────────────────
let currentGhostType: string | null = null;

export function updateGhostPreview(
  sceneManager: SceneManager,
  targetPos: Vector2 | null,
  team: Team,
  isTower: boolean
): void {
  const buildType = isTower ? 'TOWER' : activeBuildType;

  if (!buildType || !targetPos) {
    if (ghostMesh) ghostMesh.visible = false;
    return;
  }

  if (!ghostMesh || currentGhostType !== buildType) {
    if (ghostMesh) sceneManager.scene.remove(ghostMesh);

    if (buildType === 'WOOD') {
      ghostMesh = createWoodFenceMesh();
    } else if (buildType === 'STONE') {
      ghostMesh = createStoneFenceMesh();
    } else {
      // Tower
      const baseGeo = new THREE.CylinderGeometry(8.5, 12.5, 48, 8);
      const baseMat = new THREE.MeshBasicMaterial({ color: 0x22c55e, wireframe: true });
      ghostMesh = new THREE.Group();
      const m = new THREE.Mesh(baseGeo, baseMat);
      m.position.y = 24;
      ghostMesh.add(m);
    }

    currentGhostType = buildType;
    sceneManager.scene.add(ghostMesh);
  }

  // Calculate Snapped Position for Fences
  let placePos = targetPos;
  let rotation = 0;

  if (buildType !== 'TOWER') {
    const snap = getSnappedFencePlacement(targetPos, team);
    placePos = snap.position;
    rotation = snap.rotation;
  }

  const res = getPlayerResources();
  let affordable = false;
  if (buildType === 'WOOD') affordable = res.wood >= 5;
  else if (buildType === 'STONE') affordable = res.stone >= 10;
  else if (buildType === 'TOWER') affordable = res.wood >= 10 && res.stone >= 10;

  ghostMesh.visible = true;
  const groundY = getTerrainHeight(placePos.x, placePos.y);
  ghostMesh.position.set(placePos.x, groundY, placePos.y);
  ghostMesh.rotation.y = rotation;

  // Tint ghost green (affordable) or red (unaffordable)
  const tintColor = affordable ? (buildType === 'TOWER' ? 0x3b82f6 : 0x22c55e) : 0xef4444;
  ghostMesh.traverse(child => {
    if (child instanceof THREE.Mesh) {
      if (!child.userData['origMat']) child.userData['origMat'] = child.material;
      child.material = new THREE.MeshBasicMaterial({
        color: tintColor,
        transparent: true,
        opacity: 0.55,
        wireframe: false,
      });
    }
  });
}

// ── BUILD AT POSITION ─────────────────────────────────────────────
export function attemptBuildFenceAt(
  sceneManager: SceneManager,
  targetPos: Vector2,
  team: Team
): boolean {
  if (!activeBuildType) return false;

  const costWood = activeBuildType === 'WOOD' ? 5 : 0;
  const costStone = activeBuildType === 'STONE' ? 10 : 0;

  const res = getPlayerResources();
  if (res.wood < costWood || res.stone < costStone) {
    showCTFToast('❌ Kifayət qədər resurs yoxdur!', '#EF4444');
    return false;
  }

  const snap = getSnappedFencePlacement(targetPos, team);
  const buildPos = snap.position;
  const rotation = snap.rotation;

  // Check overlap with existing fences (min 22 units)
  for (const f of fences.values()) {
    if (!f.isBroken && Math.hypot(f.position.x - buildPos.x, f.position.y - buildPos.y) < 22) {
      showCTFToast('❌ Burada artıq divar var!', '#EF4444');
      return false;
    }
  }

  // Deduct resources
  deductPlayerResources(costWood, costStone);

  const id = `local-fence-${Date.now()}`;
  const maxHp = activeBuildType === 'WOOD' ? 30 : 100;

  const fenceData: LocalFence = {
    id,
    type: activeBuildType,
    team,
    position: buildPos,
    rotation,
    hp: maxHp,
    maxHp,
    isBroken: false,
  };

  addOrUpdateFence(sceneManager, fenceData);

  // Send to server
  const socket = getSocket();
  if (socket?.connected) {
    socket.emit('buildFence', {
      type: activeBuildType,
      position: buildPos,
      rotation,
    });
  }

  showCTFToast(`🧱 ${activeBuildType === 'WOOD' ? 'Taxta hasar' : 'Daş divar'} birləşdirildi!`, '#10B981');
  return true;
}

export function addOrUpdateFence(sceneManager: SceneManager, fenceData: FenceState): void {
  let f = fences.get(fenceData.id);

  if (!f) {
    const mesh = fenceData.type === 'WOOD' ? createWoodFenceMesh() : createStoneFenceMesh();
    const groundY = getTerrainHeight(fenceData.position.x, fenceData.position.y);
    mesh.position.set(fenceData.position.x, groundY, fenceData.position.y);
    mesh.rotation.y = fenceData.rotation;
    sceneManager.scene.add(mesh);

    f = { ...fenceData, mesh };
    fences.set(fenceData.id, f);
  } else {
    f.hp = fenceData.hp;
    f.isBroken = fenceData.isBroken;
  }
}

// Check player collision against active fences
export function checkFenceCollision(x: number, y: number, radius = 16): boolean {
  for (const f of fences.values()) {
    if (!f.isBroken) {
      if (Math.hypot(f.position.x - x, f.position.y - y) < radius + 14) {
        return true;
      }
    }
  }
  return false;
}

// Attack nearby opponent fence (Both teams can breach enemy fences!)
export function attemptAttackFence(
  sceneManager: SceneManager,
  playerPos: Vector2,
  playerTeam: Team,
  hasFlag: boolean
): boolean {
  let closestFence: LocalFence | null = null;
  let minDist = 75;

  for (const f of fences.values()) {
    if (!f.isBroken && f.team !== playerTeam) {
      const dist = Math.hypot(f.position.x - playerPos.x, f.position.y - playerPos.y);
      if (dist < minDist) {
        minDist = dist;
        closestFence = f;
      }
    }
  }

  if (!closestFence) return false;

  // Attack calculation: Flag carrier gets heavy bash bonus!
  const baseDamage = closestFence.type === 'WOOD' ? 15 : 25;
  const damage = hasFlag ? baseDamage * 1.5 : baseDamage;

  closestFence.hp = Math.max(0, closestFence.hp - damage);
  closestFence.shakeTime = 0.25;

  spawnDebrisParticles(sceneManager.scene, closestFence.position, closestFence.type === 'WOOD');

  // Tell server
  const socket = getSocket();
  if (socket?.connected) {
    socket.emit('attackFence', closestFence.id);
  }

  if (closestFence.hp <= 0) {
    closestFence.isBroken = true;
    closestFence.collapseProgress = 0;
    const teamName = closestFence.team === 'blue' ? 'Mavi' : 'Qırmızı';
    showCTFToast(`🔨 ${teamName} komandasının divarı dağıdıldı!`, '#EF4444');
  }

  return true;
}

// Sync world state fences
export function syncWorldFences(sceneManager: SceneManager, worldFences: Record<string, FenceState>): void {
  for (const fence of Object.values(worldFences)) {
    addOrUpdateFence(sceneManager, fence);
  }
}

export function updateFences3D(dt: number): void {
  for (const f of fences.values()) {
    if (!f.mesh) continue;

    // Hit Shake Animation
    if (f.shakeTime && f.shakeTime > 0) {
      f.shakeTime -= dt;
      f.mesh.position.x = f.position.x + (Math.random() - 0.5) * 3;
      f.mesh.position.z = f.position.y + (Math.random() - 0.5) * 3;
      if (f.shakeTime <= 0) {
        f.mesh.position.x = f.position.x;
        f.mesh.position.z = f.position.y;
      }
    }

    // Collapse Animation when Broken
    if (f.isBroken && f.collapseProgress !== undefined && f.collapseProgress < 1.0) {
      f.collapseProgress = Math.min(1.0, f.collapseProgress + dt * 2.0); // 0.5s collapse
      f.mesh.rotation.x = f.collapseProgress * (Math.PI / 2.2); // Falls over
      f.mesh.position.y -= dt * 10; // Sinks slightly
    }
  }
}