import * as THREE from 'three';
import type { SceneManager } from '../../core/SceneManager.js';
import type { TreeState } from 'shared/types/entities.js';
import { getTerrainHeight } from '../../terrain/TerrainGenerator.js';

// ── 4 DISTINCT LUSH ROUND TREE SPECIES (No sharp pointy cones!) ────────────
function createTreeMesh(treeId: string, seed: number): THREE.Group {
  const group = new THREE.Group();
  const speciesType = Math.abs(Math.floor(seed * 100)) % 4;

  const darkWoodMat = new THREE.MeshStandardMaterial({ color: 0x3d271d, roughness: 0.92 });
  const birchWoodMat = new THREE.MeshStandardMaterial({ color: 0xe2e8f0, roughness: 0.78 }); // Pale birch

  if (speciesType === 0) {
    // ── 1. ANCIENT GRAND OAK (Qədim Nəhəng Zümrüd Palıd) ─────────────────
    // Tall sturdy flaring trunk
    const trunk = new THREE.Mesh(
      new THREE.CylinderGeometry(5.0, 8.5, 46, 7),
      darkWoodMat
    );
    trunk.position.y = 23;
    trunk.castShadow = true;
    group.add(trunk);

    // Root flares spreading into ground
    for (let r = 0; r < 4; r++) {
      const angle = (r / 4) * Math.PI * 2;
      const root = new THREE.Mesh(new THREE.BoxGeometry(4, 8, 8), darkWoodMat);
      root.position.set(Math.cos(angle) * 7.5, 3.5, Math.sin(angle) * 7.5);
      root.rotation.y = -angle;
      root.rotation.x = 0.35;
      group.add(root);
    }

    // 5 Fluffy organic round foliage clusters (rich forest emeralds)
    const mat1 = new THREE.MeshStandardMaterial({ color: 0x1b5e20, roughness: 0.85, flatShading: true });
    const mat2 = new THREE.MeshStandardMaterial({ color: 0x2e7d32, roughness: 0.82, flatShading: true });
    const mat3 = new THREE.MeshStandardMaterial({ color: 0x388e3c, roughness: 0.80, flatShading: true });

    const clusters = [
      { r: 24, x:  0,  y: 60, z:  0, mat: mat2 }, // Central huge canopy
      { r: 18, x:-14,  y: 52, z: 10, mat: mat1 }, // Lower left lobe
      { r: 19, x: 13,  y: 54, z: -8, mat: mat2 }, // Lower right lobe
      { r: 16, x: -6,  y: 72, z: -7, mat: mat3 }, // Upper sunlit crest
      { r: 15, x:  8,  y: 68, z:  9, mat: mat3 }, // Upper crown
    ];
    for (const c of clusters) {
      const puff = new THREE.Mesh(new THREE.DodecahedronGeometry(c.r, 1), c.mat);
      puff.position.set(c.x, c.y, c.z);
      puff.scale.set(1.05, 0.92, 1.05);
      puff.castShadow = true;
      puff.receiveShadow = true;
      group.add(puff);
    }

  } else if (speciesType === 1) {
    // ── 2. MAJESTIC BROADLEAF (Genişyarpaqlı Zümrüd Park Ağacı) ───────────
    const trunk = new THREE.Mesh(
      new THREE.CylinderGeometry(4.2, 7.0, 42, 6),
      darkWoodMat
    );
    trunk.position.y = 21;
    trunk.castShadow = true;
    group.add(trunk);

    const leafMat1 = new THREE.MeshStandardMaterial({ color: 0x15803d, roughness: 0.82, flatShading: true });
    const leafMat2 = new THREE.MeshStandardMaterial({ color: 0x22c55e, roughness: 0.80, flatShading: true });
    const leafMat3 = new THREE.MeshStandardMaterial({ color: 0x166534, roughness: 0.86, flatShading: true });

    const clusters = [
      { r: 21, x:  0, y: 54, z:  0, mat: leafMat1 },
      { r: 16, x:-12, y: 46, z:  8, mat: leafMat3 },
      { r: 17, x: 11, y: 48, z: -7, mat: leafMat2 },
      { r: 14, x:  3, y: 66, z:  3, mat: leafMat2 },
    ];
    for (const c of clusters) {
      const sphere = new THREE.Mesh(new THREE.DodecahedronGeometry(c.r, 1), c.mat);
      sphere.position.set(c.x, c.y, c.z);
      sphere.scale.set(1.1, 0.90, 1.1);
      sphere.castShadow = true;
      sphere.receiveShadow = true;
      group.add(sphere);
    }

  } else if (speciesType === 2) {
    // ── 3. GOLDEN AUTUMN MAPLE (Qızılı Payız Ağcaqayını) ──────────────────
    const trunk = new THREE.Mesh(
      new THREE.CylinderGeometry(3.5, 5.5, 44, 6),
      birchWoodMat
    );
    trunk.position.y = 22;
    trunk.castShadow = true;
    group.add(trunk);

    const autumnAmber = new THREE.MeshStandardMaterial({ color: 0xd97706, roughness: 0.82, flatShading: true });
    const autumnGold  = new THREE.MeshStandardMaterial({ color: 0xf59e0b, roughness: 0.80, flatShading: true });
    const autumnRed   = new THREE.MeshStandardMaterial({ color: 0xef4444, roughness: 0.82, flatShading: true });

    const foliage1 = new THREE.Mesh(new THREE.DodecahedronGeometry(20, 1), autumnGold);
    foliage1.position.set(0, 56, 0);
    foliage1.scale.set(1.0, 1.15, 1.0);
    foliage1.castShadow = true;
    group.add(foliage1);

    const foliage2 = new THREE.Mesh(new THREE.DodecahedronGeometry(15, 1), autumnAmber);
    foliage2.position.set(-9, 48, 6);
    foliage2.castShadow = true;
    group.add(foliage2);

    const foliage3 = new THREE.Mesh(new THREE.DodecahedronGeometry(14, 1), autumnRed);
    foliage3.position.set(8, 52, -6);
    foliage3.castShadow = true;
    group.add(foliage3);

  } else {
    // ── 4. LUSH LAKE WILLOW (Zümrüd Göl Söyüdü — 100% Round & Drooping) ──
    const trunk = new THREE.Mesh(
      new THREE.CylinderGeometry(4.5, 7.2, 36, 6),
      darkWoodMat
    );
    trunk.position.y = 18;
    trunk.castShadow = true;
    group.add(trunk);

    const willowEmerald = new THREE.MeshStandardMaterial({ color: 0x10b981, roughness: 0.78, flatShading: true });
    const willowMint    = new THREE.MeshStandardMaterial({ color: 0x34d399, roughness: 0.75, flatShading: true });
    const willowDark    = new THREE.MeshStandardMaterial({ color: 0x059669, roughness: 0.82, flatShading: true });

    // Multi-tier cascading rounded dome tiers
    const dome1 = new THREE.Mesh(new THREE.SphereGeometry(26, 8, 6), willowDark);
    dome1.position.y = 44;
    dome1.scale.set(1.35, 0.65, 1.35);
    dome1.castShadow = true;
    dome1.receiveShadow = true;
    group.add(dome1);

    const dome2 = new THREE.Mesh(new THREE.SphereGeometry(20, 8, 6), willowEmerald);
    dome2.position.y = 56;
    dome2.scale.set(1.2, 0.75, 1.2);
    dome2.castShadow = true;
    group.add(dome2);

    const dome3 = new THREE.Mesh(new THREE.SphereGeometry(14, 7, 5), willowMint);
    dome3.position.y = 66;
    dome3.scale.set(1.0, 0.85, 1.0);
    dome3.castShadow = true;
    group.add(dome3);
  }

  return group;
}

export function updateTree3D(sceneManager: SceneManager, tree: TreeState, time?: number): void {
  const meshId = 'tree-' + tree.id;
  let mesh = sceneManager.meshes.get(meshId);

  if (!mesh) {
    const seed = Math.sin(tree.position.x * 12.9898 + tree.position.y * 78.233) * 43758.5453;
    const norm = seed - Math.floor(seed);

    mesh = createTreeMesh(tree.id, norm);
    const y = getTerrainHeight(tree.position.x, tree.position.y);
    mesh.position.set(tree.position.x, y, tree.position.y);

    mesh.rotation.y = norm * Math.PI * 2;
    // Varied natural heights: 0.95 to 1.55 (massive tall majestic presence!)
    const scale = 1.0 + norm * 0.55;
    mesh.scale.set(scale, scale, scale);

    sceneManager.scene.add(mesh);
    sceneManager.meshes.set(meshId, mesh);
  }

  // Gentle wind sway animation
  if (time !== undefined && mesh) {
    const windPhase = time * 1.8 + tree.position.x * 0.015 + tree.position.y * 0.012;
    mesh.rotation.z = Math.sin(windPhase) * 0.032;
    mesh.rotation.x = Math.cos(windPhase * 0.8) * 0.022;
  }
}