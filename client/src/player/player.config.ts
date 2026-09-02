// Player rendering and gameplay constants.

import { PLAYER_RADIUS } from 'shared/constants/game.constants.js';

export const PLAYER_CONFIG = {
  RADIUS: PLAYER_RADIUS,
  DIRECTION_LINE_LENGTH: PLAYER_RADIUS * 1.5,
  DIRECTION_LINE_WIDTH: 3,
  BORDER_COLOR: 'rgba(255,255,255,0.7)',
  BORDER_WIDTH: 2,
  LABEL_FONT: '11px monospace',
  LABEL_COLOR: '#ffffff',
  LABEL_OFFSET_Y: PLAYER_RADIUS + 14,
} as const;
