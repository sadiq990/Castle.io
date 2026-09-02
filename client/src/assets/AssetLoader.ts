// Asset loader — the ONLY module that knows about file paths.
// Tries PNG first, then SVG, then falls back to procedural canvas drawing.
// Results are cached — each asset path is attempted only once.
//
// To add an asset for an entity:
//   Drop `assets/{category}/{id}.png` OR `assets/{category}/{id}.svg`
//   No code changes needed — this module picks it up automatically.

import type { AssetCategory, AssetResult } from 'shared/types/assets.js';

const cache = new Map<string, AssetResult>();
const loading = new Map<string, Promise<AssetResult>>();

export function resolveAsset(category: AssetCategory, id: string): AssetResult {
  const key = `${category}/${id}`;
  return cache.get(key) ?? { type: 'fallback' };
}

export async function preloadAsset(category: AssetCategory, id: string): Promise<AssetResult> {
  const key = `${category}/${id}`;

  const cached = cache.get(key);
  if (cached) return cached;

  const inFlight = loading.get(key);
  if (inFlight) return inFlight;

  // Try PNG first, then SVG, then give up and use fallback shape
  const promise = loadImage(`/assets/${category}/${id}.png`)
    .catch(() => loadImage(`/assets/${category}/${id}.svg`))
    .then((img): AssetResult => ({ type: 'image', image: img }))
    .catch((): AssetResult => ({ type: 'fallback' }))
    .then(result => {
      cache.set(key, result);
      loading.delete(key);
      return result;
    });

  loading.set(key, promise);
  return promise;
}

function loadImage(src: string): Promise<HTMLImageElement> {
  return new Promise((resolve, reject) => {
    const img = new Image();
    img.onload = () => resolve(img);
    img.onerror = reject;
    img.src = src;
  });
}

