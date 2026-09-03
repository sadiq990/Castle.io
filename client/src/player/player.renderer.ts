import * as THREE from 'three';
import type { SceneManager } from '../core/SceneManager.js';
import type { PlayerState } from 'shared/types/entities.js';
import { getTerrainHeight } from '../terrain/TerrainGenerator.js';

export function updatePlayer3D(
  sceneManager: SceneManager,
  player: PlayerState,
  time: number
): void {
  const meshId = 'player-' + player.id;
  let mesh = sceneManager.meshes.get(meshId);

  const teamColor = player.team === 'red' ? 0xD9302F : 0x2E6FE0;
  const targetTerrainY = getTerrainHeight(player.position.x, player.position.y);
  const targetPlayerY = targetTerrainY + 16.0;

  if (!mesh) {
    const geo = new THREE.CapsuleGeometry(12, 16, 4, 8);
    const mat = new THREE.MeshStandardMaterial({
      color: new THREE.Color(teamColor),
      roughness: 0.5,
    });
    mesh = new THREE.Mesh(geo, mat);
    mesh.position.set(player.position.x, targetPlayerY, player.position.y);
    mesh.castShadow = true;
    mesh.receiveShadow = true;

    // Face direction indicator (visor box)
    const faceGeo = new THREE.BoxGeometry(10, 4, 10);
    const faceMat = new THREE.MeshStandardMaterial({ color: 0x1e293b, roughness: 0.3 });
    const face = new THREE.Mesh(faceGeo, faceMat);
    face.position.set(0, 10, 8);
    mesh.add(face);

    // Pulsating Carrier Rim Glow Ring
    const glowGeo = new THREE.RingGeometry(14, 20, 24);
    glowGeo.rotateX(-Math.PI / 2);
    const glowMat = new THREE.MeshBasicMaterial({
      color: player.team === 'blue' ? 0xF87171 : 0x60A5FA,
      transparent: true,
      opacity: 0.0,
      side: THREE.DoubleSide,
    });
    const carrierGlow = new THREE.Mesh(glowGeo, glowMat);
    carrierGlow.name = 'carrierGlow';
    carrierGlow.position.y = -14;
    mesh.add(carrierGlow);

    sceneManager.scene.add(mesh);
    sceneManager.meshes.set(meshId, mesh);
  } else {
    // Smooth height adjustment to match undulating terrain!
    mesh.position.x = player.position.x;
    mesh.position.z = player.position.y;
    mesh.position.y = THREE.MathUtils.lerp(mesh.position.y, targetPlayerY, 0.32);

    // Update rotation
    mesh.rotation.y = -player.facing + Math.PI / 2;

    // Update carrier visual feedback
    const carrierGlow = mesh.getObjectByName('carrierGlow') as THREE.Mesh | undefined;
    if (carrierGlow) {
      const glowMat = carrierGlow.material as THREE.MeshBasicMaterial;
      if (player.hasFlag) {
        glowMat.color.set(player.team === 'blue' ? 0xEF4444 : 0x3B82F6);
        const pulse = 0.5 + Math.sin(time * 6.0) * 0.35;
        glowMat.opacity = pulse;
        const scale = 1.0 + Math.sin(time * 6.0) * 0.15;
        carrierGlow.scale.set(scale, 1, scale);
      } else {
        glowMat.opacity = 0.0;
      }
    }
  }
}