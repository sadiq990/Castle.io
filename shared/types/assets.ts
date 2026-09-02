// Asset system contracts — only AssetLoader.ts knows file paths.
// All entity renderers use these types.

export type AssetCategory =
  | 'trees'
  | 'stones'
  | 'gold'
  | 'castles'
  | 'players'
  | 'map';

export type AssetResult =
  | { type: 'image'; image: HTMLImageElement }
  | { type: 'fallback' };
