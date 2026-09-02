import * as THREE from 'three';
import type { SceneManager } from '../../core/SceneManager.js';
import type { PlayerState } from 'shared/types/entities.js';

export function updatePlayer3D(sceneManager: SceneManager, player: PlayerState): void {
  const meshId = 'player-' + player.id;
  let mesh = sceneManager.meshes.get(meshId);

  if (!mesh) {
    const geo = new THREE.CapsuleGeometry(12, 16, 4, 8);
    const mat = new THREE.MeshStandardMaterial({ 
      color: new THREE.Color(player.color), 
      roughness: 0.5 
    });
    mesh = new THREE.Mesh(geo, mat);
    mesh.position.set(player.position.x, 16, player.position.y);
    mesh.castShadow = true;
    mesh.receiveShadow = true;
    
    // Create an indicator for facing direction
    const faceGeo = new THREE.BoxGeometry(10, 4, 10);
    const faceMat = new THREE.MeshStandardMaterial({ color: 0x222222 });
    const face = new THREE.Mesh(faceGeo, faceMat);
    face.position.set(0, 10, 8); // face forward in Z
    mesh.add(face);

    sceneManager.scene.add(mesh);
    sceneManager.meshes.set(meshId, mesh);
  } else {
    // Update position smoothly
    mesh.position.x = player.position.x;
    mesh.position.z = player.position.y;
    // Update rotation
    mesh.rotation.y = -player.facing + Math.PI / 2; // Adjust for 3D rotation vs 2D radians
  }
}