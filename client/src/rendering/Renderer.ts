import { updateWater3D } from '../entities/water/water.renderer.js';
// Top-level render orchestrator for 3D.
// Reconciles GameClientState into the SceneManager.

import type { SceneManager } from '../core/SceneManager.js';
import type { GameClientState } from '../state/gameClientState.js';
import { updateMap3D } from '../map/map.renderer.js';
import { updateTree3D } from '../entities/tree/tree.renderer.js';
import { updateStone3D } from '../entities/stone/stone.renderer.js';
import { updateCastle3D } from '../entities/castle/castle.renderer.js';
import { updatePlayer3D } from '../player/player.renderer.js';
import { drawMinimap } from '../ui/minimap.renderer.js';

export function renderFrame(
  sceneManager: SceneManager,
  state: GameClientState,
  uiCtx: CanvasRenderingContext2D,
  time: number
): void {
  // 1. Static environment
  updateMap3D(sceneManager, state.mapSize);
  for (const water of state.waters) { updateWater3D(sceneManager, water, time); }

  for (const tree of state.trees) {
    updateTree3D(sceneManager, tree);
  }
  for (const stone of state.stones) {
    updateStone3D(sceneManager, stone);
  }
  for (const castle of state.castles) {
    updateCastle3D(sceneManager, castle);
  }

  // Track active players to remove disconnected ones
  const activePlayers = new Set<string>();

  // 2. Players
  for (const player of Object.values(state.players)) {
    updatePlayer3D(sceneManager, player);
    activePlayers.add('player-' + player.id);
  }

  // Cleanup old players
  for (const [id, mesh] of sceneManager.meshes.entries()) {
    if (id.startsWith('player-') && !activePlayers.has(id)) {
      sceneManager.scene.remove(mesh);
      sceneManager.meshes.delete(id);
    }
  }

  // 3. Render WebGL
  sceneManager.render();

  // 4. Render UI Minimap
  const w = uiCtx.canvas.width;
  const h = uiCtx.canvas.height;
  uiCtx.clearRect(0, 0, w, h);
  // We mock a simple camera object for the minimap's 2D logic
  const mockCamera = { 
    position: state.localPlayerId && state.players[state.localPlayerId] ? state.players[state.localPlayerId]!.position : {x:0, y:0},
    worldToScreen: (worldPos, sw, sh) => ({ x: worldPos.x, y: worldPos.y }) // Mocked out
  };
  drawMinimap(uiCtx, mockCamera as any, state, w, h);
}