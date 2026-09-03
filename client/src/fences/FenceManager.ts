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
export function attemptBuildFence(
  sceneManager: SceneManager,
  playerPos: Vector2,
  playerFacing: number,
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

  // Place fence 45 units in front of player
  const buildPos: Vector2 = {
    x: playerPos.x + Math.cos(playerFacing) * 45,
    y: playerPos.y + Math.sin(playerFacing) * 45,
  };

  // Check overlap with existing fences (min 26 units)
  for (const f of fences.values()) {
    if (!f.isBroken && Math.hypot(f.position.x - buildPos.x, f.position.y - buildPos.y) < 26) {
      showCTFToast('❌ Burada artıq divar var!', '#EF4444');
      return false;
    }
  }

  // Deduct resources
  deductPlayerResources(costWood, costStone);

  const id = `local-fence-${Date.now()}`;
  const rotation = -playerFacing + Math.PI / 2;
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

  showCTFToast(`🧱 ${activeBuildType === 'WOOD' ? 'Taxta hasar' : 'Daş divar'} ucaldıldı!`, '#10B981');
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

// Attack nearby opponent fence
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

  // STRICT REQUIREMENT: ONLY flag carriers can damage fences!
  if (!hasFlag) {
    showCTFToast('⚠️ Yalnız bayraq daşıyarkən divar dağıda bilərsiniz!', '#F59E0B');
    return true; // Caught action
  }

  const damage = closestFence.type === 'WOOD' ? 15 : 25;
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