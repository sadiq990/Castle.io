import * as THREE from 'three';
import { getTerrainHeight } from './TerrainGenerator.js';

// Waypoints connecting Blue Castle (500, 500) to Red Castle (2500, 2500)
// Curving naturally through the landscape, avoiding lakes
const WAYPOINTS_2D: [number, number][] = [
  [500, 560],   // Outside Blue Castle Gate
  [720, 780],
  [1100, 850],  // North of Lake 1
  [1450, 1350], // Map Crossroads
  [1650, 1650], // Central pass between hills
  [1900, 2200], // South of Lake 2
  [2280, 2380],
  [2500, 2440], // Outside Red Castle Gate
];

let cachedCurve: THREE.CatmullRomCurve3 | null = null;
let sampledCurvePoints: THREE.Vector3[] = [];

export function getPathCurve(): THREE.CatmullRomCurve3 {
  if (!cachedCurve) {
    const points3D = WAYPOINTS_2D.map(([x, z]) => {
      const y = getTerrainHeight(x, z) + 0.35; // Hugs terrain height
      return new THREE.Vector3(x, y, z);
    });

    cachedCurve = new THREE.CatmullRomCurve3(points3D, false, 'catmullrom', 0.5);
    sampledCurvePoints = cachedCurve.getPoints(120);
  }
  return cachedCurve;
}

// Check if a 2D position (x, z) is on or near the road
export function isNearPath(x: number, z: number, threshold = 26): boolean {
  if (sampledCurvePoints.length === 0) {
    getPathCurve();
  }

  // Quick bounding box check
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

// Generate the 3D dirt path ribbon mesh
export function createPathMesh(): THREE.Mesh {
  const curve = getPathCurve();
  const segments = 140;
  const pathWidth = 34.0; // 34 world units wide

  const points = curve.getPoints(segments);
  const vertices: number[] = [];
  const indices: number[] = [];
  const colors: number[] = [];

  const centerColor = new THREE.Color(0xc4a876); // Warm earth dirt
  const edgeColor   = new THREE.Color(0x9e8255); // Slightly darker packed edge

  for (let i = 0; i <= segments; i++) {
    const p = points[i];
    const tangent = curve.getTangent(i / segments).normalize();
    // Normal vector perpendicular to tangent on XZ plane
    const normal = new THREE.Vector3(-tangent.z, 0, tangent.x).normalize();

    // Left vertex
    const leftX = p.x - normal.x * (pathWidth / 2);
    const leftZ = p.z - normal.z * (pathWidth / 2);
    const leftY = getTerrainHeight(leftX, leftZ) + 0.28;

    // Right vertex
    const rightX = p.x + normal.x * (pathWidth / 2);
    const rightZ = p.z + normal.z * (pathWidth / 2);
    const rightY = getTerrainHeight(rightX, rightZ) + 0.28;

    vertices.push(leftX, leftY, leftZ);
    vertices.push(rightX, rightY, rightZ);

    colors.push(edgeColor.r, edgeColor.g, edgeColor.b);
    colors.push(centerColor.r, centerColor.g, centerColor.b);

    if (i < segments) {
      const base = i * 2;
      // Two triangles per quad
      indices.push(base, base + 1, base + 2);
      indices.push(base + 1, base + 3, base + 2);
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