import * as THREE from 'three';
import type { SceneManager } from '../core/SceneManager.js';
import type { Team, Vector2 } from 'shared/types/entities.js';
import { getTerrainHeight } from '../terrain/TerrainGenerator.js';

export interface ResourceZone {
  id: string;
  type: 'FOREST' | 'MINE';
  team: Team;
  name: string;
  center: Vector2;
  radius: number;
}

export interface ResourceNode {
  id: string;
  type: 'FOREST' | 'MINE';
  position: Vector2;
  hp: number;
  maxHp: number;
  isDepleted: boolean;
  respawnTimer: number;
}

// Fixed Resource Zones near Blue and Red Castles
export const RESOURCE_ZONES: ResourceZone[] = [
  // Blue Castle (500, 500)
  {
    id: 'blue-forest',
    type: 'FOREST',
    team: 'blue',
    name: 'Mavi Meşə',
    center: { x: 270, y: 500 }, // Left of blue castle
    radius: 95,
  },
  {
    id: 'blue-mine',
    type: 'MINE',
    team: 'blue',
    name: 'Mavi Mədən',
    center: { x: 500, y: 730 }, // South of blue castle
    radius: 85,
  },

  // Red Castle (2500, 2500)
  {
    id: 'red-forest',
    type: 'FOREST',
    team: 'red',
    name: 'Qırmızı Meşə',
    center: { x: 2730, y: 2500 }, // Right of red castle
    radius: 95,
  },
  {
    id: 'red-mine',
    type: 'MINE',
    team: 'red',
    name: 'Qırmızı Mədən',
    center: { x: 2500, y: 2270 }, // North of red castle
    radius: 85,
  },
];

// Local Player Resource State (Comfortable starting amount to build defenses and towers immediately)
let playerResources = { wood: 40, stone: 30 };
const changeListeners = new Set<(res: { wood: number; stone: number }) => void>();

export function getPlayerResources(): { wood: number; stone: number } {
  return { ...playerResources };
}

export function addPlayerResources(wood: number, stone: number): void {
  playerResources.wood += wood;
  playerResources.stone += stone;
  notifyChange();
}

export function deductPlayerResources(wood: number, stone: number): boolean {
  if (playerResources.wood < wood || playerResources.stone < stone) {
    return false;
  }
  playerResources.wood -= wood;
  playerResources.stone -= stone;
  notifyChange();
  return true;
}

export function onResourceChange(fn: (res: { wood: number; stone: number }) => void): () => void {
  changeListeners.add(fn);
  fn(getPlayerResources());
  return () => changeListeners.delete(fn);
}

function notifyChange(): void {
  const current = getPlayerResources();
  for (const fn of changeListeners) fn(current);
}

// ── 3D VISUALIZATION OF RESOURCE ZONES ──────────────────────────────
let zonesInitialized = false;

export function initResourceZones3D(sceneManager: SceneManager): void {
  if (zonesInitialized) return;
  zonesInitialized = true;

  for (const zone of RESOURCE_ZONES) {
    const group = new THREE.Group();
    group.name = 'zone-' + zone.id;
    const groundY = getTerrainHeight(zone.center.x, zone.center.y);

    // 1. Territory Ground Aura Ring
    const isForest = zone.type === 'FOREST';
    const ringColor = isForest ? 0x22c55e : 0xf59e0b;
    const ringGeo = new THREE.RingGeometry(zone.radius - 8, zone.radius, 32);
    ringGeo.rotateX(-Math.PI / 2);

    const ringMat = new THREE.MeshBasicMaterial({
      color: ringColor,
      transparent: true,
      opacity: 0.22,
      side: THREE.DoubleSide,
    });
    const ringMesh = new THREE.Mesh(ringGeo, ringMat);
    ringMesh.position.y = 0.4;
    group.add(ringMesh);

    // 2. Zone Feature Nodes (Trees in Forest, Ore Rocks in Mine)
    const nodeCount = isForest ? 6 : 5;
    for (let i = 0; i < nodeCount; i++) {
      const angle = (i / nodeCount) * Math.PI * 2 + (i % 2) * 0.3;
      const dist = 25 + Math.random() * (zone.radius - 40);
      const nx = Math.cos(angle) * dist;
      const nz = Math.sin(angle) * dist;

      if (isForest) {
        // Lush Harvestable Wood Pine Tree
        const treeGroup = new THREE.Group();
        const trunk = new THREE.Mesh(
          new THREE.CylinderGeometry(3.5, 4.5, 18, 6),
          new THREE.MeshStandardMaterial({ color: 0x654321, roughness: 0.9 })
        );
        trunk.position.y = 9;
        trunk.castShadow = true;
        treeGroup.add(trunk);

        const crown = new THREE.Mesh(
          new THREE.ConeGeometry(14, 28, 6),
          new THREE.MeshStandardMaterial({ color: 0x15803d, roughness: 0.8, flatShading: true })
        );
        crown.position.y = 28;
        crown.castShadow = true;
        treeGroup.add(crown);

        treeGroup.position.set(nx, 0, nz);
        group.add(treeGroup);
      } else {
        // Mine Mineral Ore Rock
        const oreGeo = new THREE.DodecahedronGeometry(11, 0);
        oreGeo.scale(1.2, 0.75, 1.0);
        const oreMat = new THREE.MeshStandardMaterial({
          color: 0x78716c,
          roughness: 0.85,
          metalness: 0.4,
          flatShading: true,
        });
        const oreMesh = new THREE.Mesh(oreGeo, oreMat);
        oreMesh.position.set(nx, 6, nz);
        oreMesh.castShadow = true;
        group.add(oreMesh);

        // Gold/Iron ore glint patch
        const glint = new THREE.Mesh(
          new THREE.OctahedronGeometry(4, 0),
          new THREE.MeshStandardMaterial({ color: 0xfbbf24, roughness: 0.3, metalness: 0.8 })
        );
        glint.position.set(nx + 3, 11, nz + 2);
        group.add(glint);
      }
    }

    group.position.set(zone.center.x, groundY, zone.center.y);
    sceneManager.scene.add(group);
  }
}