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

// Builds a volumetric low-poly 3D grass tuft (4 V-shaped triangular blades + ground shadow base)
function createVolumetricGrassGeometry(): THREE.BufferGeometry {
  const vertices: number[] = [];
  const indices: number[] = [];
  const normals: number[] = [];

  // 4 triangular blades with outward flare
  const blades = [
    // Blade 1: flares forward-left
    { baseL: [-1.2, 0, -0.4], baseR: [1.2, 0, 0.4], tip: [-1.8, 8.5, 1.8] },
    // Blade 2: flares back-right
    { baseL: [-0.4, 0, 1.2], baseR: [0.4, 0, -1.2], tip: [2.2, 9.2, -1.5] },
    // Blade 3: flares right-forward
    { baseL: [-1.0, 0, 0.8], baseR: [1.0, 0, -0.8], tip: [1.6, 7.8, 2.4] },
    // Blade 4: flares back-left
    { baseL: [0.8, 0, 1.0], baseR: [-0.8, 0, -1.0], tip: [-2.2, 8.0, -2.0] },
  ];

  let vIdx = 0;
  for (const b of blades) {
    vertices.push(
      b.baseL[0]!, b.baseL[1]!, b.baseL[2]!,
      b.baseR[0]!, b.baseR[1]!, b.baseR[2]!,
      b.tip[0]!,   b.tip[1]!,   b.tip[2]!
    );

    // Normal pointing outward
    const edge1 = new THREE.Vector3(b.baseR[0]! - b.baseL[0]!, b.baseR[1]! - b.baseL[1]!, b.baseR[2]! - b.baseL[2]!);
    const edge2 = new THREE.Vector3(b.tip[0]! - b.baseL[0]!, b.tip[1]! - b.baseL[1]!, b.tip[2]! - b.baseL[2]!);
    const norm = new THREE.Vector3().crossVectors(edge1, edge2).normalize();

    normals.push(
      norm.x, norm.y, norm.z,
      norm.x, norm.y, norm.z,
      norm.x, norm.y, norm.z
    );

    // Double-sided triangle
    indices.push(vIdx, vIdx + 1, vIdx + 2);
    indices.push(vIdx, vIdx + 2, vIdx + 1);
    vIdx += 3;
  }

  // Base Contact Shadow Disk (small dark flat circle at ground level)
  const shadowSegs = 6;
  const shadowRadius = 2.4;
  const centerV = vIdx;
  vertices.push(0, 0.08, 0);
  normals.push(0, 1, 0);
  vIdx++;

  for (let i = 0; i < shadowSegs; i++) {
    const a = (i / shadowSegs) * Math.PI * 2;
    vertices.push(Math.cos(a) * shadowRadius, 0.08, Math.sin(a) * shadowRadius);
    normals.push(0, 1, 0);
  }

  for (let i = 0; i < shadowSegs; i++) {
    const next = (i + 1) % shadowSegs;
    indices.push(centerV, centerV + 1 + i, centerV + 1 + next);
  }

  const geo = new THREE.BufferGeometry();
  geo.setAttribute('position', new THREE.Float32BufferAttribute(vertices, 3));
  geo.setAttribute('normal', new THREE.Float32BufferAttribute(normals, 3));
  geo.setIndex(indices);

  return geo;
}

export function createScatterMeshes(mapSize: number): THREE.Group {
  const scatterGroup = new THREE.Group();
  scatterGroup.name = 'scatterGroup';

  const dummy = new THREE.Object3D();

  // ── 1. VOLUMETRIC 3D GRASS TUFTS (5,500 instances) ─────────
  const GRASS_COUNT = 5500;
  const grassGeo = createVolumetricGrassGeometry();

  const grassMat = new THREE.MeshStandardMaterial({
    roughness: 0.78,
    metalness: 0.05,
    side: THREE.DoubleSide,
    flatShading: true, // Flat shading gives distinct faces and crisp 3D volume!
  });

  const grassInstanced = new THREE.InstancedMesh(grassGeo, grassMat, GRASS_COUNT);
  grassInstanced.receiveShadow = true;

  // Two color tones: Bright Lime (#7CB342) and Deep Forest Green (#558B2F)
  const colorLight = new THREE.Color(0x7cb342);
  const colorDark  = new THREE.Color(0x558b2f);
  const tempColor  = new THREE.Color();

  let grassIdx = 0;
  const gridStep = Math.sqrt((mapSize * mapSize) / GRASS_COUNT);

  for (let gx = 60; gx < mapSize - 60 && grassIdx < GRASS_COUNT; gx += gridStep) {
    for (let gz = 60; gz < mapSize - 60 && grassIdx < GRASS_COUNT; gz += gridStep) {
      // Jittered grid sampling
      const x = gx + (Math.sin(gx * 12.9898 + gz * 78.233) * 0.5) * (gridStep * 0.85);
      const z = gz + (Math.cos(gx * 39.346 + gz * 11.135) * 0.5) * (gridStep * 0.85);

      if (isInsideAnyLake(x, z, 30)) continue;
      if (isNearAnyCastle(x, z, 130)) continue;

      // Road transition verge:
      // Inside 18 units: completely clear road
      // Between 18 and 30 units: sparse dirt verge (only 25% chance)
      if (isNearPath(x, z, 18)) continue;
      if (isNearPath(x, z, 30) && Math.random() > 0.25) continue;

      const y = getTerrainHeight(x, z);
      if (y < 0.2) continue; // Don't spawn grass tufts underwater or on beaches!
      const slope = getTerrainSlope(x, z);
      if (slope > 0.45) continue; // Don't place on steep drops

      dummy.position.set(x, y, z);

      // Random Y-rotation (0-360°) + slight tilt variation (±5°)
      const tiltX = (Math.random() - 0.5) * 0.14; // ~ ±4°
      const tiltZ = (Math.random() - 0.5) * 0.14;
      dummy.rotation.set(tiltX, Math.random() * Math.PI * 2, tiltZ);

      // Random scale (0.7x to 1.3x)
      const scale = 0.72 + Math.random() * 0.58;
      dummy.scale.set(scale, scale, scale);
      dummy.updateMatrix();

      grassInstanced.setMatrixAt(grassIdx, dummy.matrix);

      // Mixed dual-tone coloring: 50% light / 50% dark mix
      const toneMix = Math.random();
      tempColor.copy(colorLight).lerp(colorDark, toneMix);
      grassInstanced.setColorAt(grassIdx, tempColor);

      grassIdx++;
    }
  }

  grassInstanced.count = grassIdx;
  grassInstanced.instanceMatrix.needsUpdate = true;
  if (grassInstanced.instanceColor) grassInstanced.instanceColor.needsUpdate = true;
  scatterGroup.add(grassInstanced);

  // ── 2. ROCKS & PEBBLES (900 instances) ─────────────────────
  const ROCK_COUNT = 900;
  const rockGeo = new THREE.DodecahedronGeometry(3.5, 0);
  const rockMat = new THREE.MeshStandardMaterial({
    color: 0x8e9aa1,
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
      if (isNearPath(x, z, 18)) continue;

      const y = getTerrainHeight(x, z);
      const slope = getTerrainSlope(x, z);

      const isShore = y < 1.2;
      const isHillSlope = slope > 0.20;
      const isRoadVerge = isNearPath(x, z, 30); // Small pebbles along road edge!
      const isRandomPlain = Math.random() < 0.25;

      if (!isShore && !isHillSlope && !isRoadVerge && !isRandomPlain) continue;

      dummy.position.set(x, y + 1.2, z);
      dummy.rotation.set(
        Math.random() * Math.PI,
        Math.random() * Math.PI * 2,
        Math.random() * Math.PI
      );

      const scale = isRoadVerge ? (0.4 + Math.random() * 0.5) : (0.5 + Math.random() * 1.3);
      dummy.scale.set(scale, scale * 0.75, scale);
      dummy.updateMatrix();

      rockInstanced.setMatrixAt(rockIdx, dummy.matrix);
      rockIdx++;
    }
  }

  rockInstanced.count = rockIdx;
  rockInstanced.instanceMatrix.needsUpdate = true;
  scatterGroup.add(rockInstanced);

  // ── 3. WILD BUSHES (400 instances) ─────────────────────────
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
      if (slope > 0.35) continue;

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