import * as THREE from 'three';
import type { SceneManager } from '../../core/SceneManager.js';
import type { CastleState, Team } from 'shared/types/entities.js';
import { getTerrainHeight } from '../../terrain/TerrainGenerator.js';

function createCastleMesh(team: Team): THREE.Group {
  const group = new THREE.Group();

  const isBlue = team === 'blue';
  const wallColor = isBlue ? 0x2E6FE0 : 0xD9302F;
  const roofColor = isBlue ? 0x1E40AF : 0x991B1B;
  const glowColor = isBlue ? 0x60A5FA : 0xF87171;

  const mat = new THREE.MeshStandardMaterial({
    color: wallColor,
    roughness: 0.75,
    metalness: 0.1,
    flatShading: true,
  });

  // 1. Territory Aura Ring on Ground (radius 180, 20% opacity)
  const auraGeo = new THREE.RingGeometry(160, 200, 48);
  auraGeo.rotateX(-Math.PI / 2);
  const auraMat = new THREE.MeshBasicMaterial({
    color: glowColor,
    transparent: true,
    opacity: 0.22,
    side: THREE.DoubleSide,
  });
  const aura = new THREE.Mesh(auraGeo, auraMat);
  aura.name = 'territoryAura';
  aura.position.y = 0.6;
  group.add(aura);

  // 2. Main Keep (central fortress)
  const keepGeo = new THREE.BoxGeometry(110, 110, 110);
  const keep = new THREE.Mesh(keepGeo, mat);
  keep.position.y = 55;
  keep.castShadow = true;
  keep.receiveShadow = true;
  group.add(keep);

  // 3. Four Towers with glowing tops
  const towerGeo = new THREE.CylinderGeometry(20, 24, 150, 8);
  const roofGeo = new THREE.ConeGeometry(28, 45, 8);
  const roofMat = new THREE.MeshStandardMaterial({ color: roofColor, roughness: 0.65 });

  const positions = [
    [-55, -55], [55, -55], [-55, 55], [55, 55]
  ];

  for (const pos of positions) {
    const tower = new THREE.Mesh(towerGeo, mat);
    tower.position.set(pos[0], 75, pos[1]);
    tower.castShadow = true;
    tower.receiveShadow = true;
    group.add(tower);

    const roof = new THREE.Mesh(roofGeo, roofMat);
    roof.position.set(pos[0], 150 + 22, pos[1]);
    roof.castShadow = true;
    group.add(roof);

    // Glowing crystal / light at tower peak
    const glowGeo = new THREE.SphereGeometry(3.5, 6, 6);
    const glowMat = new THREE.MeshBasicMaterial({ color: glowColor });
    const glowLight = new THREE.Mesh(glowGeo, glowMat);
    glowLight.position.set(pos[0], 150 + 46, pos[1]);
    group.add(glowLight);
  }

  // 4. Heavy Castle Gate
  const gateGeo = new THREE.BoxGeometry(36, 50, 16);
  const gateMat = new THREE.MeshStandardMaterial({ color: 0x271c19, roughness: 0.95 });
  const gate = new THREE.Mesh(gateGeo, gateMat);
  gate.position.set(0, 25, 55);
  group.add(gate);

  return group;
}

export function updateCastle3D(
  sceneManager: SceneManager,
  castle: CastleState,
  time: number
): void {
  const meshId = 'castle-' + castle.id;
  let mesh = sceneManager.meshes.get(meshId);

  if (!mesh) {
    const team: Team = castle.team || (castle.id === 'castle-1' ? 'blue' : 'red');
    mesh = createCastleMesh(team);
    const y = getTerrainHeight(castle.position.x, castle.position.y);
    mesh.position.set(castle.position.x, y, castle.position.y);
    sceneManager.scene.add(mesh);
    sceneManager.meshes.set(meshId, mesh);
  }

  // Subtle breathing pulse on the aura ring
  const aura = mesh.getObjectByName('territoryAura') as THREE.Mesh | undefined;
  if (aura) {
    (aura.material as THREE.MeshBasicMaterial).opacity = 0.18 + Math.sin(time * 2.0) * 0.06;
  }
}