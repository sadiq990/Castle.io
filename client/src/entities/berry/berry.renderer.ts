import type { Camera } from '../../rendering/Camera.js';
import { BERRY_CONFIG } from './berry.config.js';
import { resolveAsset, preloadAsset } from '../../assets/AssetLoader.js';

export interface BerryObject { id: string; position: { x: number; y: number }; }

void preloadAsset('map', 'berry');

export function drawBerry(
  ctx: CanvasRenderingContext2D,
  camera: Camera,
  berry: BerryObject,
  screenW: number,
  screenH: number,
): void {
  const screen = camera.worldToScreen(berry.position, screenW, screenH);
  const { SIZE } = BERRY_CONFIG;
  const half = SIZE / 2 + 10;

  if (
    screen.x < -half || screen.x > screenW + half ||
    screen.y < -half || screen.y > screenH + half
  ) return;

  const asset = resolveAsset('map', 'berry');

  if (asset.type === 'image') {
    ctx.drawImage(asset.image, screen.x - SIZE / 2, screen.y - SIZE / 2, SIZE, SIZE);
  } else {
    ctx.save();
    ctx.beginPath();
    ctx.arc(screen.x, screen.y, SIZE * 0.4, 0, Math.PI * 2);
    ctx.fillStyle = '#e91e63';
    ctx.fill();
    ctx.restore();
  }
}