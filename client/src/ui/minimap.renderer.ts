import type { Camera } from '../rendering/Camera.js';
import type { GameClientState } from '../state/gameClientState.js';
import { MAP_RENDERER_CONFIG } from '../map/mapRenderer.config.js';

const MINIMAP_SIZE = 160;
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

  const startX = MARGIN;
  const startY = screenH - MINIMAP_SIZE - MARGIN;

  ctx.save();
  ctx.globalAlpha = 0.88;

  // 1. Background & Border
  ctx.fillStyle = MAP_RENDERER_CONFIG.MAP_FILL_COLOR;
  ctx.fillRect(startX, startY, MINIMAP_SIZE, MINIMAP_SIZE);

  ctx.lineWidth = 3;
  ctx.strokeStyle = 'rgba(255, 255, 255, 0.4)';
  ctx.strokeRect(startX, startY, MINIMAP_SIZE, MINIMAP_SIZE);

  // 2. Castles & Team Auras
  for (const castle of state.castles) {
    const cx = startX + castle.position.x * scale;
    const cy = startY + castle.position.y * scale;
    const isBlue = castle.team === 'blue' || castle.id === 'castle-1';

    // Territory aura circle
    ctx.beginPath();
    ctx.arc(cx, cy, 180 * scale, 0, Math.PI * 2);
    ctx.fillStyle = isBlue ? 'rgba(59, 130, 246, 0.22)' : 'rgba(239, 68, 68, 0.22)';
    ctx.fill();

    // Castle icon
    ctx.fillStyle = isBlue ? '#2E6FE0' : '#D9302F';
    ctx.fillRect(cx - 5, cy - 5, 10, 10);
    ctx.strokeStyle = '#ffffff';
    ctx.lineWidth = 1;
    ctx.strokeRect(cx - 5, cy - 5, 10, 10);
  }

  // 3. Flags & Carrier Markers
  if (state.ctf) {
    const flags = Object.values(state.ctf.flags);
    const now = Date.now() / 1000;

    for (const flag of flags) {
      const fx = startX + flag.position.x * scale;
      const fy = startY + flag.position.y * scale;
      const isBlue = flag.team === 'blue';
      const flagColor = isBlue ? '#3B82F6' : '#EF4444';

      if (flag.status === 'CARRIED') {
        // Pulsating glowing alarm ring around carrier on minimap
        const pulse = 6 + Math.sin(now * 8) * 3;
        ctx.beginPath();
        ctx.arc(fx, fy, pulse, 0, Math.PI * 2);
        ctx.strokeStyle = flagColor;
        ctx.lineWidth = 2;
        ctx.stroke();

        ctx.fillStyle = '#ffffff';
        ctx.font = 'bold 9px sans-serif';
        ctx.fillText('🚩', fx - 4, fy + 3);
      } else if (flag.status === 'DROPPED') {
        // Yellow blinking warning ring
        const pulse = 5 + Math.sin(now * 6) * 2;
        ctx.beginPath();
        ctx.arc(fx, fy, pulse, 0, Math.PI * 2);
        ctx.strokeStyle = '#F59E0B';
        ctx.lineWidth = 2;
        ctx.stroke();

        ctx.fillStyle = '#F59E0B';
        ctx.font = 'bold 8px sans-serif';
        ctx.fillText('⬇️', fx - 4, fy + 3);
      } else {
        // At Home Flag
        ctx.fillStyle = flagColor;
        ctx.beginPath();
        ctx.arc(fx, fy, 3.5, 0, Math.PI * 2);
        ctx.fill();
      }
    }
  }

  // 4. Viewport Box
  ctx.lineWidth = 1;
  ctx.strokeStyle = 'rgba(255, 255, 255, 0.7)';
  const camX = startX + camera.position.x * scale;
  const camY = startY + camera.position.y * scale;
  const camW = screenW * scale;
  const camH = screenH * scale;
  ctx.strokeRect(camX, camY, camW, camH);

  // 5. Players (Colored by team)
  for (const player of Object.values(state.players)) {
    const px = startX + player.position.x * scale;
    const py = startY + player.position.y * scale;
    const isMe = player.id === state.localPlayerId;
    const teamColor = player.team === 'blue' ? '#60A5FA' : '#F87171';

    ctx.beginPath();
    ctx.arc(px, py, isMe ? 4.5 : 3, 0, Math.PI * 2);
    ctx.fillStyle = isMe ? '#FFFFFF' : teamColor;
    ctx.fill();
    ctx.strokeStyle = teamColor;
    ctx.lineWidth = 1;
    ctx.stroke();
  }

  ctx.restore();
}