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

// 4 DISTINCT LOW-POLY TREE SPECIES
function createTreeMesh(treeId: string, seed: number): THREE.Group {
  const group = new THREE.Group();
  const speciesType = Math.abs(Math.floor(seed * 100)) % 4;

  if (speciesType === 0) {
    // ── 1. NORDIC PINE (Klassik Şam Ağacı) ─────────────────────
    const trunk = new THREE.Mesh(
      new THREE.CylinderGeometry(3.5, 5.5, 24, 6),
      new THREE.MeshStandardMaterial({ color: 0x452b1f, roughness: 0.9 })
    );
    trunk.position.y = 12;
    trunk.castShadow = true;
    group.add(trunk);

    const pineMat = new THREE.MeshStandardMaterial({ color: 0x14532d, roughness: 0.8, flatShading: true });
    const layers = [
      { r: 24, h: 36, y: 30 },
      { r: 19, h: 30, y: 44 },
      { r: 13, h: 24, y: 56 },
    ];
    for (const l of layers) {
      const cone = new THREE.Mesh(new THREE.ConeGeometry(l.r, l.h, 6), pineMat);
      cone.position.y = l.y;
      cone.castShadow = true;
      cone.receiveShadow = true;
      group.add(cone);
    }
  } else if (speciesType === 1) {
    // ── 2. BROADLEAF OAK (Genişyarpaqlı Zümrüd Palıd) ─────────
    const trunk = new THREE.Mesh(
      new THREE.CylinderGeometry(5.5, 8.0, 26, 7),
      new THREE.MeshStandardMaterial({ color: 0x5c3d2e, roughness: 0.9 })
    );
    trunk.position.y = 13;
    trunk.castShadow = true;
    group.add(trunk);

    const oakMat1 = new THREE.MeshStandardMaterial({ color: 0x15803d, roughness: 0.8, flatShading: true });
    const oakMat2 = new THREE.MeshStandardMaterial({ color: 0x16a34a, roughness: 0.8, flatShading: true });

    // 4 Fluffy foliage clusters
    const clusters = [
      { r: 18, x: 0, y: 36, z: 0, mat: oakMat1 },
      { r: 14, x: -10, y: 32, z: 8, mat: oakMat2 },
      { r: 15, x: 9, y: 34, z: -6, mat: oakMat1 },
      { r: 12, x: 0, y: 48, z: 0, mat: oakMat2 },
    ];
    for (const c of clusters) {
      const sphere = new THREE.Mesh(new THREE.DodecahedronGeometry(c.r, 1), c.mat);
      sphere.position.set(c.x, c.y, c.z);
      sphere.scale.set(1.1, 0.9, 1.1);
      sphere.castShadow = true;
      sphere.receiveShadow = true;
      group.add(sphere);
    }
  } else if (speciesType === 2) {
    // ── 3. GOLDEN BIRCH (Qızılı Payız Ağcaqayını) ─────────────
    const trunk = new THREE.Mesh(
      new THREE.CylinderGeometry(3.0, 4.2, 32, 6),
      new THREE.MeshStandardMaterial({ color: 0xf1f5f9, roughness: 0.7 }) // Pale birch bark
    );
    trunk.position.y = 16;
    trunk.castShadow = true;
    group.add(trunk);

    const autumnMat1 = new THREE.MeshStandardMaterial({ color: 0xd97706, roughness: 0.8, flatShading: true }); // Amber
    const autumnMat2 = new THREE.MeshStandardMaterial({ color: 0xf59e0b, roughness: 0.8, flatShading: true }); // Golden

    const foliage1 = new THREE.Mesh(new THREE.DodecahedronGeometry(18, 1), autumnMat1);
    foliage1.position.set(0, 40, 0);
    foliage1.scale.set(0.9, 1.35, 0.9); // Upright oval canopy
    foliage1.castShadow = true;
    group.add(foliage1);

    const foliage2 = new THREE.Mesh(new THREE.DodecahedronGeometry(13, 1), autumnMat2);
    foliage2.position.set(4, 34, 4);
    foliage2.castShadow = true;
    group.add(foliage2);
  } else {
    // ── 4. WEEPING WILLOW (Göl Söyüdü / Zümrüd Park Ağacı) ────
    const trunk = new THREE.Mesh(
      new THREE.CylinderGeometry(4.5, 6.5, 22, 6),
      new THREE.MeshStandardMaterial({ color: 0x4a3b32, roughness: 0.9 })
    );
    trunk.position.y = 11;
    trunk.castShadow = true;
    group.add(trunk);

    const willowMat = new THREE.MeshStandardMaterial({ color: 0x34d399, roughness: 0.75, flatShading: true }); // Mint emerald
    // Drooping layered dome
    const dome1 = new THREE.Mesh(new THREE.ConeGeometry(24, 28, 7), willowMat);
    dome1.position.y = 28;
    dome1.scale.set(1.2, 0.8, 1.2);
    dome1.castShadow = true;
    group.add(dome1);

    const dome2 = new THREE.Mesh(new THREE.ConeGeometry(17, 22, 7), willowMat);
    dome2.position.y = 40;
    dome2.castShadow = true;
    group.add(dome2);
  }

  return group;
}

export function updateTree3D(sceneManager: SceneManager, tree: TreeState): void {
  const meshId = 'tree-' + tree.id;
  let mesh = sceneManager.meshes.get(meshId);

  if (!mesh) {
    // Deterministic seed based on coordinates
    const seed = Math.sin(tree.position.x * 12.9898 + tree.position.y * 78.233) * 43758.5453;
    const norm = seed - Math.floor(seed);

    mesh = createTreeMesh(tree.id, norm);
    const y = getTerrainHeight(tree.position.x, tree.position.y);
    mesh.position.set(tree.position.x, y, tree.position.y);

    mesh.rotation.y = norm * Math.PI * 2;
    const scale = 0.82 + norm * 0.42;
    mesh.scale.set(scale, scale, scale);

    sceneManager.scene.add(mesh);
    sceneManager.meshes.set(meshId, mesh);
  }
}