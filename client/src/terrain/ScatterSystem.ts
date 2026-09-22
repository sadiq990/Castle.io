import * as THREE from 'three';
import { getTerrainHeight, getTerrainSlope } from './TerrainGenerator.js';
import { isNearPath } from './PathSystem.js';
import { MAP_CONFIG } from '../map/map.config.js';

// ── HELPERS ────────────────────────────────────────────────────────────────
function isInsideAnyLake(x: number, z: number, buffer = 20): boolean {
  for (const lake of MAP_CONFIG.waters) {
    const dist = Math.hypot(x - lake.position.x, z - lake.position.y);
    const radius = lake.radius ?? 250;
    if (dist < radius + buffer) return true;
  }
  return false;
}

function isNearAnyCastle(x: number, z: number, buffer = 140): boolean {
  if (Math.hypot(x - 500,  z - 500 ) < buffer) return true;
  if (Math.hypot(x - 2500, z - 2500) < buffer) return true;
  return false;
}

function jitter(v: number, seed1: number, seed2: number, step: number): number {
  return v + (Math.sin(v * seed1 + v * seed2) * 0.5) * (step * 0.82);
}

// ── INSTANCED SCATTER FACTORY ─────────────────────────────────────────────
export function createScatterMeshes(mapSize: number): THREE.Group {
  const scatterGroup = new THREE.Group();
  scatterGroup.name  = 'scatterGroup';

  const dummy    = new THREE.Object3D();
  const tmpColor = new THREE.Color();

  // ────────────────────────────────────────────────────────────────────────
  // A. TALL PINE — single cone geometry (stable, no UV issues)
  //    3000 instances on mid-high terrain
  // ────────────────────────────────────────────────────────────────────────
  const PINE_COUNT  = 3000;
  const pineGeo     = new THREE.ConeGeometry(18, 52, 7); // 7-sided cone, classic pine
  pineGeo.translate(0, 26, 0); // Base at Y=0
  const pineMat     = new THREE.MeshStandardMaterial({ roughness: 0.85, metalness: 0.02, flatShading: true });
  const pineInstanced = new THREE.InstancedMesh(pineGeo, pineMat, PINE_COUNT);
  pineInstanced.castShadow    = true;
  pineInstanced.receiveShadow = true;

  const pineColors = [
    new THREE.Color(0x14532d),
    new THREE.Color(0x1a6b38),
    new THREE.Color(0x22863a),
    new THREE.Color(0x0f4c25),
    new THREE.Color(0x166534),
  ];

  let pineIdx = 0;
  const pineStep = Math.sqrt((mapSize * mapSize) / PINE_COUNT);

  for (let gx = 80; gx < mapSize - 80 && pineIdx < PINE_COUNT; gx += pineStep) {
    for (let gz = 80; gz < mapSize - 80 && pineIdx < PINE_COUNT; gz += pineStep) {
      const x = jitter(gx, 12.9898, 78.233, pineStep);
      const z = jitter(gz, 39.346,  11.135, pineStep);

      if (isInsideAnyLake(x, z, 40))  continue;
      if (isNearAnyCastle(x, z, 145)) continue;
      if (isNearPath(x, z, 20))       continue;
      if (isNearPath(x, z, 36) && Math.random() > 0.3) continue;

      const h     = getTerrainHeight(x, z);
      const slope = getTerrainSlope(x, z);

      if (h > 52 || h < 0.5) continue;
      if (slope > 0.58)       continue;
      if (Math.random() > 0.72) continue;

      dummy.position.set(x, h, z);
      dummy.rotation.set(0, Math.random() * Math.PI * 2, 0);
      const scale = 0.65 + Math.random() * 0.55;
      const heightScale = 1.0 + Math.min(0.5, h / 70);
      dummy.scale.set(scale, scale * heightScale, scale);
      dummy.updateMatrix();
      pineInstanced.setMatrixAt(pineIdx, dummy.matrix);

      tmpColor.copy(pineColors[Math.floor(Math.random() * pineColors.length)]!);
      pineInstanced.setColorAt(pineIdx, tmpColor);
      pineIdx++;
    }
  }
  pineInstanced.count = pineIdx;
  pineInstanced.instanceMatrix.needsUpdate = true;
  if (pineInstanced.instanceColor) pineInstanced.instanceColor.needsUpdate = true;
  scatterGroup.add(pineInstanced);

  // ────────────────────────────────────────────────────────────────────────
  // B. BROAD OAK — dodecahedron canopy, 1400 instances
  //    Prefers flat valleys and low hills
  // ────────────────────────────────────────────────────────────────────────
  const OAK_COUNT  = 1400;
  const oakGeo     = new THREE.DodecahedronGeometry(18, 1);
  oakGeo.translate(0, 36, 0); // Canopy floats above ground
  const oakMat     = new THREE.MeshStandardMaterial({ roughness: 0.82, metalness: 0.01, flatShading: true });
  const oakInstanced = new THREE.InstancedMesh(oakGeo, oakMat, OAK_COUNT);
  oakInstanced.castShadow    = true;
  oakInstanced.receiveShadow = true;

  const oakColors = [
    new THREE.Color(0x2e7d32), // Deep forest
    new THREE.Color(0x388e3c), // Summer green
    new THREE.Color(0x43a047), // Bright leaf
    new THREE.Color(0xd97706), // Autumn amber
    new THREE.Color(0xf59e0b), // Golden autumn
    new THREE.Color(0x7b4f00), // Brown autumn
  ];

  let oakIdx = 0;
  const oakStep = Math.sqrt((mapSize * mapSize) / OAK_COUNT);

  for (let gx = 100; gx < mapSize - 100 && oakIdx < OAK_COUNT; gx += oakStep) {
    for (let gz = 100; gz < mapSize - 100 && oakIdx < OAK_COUNT; gz += oakStep) {
      const x = jitter(gx, 45.18, 23.67, oakStep);
      const z = jitter(gz, 78.34, 91.12, oakStep);

      if (isInsideAnyLake(x, z, 50))  continue;
      if (isNearAnyCastle(x, z, 155)) continue;
      if (isNearPath(x, z, 24))       continue;

      const h     = getTerrainHeight(x, z);
      const slope = getTerrainSlope(x, z);

      if (h > 24 || h < 0.8) continue;
      if (slope > 0.40)       continue;
      if (Math.random() > 0.65) continue;

      dummy.position.set(x, h, z);
      dummy.rotation.set(0, Math.random() * Math.PI * 2, 0);
      const scale = 0.75 + Math.random() * 0.50;
      dummy.scale.set(scale, scale * 0.88, scale);
      dummy.updateMatrix();
      oakInstanced.setMatrixAt(oakIdx, dummy.matrix);

      tmpColor.copy(oakColors[Math.floor(Math.random() * oakColors.length)]!);
      oakInstanced.setColorAt(oakIdx, tmpColor);
      oakIdx++;
    }
  }
  oakInstanced.count = oakIdx;
  oakInstanced.instanceMatrix.needsUpdate = true;
  if (oakInstanced.instanceColor) oakInstanced.instanceColor.needsUpdate = true;
  scatterGroup.add(oakInstanced);

  // ────────────────────────────────────────────────────────────────────────
  // C. DEAD / BARE TREE — thin cylinder trunk, 450 instances
  //    Only on steep rocky high terrain
  // ────────────────────────────────────────────────────────────────────────
  const DEAD_COUNT = 450;
  const deadGeo    = new THREE.CylinderGeometry(1.5, 4.0, 34, 5);
  deadGeo.translate(0, 17, 0);
  const deadMat    = new THREE.MeshStandardMaterial({ roughness: 0.96, metalness: 0.01, flatShading: true });
  const deadInstanced = new THREE.InstancedMesh(deadGeo, deadMat, DEAD_COUNT);
  deadInstanced.castShadow    = true;
  deadInstanced.receiveShadow = true;

  const deadColors = [
    new THREE.Color(0x5c4a3d),
    new THREE.Color(0x6b5a4f),
    new THREE.Color(0x4a3c32),
    new THREE.Color(0x7a6a5e),
  ];

  let deadIdx = 0;
  const deadStep = Math.sqrt((mapSize * mapSize) / DEAD_COUNT);

  for (let gx = 80; gx < mapSize - 80 && deadIdx < DEAD_COUNT; gx += deadStep) {
    for (let gz = 80; gz < mapSize - 80 && deadIdx < DEAD_COUNT; gz += deadStep) {
      const x = jitter(gx, 56.71, 34.89, deadStep);
      const z = jitter(gz, 12.45, 67.23, deadStep);

      if (isInsideAnyLake(x, z, 30))  continue;
      if (isNearAnyCastle(x, z, 140)) continue;
      if (isNearPath(x, z, 16))       continue;

      const h     = getTerrainHeight(x, z);
      const slope = getTerrainSlope(x, z);

      if (h < 25 || h > 58)  continue;
      if (slope < 0.18)       continue;
      if (Math.random() > 0.52) continue;

      dummy.position.set(x, h, z);
      dummy.rotation.set(
        (Math.random() - 0.5) * 0.12,
        Math.random() * Math.PI * 2,
        (Math.random() - 0.5) * 0.10
      );
      const scale = 0.65 + Math.random() * 0.60;
      dummy.scale.set(scale, scale, scale);
      dummy.updateMatrix();
      deadInstanced.setMatrixAt(deadIdx, dummy.matrix);

      tmpColor.copy(deadColors[Math.floor(Math.random() * deadColors.length)]!);
      deadInstanced.setColorAt(deadIdx, tmpColor);
      deadIdx++;
    }
  }
  deadInstanced.count = deadIdx;
  deadInstanced.instanceMatrix.needsUpdate = true;
  if (deadInstanced.instanceColor) deadInstanced.instanceColor.needsUpdate = true;
  scatterGroup.add(deadInstanced);

  // ────────────────────────────────────────────────────────────────────────
  // D. WILDFLOWERS — flat dodecahedron head, 2200 instances
  //    Only on flat green meadows
  // ────────────────────────────────────────────────────────────────────────
  const FLOWER_COUNT  = 2200;
  const flowerGeo     = new THREE.DodecahedronGeometry(4.0, 0);
  flowerGeo.scale(1.0, 0.5, 1.0); // Flat flower head
  flowerGeo.translate(0, 9, 0);
  const flowerMat     = new THREE.MeshStandardMaterial({ roughness: 0.75, metalness: 0.0, flatShading: true });
  const flowerInstanced = new THREE.InstancedMesh(flowerGeo, flowerMat, FLOWER_COUNT);
  flowerInstanced.receiveShadow = true;

  const flowerColors = [
    new THREE.Color(0xfbbf24), // Golden yellow
    new THREE.Color(0xef4444), // Poppy red
    new THREE.Color(0xffffff), // White daisy
    new THREE.Color(0x8b5cf6), // Lavender
    new THREE.Color(0xf472b6), // Pink
    new THREE.Color(0xfde68a), // Pale yellow
    new THREE.Color(0xfca5a5), // Soft coral
    new THREE.Color(0x6ee7b7), // Mint
  ];

  let flowerIdx = 0;
  const flowerStep = Math.sqrt((mapSize * mapSize) / FLOWER_COUNT);

  for (let gx = 60; gx < mapSize - 60 && flowerIdx < FLOWER_COUNT; gx += flowerStep) {
    for (let gz = 60; gz < mapSize - 60 && flowerIdx < FLOWER_COUNT; gz += flowerStep) {
      const x = jitter(gx, 88.34, 45.12, flowerStep);
      const z = jitter(gz, 23.67, 99.45, flowerStep);

      if (isInsideAnyLake(x, z, 35))  continue;
      if (isNearAnyCastle(x, z, 140)) continue;
      if (isNearPath(x, z, 16))       continue;

      const h     = getTerrainHeight(x, z);
      const slope = getTerrainSlope(x, z);

      if (h > 14 || h < 0.5) continue;
      if (slope > 0.18)       continue;
      if (Math.random() > 0.60) continue;

      dummy.position.set(x, h, z);
      dummy.rotation.set(0, Math.random() * Math.PI * 2, 0);
      const scale = 0.55 + Math.random() * 0.55;
      dummy.scale.set(scale, scale, scale);
      dummy.updateMatrix();
      flowerInstanced.setMatrixAt(flowerIdx, dummy.matrix);

      tmpColor.copy(flowerColors[Math.floor(Math.random() * flowerColors.length)]!);
      flowerInstanced.setColorAt(flowerIdx, tmpColor);
      flowerIdx++;
    }
  }
  flowerInstanced.count = flowerIdx;
  flowerInstanced.instanceMatrix.needsUpdate = true;
  if (flowerInstanced.instanceColor) flowerInstanced.instanceColor.needsUpdate = true;
  scatterGroup.add(flowerInstanced);

  // ────────────────────────────────────────────────────────────────────────
  // E. VOLUMETRIC GRASS TUFTS — 5000 instances
  // ────────────────────────────────────────────────────────────────────────
  const GRASS_COUNT   = 5000;
  const grassGeo      = new THREE.ConeGeometry(3.5, 10, 4);
  grassGeo.translate(0, 5, 0);
  const grassMat      = new THREE.MeshStandardMaterial({ roughness: 0.78, metalness: 0.04, flatShading: true, side: THREE.DoubleSide });
  const grassInstanced = new THREE.InstancedMesh(grassGeo, grassMat, GRASS_COUNT);
  grassInstanced.receiveShadow = true;

  const grassColors = [
    new THREE.Color(0x7cb342),
    new THREE.Color(0x558b2f),
    new THREE.Color(0x8bc34a),
    new THREE.Color(0x33691e),
    new THREE.Color(0x9ccc65),
  ];

  let grassIdx = 0;
  const grassStep = Math.sqrt((mapSize * mapSize) / GRASS_COUNT);

  for (let gx = 60; gx < mapSize - 60 && grassIdx < GRASS_COUNT; gx += grassStep) {
    for (let gz = 60; gz < mapSize - 60 && grassIdx < GRASS_COUNT; gz += grassStep) {
      const x = jitter(gx, 12.9898, 78.233, grassStep);
      const z = jitter(gz, 39.346,  11.135, grassStep);

      if (isInsideAnyLake(x, z, 30))  continue;
      if (isNearAnyCastle(x, z, 130)) continue;
      if (isNearPath(x, z, 18))       continue;
      if (isNearPath(x, z, 30) && Math.random() > 0.25) continue;

      const h     = getTerrainHeight(x, z);
      const slope = getTerrainSlope(x, z);

      if (h > 30 || h < 0.1) continue;
      if (slope > 0.50)       continue;

      dummy.position.set(x, h, z);
      dummy.rotation.set(
        (Math.random() - 0.5) * 0.14,
        Math.random() * Math.PI * 2,
        (Math.random() - 0.5) * 0.14
      );
      const scale = 0.65 + Math.random() * 0.65;
      dummy.scale.set(scale, scale, scale);
      dummy.updateMatrix();
      grassInstanced.setMatrixAt(grassIdx, dummy.matrix);

      tmpColor.copy(grassColors[Math.floor(Math.random() * grassColors.length)]!);
      grassInstanced.setColorAt(grassIdx, tmpColor);
      grassIdx++;
    }
  }
  grassInstanced.count = grassIdx;
  grassInstanced.instanceMatrix.needsUpdate = true;
  if (grassInstanced.instanceColor) grassInstanced.instanceColor.needsUpdate = true;
  scatterGroup.add(grassInstanced);

  // ────────────────────────────────────────────────────────────────────────
  // F. ROCKS & PEBBLES — 900 instances
  // ────────────────────────────────────────────────────────────────────────
  const ROCK_COUNT   = 900;
  const rockGeo      = new THREE.DodecahedronGeometry(3.5, 0);
  const rockMat      = new THREE.MeshStandardMaterial({ roughness: 0.92, metalness: 0.06, flatShading: true });
  const rockInstanced = new THREE.InstancedMesh(rockGeo, rockMat, ROCK_COUNT);
  rockInstanced.castShadow    = true;
  rockInstanced.receiveShadow = true;

  const rockColors = [
    new THREE.Color(0x8e9aa1),
    new THREE.Color(0x757d85),
    new THREE.Color(0xa0a8af),
    new THREE.Color(0x6b7280),
  ];

  let rockIdx = 0;
  const rockStep = Math.sqrt((mapSize * mapSize) / ROCK_COUNT);

  for (let rx = 80; rx < mapSize - 80 && rockIdx < ROCK_COUNT; rx += rockStep) {
    for (let rz = 80; rz < mapSize - 80 && rockIdx < ROCK_COUNT; rz += rockStep) {
      const x = jitter(rx, 93.98, 67.23, rockStep);
      const z = jitter(rz, 23.34, 85.11, rockStep);

      if (isInsideAnyLake(x, z, 15))  continue;
      if (isNearAnyCastle(x, z, 130)) continue;
      if (isNearPath(x, z, 18))       continue;

      const h     = getTerrainHeight(x, z);
      const slope = getTerrainSlope(x, z);

      const isShore     = h < 1.5;
      const isHillSlope = slope > 0.22;
      const isRoadVerge = isNearPath(x, z, 32);
      const isRandom    = Math.random() < 0.22;

      if (!isShore && !isHillSlope && !isRoadVerge && !isRandom) continue;

      dummy.position.set(x, h + 1.2, z);
      dummy.rotation.set(Math.random() * Math.PI, Math.random() * Math.PI * 2, Math.random() * Math.PI);
      const scale = isRoadVerge ? (0.35 + Math.random() * 0.45) : (0.55 + Math.random() * 1.4);
      dummy.scale.set(scale, scale * 0.72, scale);
      dummy.updateMatrix();
      rockInstanced.setMatrixAt(rockIdx, dummy.matrix);

      tmpColor.copy(rockColors[Math.floor(Math.random() * rockColors.length)]!);
      rockInstanced.setColorAt(rockIdx, tmpColor);
      rockIdx++;
    }
  }
  rockInstanced.count = rockIdx;
  rockInstanced.instanceMatrix.needsUpdate = true;
  if (rockInstanced.instanceColor) rockInstanced.instanceColor.needsUpdate = true;
  scatterGroup.add(rockInstanced);

  // ────────────────────────────────────────────────────────────────────────
  // G. WILD BUSHES — 400 instances
  // ────────────────────────────────────────────────────────────────────────
  const BUSH_COUNT   = 400;
  const bushGeo      = new THREE.DodecahedronGeometry(7.0, 1);
  const bushMat      = new THREE.MeshStandardMaterial({ roughness: 0.88, flatShading: true });
  const bushInstanced = new THREE.InstancedMesh(bushGeo, bushMat, BUSH_COUNT);
  bushInstanced.castShadow    = true;
  bushInstanced.receiveShadow = true;

  const bushColors = [
    new THREE.Color(0x3d7e2e),
    new THREE.Color(0x2d6b20),
    new THREE.Color(0x4a8f35),
    new THREE.Color(0x5a6e2a),
  ];

  let bushIdx = 0;
  const bushStep = Math.sqrt((mapSize * mapSize) / BUSH_COUNT);

  for (let bx = 100; bx < mapSize - 100 && bushIdx < BUSH_COUNT; bx += bushStep) {
    for (let bz = 100; bz < mapSize - 100 && bushIdx < BUSH_COUNT; bz += bushStep) {
      const x = jitter(bx, 45.18, 23.67, bushStep);
      const z = jitter(bz, 78.34, 91.12, bushStep);

      if (isInsideAnyLake(x, z, 35))  continue;
      if (isNearAnyCastle(x, z, 140)) continue;
      if (isNearPath(x, z, 22))       continue;

      const h     = getTerrainHeight(x, z);
      const slope = getTerrainSlope(x, z);

      if (h > 20 || h < 0.5) continue;
      if (slope > 0.35)       continue;

      dummy.position.set(x, h + 4.0, z);
      dummy.rotation.set(0, Math.random() * Math.PI * 2, 0);
      const scale = 0.8 + Math.random() * 0.45;
      dummy.scale.set(scale, scale * 0.85, scale);
      dummy.updateMatrix();
      bushInstanced.setMatrixAt(bushIdx, dummy.matrix);

      tmpColor.copy(bushColors[Math.floor(Math.random() * bushColors.length)]!);
      bushInstanced.setColorAt(bushIdx, tmpColor);
      bushIdx++;
    }
  }
  bushInstanced.count = bushIdx;
  bushInstanced.instanceMatrix.needsUpdate = true;
  if (bushInstanced.instanceColor) bushInstanced.instanceColor.needsUpdate = true;
  scatterGroup.add(bushInstanced);

  return scatterGroup;
}