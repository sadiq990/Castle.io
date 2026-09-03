import * as THREE from 'three';
import { getTerrainHeight, getTerrainSlope } from './TerrainGenerator.js';
import { isNearPath } from './PathSystem.js';
import { MAP_CONFIG } from '../map/map.config.js';

function isInsideAnyLake(x: number, z: number, buffer = 20): boolean {
  for (const lake of MAP_CONFIG.waters) {
    const dist = Math.hypot(x - lake.position.x, z - lake.position.y);
    const radius = lake.radius ?? 250;
    if (dist < radius + buffer) {
      return true;
    }
  }
  return false;
}

function isNearAnyCastle(x: number, z: number, buffer = 140): boolean {
  if (Math.hypot(x - 500, z - 500) < buffer) return true;
  if (Math.hypot(x - 2500, z - 2500) < buffer) return true;
  return false;
}

export function createScatterMeshes(mapSize: number): THREE.Group {
  const scatterGroup = new THREE.Group();
  scatterGroup.name = 'scatterGroup';

  const dummy = new THREE.Object3D();

  // ── 1. GRASS TUFTS (5,000 instances, single draw call) ────
  const GRASS_COUNT = 5200;
  // Low-poly 3-blade crossed grass geometry
  const grassGeo = new THREE.PlaneGeometry(6, 9, 1, 1);
  grassGeo.translate(0, 4.5, 0); // Pivot at bottom

  const grassMat = new THREE.MeshStandardMaterial({
    color: 0x54a838,
    roughness: 0.85,
    metalness: 0.0,
    side: THREE.DoubleSide,
    flatShading: true,
  });

  const grassInstanced = new THREE.InstancedMesh(grassGeo, grassMat, GRASS_COUNT);
  grassInstanced.castShadow = false; // Disable shadows on tiny grass for high FPS
  grassInstanced.receiveShadow = true;

  let grassIdx = 0;
  const gridStep = Math.sqrt((mapSize * mapSize) / GRASS_COUNT);

  for (let gx = 60; gx < mapSize - 60 && grassIdx < GRASS_COUNT; gx += gridStep) {
    for (let gz = 60; gz < mapSize - 60 && grassIdx < GRASS_COUNT; gz += gridStep) {
      // Jittered grid sampling (pseudo Poisson-disk)
      const x = gx + (Math.sin(gx * 12.9898 + gz * 78.233) * 0.5) * (gridStep * 0.8);
      const z = gz + (Math.cos(gx * 39.346 + gz * 11.135) * 0.5) * (gridStep * 0.8);

      if (isInsideAnyLake(x, z, 30)) continue;
      if (isNearAnyCastle(x, z, 130)) continue;
      if (isNearPath(x, z, 20)) continue;

      const y = getTerrainHeight(x, z);
      const slope = getTerrainSlope(x, z);

      // Higher density on open plains and gentle slopes, rare on steep cliffs
      if (slope > 0.45) continue;

      dummy.position.set(x, y, z);
      dummy.rotation.set(0, Math.random() * Math.PI * 2, 0);

      // Height 0.6x to 1.3x scale
      const scaleY = 0.6 + Math.random() * 0.7;
      dummy.scale.set(0.85, scaleY, 0.85);
      dummy.updateMatrix();

      grassInstanced.setMatrixAt(grassIdx, dummy.matrix);
      grassIdx++;
    }
  }
  grassInstanced.count = grassIdx;
  grassInstanced.instanceMatrix.needsUpdate = true;
  scatterGroup.add(grassInstanced);

  // ── 2. ROCKS & PEBBLES (800 instances, single draw call) ───
  const ROCK_COUNT = 850;
  const rockGeo = new THREE.DodecahedronGeometry(3.5, 0); // Low-poly stylized rock
  const rockMat = new THREE.MeshStandardMaterial({
    color: 0x8a979e,
    roughness: 0.92,
    metalness: 0.05,
    flatShading: true,
  });

  const rockInstanced = new THREE.InstancedMesh(rockGeo, rockMat, ROCK_COUNT);
  rockInstanced.castShadow = true;
  rockInstanced.receiveShadow = true;

  let rockIdx = 0;
  const rockGridStep = Math.sqrt((mapSize * mapSize) / ROCK_COUNT);

  for (let rx = 80; rx < mapSize - 80 && rockIdx < ROCK_COUNT; rx += rockGridStep) {
    for (let rz = 80; rz < mapSize - 80 && rockIdx < ROCK_COUNT; rz += rockGridStep) {
      const x = rx + (Math.sin(rx * 93.98 + rz * 67.23) * 0.5) * (rockGridStep * 0.85);
      const z = rz + (Math.cos(rx * 23.34 + rz * 85.11) * 0.5) * (rockGridStep * 0.85);

      if (isInsideAnyLake(x, z, 15)) continue;
      if (isNearAnyCastle(x, z, 130)) continue;
      if (isNearPath(x, z, 20)) continue;

      const y = getTerrainHeight(x, z);
      const slope = getTerrainSlope(x, z);

      // Higher density on hill slopes and near shorelines
      const isShore = y < 1.0;
      const isHillSlope = slope > 0.22;
      const isRandomPlain = Math.random() < 0.25;

      if (!isShore && !isHillSlope && !isRandomPlain) continue;

      dummy.position.set(x, y + 1.2, z);
      dummy.rotation.set(
        Math.random() * Math.PI,
        Math.random() * Math.PI * 2,
        Math.random() * Math.PI
      );

      // Scale 0.5x to 1.8x
      const scale = 0.5 + Math.random() * 1.3;
      dummy.scale.set(scale, scale * 0.75, scale);
      dummy.updateMatrix();

      rockInstanced.setMatrixAt(rockIdx, dummy.matrix);
      rockIdx++;
    }
  }
  rockInstanced.count = rockIdx;
  rockInstanced.instanceMatrix.needsUpdate = true;
  scatterGroup.add(rockInstanced);

  // ── 3. WILD BUSHES (350 instances, single draw call) ───────
  const BUSH_COUNT = 400;
  const bushGeo = new THREE.DodecahedronGeometry(7.0, 1);
  const bushMat = new THREE.MeshStandardMaterial({
    color: 0x3d7e2e,
    roughness: 0.88,
    flatShading: true,
  });

  const bushInstanced = new THREE.InstancedMesh(bushGeo, bushMat, BUSH_COUNT);
  bushInstanced.castShadow = true;
  bushInstanced.receiveShadow = true;

  let bushIdx = 0;
  const bushGridStep = Math.sqrt((mapSize * mapSize) / BUSH_COUNT);

  for (let bx = 100; bx < mapSize - 100 && bushIdx < BUSH_COUNT; bx += bushGridStep) {
    for (let bz = 100; bz < mapSize - 100 && bushIdx < BUSH_COUNT; bz += bushGridStep) {
      const x = bx + (Math.sin(bx * 45.18 + bz * 23.67) * 0.5) * (bushGridStep * 0.85);
      const z = bz + (Math.cos(bx * 78.34 + bz * 91.12) * 0.5) * (bushGridStep * 0.85);

      if (isInsideAnyLake(x, z, 35)) continue;
      if (isNearAnyCastle(x, z, 140)) continue;
      if (isNearPath(x, z, 22)) continue;

      const y = getTerrainHeight(x, z);
      const slope = getTerrainSlope(x, z);
      if (slope > 0.35) continue; // Bushes don't grow on steep cliffs

      dummy.position.set(x, y + 4.0, z);
      dummy.rotation.set(0, Math.random() * Math.PI * 2, 0);

      const scale = 0.8 + Math.random() * 0.45;
      dummy.scale.set(scale, scale * 0.85, scale);
      dummy.updateMatrix();

      bushInstanced.setMatrixAt(bushIdx, dummy.matrix);
      bushIdx++;
    }
  }
  bushInstanced.count = bushIdx;
  bushInstanced.instanceMatrix.needsUpdate = true;
  scatterGroup.add(bushInstanced);

  return scatterGroup;
}