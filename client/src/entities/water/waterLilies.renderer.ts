import * as THREE from 'three';
import type { SceneManager } from '../../core/SceneManager.js';
import { MAP_CONFIG } from '../../map/map.config.js';

interface LilyInstance {
  group: THREE.Group;
  phase: number;
}

const lilyInstances: LilyInstance[] = [];
let liliesInitialized = false;

function createLilyPadWithFlower(hasFlower: boolean): THREE.Group {
  const padGroup = new THREE.Group();

  // 1. Lily Pad with natural pie-slice cut
  const padRadius = 7 + Math.random() * 6;
  const padGeo = new THREE.CircleGeometry(padRadius, 18, 0.4, Math.PI * 1.85);
  padGeo.rotateX(-Math.PI / 2); // Lay flat on water surface

  const padMat = new THREE.MeshStandardMaterial({
    color: 0x2e7d32, // Vibrant water lily leaf green
    roughness: 0.5,
    metalness: 0.05,
    side: THREE.DoubleSide,
    flatShading: true,
  });

  const padMesh = new THREE.Mesh(padGeo, padMat);
  padMesh.receiveShadow = true;
  padGroup.add(padMesh);

  // 2. Beautiful Low-Poly Lotus Flower (on select pads)
  if (hasFlower) {
    const flowerGroup = new THREE.Group();
    flowerGroup.position.set(0, 0.4, 0);

    // Yellow pollen core
    const coreGeo = new THREE.SphereGeometry(1.6, 8, 6);
    coreGeo.scale(1, 0.7, 1);
    const coreMat = new THREE.MeshStandardMaterial({ color: 0xfef08a, roughness: 0.4 });
    const core = new THREE.Mesh(coreGeo, coreMat);
    flowerGroup.add(core);

    // 6 Pink-white petals
    const petalMat = new THREE.MeshStandardMaterial({
      color: 0xfbcfe8, // Soft pastel pink
      roughness: 0.4,
      side: THREE.DoubleSide,
      flatShading: true,
    });

    const petalCount = 6;
    for (let p = 0; p < petalCount; p++) {
      const angle = (p / petalCount) * Math.PI * 2;
      const petalGeo = new THREE.ConeGeometry(1.8, 4.5, 4);
      petalGeo.rotateX(Math.PI / 3); // Flared outward
      petalGeo.translate(0, 0.8, 1.8);

      const petal = new THREE.Mesh(petalGeo, petalMat);
      petal.rotation.y = angle;
      flowerGroup.add(petal);
    }

    padGroup.add(flowerGroup);
  }

  return padGroup;
}

export function initWaterLilies(sceneManager: SceneManager): void {
  if (liliesInitialized) return;
  liliesInitialized = true;

  // Scatter lily clusters around the calm bays and edges of both lakes
  const CLUSTERS_PER_LAKE = 4;
  const PADS_PER_CLUSTER = 6;

  for (const lake of MAP_CONFIG.waters) {
    const lakeRadius = lake.radius ?? 250;

    for (let c = 0; c < CLUSTERS_PER_LAKE; c++) {
      // Choose an angle around the lake (mostly in shallow bays)
      const clusterAngle = (c / CLUSTERS_PER_LAKE) * Math.PI * 2 + Math.random() * 0.4;
      const clusterDist = lakeRadius * (0.45 + Math.random() * 0.35); // Shallow waters
      const clusterCenterX = lake.position.x + Math.cos(clusterAngle) * clusterDist;
      const clusterCenterZ = lake.position.y + Math.sin(clusterAngle) * clusterDist;

      for (let p = 0; p < PADS_PER_CLUSTER; p++) {
        const hasFlower = p % 2 === 0; // Every 2nd pad has a blossoming lotus
        const padGroup = createLilyPadWithFlower(hasFlower);

        const offsetX = (Math.random() - 0.5) * 55;
        const offsetZ = (Math.random() - 0.5) * 55;

        padGroup.position.set(
          clusterCenterX + offsetX,
          0.30, // Floats right on water surface
          clusterCenterZ + offsetZ
        );

        padGroup.rotation.y = Math.random() * Math.PI * 2;

        sceneManager.scene.add(padGroup);

        lilyInstances.push({
          group: padGroup,
          phase: Math.random() * Math.PI * 2,
        });
      }
    }
  }
}

export function updateWaterLilies3D(time: number): void {
  for (const item of lilyInstances) {
    // Gentle bobbing and subtle sway with the water waves
    item.group.position.y = 0.30 + Math.sin(time * 2.2 + item.phase) * 0.45;
    item.group.rotation.z = Math.sin(time * 1.5 + item.phase) * 0.04;
  }
}