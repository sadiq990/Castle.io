// All tuneable game constants in one place.
// Import these in server and client — never hardcode numbers elsewhere.

/** Server tick rate in Hz (state broadcasts per second) */
export const TICK_RATE = 20;

/** Default map size in world units (square) */
export const DEFAULT_MAP_SIZE = 3000;

/** Default player movement speed (world units per second) */
export const DEFAULT_PLAYER_SPEED = 200;

/** Player circle radius in world units */
export const PLAYER_RADIUS = 20;

/** Colors available for new players (cycling) */
export const PLAYER_COLORS: ReadonlyArray<string> = [
  '#e63946',
  '#2196f3',
  '#4caf50',
  '#ff9800',
  '#9c27b0',
  '#00bcd4',
  '#ff5722',
  '#8bc34a',
];
