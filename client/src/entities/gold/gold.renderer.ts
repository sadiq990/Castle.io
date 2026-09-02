import type { Camera } from '../../rendering/Camera.js';
import type { GoldState } from 'shared/types/entities.js';
import { resolveAsset, preloadAsset } from '../../assets/AssetLoader.js';

void preloadAsset('map', 'goldmine2');

const SVG_SIZE = 110;

export function drawGold(
  ctx: CanvasRenderingContext2D,
  camera: Camera,
  gold: GoldState,
  screenW: number,
  screenH: number,
): void {
  const screen = camera.worldToScreen(gold.position, screenW, screenH);
  const margin = SVG_SIZE / 2;

  if (
    screen.x < -margin || screen.x > screenW + margin ||
    screen.y < -margin || screen.y > screenH + margin
  ) return;

  const asset = resolveAsset('map', 'goldmine2');

  if (asset.type === 'image') {
    ctx.drawImage(asset.image, screen.x - SVG_SIZE / 2, screen.y - SVG_SIZE / 2, SVG_SIZE, SVG_SIZE);
  }
}