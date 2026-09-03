import * as THREE from 'three';
import type { SceneManager } from '../core/SceneManager.js';

interface CloudInstance {
  mesh: THREE.Group;
  speed: number;
}

const clouds: CloudInstance[] = [];
let cloudsInitialized = false;

function createSingleCloud(): THREE.Group {
  const group = new THREE.Group();
  const mat = new THREE.MeshStandardMaterial({
    color: 0xf8fafc,
    roughness: 0.95,
    metalness: 0.0,
    flatShading: true,
  });

  // Cluster of 4-6 low-poly spheres to form a puffy cloud
  const puffCount = 5 + Math.floor(Math.random() * 3);
  for (let i = 0; i < puffCount; i++) {
    const r = 24 + Math.random() * 22;
    const geo = new THREE.DodecahedronGeometry(r, 1);
    // Flatten vertically for natural cloud shape
    geo.scale(1.2, 0.55, 1.0);

    const mesh = new THREE.Mesh(geo, mat);
    mesh.position.set(
      (i - puffCount / 2) * 26 + (Math.random() - 0.5) * 15,
      (Math.random() - 0.5) * 8,
      (Math.random() - 0.5) * 25
    );
    mesh.castShadow = true;
    group.add(mesh);
  }

  return group;
}

export function initClouds(sceneManager: SceneManager, mapSize: number): void {
  if (cloudsInitialized) return;
  cloudsInitialized = true;

  const CLOUD_COUNT = 18;

  for (let i = 0; i < CLOUD_COUNT; i++) {
    const cloudMesh = createSingleCloud();

    const x = Math.random() * mapSize;
    const y = 290 + Math.random() * 90; // Floating high above terrain
    const z = Math.random() * mapSize;
    cloudMesh.position.set(x, y, z);

    // Varied scale (0.8x to 1.6x)
    const scale = 0.8 + Math.random() * 0.8;
    cloudMesh.scale.set(scale, scale, scale);

    sceneManager.scene.add(cloudMesh);

    clouds.push({
      mesh: cloudMesh,
      speed: 12 + Math.random() * 16, // gentle drift speed
    });
  }
}

export function updateClouds(mapSize: number, dt: number): void {
  for (const c of clouds) {
    c.mesh.position.x += c.speed * dt;

    // Loop seamlessly across the map boundaries
    if (c.mesh.position.x > mapSize + 350) {
      c.mesh.position.x = -350;
      c.mesh.position.z = Math.random() * mapSize;
    }
  }
}