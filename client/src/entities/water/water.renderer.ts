import * as THREE from 'three';
import type { SceneManager } from '../../core/SceneManager.js';

const vertexShader = `
  varying vec2 vUv;
  void main() {
    vUv = uv;
    gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
  }
`;

const fragmentShader = `
  uniform float time;
  varying vec2 vUv;
  void main() {
    vec2 uv = vUv * 12.0; 
    
    // Create animated wavy pattern
    float wave = sin(uv.x + time * 1.2) * cos(uv.y + time * 1.5) * 0.5 + 0.5;
    
    vec3 baseColor = vec3(0.08, 0.4, 0.75); // Dark blue
    vec3 waveColor = vec3(0.2, 0.65, 0.95); // Light cyan waves
    
    vec3 finalColor = mix(baseColor, waveColor, wave);
    gl_FragColor = vec4(finalColor, 0.85); // Transparent water
  }
`;

function createIrregularLakeGeometry(radius: number): THREE.BufferGeometry {
  const geo = new THREE.CylinderGeometry(radius, radius, 2, 64, 1);
  const pos = geo.attributes.position;
  
  for (let i = 0; i < pos.count; i++) {
    const x = pos.getX(i);
    const z = pos.getZ(i);
    
    // Ignore top and bottom center vertices (they are at x=0, z=0)
    if (Math.abs(x) < 0.1 && Math.abs(z) < 0.1) continue;
    
    const angle = Math.atan2(z, x);
    
    // Create abnormal irregular shapes using sine waves
    const noise = Math.sin(angle * 3) * (radius * 0.2) 
                + Math.cos(angle * 5) * (radius * 0.15)
                + Math.sin(angle * 7) * (radius * 0.1);
                
    const scale = 1.0 + (noise / radius);
    
    pos.setX(i, x * scale);
    pos.setZ(i, z * scale);
  }
  
  geo.computeVertexNormals();
  geo.translate(0, -1, 0);
  return geo;
}

export function updateWater3D(sceneManager: SceneManager, water: { id: string, position: { x: number, y: number } }, time: number): void {
  const meshId = 'water-' + water.id;
  let mesh = sceneManager.meshes.get(meshId);
  
  if (!mesh) {
    // Generate a large irregular lake
    const geo = createIrregularLakeGeometry(250);

    const mat = new THREE.ShaderMaterial({
      uniforms: { time: { value: 0.0 } },
      vertexShader,
      fragmentShader,
      transparent: true
    });

    mesh = new THREE.Mesh(geo, mat);
    mesh.position.set(water.position.x, 0, water.position.y);
    mesh.receiveShadow = true;
    
    // Random rotation so the 2 lakes don't look exactly identical
    mesh.rotation.y = Math.random() * Math.PI * 2;
    
    sceneManager.scene.add(mesh);
    sceneManager.meshes.set(meshId, mesh);
  } else {
    // Update shader time for animation
    const mat = (mesh as THREE.Mesh).material as THREE.ShaderMaterial;
    if (mat.uniforms && mat.uniforms.time) {
      mat.uniforms.time.value = time;
    }
  }
}