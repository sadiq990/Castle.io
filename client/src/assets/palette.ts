// Color palette for low-poly RTS io game
// All colors match the design specification exactly

export const PALETTE = {
  // Terrain
  GRASS_DARK:    0x3E8E3A,
  GRASS_LIGHT:   0x5FAF4A,
  ROAD:          0xB89A6A,
  WATER_SHALLOW: 0x8FD3F4,
  WATER_DEEP:    0x0B4FA8,
  // Nature
  TREE_DARK:     0x1E6B3A,
  TREE_LIGHT:    0x3FBF7F,
  TREE_AUTUMN:   0xE8A020,
  ROCK:          0x8A8F98,
  // Buildings
  CASTLE_WALL:   0x7C8794,
  GOLD:          0xF5C542,
  WOOD_BROWN:    0x8B6340,
  WOOD_LIGHT:    0xC49A6C,
  // Teams
  TEAM_BLUE:     0x2F7BFF,
  TEAM_RED:      0xFF3B3B,
  TEAM_BLUE_DARK:0x1A4DA8,
  TEAM_RED_DARK: 0xA82020,
  // UI
  UI_BG:         0x0F1B2D,
  UI_DANGER:     0xFF5A4F,
  UI_SUCCESS:    0x3DDC84,
  UI_WARNING:    0xF5C542,
  // Misc
  WHITE:         0xFFFFFF,
  BLACK:         0x000000,
  NEUTRAL_GRAY:  0x888888,
  GROUND_SHADOW: 0x2A3A1A,
  FOG_COLOR:     0xBFE3F5,
  SKY_COLOR:     0x87CEEB,
  MUSHROOM_CAP:  0xD44C2E,
  MUSHROOM_STEM: 0xF5E6C8,
  BERRY_RED:     0xCC2222,
  EARTH_DARK:    0x5C4A2A,
} as const;

export type PaletteKey = keyof typeof PALETTE;

// CSS hex strings for UI
export const CSS = {
  TEAM_BLUE:  '#2F7BFF',
  TEAM_RED:   '#FF3B3B',
  UI_BG:      '#0F1B2D',
  UI_DANGER:  '#FF5A4F',
  UI_SUCCESS: '#3DDC84',
  UI_WARNING: '#F5C542',
  GOLD:       '#F5C542',
  WHITE:      '#FFFFFF',
  GRASS:      '#3E8E3A',
} as const;
