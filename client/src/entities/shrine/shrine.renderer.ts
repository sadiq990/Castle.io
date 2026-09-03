import * as THREE from 'three';
import type { SceneManager } from '../../core/SceneManager.js';
import { getTerrainHeight } from '../../terrain/TerrainGenerator.js';

const SHRINE_CENTER = { x: 1500, z: 1500 };

function createAncientShrineMesh(): THREE.Group {
  const shrineGroup = new THREE.Group();
  shrineGroup.name = 'ancientShrine';

  const stoneMat = new THREE.MeshStandardMaterial({
    color: 0x768087, // Weathered ancient megalith granite
    roughness: 0.92,
    metalness: 0.05,
    flatShading: true,
  });

  const mossMat = new THREE.MeshStandardMaterial({
    color: 0x5a7052, // Mossy stone lintel
    roughness: 0.88,
    flatShading: true,
  });

  // 1. Central Raised Altar Dais
  const altarGeo = new THREE.CylinderGeometry(28, 34, 6, 16);
  const altar = new THREE.Mesh(altarGeo, stoneMat);
  altar.position.y = 3;
  altar.receiveShadow = true;
  altar.castShadow = true;
  shrineGroup.add(altar);

  // 2. Stonehenge Megaliths (8 standing stones in a circle + 4 lintels)
  const stoneCount = 8;
  const ringRadius = 72;

  for (let i = 0; i < stoneCount; i++) {
    const angle = (i / stoneCount) * Math.PI * 2;
    const sx = Math.cos(angle) * ringRadius;
    const sz = Math.sin(angle) * ringRadius;

    // Standing pillar
    const pillarHeight = 36 + (i % 2) * 6;
    const pillarGeo = new THREE.BoxGeometry(10, pillarHeight, 8);
    // Slight random rotation for ancient weathered look
    pillarGeo.rotateY((i * 17) % Math.PI);

    const pillar = new THREE.Mesh(pillarGeo, stoneMat);
    pillar.position.set(sx, pillarHeight / 2, sz);
    pillar.castShadow = true;
    pillar.receiveShadow = true;
    shrineGroup.add(pillar);

    // Add horizontal lintel across every 2 pillars
    if (i % 2 === 0) {
      const nextAngle = ((i + 1) / stoneCount) * Math.PI * 2;
      const nx = Math.cos(nextAngle) * ringRadius;
      const nz = Math.sin(nextAngle) * ringRadius;

      const midX = (sx + nx) / 2;
      const midZ = (sz + nz) / 2;
      const lintelLen = Math.hypot(nx - sx, nz - sz) + 6;

      const lintelGeo = new THREE.BoxGeometry(lintelLen, 6, 9);
      const lintel = new THREE.Mesh(lintelGeo, mossMat);
      lintel.position.set(midX, pillarHeight + 3, midZ);
      lintel.rotation.y = -Math.atan2(nz - sz, nx - sx);
      lintel.castShadow = true;
      shrineGroup.add(lintel);
    }
  }

  // 3. Floating Mystic Ancient Crystal
  const crystalGeo = new THREE.OctahedronGeometry(8.5, 0);
  const crystalMat = new THREE.MeshStandardMaterial({
    color: 0x2dd4bf, // Luminous turquoise
    emissive: 0x0f766e,
    emissiveIntensity: 0.9,
    roughness: 0.2,
    metalness: 0.3,
    flatShading: true,
  });

  const crystal = new THREE.Mesh(crystalGeo, crystalMat);
  crystal.name = 'shrineCrystal';
  crystal.position.set(0, 22, 0);
  crystal.castShadow = true;
  shrineGroup.add(crystal);

  // Soft mystical PointLight
  const glowLight = new THREE.PointLight(0x2dd4bf, 1.8, 140);
  glowLight.name = 'shrineLight';
  glowLight.position.set(0, 22, 0);
  shrineGroup.add(glowLight);

  return shrineGroup;
}

export function updateShrine3D(sceneManager: SceneManager, time: number): void {
  let mesh = sceneManager.meshes.get('ancient-shrine') as THREE.Group | undefined;

  if (!mesh) {
    mesh = createAncientShrineMesh();
    const terrainY = getTerrainHeight(SHRINE_CENTER.x, SHRINE_CENTER.z);
    mesh.position.set(SHRINE_CENTER.x, terrainY, SHRINE_CENTER.z);

    sceneManager.scene.add(mesh);
    sceneManager.meshes.set('ancient-shrine', mesh);
  }

  // Animate floating crystal rotation & breathing pulse
  const crystal = mesh.getObjectByName('shrineCrystal') as THREE.Mesh | undefined;
  if (crystal) {
    crystal.rotation.y = time * 0.8;
    crystal.rotation.x = Math.sin(time * 0.6) * 0.2;
    crystal.position.y = 22 + Math.sin(time * 1.8) * 3.0; // gentle float bobbing
  }

  const light = mesh.getObjectByName('shrineLight') as THREE.PointLight | undefined;
  if (light) {
    light.intensity = 1.4 + Math.sin(time * 3.0) * 0.5;
  }
}