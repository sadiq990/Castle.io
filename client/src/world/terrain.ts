import * as THREE from 'three';
import { createTerrainMesh, getTerrainHeight, getTerrainSlope, getElevationColor } from '../terrain/TerrainGenerator.js';
import { createPathMesh, isNearPath, getPathCurve } from '../terrain/PathSystem.js';

export {
  createTerrainMesh,
  getTerrainHeight,
  getTerrainSlope,
  getElevationColor,
  createPathMesh,
  isNearPath,
  getPathCurve,
};

/**
 * Creates the complete ground terrain group (subdivided 3D heightmap + path ribbon)
 */
export function createWorldTerrain(mapSize: number = 4500): THREE.Group {
  const group = new THREE.Group();
  group.name = 'world-terrain';

  const terrainMesh = createTerrainMesh(mapSize);
  group.add(terrainMesh);

  const pathMesh = createPathMesh();
  group.add(pathMesh);

  return group;
}
