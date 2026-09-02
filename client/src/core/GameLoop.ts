// requestAnimationFrame game loop with delta-time.
// Pass an onTick callback that receives deltaTime in seconds.

export type TickCallback = (deltaTime: number) => void;

export interface GameLoop {
  start: () => void;
  stop: () => void;
}

export function createGameLoop(onTick: TickCallback): GameLoop {
  let rafHandle = 0;
  let lastTime = 0;
  let running = false;

  function tick(timestamp: number): void {
    if (!running) return;
    const deltaTime = lastTime === 0 ? 0 : Math.min((timestamp - lastTime) / 1000, 0.1);
    lastTime = timestamp;
    onTick(deltaTime);
    rafHandle = requestAnimationFrame(tick);
  }

  return {
    start(): void {
      if (running) return;
      running = true;
      lastTime = 0;
      rafHandle = requestAnimationFrame(tick);
    },
    stop(): void {
      running = false;
      cancelAnimationFrame(rafHandle);
    },
  };
}
