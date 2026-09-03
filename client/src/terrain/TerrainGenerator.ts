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

  const u = fx * fx * (3.0 - 2.0 * fx);
  const v = fy * fy * (3.0 - 2.0 * fy);

  const n00 = hash2d(i, j);
  const n10 = hash2d(i + 1, j);
  const n01 = hash2d(i, j + 1);
  const n11 = hash2d(i + 1, j + 1);

  return (
    n00 * (1.0 - u) * (1.0 - v) +
    n10 * u * (1.0 - v) +
    n01 * (1.0 - u) * v +
    n11 * u * v
  );
}

function fbm(x: number, y: number): number {
  let val = 0.0;
  let amp = 1.0;
  let freq = 1.0;

  for (let i = 0; i < 3; i++) {
    val += amp * smoothNoise(x * freq, y * freq);
    freq *= 2.1;
    amp *= 0.45;
  }
  return val;
}

// ── UNIFIED HEIGHTMAP FUNCTION ─────────────────────────────────────────────
export function getTerrainHeight(x: number, z: number): number {
  // 1. Castle Flattening (Spacious flat green courtyards around both castles)
  const distToBlueCastle = Math.hypot(x - 500, z - 500);
  const distToRedCastle  = Math.hypot(x - 2500, z - 2500);
  const castleDist = Math.min(distToBlueCastle, distToRedCastle);

  if (castleDist < 200) {
    return 0.0;
  }
  const castleBlend = Math.min(1.0, Math.max(0.0, (castleDist - 200) / 100));

  // 2. Lake Basin Depression (Water sits inside natural smooth depressed basins)
  for (const lake of MAP_CONFIG.waters) {
    const distToLake = Math.hypot(x - lake.position.x, z - lake.position.y);
    const radius = lake.radius ?? 250;
    if (distToLake < radius) {
      // Depressed bowl inside the lake
      return -2.6 + (distToLake / radius) * 2.2;
    } else if (distToLake < radius + 45) {
      // Gentle slope rising from water shore to green meadow
      const shoreProgress = (distToLake - radius) / 45;
      return -0.4 + shoreProgress * 0.7;
    }
  }

  // 3. Gentle Rolling Landscape Waves (Soft rolling hills across meadows)
  const broadWaves = (fbm(x * 0.001, z * 0.001) - 0.45) * 16.0;
  const fineWaves  = (smoothNoise(x * 0.0035, z * 0.0035) - 0.5) * 4.0;

  // 4. Pronounced Rolling Hill Swells
  let hillSwells = 0.0;
  for (const hill of MAP_CONFIG.mountains) {
    const dist = Math.hypot(x - hill.position.x, z - hill.position.y);
    const hillRadius = 140;
    if (dist < hillRadius * 1.5) {
      const normDist = dist / hillRadius;
      const swell = Math.cos(Math.min(Math.PI, normDist * Math.PI)) * 0.5 + 0.5;
      hillSwells += swell * 18.0;
    }
  }

  // 5. Organic Island Coastline (Slopes naturally down into the surrounding ocean)
  const dx = x - 1500;
  const dz = z - 1500;
  const distFromCenter = Math.hypot(dx, dz);
  const angle = Math.atan2(dz, dx);
  // Organic island contour with bays, coves, and peninsulas
  const coastRadius = 1680 + Math.sin(angle * 4.0) * 80 + Math.cos(angle * 3.0) * 60 + Math.sin(angle * 7.0) * 30;

  let coastalSlope = 0.0;
  if (distFromCenter > coastRadius - 100) {
    const t = Math.min(1.0, Math.max(0.0, (distFromCenter - (coastRadius - 100)) / 220));
    // Smooth drop into ocean water (submerged under ocean at y = -6.5)
    coastalSlope = -t * 6.5;
  }

  const baseHeight = Math.max(0.0, broadWaves + fineWaves + hillSwells) * castleBlend;
  return baseHeight + coastalSlope;
}

// ── SLOPE GRADIENT ────────────────────────────────────────────────────────
export function getTerrainSlope(x: number, z: number): number {
  const step = 4.0;
  const hL = getTerrainHeight(x - step, z);
  const hR = getTerrainHeight(x + step, z);
  const hD = getTerrainHeight(x, z - step);
  const hU = getTerrainHeight(x, z + step);

  const dx = (hR - hL) / (step * 2);
  const dz = (hU - hD) / (step * 2);

  return Math.sqrt(dx * dx + dz * dz);
}

// ── 3D TERRAIN MESH GENERATOR (Expansive 4600x4600 Island) ─────────────────
export function createTerrainMesh(mapSize: number): THREE.Mesh {
  // Expanded to 4600x4600 so the island extends well beyond camera view
  const meshSize = mapSize + 1600;
  const segments = 200;
  const geo = new THREE.PlaneGeometry(meshSize, meshSize, segments, segments);
  geo.rotateX(-Math.PI / 2); // Lay horizontal (Y is up, X/Z are world coordinates)
  geo.translate(mapSize / 2, 0, mapSize / 2); // Center on map center (1500, 1500)

  const pos = geo.attributes.position;
  const count = pos.count;

  // Vertex Colors: 100% Lush, Vibrant Fantasy Green Meadow Palette (NO MUD SLUDGE!)
  const colors = new Float32Array(count * 3);

  const emeraldGrass  = new THREE.Color(0x3e8529); // Rich deep meadow green
  const vibrantMeadow = new THREE.Color(0x4fa336); // Fresh spring grass
  const sunlitClover  = new THREE.Color(0x5db33e); // Sun-dappled warm green
  const goldenPrairie = new THREE.Color(0x6cbe46); // Golden grassy ridge highlight
  const shoreSand     = new THREE.Color(0xd6c290); // Warm soft beach sand
  const underwaterBed = new THREE.Color(0x2d5e52); // Submerged coastal shelf

  for (let i = 0; i < count; i++) {
    const x = pos.getX(i);
    const z = pos.getZ(i);

    const h = getTerrainHeight(x, z);
    pos.setY(i, h);

    let vColor: THREE.Color;

    if (h < -0.8) {
      // Submerged seabed under ocean
      vColor = underwaterBed.clone();
    } else if (h < 0.25) {
      // Natural sandy shore / beach where land meets water
      const t = Math.max(0.0, Math.min(1.0, (h + 0.8) / 1.05));
      vColor = underwaterBed.clone().lerp(shoreSand, t);
    } else if (h < 0.8) {
      // Beach to lush grass transition
      const t = (h - 0.25) / 0.55;
      vColor = shoreSand.clone().lerp(vibrantMeadow, t);
    } else {
      // 100% LUSH VIBRANT GREEN MEADOW across the whole island!
      // Procedurally blended via smooth Perlin noise for natural, organic beauty
      const n = fbm(x * 0.0025, z * 0.0025);
      if (n > 0.58) {
        const t = Math.min(1.0, (n - 0.58) * 3.0);
        vColor = vibrantMeadow.clone().lerp(sunlitClover, t);
      } else if (n < 0.42) {
        const t = Math.min(1.0, (0.42 - n) * 3.0);
        vColor = emeraldGrass.clone().lerp(vibrantMeadow, 1.0 - t);
      } else {
        vColor = vibrantMeadow.clone();
      }

      // Rolling hill tops get a sunlit golden meadow glow (NEVER dirty brown mud!)
      if (h > 6.0) {
        const t = Math.min(0.65, (h - 6.0) / 14.0);
        vColor.lerp(goldenPrairie, t);
      }
    }

    colors[i * 3 + 0] = vColor.r;
    colors[i * 3 + 1] = vColor.g;
    colors[i * 3 + 2] = vColor.b;
  }

  geo.setAttribute('color', new THREE.BufferAttribute(colors, 3));
  geo.computeVertexNormals();

  const mat = new THREE.MeshStandardMaterial({
    vertexColors: true,
    roughness: 0.85,
    metalness: 0.02,
    flatShading: true, // Crisp low-poly faceted aesthetic
  });

  const mesh = new THREE.Mesh(geo, mat);
  mesh.receiveShadow = true;
  mesh.name = 'terrainMesh';

  return mesh;
}