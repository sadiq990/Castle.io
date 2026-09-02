// Camera: translates world coordinates to screen coordinates.
// Call setTarget() each frame with the player's world position.
// Use worldToScreen() in all renderers to convert positions.

import type { Vector2 } from 'shared/types/entities.js';

export interface Camera {
  position: Vector2; // camera center in world space
  setTarget: (worldPos: Vector2) => void;
  worldToScreen: (worldPos: Vector2, screenW: number, screenH: number) => Vector2;
}

export function createCamera(initialPos: Vector2 = { x: 0, y: 0 }): Camera {
  const position: Vector2 = { ...initialPos };

  return {
    position,

    setTarget(worldPos: Vector2): void {
      position.x = worldPos.x;
      position.y = worldPos.y;
    },

    worldToScreen(worldPos: Vector2, screenW: number, screenH: number): Vector2 {
      return {
        x: worldPos.x - position.x + screenW / 2,
        y: worldPos.y - position.y + screenH / 2,
      };
    },
  };
}
