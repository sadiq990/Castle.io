import * as THREE from 'three';
import { getTerrainHeight, getTerrainSlope } from './TerrainGenerator.js';
import { isNearPath } from './PathSystem.js';
import { MAP_CONFIG } from '../map/map.config.js';

// ── HELPERS & ZONING ───────────────────────────────────────────────────────
function isInsideAnyLake(x: number, z: number, buffer = 20): boolean {
  for (const lake of MAP_CONFIG.waters) {
    const dist = Math.hypot(x - lake.position.x, z - lake.position.y);
    const radius = lake.radius ?? 250;
    if (dist < radius + buffer) return true;
  }
  return false;
}

function isNearAnyCastle(x: number, z: number, buffer = 160): boolean {
  if (Math.hypot(x - 700,  z - 700 ) < buffer) return true;
  if (Math.hypot(x - 3800, z - 3800) < buffer) return true;
  return false;
}

function isNearShrine(x: number, z: number, buffer = 120): boolean {
  return Math.hypot(x - 2250, z - 2250) < buffer;
}

function jitter(v: number, seed1: number, seed2: number, step: number): number {
  return v + (Math.sin(v * seed1 + v * seed2) * 0.5) * (step * 0.82);
}

// Organic 2D forest density mask: creates natural groves & sunny meadows
function getForestNoise(x: number, z: number): number {
  const n1 = Math.sin(x * 0.0013 + 1.2) * Math.cos(z * 0.0013 + 0.8);
  const n2 = Math.sin(x * 0.0028 + z * 0.0021) * 0.35;
  return n1 * 0.65 + n2 + 0.5; // range roughly 0.0 to 1.0
}

// ── GPU WIND SWAY SHADER MATERIAL ──────────────────────────────────────────
function createWindMaterial(roughness = 0.82): THREE.MeshStandardMaterial {
  const mat = new THREE.MeshStandardMaterial({
    roughness,
    metalness: 0.01,
    flatShading: true,
  });

  mat.onBeforeCompile = (shader) => {
    shader.uniforms.uTime = { value: 0 };
    mat.userData.shader = shader;

    shader.vertexShader = `
      uniform float uTime;
    ` + shader.vertexShader;

    shader.vertexShader = shader.vertexShader.replace(
      '#include <begin_vertex>',
      `
      #include <begin_vertex>
      #ifdef USE_INSTANCING
        vec4 wPos = modelMatrix * instanceMatrix * vec4(position, 1.0);
      #else
        vec4 wPos = modelMatrix * vec4(position, 1.0);
      #endif
      float hFactor = clamp(position.y / 65.0, 0.0, 1.0);
      float sway = sin(uTime * 2.0 + wPos.x * 0.012 + wPos.z * 0.010) * 0.75
                 + cos(uTime * 1.3 + wPos.x * 0.007) * 0.25;
      transformed.x += sway * hFactor * hFactor * 3.6;
      transformed.z += sway * 0.65 * hFactor * hFactor * 2.4;
      `
    );
  };

  return mat;
}

function attachWindHook(mesh: THREE.InstancedMesh): void {
  mesh.onBeforeRender = () => {
    const shader = (mesh.material as THREE.Material).userData?.shader;
    if (shader) {
      shader.uniforms.uTime.value = performance.now() * 0.001;
    }
  };
}

// ── INSTANCED SCATTER FACTORY ─────────────────────────────────────────────
export function createScatterMeshes(mapSize: number): THREE.Group {
  const scatterGroup = new THREE.Group();
  scatterGroup.name  = 'scatterGroup';

  const dummy    = new THREE.Object3D();
  const tmpColor = new THREE.Color();

  // Shared wood trunk material for all trees (warm rugged walnut bark)
  const trunkMat = new THREE.MeshStandardMaterial({
    color: 0x3d271d,
    roughness: 0.94,
    metalness: 0.02,
    flatShading: true,
  });

  const birchTrunkMat = new THREE.MeshStandardMaterial({
    color: 0xe2e8f0,
    roughness: 0.82,
    metalness: 0.0,
    flatShading: true,
  });

  // ────────────────────────────────────────────────────────────────────────
  // 1. ANCIENT GRAND OAKS (Tier 1: Giant Forest Anchors, Height 85 - 110)
  //    1200 instances in deep forest groves
  // ────────────────────────────────────────────────────────────────────────
  const GRAND_OAK_COUNT = 1200;
  const grandTrunkGeo = new THREE.CylinderGeometry(4.2, 7.5, 48, 7);
  grandTrunkGeo.translate(0, 24, 0); // Base sits at y=0

  const grandCrownGeo = new THREE.DodecahedronGeometry(26, 1);
  grandCrownGeo.scale(1.1, 0.88, 1.1);
  grandCrownGeo.translate(0, 64, 0); // Sits atop 48-unit trunk

  const grandTrunkInstanced = new THREE.InstancedMesh(grandTrunkGeo, trunkMat, GRAND_OAK_COUNT);
  grandTrunkInstanced.castShadow = true;
  grandTrunkInstanced.receiveShadow = true;

  const grandCrownMat = createWindMaterial(0.85);
  const grandCrownInstanced = new THREE.InstancedMesh(grandCrownGeo, grandCrownMat, GRAND_OAK_COUNT);
  grandCrownInstanced.castShadow = true;
  grandCrownInstanced.receiveShadow = true;
  attachWindHook(grandCrownInstanced);

  const grandOakColors = [
    new THREE.Color(0x14532d), // Deep dark emerald
    new THREE.Color(0x166534), // Forest green
    new THREE.Color(0x1b5e20), // Rich spruce
    new THREE.Color(0x15803d), // Vibrant oak
    new THREE.Color(0x2e7d32), // Classic leaf
  ];

  let grandIdx = 0;
  const grandStep = Math.sqrt((mapSize * mapSize) / GRAND_OAK_COUNT);

  for (let gx = 100; gx < mapSize - 100 && grandIdx < GRAND_OAK_COUNT; gx += grandStep) {
    for (let gz = 100; gz < mapSize - 100 && grandIdx < GRAND_OAK_COUNT; gz += grandStep) {
      const x = jitter(gx, 12.98, 78.23, grandStep);
      const z = jitter(gz, 39.34, 11.13, grandStep);

      if (isInsideAnyLake(x, z, 55))  continue;
      if (isNearAnyCastle(x, z, 180)) continue;
      if (isNearShrine(x, z, 130))    continue;
      if (isNearPath(x, z, 28))       continue;

      // Only in dense forest groves
      const density = getForestNoise(x, z);
      if (density < 0.45) continue;

      const h     = getTerrainHeight(x, z);
      const slope = getTerrainSlope(x, z);

      if (h > 42 || h < 0.6) continue;
      if (slope > 0.45)       continue;

      dummy.position.set(x, h, z);
      dummy.rotation.set(0, Math.random() * Math.PI * 2, 0);
      const sw = 0.85 + Math.random() * 0.45;
      const sh = 0.90 + Math.random() * 0.50; // Tall variation
      dummy.scale.set(sw, sh, sw);
      dummy.updateMatrix();

      grandTrunkInstanced.setMatrixAt(grandIdx, dummy.matrix);
      grandCrownInstanced.setMatrixAt(grandIdx, dummy.matrix);

      tmpColor.copy(grandOakColors[Math.floor(Math.random() * grandOakColors.length)]!);
      grandCrownInstanced.setColorAt(grandIdx, tmpColor);
      grandIdx++;
    }
  }
  grandTrunkInstanced.count = grandIdx;
  grandCrownInstanced.count = grandIdx;
  grandTrunkInstanced.instanceMatrix.needsUpdate = true;
  grandCrownInstanced.instanceMatrix.needsUpdate = true;
  if (grandCrownInstanced.instanceColor) grandCrownInstanced.instanceColor.needsUpdate = true;
  scatterGroup.add(grandTrunkInstanced);
  scatterGroup.add(grandCrownInstanced);

  // ────────────────────────────────────────────────────────────────────────
  // 2. TALL SLENDER POPLARS (Tier 2: Roadside & Avenue, Height 105 - 130)
  //    800 instances lined near roads, meadows and lake approaches
  // ────────────────────────────────────────────────────────────────────────
  const POPLAR_COUNT = 800;
  const poplarTrunkGeo = new THREE.CylinderGeometry(2.2, 3.8, 54, 6);
  poplarTrunkGeo.translate(0, 27, 0);

  const poplarCrownGeo = new THREE.SphereGeometry(13, 8, 6);
  poplarCrownGeo.scale(0.85, 2.3, 0.85); // Tall narrow cypress-poplar silhouette
  poplarCrownGeo.translate(0, 78, 0);

  const poplarTrunkInstanced = new THREE.InstancedMesh(poplarTrunkGeo, trunkMat, POPLAR_COUNT);
  poplarTrunkInstanced.castShadow = true;
  poplarTrunkInstanced.receiveShadow = true;

  const poplarCrownMat = createWindMaterial(0.80);
  const poplarCrownInstanced = new THREE.InstancedMesh(poplarCrownGeo, poplarCrownMat, POPLAR_COUNT);
  poplarCrownInstanced.castShadow = true;
  poplarCrownInstanced.receiveShadow = true;
  attachWindHook(poplarCrownInstanced);

  const poplarColors = [
    new THREE.Color(0x15803d),
    new THREE.Color(0x166534),
    new THREE.Color(0x14532d),
    new THREE.Color(0x16a34a),
    new THREE.Color(0x4ade80),
  ];

  let poplarIdx = 0;
  const poplarStep = Math.sqrt((mapSize * mapSize) / POPLAR_COUNT);

  for (let gx = 80; gx < mapSize - 80 && poplarIdx < POPLAR_COUNT; gx += poplarStep) {
    for (let gz = 80; gz < mapSize - 80 && poplarIdx < POPLAR_COUNT; gz += poplarStep) {
      const x = jitter(gx, 67.32, 14.78, poplarStep);
      const z = jitter(gz, 44.56, 88.91, poplarStep);

      if (isInsideAnyLake(x, z, 42))  continue;
      if (isNearAnyCastle(x, z, 170)) continue;
      if (isNearShrine(x, z, 120))    continue;

      // Poplars love roadsides (buffer 22-65 units from road) or lake approaches
      const nearRoad = isNearPath(x, z, 70) && !isNearPath(x, z, 22);
      const density = getForestNoise(x, z);
      if (!nearRoad && (density < 0.25 || density > 0.65)) continue;

      const h     = getTerrainHeight(x, z);
      const slope = getTerrainSlope(x, z);

      if (h > 32 || h < 0.5) continue;
      if (slope > 0.32)       continue;

      dummy.position.set(x, h, z);
      dummy.rotation.set(0, Math.random() * Math.PI * 2, 0);
      const sw = 0.75 + Math.random() * 0.40;
      const sh = 0.90 + Math.random() * 0.45; // Towering height
      dummy.scale.set(sw, sh, sw);
      dummy.updateMatrix();

      poplarTrunkInstanced.setMatrixAt(poplarIdx, dummy.matrix);
      poplarCrownInstanced.setMatrixAt(poplarIdx, dummy.matrix);

      tmpColor.copy(poplarColors[Math.floor(Math.random() * poplarColors.length)]!);
      poplarCrownInstanced.setColorAt(poplarIdx, tmpColor);
      poplarIdx++;
    }
  }
  poplarTrunkInstanced.count = poplarIdx;
  poplarCrownInstanced.count = poplarIdx;
  poplarTrunkInstanced.instanceMatrix.needsUpdate = true;
  poplarCrownInstanced.instanceMatrix.needsUpdate = true;
  if (poplarCrownInstanced.instanceColor) poplarCrownInstanced.instanceColor.needsUpdate = true;
  scatterGroup.add(poplarTrunkInstanced);
  scatterGroup.add(poplarCrownInstanced);

  // ────────────────────────────────────────────────────────────────────────
  // 3. GOLDEN AUTUMN MAPLES (Tier 3: Mid-forest Color Pop, Height 70 - 85)
  //    1000 instances in mid-density groves
  // ────────────────────────────────────────────────────────────────────────
  const MAPLE_COUNT = 1000;
  const mapleTrunkGeo = new THREE.CylinderGeometry(3.0, 4.8, 38, 6);
  mapleTrunkGeo.translate(0, 19, 0);

  const mapleCrownGeo = new THREE.DodecahedronGeometry(20, 1);
  mapleCrownGeo.scale(1.05, 0.92, 1.05);
  mapleCrownGeo.translate(0, 50, 0);

  const mapleTrunkInstanced = new THREE.InstancedMesh(mapleTrunkGeo, birchTrunkMat, MAPLE_COUNT);
  mapleTrunkInstanced.castShadow = true;
  mapleTrunkInstanced.receiveShadow = true;

  const mapleCrownMat = createWindMaterial(0.82);
  const mapleCrownInstanced = new THREE.InstancedMesh(mapleCrownGeo, mapleCrownMat, MAPLE_COUNT);
  mapleCrownInstanced.castShadow = true;
  mapleCrownInstanced.receiveShadow = true;
  attachWindHook(mapleCrownInstanced);

  const mapleColors = [
    new THREE.Color(0xd97706), // Warm amber
    new THREE.Color(0xf59e0b), // Golden yellow
    new THREE.Color(0xef4444), // Autumn crimson
    new THREE.Color(0xdc2626), // Deep red
    new THREE.Color(0xfbbf24), // Bright gold
    new THREE.Color(0xb45309), // Burnt orange
  ];

  let mapleIdx = 0;
  const mapleStep = Math.sqrt((mapSize * mapSize) / MAPLE_COUNT);

  for (let gx = 90; gx < mapSize - 90 && mapleIdx < MAPLE_COUNT; gx += mapleStep) {
    for (let gz = 90; gz < mapSize - 90 && mapleIdx < MAPLE_COUNT; gz += mapleStep) {
      const x = jitter(gx, 45.18, 23.67, mapleStep);
      const z = jitter(gz, 78.34, 91.12, mapleStep);

      if (isInsideAnyLake(x, z, 48))  continue;
      if (isNearAnyCastle(x, z, 175)) continue;
      if (isNearShrine(x, z, 120))    continue;
      if (isNearPath(x, z, 24))       continue;

      const density = getForestNoise(x, z);
      if (density < 0.35 || density > 0.75) continue;

      const h     = getTerrainHeight(x, z);
      const slope = getTerrainSlope(x, z);

      if (h > 26 || h < 0.6) continue;
      if (slope > 0.36)       continue;

      dummy.position.set(x, h, z);
      dummy.rotation.set(0, Math.random() * Math.PI * 2, 0);
      const sw = 0.80 + Math.random() * 0.45;
      dummy.scale.set(sw, sw * 0.95, sw);
      dummy.updateMatrix();

      mapleTrunkInstanced.setMatrixAt(mapleIdx, dummy.matrix);
      mapleCrownInstanced.setMatrixAt(mapleIdx, dummy.matrix);

      tmpColor.copy(mapleColors[Math.floor(Math.random() * mapleColors.length)]!);
      mapleCrownInstanced.setColorAt(mapleIdx, tmpColor);
      mapleIdx++;
    }
  }
  mapleTrunkInstanced.count = mapleIdx;
  mapleCrownInstanced.count = mapleIdx;
  mapleTrunkInstanced.instanceMatrix.needsUpdate = true;
  mapleCrownInstanced.instanceMatrix.needsUpdate = true;
  if (mapleCrownInstanced.instanceColor) mapleCrownInstanced.instanceColor.needsUpdate = true;
  scatterGroup.add(mapleTrunkInstanced);
  scatterGroup.add(mapleCrownInstanced);

  // ────────────────────────────────────────────────────────────────────────
  // 4. YOUNG SAPLINGS & FRINGE TREES (Tier 4: Forest Edges, Height 38 - 52)
  //    1500 instances around grove perimeters and glades
  // ────────────────────────────────────────────────────────────────────────
  const SAPLING_COUNT = 1500;
  const saplingTrunkGeo = new THREE.CylinderGeometry(1.6, 2.8, 26, 5);
  saplingTrunkGeo.translate(0, 13, 0);

  const saplingCrownGeo = new THREE.DodecahedronGeometry(13, 0);
  saplingCrownGeo.translate(0, 33, 0);

  const saplingTrunkInstanced = new THREE.InstancedMesh(saplingTrunkGeo, trunkMat, SAPLING_COUNT);
  saplingTrunkInstanced.castShadow = true;
  saplingTrunkInstanced.receiveShadow = true;

  const saplingCrownMat = createWindMaterial(0.84);
  const saplingCrownInstanced = new THREE.InstancedMesh(saplingCrownGeo, saplingCrownMat, SAPLING_COUNT);
  saplingCrownInstanced.castShadow = true;
  saplingCrownInstanced.receiveShadow = true;
  attachWindHook(saplingCrownInstanced);

  const saplingColors = [
    new THREE.Color(0x4ade80), // Fresh spring green
    new THREE.Color(0x22c55e), // Bright leaf
    new THREE.Color(0x16a34a), // Meadow green
    new THREE.Color(0x84cc16), // Lime green
    new THREE.Color(0x65a30d), // Olive green
  ];

  let saplingIdx = 0;
  const saplingStep = Math.sqrt((mapSize * mapSize) / SAPLING_COUNT);

  for (let gx = 70; gx < mapSize - 70 && saplingIdx < SAPLING_COUNT; gx += saplingStep) {
    for (let gz = 70; gz < mapSize - 70 && saplingIdx < SAPLING_COUNT; gz += saplingStep) {
      const x = jitter(gx, 51.23, 89.45, saplingStep);
      const z = jitter(gz, 33.67, 12.89, saplingStep);

      if (isInsideAnyLake(x, z, 35))  continue;
      if (isNearAnyCastle(x, z, 150)) continue;
      if (isNearShrine(x, z, 115))    continue;
      if (isNearPath(x, z, 18))       continue;

      // Saplings grow around the edges of groves (density 0.22 to 0.48)
      const density = getForestNoise(x, z);
      if (density < 0.22 || density > 0.52) continue;

      const h     = getTerrainHeight(x, z);
      const slope = getTerrainSlope(x, z);

      if (h > 30 || h < 0.4) continue;
      if (slope > 0.38)       continue;

      dummy.position.set(x, h, z);
      dummy.rotation.set(0, Math.random() * Math.PI * 2, 0);
      const scale = 0.70 + Math.random() * 0.50;
      dummy.scale.set(scale, scale, scale);
      dummy.updateMatrix();

      saplingTrunkInstanced.setMatrixAt(saplingIdx, dummy.matrix);
      saplingCrownInstanced.setMatrixAt(saplingIdx, dummy.matrix);

      tmpColor.copy(saplingColors[Math.floor(Math.random() * saplingColors.length)]!);
      saplingCrownInstanced.setColorAt(saplingIdx, tmpColor);
      saplingIdx++;
    }
  }
  saplingTrunkInstanced.count = saplingIdx;
  saplingCrownInstanced.count = saplingIdx;
  saplingTrunkInstanced.instanceMatrix.needsUpdate = true;
  saplingCrownInstanced.instanceMatrix.needsUpdate = true;
  if (saplingCrownInstanced.instanceColor) saplingCrownInstanced.instanceColor.needsUpdate = true;
  scatterGroup.add(saplingTrunkInstanced);
  scatterGroup.add(saplingCrownInstanced);

  // ────────────────────────────────────────────────────────────────────────
  // 5. WEEPING WILLOWS (Tier 5: Lake Shores & Riverbanks, Height 55 - 72)
  //    400 instances hugging lake shorelines
  // ────────────────────────────────────────────────────────────────────────
  const WILLOW_COUNT = 400;
  const willowTrunkGeo = new THREE.CylinderGeometry(3.6, 5.8, 30, 6);
  willowTrunkGeo.translate(0, 15, 0);

  const willowCrownGeo = new THREE.SphereGeometry(24, 8, 5);
  willowCrownGeo.scale(1.4, 0.60, 1.4); // Wide, flat drooping umbrella
  willowCrownGeo.translate(0, 38, 0);

  const willowTrunkInstanced = new THREE.InstancedMesh(willowTrunkGeo, trunkMat, WILLOW_COUNT);
  willowTrunkInstanced.castShadow = true;
  willowTrunkInstanced.receiveShadow = true;

  const willowCrownMat = createWindMaterial(0.78);
  const willowCrownInstanced = new THREE.InstancedMesh(willowCrownGeo, willowCrownMat, WILLOW_COUNT);
  willowCrownInstanced.castShadow = true;
  willowCrownInstanced.receiveShadow = true;
  attachWindHook(willowCrownInstanced);

  const willowColors = [
    new THREE.Color(0x34d399), // Mint emerald
    new THREE.Color(0x10b981), // Bright emerald
    new THREE.Color(0x059669), // Deep emerald
    new THREE.Color(0x6ee7b7), // Pale mint
    new THREE.Color(0x4ade80), // Lime green
  ];

  let willowIdx = 0;
  const willowStep = Math.sqrt((mapSize * mapSize) / WILLOW_COUNT);

  for (let gx = 80; gx < mapSize - 80 && willowIdx < WILLOW_COUNT; gx += willowStep) {
    for (let gz = 80; gz < mapSize - 80 && willowIdx < WILLOW_COUNT; gz += willowStep) {
      const x = jitter(gx, 33.12, 91.45, willowStep);
      const z = jitter(gz, 77.89, 22.34, willowStep);

      // Willows strictly stay near lake shores (distance 35 to 140 from lake edge)
      let nearLake = false;
      for (const lake of MAP_CONFIG.waters) {
        const dist = Math.hypot(x - lake.position.x, z - lake.position.y);
        if (dist < (lake.radius ?? 250) + 140 && dist > (lake.radius ?? 250) + 30) {
          nearLake = true;
          break;
        }
      }
      if (!nearLake) continue;

      if (isInsideAnyLake(x, z, 26))  continue;
      if (isNearAnyCastle(x, z, 180)) continue;
      if (isNearShrine(x, z, 120))    continue;
      if (isNearPath(x, z, 20))       continue;

      const h     = getTerrainHeight(x, z);
      const slope = getTerrainSlope(x, z);

      if (h > 15 || h < 0.2) continue;
      if (slope > 0.24)       continue;

      dummy.position.set(x, h, z);
      dummy.rotation.set(0, Math.random() * Math.PI * 2, 0);
      const sw = 0.85 + Math.random() * 0.45;
      dummy.scale.set(sw, sw * 0.95, sw);
      dummy.updateMatrix();

      willowTrunkInstanced.setMatrixAt(willowIdx, dummy.matrix);
      willowCrownInstanced.setMatrixAt(willowIdx, dummy.matrix);

      tmpColor.copy(willowColors[Math.floor(Math.random() * willowColors.length)]!);
      willowCrownInstanced.setColorAt(willowIdx, tmpColor);
      willowIdx++;
    }
  }
  willowTrunkInstanced.count = willowIdx;
  willowCrownInstanced.count = willowIdx;
  willowTrunkInstanced.instanceMatrix.needsUpdate = true;
  willowCrownInstanced.instanceMatrix.needsUpdate = true;
  if (willowCrownInstanced.instanceColor) willowCrownInstanced.instanceColor.needsUpdate = true;
  scatterGroup.add(willowTrunkInstanced);
  scatterGroup.add(willowCrownInstanced);

  // ────────────────────────────────────────────────────────────────────────
  // 6. WILDFLOWERS — 2400 instances in sunlit open meadows
  // ────────────────────────────────────────────────────────────────────────
  const FLOWER_COUNT  = 2400;
  const flowerGeo     = new THREE.DodecahedronGeometry(4.0, 0);
  flowerGeo.scale(1.0, 0.45, 1.0); // Flat colorful blossom
  flowerGeo.translate(0, 3.5, 0);
  const flowerMat     = new THREE.MeshStandardMaterial({ roughness: 0.72, metalness: 0.0, flatShading: true });
  const flowerInstanced = new THREE.InstancedMesh(flowerGeo, flowerMat, FLOWER_COUNT);
  flowerInstanced.receiveShadow = true;

  const flowerColors = [
    new THREE.Color(0xfbbf24), // Golden buttercup
    new THREE.Color(0xef4444), // Poppy red
    new THREE.Color(0xffffff), // White daisy
    new THREE.Color(0x8b5cf6), // Royal lavender
    new THREE.Color(0xf472b6), // Wild rose pink
    new THREE.Color(0xfde68a), // Pale yellow
    new THREE.Color(0x38bdf8), // Sky blue forget-me-not
  ];

  let flowerIdx = 0;
  const flowerStep = Math.sqrt((mapSize * mapSize) / FLOWER_COUNT);

  for (let gx = 60; gx < mapSize - 60 && flowerIdx < FLOWER_COUNT; gx += flowerStep) {
    for (let gz = 60; gz < mapSize - 60 && flowerIdx < FLOWER_COUNT; gz += flowerStep) {
      const x = jitter(gx, 88.34, 45.12, flowerStep);
      const z = jitter(gz, 23.67, 99.45, flowerStep);

      if (isInsideAnyLake(x, z, 35))  continue;
      if (isNearAnyCastle(x, z, 140)) continue;
      if (isNearShrine(x, z, 110))    continue;
      if (isNearPath(x, z, 16))       continue;

      // Flowers thrive in sunlit open glades (low tree density)
      const density = getForestNoise(x, z);
      if (density > 0.40) continue;

      const h     = getTerrainHeight(x, z);
      const slope = getTerrainSlope(x, z);

      if (h > 18 || h < 0.4) continue;
      if (slope > 0.22)       continue;

      dummy.position.set(x, h, z);
      dummy.rotation.set(0, Math.random() * Math.PI * 2, 0);
      const scale = 0.60 + Math.random() * 0.55;
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
  // 7. VOLUMETRIC 3D GRASS TUFTS — 5000 instances
  // ────────────────────────────────────────────────────────────────────────
  const GRASS_COUNT   = 5000;
  const grassGeo      = new THREE.ConeGeometry(3.5, 10, 4);
  grassGeo.translate(0, 5, 0);
  const grassMat      = new THREE.MeshStandardMaterial({ roughness: 0.80, metalness: 0.02, flatShading: true, side: THREE.DoubleSide });
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

      if (isInsideAnyLake(x, z, 28))  continue;
      if (isNearAnyCastle(x, z, 130)) continue;
      if (isNearShrine(x, z, 105))    continue;
      if (isNearPath(x, z, 18))       continue;

      const h     = getTerrainHeight(x, z);
      const slope = getTerrainSlope(x, z);

      if (h > 32 || h < 0.1) continue;
      if (slope > 0.48)       continue;

      dummy.position.set(x, h, z);
      dummy.rotation.set(
        (Math.random() - 0.5) * 0.12,
        Math.random() * Math.PI * 2,
        (Math.random() - 0.5) * 0.12
      );
      const scale = 0.65 + Math.random() * 0.60;
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
  // 8. ROCKS & BOULDERS — 900 instances
  // ────────────────────────────────────────────────────────────────────────
  const ROCK_COUNT   = 900;
  const rockGeo      = new THREE.DodecahedronGeometry(3.8, 0);
  const rockMat      = new THREE.MeshStandardMaterial({ roughness: 0.92, metalness: 0.05, flatShading: true });
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
      if (isNearShrine(x, z, 105))    continue;
      if (isNearPath(x, z, 18))       continue;

      const h     = getTerrainHeight(x, z);
      const slope = getTerrainSlope(x, z);

      const isShore     = h < 1.6;
      const isHillSlope = slope > 0.22;
      const isRoadVerge = isNearPath(x, z, 34);
      const isRandom    = Math.random() < 0.20;

      if (!isShore && !isHillSlope && !isRoadVerge && !isRandom) continue;

      dummy.position.set(x, h + 1.2, z);
      dummy.rotation.set(Math.random() * Math.PI, Math.random() * Math.PI * 2, Math.random() * Math.PI);
      const scale = isRoadVerge ? (0.35 + Math.random() * 0.45) : (0.55 + Math.random() * 1.5);
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
  // 9. WILD BUSHES — 400 instances
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
      if (isNearShrine(x, z, 110))    continue;
      if (isNearPath(x, z, 22))       continue;

      const h     = getTerrainHeight(x, z);
      const slope = getTerrainSlope(x, z);

      if (h > 20 || h < 0.5) continue;
      if (slope > 0.35)       continue;

      dummy.position.set(x, h + 3.5, z);
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