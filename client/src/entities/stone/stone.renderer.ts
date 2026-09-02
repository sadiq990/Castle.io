import * as THREE from 'three';
import type { SceneManager } from '../../core/SceneManager.js';
import type { StoneState } from 'shared/types/entities.js';

function createStoneMesh(): THREE.Mesh {
  const geo = new THREE.DodecahedronGeometry(15, 0);
  // Flatten it a bit
  geo.scale(1, 0.6, 1);
  const mat = new THREE.MeshStandardMaterial({ color: 0x9e9e9e, roughness: 0.9, flatShading: true });
  const mesh = new THREE.Mesh(geo, mat);
  mesh.castShadow = true;
  mesh.receiveShadow = true;
  return mesh;
}

export function updateStone3D(sceneManager: SceneManager, stone: StoneState): void {
  const meshId = 'stone-' + stone.id;
  let mesh = sceneManager.meshes.get(meshId);
  if (!mesh) {
    mesh = createStoneMesh();
    mesh.position.set(stone.position.x, 5, stone.position.y);
    mesh.rotation.y = Math.random() * Math.PI * 2;
    mesh.rotation.x = (Math.random() - 0.5) * 0.2;
    mesh.rotation.z = (Math.random() - 0.5) * 0.2;
    
    const scale = 0.8 + Math.random() * 0.6;
    mesh.scale.set(scale, scale, scale);
    
    sceneManager.scene.add(mesh);
    sceneManager.meshes.set(meshId, mesh);
  }
}