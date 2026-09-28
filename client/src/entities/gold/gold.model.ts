// GoldState is not in shared types — define locally as a simple positional entity.

export interface GoldState {
  id: string;
  position: { x: number; y: number };
}

export function createGold(id: string, x: number, y: number): GoldState {
  return { id, position: { x, y } };
}
