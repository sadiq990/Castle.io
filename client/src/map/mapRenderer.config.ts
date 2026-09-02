// Map rendering constants. Edit here to tweak visuals.

export const MAP_RENDERER_CONFIG = {
  GRASS_COLOR: '#4C8244',      // outside-world background
  MAP_FILL_COLOR: '#609F57',   // in-world grass (Lordz.io base green)
  BORDER_COLOR: '#41733A',     // darker border
  BORDER_WIDTH: 8,             // thicker border
  SHOW_GRID: false,            // Lordz.io doesn't have a visible thin grid
  GRID_CELL_SIZE: 100,         
  GRID_COLOR: 'rgba(0,0,0,0.05)',
  GRID_LINE_WIDTH: 1,
} as const;
