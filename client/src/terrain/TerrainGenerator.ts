import * as THREE from 'three';
import { MAP_CONFIG } from '../map/map.config.js';

// ── FAST 2D NOISE IMPLEMENTATION (Deterministic Simplex Approximation) ─────
function fract(x: number): number {
  return x - Math.floor(x);
}

function hash2d(x: number, y: number): number {
  const h = Math.sin(x * 127.1 + y * 311.7) * 43758.5453123;
  return fract(h);
}

function smoothNoise(x: number, y: number): number {
  const i = Math.floor(x);
  const j = Math.floor(y);
  const fx = fract(x);
  const fy = fract(y);

  // Quintic Hermite curve — smoother than cubic for terrain
  const u = fx * fx * fx * (fx * (fx * 6.0 - 15.0) + 10.0);
  const v = fy * fy * fy * (fy * (fy * 6.0 - 15.0) + 10.0);

  const n00 = hash2d(i,     j    );
  const n10 = hash2d(i + 1, j    );
  const n01 = hash2d(i,     j + 1);
  const n11 = hash2d(i + 1, j + 1);

  return (
    n00 * (1.0 - u) * (1.0 - v) +
    n10 * u * (1.0 - v) +
    n01 * (1.0 - u) * v +
    n11 * u * v
  );
}

// 5-octave FBM for dramatic, layered mountain landscapes
function fbm(x: number, y: number): number {
  let val  = 0.0;
  let amp  = 1.0;
  let freq = 1.0;
  let norm = 0.0;

  const octaves  = 5;
  const lacunarity = 2.05;
  const gain     = 0.48;

  for (let i = 0; i < octaves; i++) {
    val  += amp * smoothNoise(x * freq, y * freq);
    norm += amp;
    freq *= lacunarity;
    amp  *= gain;
  }
  return val / norm; // Normalize 0..1
}

// Domain-warped fbm — gives terrain a more "twisted" mountain look
function warpedFbm(x: number, y: number): number {
  const warpStrength = 0.6;
  const wx = fbm(x + 1.7, y + 9.2);
  const wy = fbm(x + 8.3, y + 2.8);
  return fbm(x + warpStrength * wx, y + warpStrength * wy);
}

// ── UNIFIED HEIGHTMAP FUNCTION ─────────────────────────────────────────────
export function getTerrainHeight(x: number, z: number): number {

  // 1. Castle Flattening — matches map.config castles at 700,700 and MAP-700,MAP-700
  const distToBlueCastle = Math.hypot(x - 700,  z - 700 );
  const distToRedCastle  = Math.hypot(x - 3800, z - 3800);
  const castleDist = Math.min(distToBlueCastle, distToRedCastle);

  if (castleDist < 180) return 0.0;
  const castleBlend = Math.min(1.0, Math.max(0.0, (castleDist - 180) / 140));

  // 2. Lake Basin Depression
  for (const lake of MAP_CONFIG.waters) {
    const distToLake = Math.hypot(x - lake.position.x, z - lake.position.y);
    const radius = lake.radius ?? 250;
    if (distToLake < radius) {
      // Smooth bowl depression
      const t = distToLake / radius;
      return -3.0 + t * t * 2.8;
    } else if (distToLake < radius + 80) {
      // Gradual sandy shore rise
      const shoreProgress = (distToLake - radius) / 80;
      return -0.2 + shoreProgress * 1.2;
    }
  }

  // 3. Broad landscape shape (domain-warped for natural look)
  const broadLandscape = (warpedFbm(x * 0.00085, z * 0.00085) - 0.38) * 52.0;

  // 4. Medium rolling hills layer
  const mediumRolls = (fbm(x * 0.0022, z * 0.0022) - 0.45) * 18.0;

  // 5. Fine surface detail
  const fineDetail = (smoothNoise(x * 0.006, z * 0.006) - 0.5) * 5.0;

  // 6. Pronounced dramatic mountain peaks (Gaussian swells with ridge effect)
  let hillSwells = 0.0;
  for (const hill of MAP_CONFIG.mountains) {
    const dist = Math.hypot(x - hill.position.x, z - hill.position.y);
    const hillRadius = 180;

    if (dist < hillRadius * 2.2) {
      const normDist = dist / hillRadius;
      // Smooth sharp peak: cosine base + extra ridge boost
      const baseSwell = Math.cos(Math.min(Math.PI, normDist * Math.PI)) * 0.5 + 0.5;
      // Sharpened tip using power curve
      const peakBoost = Math.pow(baseSwell, 1.8) * 28.0;
      hillSwells += peakBoost;
    }
  }

  const rawHeight = broadLandscape + mediumRolls + fineDetail + hillSwells;
  const baseHeight = Math.max(0.0, rawHeight) * castleBlend;
  return baseHeight;
}

// ── SLOPE GRADIENT ────────────────────────────────────────────────────────
export function getTerrainSlope(x: number, z: number): number {
  const step = 5.0;
  const hL = getTerrainHeight(x - step, z);
  const hR = getTerrainHeight(x + step, z);
  const hD = getTerrainHeight(x, z - step);
  const hU = getTerrainHeight(x, z + step);

  const dx = (hR - hL) / (step * 2);
  const dz = (hU - hD) / (step * 2);

  return Math.sqrt(dx * dx + dz * dz);
}

// ── 5-ZONE ELEVATION COLOR FUNCTION ──────────────────────────────────────
function getElevationColor(h: number, slope: number): THREE.Color {
  // Zone boundaries
  const SHORE_HIGH   =  1.5;   // Sandy beach/shore
  const GRASS_HIGH   = 18.0;   // Lush green meadow
  const ROCKY_START  = 28.0;   // Transition to rocky
  const CLIFF_HIGH   = 42.0;   // Full cliff/rock
  const SNOW_START   = 54.0;   // Snow caps

  const lakeFloorColor  = new THREE.Color(0x8b7355); // Muddy lake bottom
  const shoreColor      = new THREE.Color(0xd4b896); // Warm sandy shore
  const flatGrassColor  = new THREE.Color(0x4a8c35); // Lush flat grass
  const hillGrassColor  = new THREE.Color(0x5a9e3e); // Sunlit slope grass
  const alpineGrassColor= new THREE.Color(0x3d7a2e); // High alpine grass
  const rockyColor      = new THREE.Color(0x7a6e64); // Rocky cliff grey-brown
  const cliffColor      = new THREE.Color(0x5c5450); // Dark cliff face
  const snowColor       = new THREE.Color(0xeef2f5); // Bright snow

  let color = flatGrassColor.clone();

  if (h < -0.5) {
    // Lake floor / submerged
    color.copy(lakeFloorColor);
  } else if (h < SHORE_HIGH) {
    // Sandy shore transitioning from muddy floor
    const t = Math.max(0, Math.min(1, (h + 0.5) / (SHORE_HIGH + 0.5)));
    color.copy(lakeFloorColor).lerp(shoreColor, t);
  } else if (h < GRASS_HIGH) {
    // Lush grass with subtle slope variation
    const slopeT = Math.min(1, slope * 3.0);
    color.copy(flatGrassColor).lerp(hillGrassColor, slopeT);
    // Slightly darker deep grass in flat areas
    if (slope < 0.05) {
      color.lerp(alpineGrassColor, 0.2);
    }
  } else if (h < ROCKY_START) {
    // Transition from grass to rocky
    const t = (h - GRASS_HIGH) / (ROCKY_START - GRASS_HIGH);
    const slopeT = Math.min(1, slope * 2.5);
    const baseGrass = hillGrassColor.clone().lerp(alpineGrassColor, slopeT);
    color.copy(baseGrass).lerp(rockyColor, t * t);
  } else if (h < CLIFF_HIGH) {
    // Rocky cliff face
    const t = (h - ROCKY_START) / (CLIFF_HIGH - ROCKY_START);
    // Steep slopes are pure cliff
    const slopeBoost = Math.min(1, slope * 4.0);
    color.copy(rockyColor).lerp(cliffColor, Math.max(t, slopeBoost * 0.7));
  } else if (h < SNOW_START) {
    // Dark cliff approaching snow line
    const t = (h - CLIFF_HIGH) / (SNOW_START - CLIFF_HIGH);
    color.copy(cliffColor).lerp(snowColor, t * t);
  } else {
    // Brilliant snow cap
    const t = Math.min(1, (h - SNOW_START) / 15.0);
    color.copy(snowColor);
    // Slight blue tint for deep snow
    color.lerp(new THREE.Color(0xdce8f0), t * 0.4);
  }

  return color;
}

// ── 3D TERRAIN MESH GENERATOR (240×240 Subdivided Plane) ──────────────────
export function createTerrainMesh(mapSize: number): THREE.Mesh {
  // 240×240 = 57,600 quads — good resolution for dramatic mountains, still GPU-friendly
  const segments = 240;
  const geo = new THREE.PlaneGeometry(mapSize, mapSize, segments, segments);
  geo.rotateX(-Math.PI / 2); // Lay horizontal
  geo.translate(mapSize / 2, 0, mapSize / 2); // Align origin to top-left

  const pos    = geo.attributes.position;
  const count  = pos.count;
  const colors = new Float32Array(count * 3);

  for (let i = 0; i < count; i++) {
    const x = pos.getX(i);
    const z = pos.getZ(i);

    const h     = getTerrainHeight(x, z);
    const slope = getTerrainSlope(x, z);

    pos.setY(i, h);

    const vColor = getElevationColor(h, slope);
    colors[i * 3 + 0] = vColor.r;
    colors[i * 3 + 1] = vColor.g;
    colors[i * 3 + 2] = vColor.b;
  }

  geo.setAttribute('color', new THREE.BufferAttribute(colors, 3));
  geo.computeVertexNormals();

  const mat = new THREE.MeshStandardMaterial({
    vertexColors: true,
    roughness: 0.90,
    metalness: 0.01,
    flatShading: true, // Low-poly faceted beauty
  });

  const mesh = new THREE.Mesh(geo, mat);
  mesh.receiveShadow = true;
  mesh.castShadow = false; // Terrain doesn't need to cast on itself
  mesh.name = 'terrainMesh';

  return mesh;
}