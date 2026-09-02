// Canvas setup and resize handling.
// This module owns the canvas element and its 2D context.
// Nothing else should reach into the DOM directly.

export interface CanvasContext {
  canvas: HTMLCanvasElement;
  ctx: CanvasRenderingContext2D;
}

export function initCanvas(canvasId: string): CanvasContext {
  const canvas = document.getElementById(canvasId) as HTMLCanvasElement | null;
  if (!canvas) throw new Error(`Canvas element #${canvasId} not found`);

  const ctx = canvas.getContext('2d');
  if (!ctx) throw new Error('Could not get 2D canvas context');

  function resize(): void {
    canvas!.width = window.innerWidth;
    canvas!.height = window.innerHeight;
  }

  resize();
  window.addEventListener('resize', resize);

  return { canvas, ctx };
}
