import * as THREE from 'three';

const oceanVertexShader = `
  varying vec2 vUv;
  varying vec3 vWorldPosition;
  uniform float time;

  void main() {
    vUv = uv;
    vec3 pos = position;
    
    // Gentle rolling swell on the ocean surface
    float wave1 = sin(pos.x * 0.008 + time * 1.2) * cos(pos.y * 0.008 + time * 0.9) * 1.2;
    float wave2 = sin(pos.x * 0.015 - time * 1.5) * cos(pos.y * 0.012 + time * 1.1) * 0.6;
    pos.z += wave1 + wave2;

    vec4 worldPos = modelMatrix * vec4(pos, 1.0);
    vWorldPosition = worldPos.xyz;
    gl_Position = projectionMatrix * viewMatrix * worldPos;
  }
`;

const oceanFragmentShader = `
  uniform float time;
  varying vec2 vUv;
  varying vec3 vWorldPosition;

  void main() {
    // Distance from map center (1500, 1500)
    vec2 center = vec2(1500.0, 1500.0);
    float distFromCenter = length(vWorldPosition.xz - center);

    // Multi-frequency caustic wave pattern
    vec2 waveCoord = vWorldPosition.xz * 0.018;
    float w1 = sin(waveCoord.x + time * 1.1) * cos(waveCoord.y + time * 0.9);
    float w2 = sin(waveCoord.x * 2.2 - time * 1.3) * cos(waveCoord.y * 1.8 + time * 1.4);
    float wave = (w1 + w2) * 0.5;

    // Water depth colors
    vec3 deepOceanColor    = vec3(0.04, 0.28, 0.56); // Deep sapphire ocean
    vec3 midOceanColor     = vec3(0.08, 0.44, 0.72); // Open sea blue
    vec3 shallowCoastColor = vec3(0.18, 0.68, 0.85); // Tropical turquoise coastal water
    vec3 foamColor         = vec3(0.92, 0.97, 1.0);  // Crisp white surf foam

    // Coast proximity blend (island edge is ~1600-1800 from center)
    float coastFactor = smoothstep(2400.0, 1550.0, distFromCenter);
    vec3 waterColor = mix(deepOceanColor, midOceanColor, 0.5 + wave * 0.2);
    waterColor = mix(waterColor, shallowCoastColor, coastFactor * 0.85);

    // Dynamic wave ripples & highlights
    float ripple = smoothstep(0.25, 0.6, wave);
    waterColor = mix(waterColor, shallowCoastColor * 1.15, ripple * 0.35);

    // Sun specular glint
    float sunGlint = pow(max(0.0, wave), 5.0) * 0.55;
    waterColor += vec3(sunGlint);

    // Coastal surf foam ring near island edges
    if (distFromCenter < 1950.0 && distFromCenter > 1520.0) {
      float foamBand = sin(distFromCenter * 0.12 - time * 2.5) * 0.5 + 0.5;
      float foamMask = smoothstep(1950.0, 1700.0, distFromCenter) * smoothstep(1520.0, 1650.0, distFromCenter);
      waterColor = mix(waterColor, foamColor, foamBand * foamMask * 0.45);
    }

    gl_FragColor = vec4(waterColor, 0.92);
  }
`;

let oceanMesh: THREE.Mesh | null = null;
let oceanMaterial: THREE.ShaderMaterial | null = null;

export function createOceanMesh(center = { x: 1500, y: 1500 }): THREE.Mesh {
  // Vast 14,000 x 14,000 ocean extending to the horizon
  const geo = new THREE.PlaneGeometry(14000, 14000, 128, 128);
  geo.rotateX(-Math.PI / 2); // Lay horizontal
  geo.translate(center.x, 0, center.y);

  oceanMaterial = new THREE.ShaderMaterial({
    uniforms: {
      time: { value: 0.0 },
    },
    vertexShader: oceanVertexShader,
    fragmentShader: oceanFragmentShader,
    transparent: true,
    depthWrite: true,
  });

  oceanMesh = new THREE.Mesh(geo, oceanMaterial);
  oceanMesh.position.y = -1.2; // Sits at sea level
  oceanMesh.receiveShadow = true;
  return oceanMesh;
}

export function updateOcean(time: number): void {
  if (oceanMaterial?.uniforms?.time) {
    oceanMaterial.uniforms.time.value = time;
  }
}