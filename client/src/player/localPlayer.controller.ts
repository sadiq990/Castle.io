// Keyboard and mouse input handler for the local player.
// Converts key state into a normalized movement vector and attack actions.

import type { MovementInput } from 'shared/types/network.js';

const keys = { up: false, down: false, left: false, right: false };
let attackCallback: (() => void) | null = null;

export function initLocalPlayerController(onAttack?: () => void): void {
  if (onAttack) attackCallback = onAttack;

  window.addEventListener('keydown', e => {
    if (e.code === 'KeyW' || e.code === 'ArrowUp') keys.up = true;
    if (e.code === 'KeyS' || e.code === 'ArrowDown') keys.down = true;
    if (e.code === 'KeyA' || e.code === 'ArrowLeft') keys.left = true;
    if (e.code === 'KeyD' || e.code === 'ArrowRight') keys.right = true;

    // Spacebar to attack / knock enemy flag!
    if (e.code === 'Space') {
      e.preventDefault();
      attackCallback?.();
    }
  });

  window.addEventListener('keyup', e => {
    if (e.code === 'KeyW' || e.code === 'ArrowUp') keys.up = false;
    if (e.code === 'KeyS' || e.code === 'ArrowDown') keys.down = false;
    if (e.code === 'KeyA' || e.code === 'ArrowLeft') keys.left = false;
    if (e.code === 'KeyD' || e.code === 'ArrowRight') keys.right = false;
  });

  // Left mouse click to attack
  window.addEventListener('mousedown', e => {
    if (e.button === 0) { // Primary / Left button
      attackCallback?.();
    }
  });
}

export function getMovementInput(): MovementInput {
  let dx = 0;
  let dy = 0;

  if (keys.left) dx -= 1;
  if (keys.right) dx += 1;
  if (keys.up) dy -= 1;
  if (keys.down) dy += 1;

  return { dx, dy };
}