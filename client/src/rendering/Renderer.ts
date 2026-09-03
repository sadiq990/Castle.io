// Top-level render orchestrator for 3D.
// Reconciles GameClientState into the SceneManager with Terrain, Paths, and Scattering.

import type { SceneManager } from '../core/SceneManager.js';
import type { GameClientState } from '../state/gameClientState.js';
import { createTerrainMesh } from '../terrain/TerrainGenerator.js';
import { createPathMesh } from '../terrain/PathSystem.js';
import { createScatterMeshes } from '../terrain/ScatterSystem.js';
import { updateTree3D } from '../entities/tree/tree.renderer.js';
import { updateStone3D } from '../entities/stone/stone.renderer.js';
import { updateCastle3D } from '../entities/castle/castle.renderer.js';
import { updateWater3D } from '../entities/water/water.renderer.js';
import { updatePlayer3D } from '../player/player.renderer.js';
import { updateFlag3D } from '../entities/flag/flag.renderer.js';
import { updateFlagVFX } from '../entities/flag/flagVFX.js';
import { drawMinimap } from '../ui/minimap.renderer.js';

let terrainInitialized = false;

function ensureTerrainEnvironment(sceneManager: SceneManager, mapSize: number): void {
  if (terrainInitialized) return;
  terrainInitialized = true;

  // 1. Unified 3D Heightmap Terrain
  const terrainMesh = createTerrainMesh(mapSize);
  sceneManager.scene.add(terrainMesh);

  // 2. Catmull-Rom Dirt Path Ribbon
  const pathMesh = createPathMesh();
  sceneManager.scene.add(pathMesh);

  // 3. InstancedMesh Procedural Scattering (Grass, Rocks, Bushes)
  const scatterGroup = createScatterMeshes(mapSize);
  sceneManager.scene.add(scatterGroup);
}

export function renderFrame(
  sceneManager: SceneManager,
  state: GameClientState,
  uiCtx: CanvasRenderingContext2D,
  time: number
): void {
  // 1. One-time procedurally generated terrain, road, and scattering
  ensureTerrainEnvironment(sceneManager, state.mapSize);

  // 2. Lakes & Shorelines
  for (const water of state.waters) {
    updateWater3D(sceneManager, water, time);
  }

  // 3. Trees & Stones (Grounded on terrain height)
  for (const tree of state.trees) {
    updateTree3D(sceneManager, tree);
  }
  for (const stone of state.stones) {
    updateStone3D(sceneManager, stone);
  }

  // 4. Castles
  for (const castle of state.castles) {
    updateCastle3D(sceneManager, castle, time);
  }

  // 5. CTF Flags & VFX
  if (state.ctf) {
    for (const flag of Object.values(state.ctf.flags)) {
      updateFlag3D(sceneManager, flag, state, time);
    }
    updateFlagVFX(sceneManager, state, time);
  }

  // 6. Players
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

  // 7. Render WebGL Scene
  sceneManager.render();

  // 8. Render UI Minimap
  const w = uiCtx.canvas.width;
  const h = uiCtx.canvas.height;
  uiCtx.clearRect(0, 0, w, h);
  const mockCamera = {
    position: state.localPlayerId && state.players[state.localPlayerId] ? state.players[state.localPlayerId]!.position : { x: 0, y: 0 },
    worldToScreen: (worldPos: any) => ({ x: worldPos.x, y: worldPos.y }),
  };
  drawMinimap(uiCtx, mockCamera as any, state, w, h);
}