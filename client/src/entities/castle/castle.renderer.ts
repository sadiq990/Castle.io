import * as THREE from 'three';
import type { SceneManager } from '../../core/SceneManager.js';
import type { CastleState } from 'shared/types/entities.js';

function createCastleMesh(): THREE.Group {
  const group = new THREE.Group();
  const mat = new THREE.MeshStandardMaterial({ color: 0x757575, roughness: 0.8, flatShading: true });

  // Main Keep
  const keepGeo = new THREE.BoxGeometry(60, 60, 60);
  const keep = new THREE.Mesh(keepGeo, mat);
  keep.position.y = 30;
  keep.castShadow = true;
  keep.receiveShadow = true;
  group.add(keep);

  // Four Towers
  const towerGeo = new THREE.CylinderGeometry(12, 14, 80, 8);
  const roofGeo = new THREE.ConeGeometry(16, 25, 8);
  const roofMat = new THREE.MeshStandardMaterial({ color: 0xb71c1c, roughness: 0.7 });

  const positions = [
    [-30, -30], [30, -30], [-30, 30], [30, 30]
  ];

  for (const pos of positions) {
    const tower = new THREE.Mesh(towerGeo, mat);
    tower.position.set(pos[0], 40, pos[1]);
    tower.castShadow = true;
    tower.receiveShadow = true;
    group.add(tower);

    const roof = new THREE.Mesh(roofGeo, roofMat);
    roof.position.set(pos[0], 80 + 12.5, pos[1]);
    roof.castShadow = true;
    group.add(roof);
  }

  // Gate
  const gateGeo = new THREE.BoxGeometry(20, 30, 10);
  const gateMat = new THREE.MeshStandardMaterial({ color: 0x3e2723, roughness: 0.9 });
  const gate = new THREE.Mesh(gateGeo, gateMat);
  gate.position.set(0, 15, 30);
  group.add(gate);

  return group;
}

export function updateCastle3D(sceneManager: SceneManager, castle: CastleState): void {
  const meshId = 'castle-' + castle.id;
  let mesh = sceneManager.meshes.get(meshId);
  if (!mesh) {
    mesh = createCastleMesh();
    mesh.position.set(castle.position.x, 0, castle.position.y);
    sceneManager.scene.add(mesh);
    sceneManager.meshes.set(meshId, mesh);
  }
}