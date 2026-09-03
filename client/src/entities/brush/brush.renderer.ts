import * as THREE from 'three';
import type { SceneManager } from '../../core/SceneManager.js';

function createBrushMesh(): THREE.Group {
  const group = new THREE.Group();
  const geo = new THREE.DodecahedronGeometry(8, 0);
  const mat = new THREE.MeshStandardMaterial({ 
    color: 0x33691e, 
    roughness: 0.9,
    flatShading: true
  });
  
  const m1 = new THREE.Mesh(geo, mat);
  m1.position.set(-4, 6, -2);
  m1.castShadow = true;
  group.add(m1);
  
  const m2 = new THREE.Mesh(geo, mat);
  m2.position.set(4, 5, 2);
  m2.castShadow = true;
  group.add(m2);

  const m3 = new THREE.Mesh(geo, mat);
  m3.position.set(0, 8, 4);
  m3.castShadow = true;
  group.add(m3);

  return group;
}

export function updateBrush3D(sceneManager: SceneManager, brush: { id: string, position: { x: number, y: number } }): void {
  const meshId = 'brush-' + brush.id;
  let mesh = sceneManager.meshes.get(meshId);
  if (!mesh) {
    mesh = createBrushMesh();
    mesh.position.set(brush.position.x, 0, brush.position.y);
    mesh.rotation.y = Math.random() * Math.PI * 2;
    const scale = 0.8 + Math.random() * 0.4;
    mesh.scale.set(scale, scale, scale);
    
    sceneManager.scene.add(mesh);
    sceneManager.meshes.set(meshId, mesh);
  }
}