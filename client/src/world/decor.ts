import * as THREE from 'three';
import { PALETTE } from '../assets/palette.js';
import { LAKE_CONFIGS } from './water.js';

function isNearLake(x: number, z: number, buffer: number): boolean {
  for (const lake of LAKE_CONFIGS) {
    const dx = x - lake.x;
    const dz = z - lake.z;
    if (Math.sqrt(dx * dx + dz * dz) < lake.radius + buffer) {
      return true;
    }
  }
  return false;
}

function seededRNG(seed: number): () => number {
  return function() {
    let t = seed += 0x6D2B79F5;
    t = Math.imul(t ^ t >>> 15, t | 1);
    t ^= t + Math.imul(t ^ t >>> 7, t | 61);
    return ((t ^ t >>> 14) >>> 0) / 4294967296;
  }
}

export function createDecorInstances(scene: THREE.Scene, mapSize: number): void {
  const rng = seededRNG(77);
  const dummy = new THREE.Object3D();

  // 1. FLOWERS
  const flowerGeo = new THREE.IcosahedronGeometry(0.15, 0);
  flowerGeo.computeVertexNormals();
  const flowerColors = [0xFF4466, 0xFFDD00, 0xFFFFFF, 0xAA44FF];
  
  for (const color of flowerColors) {
    const mat = new THREE.MeshStandardMaterial({
      color,
      roughness: 0.9,
      metalness: 0,
      flatShading: true
    });
    const instancedMesh = new THREE.InstancedMesh(flowerGeo, mat, 2500);
    instancedMesh.castShadow = false;
    instancedMesh.receiveShadow = true;
    
    let added = 0;
    while (added < 2500) {
      const x = rng() * mapSize;
      const z = rng() * mapSize;
      if (!isNearLake(x, z, 30)) {
        dummy.position.set(x, 0.1, z);
        dummy.rotation.y = rng() * Math.PI * 2;
        dummy.updateMatrix();
        instancedMesh.setMatrixAt(added, dummy.matrix);
        added++;
      }
    }
    scene.add(instancedMesh);
  }

  // 2. GRASS TUFTS
  const grassGeo = new THREE.ConeGeometry(0.15, 0.7, 3);
  grassGeo.computeVertexNormals();
  const grassMat = new THREE.MeshStandardMaterial({
    color: 0x5FAF4A,
    roughness: 0.9,
    metalness: 0,
    flatShading: true
  });
  const grassMesh = new THREE.InstancedMesh(grassGeo, grassMat, 5000);
  grassMesh.castShadow = false;
  grassMesh.receiveShadow = true;
  
  let grassAdded = 0;
  while (grassAdded < 5000) {
    const x = rng() * mapSize;
    const z = rng() * mapSize;
    if (!isNearLake(x, z, 30)) {
      dummy.position.set(x, 0, z);
      dummy.rotation.y = rng() * Math.PI * 2;
      dummy.updateMatrix();
      grassMesh.setMatrixAt(grassAdded, dummy.matrix);
      grassAdded++;
    }
  }
  scene.add(grassMesh);

  // 3. SMALL ROCKS
  const rockGeo = new THREE.IcosahedronGeometry(0.2, 0);
  rockGeo.computeVertexNormals();
  const rockMat = new THREE.MeshStandardMaterial({
    color: 0x888888,
    roughness: 0.9,
    metalness: 0,
    flatShading: true
  });
  const rockMesh = new THREE.InstancedMesh(rockGeo, rockMat, 3000);
  rockMesh.castShadow = false;
  rockMesh.receiveShadow = true;
  
  let rocksAdded = 0;
  while (rocksAdded < 3000) {
    const x = rng() * mapSize;
    const z = rng() * mapSize;
    if (!isNearLake(x, z, 20)) {
      dummy.position.set(x, 0.1, z);
      dummy.rotation.y = rng() * Math.PI * 2;
      dummy.rotation.x = rng() * Math.PI;
      dummy.updateMatrix();
      rockMesh.setMatrixAt(rocksAdded, dummy.matrix);
      rocksAdded++;
    }
  }
  scene.add(rockMesh);

  // 4. DIRT PATCHES
  const dirtGeo = new THREE.CircleGeometry(1.5, 6);
  dirtGeo.computeVertexNormals();
  const dirtMat = new THREE.MeshStandardMaterial({
    color: 0x8B6340,
    roughness: 0.9,
    metalness: 0,
    transparent: true,
    opacity: 0.6,
    flatShading: true
  });
  const dirtMesh = new THREE.InstancedMesh(dirtGeo, dirtMat, 1000);
  dirtMesh.castShadow = false;
  dirtMesh.receiveShadow = true;
  
  let dirtAdded = 0;
  while (dirtAdded < 1000) {
    const x = rng() * mapSize;
    const z = rng() * mapSize;
    if (!isNearLake(x, z, 35)) {
      dummy.position.set(x, 0.02, z);
      dummy.rotation.x = -Math.PI / 2;
      dummy.rotation.z = rng() * Math.PI * 2;
      dummy.updateMatrix();
      dirtMesh.setMatrixAt(dirtAdded, dummy.matrix);
      dirtAdded++;
    }
  }
  scene.add(dirtMesh);
}

export function createRoadMesh(mapSize: number): THREE.Mesh | THREE.Group {
  const group = new THREE.Group();
  
  const p1 = new THREE.Vector3(700, 0, 700);
  const p2 = new THREE.Vector3(mapSize / 2, 0, mapSize / 2);
  const p3 = new THREE.Vector3(3800, 0, 3800);
  
  const mat = new THREE.MeshStandardMaterial({
    color: 0xB89A6A,
    roughness: 0.95,
    metalness: 0,
    flatShading: true
  });
  
  const createSegment = (start: THREE.Vector3, end: THREE.Vector3) => {
    const distance = start.distanceTo(end);
    const geo = new THREE.BoxGeometry(24, 0.1, distance);
    const mesh = new THREE.Mesh(geo, mat);
    
    mesh.position.copy(start).lerp(end, 0.5);
    mesh.position.y = 0.01; 
    
    mesh.lookAt(end);
    mesh.receiveShadow = true;
    return mesh;
  };

  group.add(createSegment(p1, p2));
  group.add(createSegment(p2, p3));
  
  return group;
}
