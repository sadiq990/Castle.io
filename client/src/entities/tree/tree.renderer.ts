import * as THREE from 'three';
import type { SceneManager } from '../core/SceneManager.js';
import type { TreeState } from 'shared/types/entities.js';

function createTreeMesh(): THREE.Group {
  const group = new THREE.Group();
  
  // Trunk
  const trunkGeo = new THREE.CylinderGeometry(4, 6, 20, 5);
  const trunkMat = new THREE.MeshStandardMaterial({ color: 0x5d4037, roughness: 0.9 });
  const trunk = new THREE.Mesh(trunkGeo, trunkMat);
  trunk.position.y = 10;
  trunk.castShadow = true;
  trunk.receiveShadow = true;
  group.add(trunk);

  // Leaves (pine style)
  const leavesMat = new THREE.MeshStandardMaterial({ color: 0x2e7d32, roughness: 0.8 });
  
  const layer1 = new THREE.Mesh(new THREE.ConeGeometry(25, 40, 5), leavesMat);
  layer1.position.y = 30;
  layer1.castShadow = true;
  layer1.receiveShadow = true;
  group.add(layer1);

  const layer2 = new THREE.Mesh(new THREE.ConeGeometry(20, 35, 5), leavesMat);
  layer2.position.y = 45;
  layer2.castShadow = true;
  layer2.receiveShadow = true;
  group.add(layer2);

  const layer3 = new THREE.Mesh(new THREE.ConeGeometry(15, 30, 5), leavesMat);
  layer3.position.y = 60;
  layer3.castShadow = true;
  layer3.receiveShadow = true;
  group.add(layer3);

  return group;
}

export function updateTree3D(sceneManager: SceneManager, tree: TreeState): void {
  const meshId = 'tree-' + tree.id;
  let mesh = sceneManager.meshes.get(meshId);
  if (!mesh) {
    mesh = createTreeMesh();
    // 2D logic: y is Z in 3D
    mesh.position.set(tree.position.x, 0, tree.position.y);
    // Randomize rotation a bit
    mesh.rotation.y = Math.random() * Math.PI * 2;
    // Randomize scale a bit
    const scale = 0.8 + Math.random() * 0.4;
    mesh.scale.set(scale, scale, scale);
    
    sceneManager.scene.add(mesh);
    sceneManager.meshes.set(meshId, mesh);
  }
}