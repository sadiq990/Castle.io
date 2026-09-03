import * as THREE from 'three';
import { getTerrainHeight } from './TerrainGenerator.js';
import { MAP_CONFIG } from '../map/map.config.js';

// Base waypoints connecting Blue Castle (500, 500) to Red Castle (2500, 2500)
// Planned carefully with generous clearance around lakes
const RAW_WAYPOINTS: [number, number][] = [
  [500, 560],   // Blue Castle front gate
  [700, 750],   // Leaving blue castle grounds
  [1050, 720],  // Safe northern corridor past Lake 1 (radius 250 at 950, 1150)
  [1450, 1250], // Approaching central crossroads
  [1600, 1600], // Central pass between terrain swells
  [1750, 2350], // Safe southern corridor around Lake 2 (radius 270 at 2100, 1950)
  [2150, 2480], // Approaching red territory
  [2500, 2440], // Red Castle front gate
];

// Dynamic radial contour push-out to ensure the road NEVER clips or touches any lake
function avoidLakes(x: number, z: number, margin = 85): [number, number] {
  let curX = x;
  let curZ = z;

  for (const lake of MAP_CONFIG.waters) {
    const dx = curX - lake.position.x;
    const dz = curZ - lake.position.y;
    const dist = Math.hypot(dx, dz);
    const safeRadius = (lake.radius ?? 250) + margin;

    if (dist < safeRadius && dist > 0.1) {
      const push = safeRadius - dist;
      curX += (dx / dist) * push;
      curZ += (dz / dist) * push;
    }
  }
  return [curX, curZ];
}

let cachedCurve: THREE.CatmullRomCurve3 | null = null;
let sampledCurvePoints: THREE.Vector3[] = [];

export function getPathCurve(): THREE.CatmullRomCurve3 {
  if (!cachedCurve) {
    // 1. First pass: snap raw waypoints away from lakes
    const safeWaypoints = RAW_WAYPOINTS.map(([x, z]) => avoidLakes(x, z, 90));

    // 2. Build 3D control points following terrain height
    const points3D = safeWaypoints.map(([x, z]) => {
      // Road height is safely above terrain and NEVER below baseline 0.35
      const h = Math.max(0.35, getTerrainHeight(x, z) + 0.35);
      return new THREE.Vector3(x, h, z);
    });

    cachedCurve = new THREE.CatmullRomCurve3(points3D, false, 'catmullrom', 0.5);

    // 3. Sample 160 points along spline, ensuring every single point respects lake boundary
    const rawPoints = cachedCurve.getPoints(160);
    sampledCurvePoints = rawPoints.map(p => {
      const [nx, nz] = avoidLakes(p.x, p.z, 80);
      const ny = Math.max(0.35, getTerrainHeight(nx, nz) + 0.35);
      return new THREE.Vector3(nx, ny, nz);
    });

    // Rebuild smooth curve through verified safe points
    cachedCurve = new THREE.CatmullRomCurve3(sampledCurvePoints, false, 'catmullrom', 0.5);
  }
  return cachedCurve;
}

// Check if a 2D position (x, z) is on or near the road
export function isNearPath(x: number, z: number, threshold = 26): boolean {
  if (sampledCurvePoints.length === 0) {
    getPathCurve();
  }

  for (let i = 0; i < sampledCurvePoints.length; i++) {
    const p = sampledCurvePoints[i];
    const dx = x - p.x;
    const dz = z - p.z;
    if (Math.hypot(dx, dz) < threshold) {
      return true;
    }
  }
  return false;
}

// Generate the 3D dirt path ribbon with soft feathered edge blend & organic width variation
export function createPathMesh(): THREE.Mesh {
  const curve = getPathCurve();
  const segments = 160;

  const vertices: number[] = [];
  const indices: number[] = [];
  const colors: number[] = [];

  // Colors for multi-strip soft feathering
  const coreColor     = new THREE.Color(0xc4a876); // Warm packed dirt center
  const shoulderColor = new THREE.Color(0xa88f5e); // Packed earth transition
  const edgeColor     = new THREE.Color(0x529b3e); // Blends seamlessly into terrain grass!

  // 4 vertices across the cross-section: Outer-Left, Inner-Left, Inner-Right, Outer-Right
  for (let i = 0; i <= segments; i++) {
    const u = i / segments;
    const p = curve.getPoint(u);
    const tangent = curve.getTangent(u).normalize();
    const normal = new THREE.Vector3(-tangent.z, 0, tangent.x).normalize();

    // Organic procedural width variation (28 to 38 units)
    const widthNoise = Math.sin(i * 0.28) * 3.5 + Math.cos(i * 0.65) * 2.0;
    const totalWidth = 32.0 + widthNoise;
    const coreWidth = totalWidth * 0.55; // Central clear trail

    // 4 cross-section points
    const pOuterLeft  = p.clone().addScaledVector(normal, -totalWidth / 2);
    const pInnerLeft  = p.clone().addScaledVector(normal, -coreWidth / 2);
    const pInnerRight = p.clone().addScaledVector(normal, coreWidth / 2);
    const pOuterRight = p.clone().addScaledVector(normal, totalWidth / 2);

    // Height conformance (hug terrain, never dip below 0.35)
    pOuterLeft.y  = Math.max(0.35, getTerrainHeight(pOuterLeft.x, pOuterLeft.z) + 0.22);
    pInnerLeft.y  = Math.max(0.35, getTerrainHeight(pInnerLeft.x, pInnerLeft.z) + 0.30);
    pInnerRight.y = Math.max(0.35, getTerrainHeight(pInnerRight.x, pInnerRight.z) + 0.30);
    pOuterRight.y = Math.max(0.35, getTerrainHeight(pOuterRight.x, pOuterRight.z) + 0.22);

    // Push vertices
    vertices.push(
      pOuterLeft.x, pOuterLeft.y, pOuterLeft.z,
      pInnerLeft.x, pInnerLeft.y, pInnerLeft.z,
      pInnerRight.x, pInnerRight.y, pInnerRight.z,
      pOuterRight.x, pOuterRight.y, pOuterRight.z
    );

    // Colors: Outer edges match grass terrain, center is warm dirt
    colors.push(
      edgeColor.r, edgeColor.g, edgeColor.b,
      shoulderColor.r, shoulderColor.g, shoulderColor.b,
      shoulderColor.r, shoulderColor.g, shoulderColor.b,
      edgeColor.r, edgeColor.g, edgeColor.b
    );

    if (i < segments) {
      const base = i * 4;
      // Strip 1: Outer-Left to Inner-Left
      indices.push(base + 0, base + 1, base + 4);
      indices.push(base + 1, base + 5, base + 4);

      // Strip 2: Inner-Left to Inner-Right (main dirt road)
      indices.push(base + 1, base + 2, base + 5);
      indices.push(base + 2, base + 6, base + 5);

      // Strip 3: Inner-Right to Outer-Right
      indices.push(base + 2, base + 3, base + 6);
      indices.push(base + 3, base + 7, base + 6);
    }
  }

  const geo = new THREE.BufferGeometry();
  geo.setAttribute('position', new THREE.Float32BufferAttribute(vertices, 3));
  geo.setAttribute('color', new THREE.Float32BufferAttribute(colors, 3));
  geo.setIndex(indices);
  geo.computeVertexNormals();

  const mat = new THREE.MeshStandardMaterial({
    vertexColors: true,
    roughness: 0.95,
    metalness: 0.0,
    flatShading: true,
  });

  const mesh = new THREE.Mesh(geo, mat);
  mesh.name = 'dirtPathMesh';
  mesh.receiveShadow = true;

  return mesh;
}