// Top-level render orchestrator for 3D.
// Reconciles GameClientState into the SceneManager with Terrain, Paths, Scattering, Clouds, Shrine & Water Lilies.

import type { SceneManager } from '../core/SceneManager.js';
import type { GameClientState } from '../state/gameClientState.js';
import { createTerrainMesh } from '../terrain/TerrainGenerator.js';
import { createPathMesh } from '../terrain/PathSystem.js';
import { createScatterMeshes } from '../terrain/ScatterSystem.js';
import { initClouds, updateClouds } from '../environment/CloudSystem.js';
import { updateShrine3D } from '../entities/shrine/shrine.renderer.js';
import { initWaterLilies, updateWaterLilies3D } from '../entities/water/waterLilies.renderer.js';
import { updateTree3D } from '../entities/tree/tree.renderer.js';
import { updateStone3D } from '../entities/stone/stone.renderer.js';
import { updateCastle3D } from '../entities/castle/castle.renderer.js';
import { updateWater3D } from '../entities/water/water.renderer.js';
import { updatePlayer3D } from '../player/player.renderer.js';
import { updateFlag3D } from '../entities/flag/flag.renderer.js';
import { updateFlagVFX } from '../entities/flag/flagVFX.js';
import { drawMinimap } from '../ui/minimap.renderer.js';
import { initResourceZones3D } from '../resources/ResourceManager.js';
import { updateSlaves3D } from '../slaves/SlaveManager.js';
import { updateFences3D, syncWorldFences } from '../fences/FenceManager.js';
import { syncTowersAndArrows3D } from '../towers/TowerManager.js';
import { createBuilding, type BuildingType } from '../models/buildings.js';
import { getTerrainHeight } from '../terrain/TerrainGenerator.js';

let terrainInitialized = false;
let lastRenderTime = 0;

function initBaseBuildings(sceneManager: SceneManager): void {
  const buildingDefs: Array<{
    type: BuildingType;
    team: 'blue' | 'red';
    x: number;
    z: number;
    scale: number;
  }> = [
    // Blue Castle (700, 700) village
    { type: 'barracks',   team: 'blue', x: 860,  z: 620, scale: 8 },  // Kazarma
    { type: 'stable',     team: 'blue', x: 600,  z: 850, scale: 7 },  // Tövlə
    { type: 'catapult',   team: 'blue', x: 860,  z: 780, scale: 8 },  // Mancınıq emalatxanası
    { type: 'archery',    team: 'blue', x: 540,  z: 680, scale: 7 },  // Atıcılıq meydanı
    { type: 'farm',       team: 'blue', x: 940,  z: 660, scale: 8 },  // Ev / Ferma
    { type: 'storage',    team: 'blue', x: 680,  z: 920, scale: 7 },  // Anbar
    { type: 'watchtower', team: 'blue', x: 880,  z: 880, scale: 7 },  // Qüllə

    // Red Castle (3800, 3800) village
    { type: 'barracks',   team: 'red',  x: 3640, z: 3980, scale: 8 }, // Kazarma
    { type: 'stable',     team: 'red',  x: 3980, z: 3650, scale: 7 }, // Tövlə
    { type: 'catapult',   team: 'red',  x: 3740, z: 3820, scale: 8 }, // Mancınıq emalatxanası
    { type: 'archery',    team: 'red',  x: 4060, z: 3920, scale: 7 }, // Atıcılıq meydanı
    { type: 'farm',       team: 'red',  x: 3660, z: 3680, scale: 8 }, // Ev / Ferma
    { type: 'storage',    team: 'red',  x: 3920, z: 3680, scale: 7 }, // Anbar
    { type: 'watchtower', team: 'red',  x: 3720, z: 3720, scale: 7 }, // Qüllə
  ];

  for (const def of buildingDefs) {
    const building = createBuilding(def.type, def.team, 'ready');
    const y = getTerrainHeight(def.x, def.z);
    building.position.set(def.x, y, def.z);
    building.scale.setScalar(def.scale);
    sceneManager.scene.add(building);
  }
}

function ensureWorldEnvironment(sceneManager: SceneManager, mapSize: number): void {
  if (terrainInitialized) return;
  terrainInitialized = true;

  // 1. Unified 3D Heightmap Terrain
  const terrainMesh = createTerrainMesh(mapSize);
  sceneManager.scene.add(terrainMesh);

  // 2. Catmull-Rom Dirt Path Ribbon
  const pathMesh = createPathMesh();
  sceneManager.scene.add(pathMesh);

  // 3. InstancedMesh Procedural Scattering (3D Grass, Rocks, Bushes)
  const scatterGroup = createScatterMeshes(mapSize);
  sceneManager.scene.add(scatterGroup);

  // 4. Floating Water Lilies on Lakes
  initWaterLilies(sceneManager);

  // 5. Puffy Low-Poly Clouds in Sky
  initClouds(sceneManager, mapSize);

  // 6. Forest and Mine Resource Zones
  initResourceZones3D(sceneManager);

  // 7. Base Village Buildings (Kazarma, Tövlə, Mancınıq, Atıcılıq, Ferma, Anbar, Qüllə)
  initBaseBuildings(sceneManager);
}

export function renderFrame(
  sceneManager: SceneManager,
  state: GameClientState,
  uiCtx: CanvasRenderingContext2D,
  time: number
): void {
  const dt = lastRenderTime === 0 ? 0.016 : Math.min(0.1, time - lastRenderTime);
  lastRenderTime = time;

  // 1. One-time procedurally generated terrain, road, clouds, and scattering
  ensureWorldEnvironment(sceneManager, state.mapSize);

  // 2. Animated Sky Clouds & Water Lilies
  updateClouds(state.mapSize, dt);
  updateWaterLilies3D(time);

  // 3. Central Ancient Stonehenge Shrine & Crossroads Crystal
  updateShrine3D(sceneManager, time);

  // 4. Slaves (Villager mini-army) & Fences
  updateSlaves3D(dt, time);
  if (state.fences) {
    syncWorldFences(sceneManager, state.fences);
  }
  updateFences3D(dt);

  // 5. Archer Watchtowers & Flying Arrows
  syncTowersAndArrows3D(sceneManager, state.towers, state.arrows);

  // 4. Lakes & Shorelines
  for (const water of state.waters) {
    updateWater3D(sceneManager, water, time);
  }

  // 5. Trees & Stones (Grounded on terrain height with wind sway)
  for (const tree of state.trees) {
    updateTree3D(sceneManager, tree, time);
  }
  for (const stone of state.stones) {
    updateStone3D(sceneManager, stone);
  }

  // 6. Castles
  for (const castle of state.castles) {
    updateCastle3D(sceneManager, castle, time);
  }

  // 7. CTF Flags & VFX
  if (state.ctf) {
    for (const flag of Object.values(state.ctf.flags)) {
      updateFlag3D(sceneManager, flag, state, time);
    }
    updateFlagVFX(sceneManager, state, time);
  }

  // 8. Players
  const activePlayers = new Set<string>();
  for (const player of Object.values(state.players)) {
    updatePlayer3D(sceneManager, player, time);
    activePlayers.add('player-' + player.id);
  }

  // Cleanup disconnected players
  for (const [id, mesh] of sceneManager.meshes.entries()) {
    if (id.startsWith('player-') && !activePlayers.has(id)) {
      sceneManager.scene.remove(mesh);
      sceneManager.meshes.delete(id);
    }
  }

  // 9. Render WebGL Scene
  sceneManager.render();

  // 10. Render UI Minimap
  const w = uiCtx.canvas.width;
  const h = uiCtx.canvas.height;
  uiCtx.clearRect(0, 0, w, h);
  const mockCamera = {
    position: state.localPlayerId && state.players[state.localPlayerId] ? state.players[state.localPlayerId]!.position : { x: 0, y: 0 },
    worldToScreen: (worldPos: any) => ({ x: worldPos.x, y: worldPos.y }),
  };
  drawMinimap(uiCtx, mockCamera as any, state, w, h);
}