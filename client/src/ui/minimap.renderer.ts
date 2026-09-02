import type { Camera } from '../rendering/Camera.js';
import type { GameClientState } from '../state/gameClientState.js';
import { MAP_RENDERER_CONFIG } from '../map/mapRenderer.config.js';

const MINIMAP_SIZE = 150;
const MARGIN = 20;

export function drawMinimap(
  ctx: CanvasRenderingContext2D,
  camera: Camera,
  state: GameClientState,
  screenW: number,
  screenH: number
): void {
  const mapSize = state.mapSize;
  const scale = MINIMAP_SIZE / mapSize;
  
  // Position: bottom-left
  const startX = MARGIN;
  const startY = screenH - MINIMAP_SIZE - MARGIN;

  ctx.save();
  ctx.globalAlpha = 0.85;

  // 1. Background
  ctx.fillStyle = MAP_RENDERER_CONFIG.MAP_FILL_COLOR;
  ctx.fillRect(startX, startY, MINIMAP_SIZE, MINIMAP_SIZE);
  
  ctx.lineWidth = 4;
  ctx.strokeStyle = MAP_RENDERER_CONFIG.BORDER_COLOR;
  ctx.strokeRect(startX, startY, MINIMAP_SIZE, MINIMAP_SIZE);

  // 2. Castles (gray squares)
  ctx.fillStyle = '#90a4ae';
  for (const castle of state.castles) {
    const cx = startX + castle.position.x * scale;
    const cy = startY + castle.position.y * scale;
    ctx.fillRect(cx - 3, cy - 3, 6, 6);
  }

  // 3. Viewport (Camera area)
  ctx.lineWidth = 1;
  ctx.strokeStyle = '#ffffff';
  const camX = startX + camera.position.x * scale;
  const camY = startY + camera.position.y * scale;
  const camW = screenW * scale;
  const camH = screenH * scale;
  ctx.strokeRect(camX, camY, camW, camH);

  // 4. Local Player
  if (state.localPlayerId) {
    const localPlayer = state.players[state.localPlayerId];
    if (localPlayer) {
      const px = startX + localPlayer.position.x * scale;
      const py = startY + localPlayer.position.y * scale;
      
      ctx.beginPath();
      ctx.arc(px, py, 4, 0, Math.PI * 2);
      ctx.fillStyle = '#ffffff'; // White dot for local player
      ctx.fill();
      ctx.lineWidth = 1;
      ctx.strokeStyle = '#000000';
      ctx.stroke();
    }
  }

  // 5. Other players
  for (const player of Object.values(state.players)) {
    if (player.id === state.localPlayerId) continue;
    const px = startX + player.position.x * scale;
    const py = startY + player.position.y * scale;
    
    ctx.beginPath();
    ctx.arc(px, py, 3, 0, Math.PI * 2);
    ctx.fillStyle = '#e53935'; // Red dot for other players
    ctx.fill();
  }

  ctx.restore();
}