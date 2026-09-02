// Brush renderer — draws bush/shrub using brush.svg asset.
// Falls back to a simple green oval if SVG not loaded.

import type { Camera } from '../../rendering/Camera.js';
import { BRUSH_CONFIG } from './brush.config.js';
import { resolveAsset, preloadAsset } from '../../assets/AssetLoader.js';

export interface BrushObject { id: string; position: { x: number; y: number }; }

void preloadAsset('map', 'brush');

export function drawBrush(
  ctx: CanvasRenderingContext2D,
  camera: Camera,
  brush: BrushObject,
  screenW: number,
  screenH: number,
): void {
  const screen = camera.worldToScreen(brush.position, screenW, screenH);
  const { SIZE } = BRUSH_CONFIG;
  const half = SIZE / 2 + 10;

  if (
    screen.x < -half || screen.x > screenW + half ||
    screen.y < -half || screen.y > screenH + half
  ) return;

  const asset = resolveAsset('map', 'brush');

  if (asset.type === 'image') {
    ctx.drawImage(asset.image, screen.x - SIZE / 2, screen.y - SIZE / 2, SIZE, SIZE);
  } else {
    // Fallback: simple green oval
    ctx.save();
    ctx.beginPath();
    ctx.ellipse(screen.x, screen.y, SIZE * 0.55, SIZE * 0.4, 0, 0, Math.PI * 2);
    ctx.fillStyle = '#388e3c';
    ctx.globalAlpha = 0.85;
    ctx.fill();
    ctx.restore();
  }
}