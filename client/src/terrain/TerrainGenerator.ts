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

  // Cubic Hermite curve for smooth interpolation
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
  // 1. Castle Flattening (Both castles sit on flat ground)
  const distToBlueCastle = Math.hypot(x - 500, z - 500);
  const distToRedCastle  = Math.hypot(x - 2500, z - 2500);
  const castleDist = Math.min(distToBlueCastle, distToRedCastle);

  if (castleDist < 140) {
    return 0.0;
  }
  const castleBlend = Math.min(1.0, Math.max(0.0, (castleDist - 140) / 100));

  // 2. Lake Basin Depression (Water sits inside natural depressed basins)
  for (const lake of MAP_CONFIG.waters) {
    const distToLake = Math.hypot(x - lake.position.x, z - lake.position.y);
    const radius = lake.radius ?? 250;
    if (distToLake < radius) {
      // Depressed bowl inside the lake
      return -2.5 + (distToLake / radius) * 2.0;
    } else if (distToLake < radius + 50) {
      // Gentle slope rising from water shore to terrain
      const shoreProgress = (distToLake - radius) / 50;
      return -0.5 + shoreProgress * 0.8;
    }
  }

  // 3. Natural Rolling Landscape Waves (Broad, smooth rolling hills)
  const broadWaves = (fbm(x * 0.0012, z * 0.0012) - 0.45) * 32.0;
  const fineWaves  = (smoothNoise(x * 0.004, z * 0.004) - 0.5) * 6.0;

  // 4. Pronounced Rolling Hill Centers (Smooth Gaussian swell mounds)
  let hillSwells = 0.0;
  for (const hill of MAP_CONFIG.mountains) {
    const dist = Math.hypot(x - hill.position.x, z - hill.position.y);
    const hillRadius = 140;
    if (dist < hillRadius * 1.5) {
      const normDist = dist / hillRadius;
      const swell = Math.cos(Math.min(Math.PI, normDist * Math.PI)) * 0.5 + 0.5;
      hillSwells += swell * 36.0;
    }
  }

  // 5. Organic Map Perimeter & Jagged Mountain Cliffs (Organic, non-square boundary!)
  const dx = x - 1500;
  const dz = z - 1500;
  const distFromCenter = Math.hypot(dx, dz);
  const angle = Math.atan2(dz, dx);
  // Multi-harmonic organic contour with jutting capes and bays
  const organicBorder = 1320 + Math.sin(angle * 5.0) * 110 + Math.cos(angle * 3.0) * 85 + Math.sin(angle * 9.0) * 40;

  let perimeterCliff = 0.0;
  if (distFromCenter > organicBorder) {
    const overflow = distFromCenter - organicBorder;
    perimeterCliff = Math.min(140.0, Math.pow(overflow * 0.22, 1.45) + smoothNoise(x * 0.015, z * 0.015) * 25.0);
  }

  const baseHeight = Math.max(0.0, broadWaves + fineWaves + hillSwells) * castleBlend;
  return baseHeight + perimeterCliff;
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

// ── 3D TERRAIN MESH GENERATOR (160x160 Subdivided Plane) ───────────────────
export function createTerrainMesh(mapSize: number): THREE.Mesh {
  const segments = 160;
  const geo = new THREE.PlaneGeometry(mapSize, mapSize, segments, segments);
  geo.rotateX(-Math.PI / 2); // Lay horizontal (Y is up, X/Z are world coordinates)
  geo.translate(mapSize / 2, 0, mapSize / 2); // Align origin to (0, 0) top-left

  const pos = geo.attributes.position;
  const count = pos.count;

  // Vertex Colors: Rich pastel fantasy palette
  const colors = new Float32Array(count * 3);

  const flatGrassColor = new THREE.Color(0x529b3e); // Lush base grass
  const slopeGrassColor = new THREE.Color(0x68b352); // Sunlit slope
  const hillRidgeColor = new THREE.Color(0x7ea36d); // Higher hill plateau
  const cliffRockColor = new THREE.Color(0x475569); // Mountain cliff slate
  const snowCapColor   = new THREE.Color(0xf1f5f9); // Snowy alpine peak
  const shoreSandColor = new THREE.Color(0xc2b080); // Lake shore sand

  for (let i = 0; i < count; i++) {
    const x = pos.getX(i);
    const z = pos.getZ(i);

    const h = getTerrainHeight(x, z);
    pos.setY(i, h);

    // Compute color based on elevation and slope
    const slope = getTerrainSlope(x, z);

    let vColor = flatGrassColor.clone();

    if (h < 0.2) {
      // Near water shore
      vColor.lerp(shoreSandColor, Math.max(0.0, 1.0 - (h + 2.5) / 2.5));
    } else if (h > 45.0) {
      // High perimeter mountain cliffs & snowy peaks
      const t = Math.min(1.0, (h - 45.0) / 45.0);
      vColor.copy(cliffRockColor).lerp(snowCapColor, t);
    } else if (h > 18.0) {
      // Higher hill ridges
      const t = Math.min(1.0, (h - 18.0) / 27.0);
      vColor.lerp(hillRidgeColor, t);
    } else {
      // Slopes get lighter sunlit green
      const t = Math.min(1.0, slope * 2.2);
      vColor.lerp(slopeGrassColor, t);
    }

    colors[i * 3 + 0] = vColor.r;
    colors[i * 3 + 1] = vColor.g;
    colors[i * 3 + 2] = vColor.b;
  }

  geo.setAttribute('color', new THREE.BufferAttribute(colors, 3));
  geo.computeVertexNormals();

  const mat = new THREE.MeshStandardMaterial({
    vertexColors: true,
    roughness: 0.88,
    metalness: 0.02,
    flatShading: true, // Stylish low-poly faceted look!
  });

  const mesh = new THREE.Mesh(geo, mat);
  mesh.receiveShadow = true;
  mesh.name = 'terrainMesh';

  return mesh;
}