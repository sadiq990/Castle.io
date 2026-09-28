import * as THREE from 'three';

export type LakeConfig = {
  id: string;
  x: number;
  z: number;
  radius: number;
};

export const LAKE_CONFIGS: LakeConfig[] = [
  { id: 'lake-1', x: 1300, z: 1600, radius: 290 },
  { id: 'lake-2', x: 3200, z: 2900, radius: 310 }
];

export function createLake(config: LakeConfig): THREE.Group {
  const group = new THREE.Group();
  group.position.set(config.x, 0, config.z);
  group.userData.lakeConfig = config;

  const deepGeo = new THREE.CircleGeometry(config.radius * 0.6, 32);
  const deepMat = new THREE.MeshStandardMaterial({
    color: 0x0B4FA8,
    roughness: 0.1,
    metalness: 0.05,
    side: THREE.DoubleSide,
    flatShading: true
  });
  const deepMesh = new THREE.Mesh(deepGeo, deepMat);
  deepMesh.rotation.x = -Math.PI / 2;
  deepMesh.position.y = 0.5;
  group.add(deepMesh);

  const shallowGeo = new THREE.RingGeometry(config.radius * 0.6, config.radius, 32);
  const shallowMat = new THREE.MeshStandardMaterial({
    color: 0x8FD3F4,
    roughness: 0.1,
    metalness: 0.05,
    side: THREE.DoubleSide,
    flatShading: true
  });
  const shallowMesh = new THREE.Mesh(shallowGeo, shallowMat);
  shallowMesh.rotation.x = -Math.PI / 2;
  shallowMesh.position.y = 0.51;
  group.add(shallowMesh);

  const foamGeo = new THREE.RingGeometry(config.radius, config.radius + 15, 32);
  const foamMat = new THREE.MeshStandardMaterial({
    color: 0xFFFFFF,
    roughness: 0.1,
    metalness: 0.05,
    transparent: true,
    opacity: 0.35,
    side: THREE.DoubleSide,
    flatShading: true
  });
  const foamMesh = new THREE.Mesh(foamGeo, foamMat);
  foamMesh.rotation.x = -Math.PI / 2;
  foamMesh.position.y = 0.52;
  group.add(foamMesh);

  const numLilies = 8 + Math.floor(Math.random() * 5);
  const lilyGeo = new THREE.BoxGeometry(3, 0.1, 3);
  const lilyMat = new THREE.MeshStandardMaterial({
    color: 0xAADDAA,
    roughness: 0.1,
    metalness: 0.05,
    flatShading: true
  });

  for (let i = 0; i < numLilies; i++) {
    const lily = new THREE.Mesh(lilyGeo, lilyMat);
    const angle = Math.random() * Math.PI * 2;
    const r = Math.random() * config.radius * 0.8;
    lily.position.set(Math.cos(angle) * r, 0.6, Math.sin(angle) * r);
    lily.rotation.y = Math.random() * Math.PI;
    group.add(lily);
  }

  return group;
}

export function animateLake(lakeGroup: THREE.Group, time: number): void {
  const shallowMesh = lakeGroup.children[1];
  if (shallowMesh) {
    shallowMesh.rotation.z = time * 0.05;
  }
  for (let i = 3; i < lakeGroup.children.length; i++) {
    const lily = lakeGroup.children[i];
    lily!.position.y = 0.6 + Math.sin(time * 0.8 + i * 0.7) * 0.05;
  }
}

export function initAllLakes(scene: THREE.Scene): THREE.Group[] {
  const lakeGroups = LAKE_CONFIGS.map(config => {
    const lake = createLake(config);
    scene.add(lake);
    return lake;
  });
  return lakeGroups;
}

export function updateAllLakes(lakeGroups: THREE.Group[], time: number): void {
  lakeGroups.forEach(lakeGroup => {
    animateLake(lakeGroup, time);
  });
}
