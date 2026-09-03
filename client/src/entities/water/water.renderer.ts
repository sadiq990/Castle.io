import * as THREE from 'three';
import type { SceneManager } from '../../core/SceneManager.js';

const waterVertexShader = `
  varying vec2 vUv;
  varying vec3 vWorldPosition;
  void main() {
    vUv = uv;
    vec4 worldPos = modelMatrix * vec4(position, 1.0);
    vWorldPosition = worldPos.xyz;
    gl_Position = projectionMatrix * viewMatrix * worldPos;
  }
`;

const waterFragmentShader = `
  uniform float time;
  varying vec2 vUv;
  varying vec3 vWorldPosition;

  void main() {
    // Distance from center for radial depth
    vec2 centeredUv = vUv - 0.5;
    float distFromCenter = length(centeredUv) * 2.0;

    // Dual-wave interference pattern
    vec2 waveCoords = vUv * 16.0;
    float w1 = sin(waveCoords.x + time * 1.1) * cos(waveCoords.y + time * 1.3);
    float w2 = sin(waveCoords.x * 1.8 - time * 0.9) * cos(waveCoords.y * 1.6 + time * 1.2);
    float wave = (w1 + w2) * 0.5;

    // Water depth colors
    vec3 deepWaterColor    = vec3(0.05, 0.32, 0.68); // Deep sapphire blue
    vec3 shallowWaterColor = vec3(0.15, 0.68, 0.88); // Cyan / aquamarine shore
    vec3 foamColor         = vec3(0.85, 0.95, 1.0);  // Soft white foam

    // Mix based on depth and gentle wave crests
    vec3 waterColor = mix(deepWaterColor, shallowWaterColor, smoothstep(0.15, 0.95, distFromCenter));

    // Dynamic wave ripples & highlights
    float ripple = smoothstep(0.2, 0.55, wave);
    waterColor = mix(waterColor, shallowWaterColor * 1.2, ripple * 0.4);

    // Sun reflection / specular glint
    float sunGlint = pow(max(0.0, wave), 4.0) * 0.45;
    waterColor += vec3(sunGlint);

    // Gentle shore foam ring
    float shoreFoam = smoothstep(0.85, 0.98, distFromCenter) * (0.35 + 0.25 * sin(time * 3.0 + centeredUv.x * 20.0));
    waterColor = mix(waterColor, foamColor, shoreFoam);

    gl_FragColor = vec4(waterColor, 0.88);
  }
`;

// Generates an organic curving natural lake boundary
function createOrganicLakeShape(radius: number, scaleMultiplier = 1.0): THREE.BufferGeometry {
  const segments = 72;
  const geo = new THREE.CylinderGeometry(radius * scaleMultiplier, radius * scaleMultiplier, 2, segments, 1);
  const pos = geo.attributes.position;

  for (let i = 0; i < pos.count; i++) {
    const x = pos.getX(i);
    const z = pos.getZ(i);

    // Skip top/bottom center vertices
    if (Math.abs(x) < 0.1 && Math.abs(z) < 0.1) continue;

    const angle = Math.atan2(z, x);

    // Smooth harmonic organic waves (natural curved bay & lagoon profile)
    const perturbation = 1.0
      + 0.15 * Math.sin(angle * 3.0)
      + 0.10 * Math.cos(angle * 5.0)
      + 0.08 * Math.sin(angle * 2.0 + 1.2);

    pos.setX(i, x * perturbation);
    pos.setZ(i, z * perturbation);
  }

  geo.computeVertexNormals();
  return geo;
}

function createLakeEntity(radius: number): THREE.Group {
  const lakeGroup = new THREE.Group();

  // Animated Crystal Water Surface
  const waterGeo = createOrganicLakeShape(radius, 1.0);
  waterGeo.translate(0, -0.3, 0); // Sits cleanly submerged inside terrain lake depression

  const waterMat = new THREE.ShaderMaterial({
    uniforms: {
      time: { value: 0.0 },
    },
    vertexShader: waterVertexShader,
    fragmentShader: waterFragmentShader,
    transparent: true,
  });

  const waterMesh = new THREE.Mesh(waterGeo, waterMat);
  waterMesh.name = 'waterSurface';
  waterMesh.receiveShadow = true;
  lakeGroup.add(waterMesh);

  return lakeGroup;
}

export function updateWater3D(
  sceneManager: SceneManager,
  water: { id: string; position: { x: number; y: number }; radius?: number },
  time: number
): void {
  const meshId = 'water-' + water.id;
  let mesh = sceneManager.meshes.get(meshId);

  if (!mesh) {
    const radius = water.radius ?? 250;
    mesh = createLakeEntity(radius);
    mesh.position.set(water.position.x, 0, water.position.y);

    // Deterministic rotation based on id so shape stays fixed
    const seedAngle = (water.id.charCodeAt(water.id.length - 1) % 10) * 0.6;
    mesh.rotation.y = seedAngle;

    sceneManager.scene.add(mesh);
    sceneManager.meshes.set(meshId, mesh);
  } else {
    // Update shader time for gentle wave motion
    const waterSurface = mesh.getObjectByName('waterSurface') as THREE.Mesh | undefined;
    if (waterSurface) {
      const mat = waterSurface.material as THREE.ShaderMaterial;
      if (mat.uniforms?.time) {
        mat.uniforms.time.value = time;
      }
    }
  }
}