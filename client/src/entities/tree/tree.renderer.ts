import * as THREE from 'three';
import type { SceneManager } from '../core/SceneManager.js';
import type { TreeState } from 'shared/types/entities.js';
import { getTerrainHeight } from '../../terrain/TerrainGenerator.js';

// Foliage color palette for rich, natural forest variety
const FOLIAGE_COLORS = [
  0x2e7d32, // Classic rich pine green
  0x1b5e20, // Deep dark spruce green
  0x388e3c, // Lush forest green
  0x43a047, // Bright spring pine
  0x286b2d, // Moss pine
];

function createTreeMesh(treeId: string): THREE.Group {
  const group = new THREE.Group();

  // Pick deterministic foliage color based on tree id
  let hash = 0;
  for (let i = 0; i < treeId.length; i++) {
    hash = (hash * 31 + treeId.charCodeAt(i)) | 0;
  }
  const colorIndex = Math.abs(hash) % FOLIAGE_COLORS.length;
  const leavesColor = FOLIAGE_COLORS[colorIndex];

  // Trunk
  const trunkGeo = new THREE.CylinderGeometry(4, 6, 22, 6);
  const trunkMat = new THREE.MeshStandardMaterial({ color: 0x5d4037, roughness: 0.92 });
  const trunk = new THREE.Mesh(trunkGeo, trunkMat);
  trunk.position.y = 11;
  trunk.castShadow = true;
  trunk.receiveShadow = true;
  group.add(trunk);

  // Pine foliage layers
  const leavesMat = new THREE.MeshStandardMaterial({
    color: leavesColor,
    roughness: 0.82,
    flatShading: true,
  });

  const layer1 = new THREE.Mesh(new THREE.ConeGeometry(25, 38, 6), leavesMat);
  layer1.position.y = 30;
  layer1.castShadow = true;
  layer1.receiveShadow = true;
  group.add(layer1);

  const layer2 = new THREE.Mesh(new THREE.ConeGeometry(20, 32, 6), leavesMat);
  layer2.position.y = 44;
  layer2.castShadow = true;
  layer2.receiveShadow = true;
  group.add(layer2);

  const layer3 = new THREE.Mesh(new THREE.ConeGeometry(14, 26, 6), leavesMat);
  layer3.position.y = 57;
  layer3.castShadow = true;
  layer3.receiveShadow = true;
  group.add(layer3);

  return group;
}

export function updateTree3D(sceneManager: SceneManager, tree: TreeState): void {
  const meshId = 'tree-' + tree.id;
  let mesh = sceneManager.meshes.get(meshId);

  if (!mesh) {
    mesh = createTreeMesh(tree.id);
    const y = getTerrainHeight(tree.position.x, tree.position.y);
    mesh.position.set(tree.position.x, y, tree.position.y);

    // Deterministic rotation & scale based on coordinates so it's stable
    const seed = Math.sin(tree.position.x * 12.9898 + tree.position.y * 78.233) * 43758.5453;
    const norm = seed - Math.floor(seed);

    mesh.rotation.y = norm * Math.PI * 2;
    const scale = 0.82 + norm * 0.42;
    mesh.scale.set(scale, scale, scale);

    sceneManager.scene.add(mesh);
    sceneManager.meshes.set(meshId, mesh);
  }
}