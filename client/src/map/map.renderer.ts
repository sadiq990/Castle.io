import * as THREE from 'three';
import type { SceneManager } from '../core/SceneManager.js';

let groundMesh: THREE.Mesh | null = null;

function generateGrassTexture(size: number): THREE.CanvasTexture {
  const canvas = document.createElement('canvas');
  canvas.width = 2048;
  canvas.height = 2048;
  const ctx = canvas.getContext('2d');
  if (!ctx) return new THREE.CanvasTexture(canvas);

  // Base grass color
  ctx.fillStyle = '#609F57';
  ctx.fillRect(0, 0, 2048, 2048);

  const drawPatch = (color: string) => {
    ctx.fillStyle = color;
    const x = Math.random() * 2048;
    const y = Math.random() * 2048;
    const w = 150 + Math.random() * 300;
    const h = 150 + Math.random() * 300;
    
    ctx.beginPath();
    ctx.roundRect(x - w/2, y - h/2, w, h, 80);
    ctx.fill();
  };

  // Draw many patches
  for(let i=0; i<80; i++) drawPatch('#6BA85F');
  for(let i=0; i<60; i++) drawPatch('#568F4D');

  const texture = new THREE.CanvasTexture(canvas);
  texture.wrapS = THREE.RepeatWrapping;
  texture.wrapT = THREE.RepeatWrapping;
  // Repeat the texture across the huge 3D map
  texture.repeat.set(size / 1000, size / 1000); 
  return texture;
}

export function updateMap3D(sceneManager: SceneManager, mapSize: number): void {
  if (!groundMesh) {
    const geo = new THREE.PlaneGeometry(mapSize, mapSize);
    geo.rotateX(-Math.PI / 2);

    const texture = generateGrassTexture(mapSize);
    const mat = new THREE.MeshStandardMaterial({ 
      map: texture,
      roughness: 0.9,
      metalness: 0.05
    });

    groundMesh = new THREE.Mesh(geo, mat);
    groundMesh.receiveShadow = true;
    
    groundMesh.position.set(mapSize / 2, -1, mapSize / 2);
    sceneManager.scene.add(groundMesh);
  }
}