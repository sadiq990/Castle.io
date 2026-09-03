import * as THREE from 'three';
import type { SceneManager } from '../../core/SceneManager.js';

// Creates a smooth rolling green hill ("təpə", swollen terrain mound)
function createHillMesh(): THREE.Group {
  const hillGroup = new THREE.Group();

  // Grassy hill material with soft shading and natural lush green tone
  const hillMat = new THREE.MeshStandardMaterial({
    color: 0x5a9a47,
    roughness: 0.88,
    metalness: 0.02,
    flatShading: false, // Smooth curved shading
  });

  // Base transition ring (darker contour so the hill blends naturally into the grass)
  const baseRimMat = new THREE.MeshStandardMaterial({
    color: 0x487f37,
    roughness: 0.95,
    flatShading: false,
  });

  // 1. Gentle Base Contour Swell (wide and flat)
  const baseGeo = new THREE.CylinderGeometry(150, 165, 6, 32);
  baseGeo.translate(0, 3, 0);
  const baseMesh = new THREE.Mesh(baseGeo, baseRimMat);
  baseMesh.receiveShadow = true;
  hillGroup.add(baseMesh);

  // 2. Main Rolling Dome (smooth elevated mound)
  const domeRadius = 135;
  const domeHeight = 36;
  const domeGeo = new THREE.SphereGeometry(domeRadius, 32, 16, 0, Math.PI * 2, 0, Math.PI * 0.5);
  domeGeo.scale(1, domeHeight / domeRadius, 1);
  const domeMesh = new THREE.Mesh(domeGeo, hillMat);
  domeMesh.position.y = 4;
  domeMesh.castShadow = true;
  domeMesh.receiveShadow = true;
  hillGroup.add(domeMesh);

  // 3. Natural Organic Ridge / Sub-hill (offset shoulder)
  const shoulderRadius = 85;
  const shoulderHeight = 26;
  const shoulderGeo = new THREE.SphereGeometry(shoulderRadius, 24, 12, 0, Math.PI * 2, 0, Math.PI * 0.5);
  shoulderGeo.scale(1, shoulderHeight / shoulderRadius, 1);
  const shoulderMesh = new THREE.Mesh(shoulderGeo, hillMat);
  shoulderMesh.position.set(45, 4, 30);
  shoulderMesh.castShadow = true;
  shoulderMesh.receiveShadow = true;
  hillGroup.add(shoulderMesh);

  // 4. Subtle decorative hilltop bush for 2D/3D hybrid charm
  const bushGeo = new THREE.DodecahedronGeometry(7, 1);
  const bushMat = new THREE.MeshStandardMaterial({
    color: 0x33691e,
    roughness: 0.85,
    flatShading: true,
  });
  const bush = new THREE.Mesh(bushGeo, bushMat);
  bush.position.set(-15, domeHeight + 2, -10);
  bush.castShadow = true;
  hillGroup.add(bush);

  return hillGroup;
}

export function updateMountain3D(
  sceneManager: SceneManager,
  mountain: { id: string; position: { x: number; y: number } }
): void {
  const meshId = 'mountain-' + mountain.id;
  let mesh = sceneManager.meshes.get(meshId);

  if (!mesh) {
    mesh = createHillMesh();
    mesh.position.set(mountain.position.x, 0, mountain.position.y);

    // Randomize rotation for variety
    mesh.rotation.y = Math.random() * Math.PI * 2;

    // Slight scale variation (0.85 to 1.35) so some hills are gentle rises and others wide plateaus
    const scale = 0.85 + Math.random() * 0.5;
    mesh.scale.set(scale, scale * 0.9, scale);

    sceneManager.scene.add(mesh);
    sceneManager.meshes.set(meshId, mesh);
  }
}