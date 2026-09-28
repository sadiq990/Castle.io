import * as THREE from 'three';
import { PALETTE } from './palette.js';

const baseMatOpts: THREE.MeshStandardMaterialParameters = {
  flatShading: true,
  roughness: 0.9,
  metalness: 0,
};

function createMat(color: number): THREE.MeshStandardMaterial {
  return new THREE.MeshStandardMaterial({ ...baseMatOpts, color });
}

export const SHARED_MATS = {
  grassDark: createMat(PALETTE.GRASS_DARK),
  grassLight: createMat(PALETTE.GRASS_LIGHT),
  road: createMat(PALETTE.ROAD),
  waterShallow: createMat(PALETTE.WATER_SHALLOW),
  waterDeep: createMat(PALETTE.WATER_DEEP),
  treeDark: createMat(PALETTE.TREE_DARK),
  treeLight: createMat(PALETTE.TREE_LIGHT),
  treeAutumn: createMat(PALETTE.TREE_AUTUMN),
  rock: createMat(PALETTE.ROCK),
  castleWall: createMat(PALETTE.CASTLE_WALL),
  gold: createMat(PALETTE.GOLD),
  woodBrown: createMat(PALETTE.WOOD_BROWN),
  woodLight: createMat(PALETTE.WOOD_LIGHT),
  neutralGray: createMat(PALETTE.NEUTRAL_GRAY),
  groundShadow: createMat(PALETTE.GROUND_SHADOW),
  mushroom: createMat(PALETTE.MUSHROOM_CAP),
  mushroomCap: createMat(PALETTE.MUSHROOM_CAP),
  mushroomStem: createMat(PALETTE.MUSHROOM_STEM),
};

export type SharedMatKey = keyof typeof SHARED_MATS;

export function getMaterial(name: SharedMatKey): THREE.MeshStandardMaterial {
  return SHARED_MATS[name];
}

export function createTeamMaterial(team: 'blue' | 'red', variant: 'primary' | 'dark' | 'accent'): THREE.MeshStandardMaterial {
  let color: number;
  if (team === 'blue') {
    if (variant === 'dark') color = PALETTE.TEAM_BLUE_DARK;
    else if (variant === 'accent') color = PALETTE.WHITE;
    else color = PALETTE.TEAM_BLUE;
  } else {
    if (variant === 'dark') color = PALETTE.TEAM_RED_DARK;
    else if (variant === 'accent') color = PALETTE.WHITE;
    else color = PALETTE.TEAM_RED;
  }
  return createMat(color);
}

export function dispose(): void {
  for (const mat of Object.values(SHARED_MATS)) {
    mat.dispose();
  }
}
