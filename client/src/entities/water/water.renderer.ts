import * as THREE from 'three';
import type { SceneManager } from '../../core/SceneManager.js';

// ── UPGRADED WATER SHADER — Fresnel + Sun Path + Normal Ripples ────────────

const waterVertexShader = `
  varying vec2 vUv;
  varying vec3 vWorldPosition;
  varying vec3 vViewDir;
  varying vec3 vNormal;

  void main() {
    vUv = uv;
    vec4 worldPos = modelMatrix * vec4(position, 1.0);
    vWorldPosition = worldPos.xyz;

    // View direction (from vertex to camera) in world space
    vViewDir = normalize(cameraPosition - worldPos.xyz);
    vNormal  = normalize((modelMatrix * vec4(normal, 0.0)).xyz);

    gl_Position = projectionMatrix * viewMatrix * worldPos;
  }
`;

const waterFragmentShader = `
  uniform float time;
  uniform vec3  sunDirection;   // normalized sun direction (world space)
  uniform vec3  sunColor;       // sun light color

  varying vec2 vUv;
  varying vec3 vWorldPosition;
  varying vec3 vViewDir;
  varying vec3 vNormal;

  // Simple 2D noise
  float hash(vec2 p) {
    return fract(sin(dot(p, vec2(127.1, 311.7))) * 43758.5453123);
  }
  float smoothNoise(vec2 p) {
    vec2 i = floor(p);
    vec2 f = fract(p);
    vec2 u = f * f * (3.0 - 2.0 * f);
    float a = hash(i);
    float b = hash(i + vec2(1.0, 0.0));
    float c = hash(i + vec2(0.0, 1.0));
    float d = hash(i + vec2(1.0, 1.0));
    return mix(mix(a, b, u.x), mix(c, d, u.x), u.y);
  }
  float fbm(vec2 p) {
    float val = 0.0;
    float amp = 0.5;
    for (int i = 0; i < 4; i++) {
      val += amp * smoothNoise(p);
      p   *= 2.1;
      amp *= 0.5;
    }
    return val;
  }

  void main() {
    // Distance from center for radial depth gradient
    vec2  centeredUv   = vUv - 0.5;
    float distFromCenter = length(centeredUv) * 2.0;

    // ── 1. ANIMATED NORMAL RIPPLES ─────────────────────────────────────────
    // Layer 1: broad gentle swell
    vec2 rippleCoords1 = vUv * 9.0 + vec2(time * 0.08, time * 0.05);
    // Layer 2: finer crossing ripple at slight angle
    vec2 rippleCoords2 = vUv * 17.0 + vec2(-time * 0.13, time * 0.09);

    float ripple1 = fbm(rippleCoords1) * 2.0 - 1.0;
    float ripple2 = fbm(rippleCoords2) * 2.0 - 1.0;
    float combinedRipple = (ripple1 + ripple2 * 0.55) * 0.5;

    // Perturbed surface normal
    vec3 perturbedNormal = normalize(vNormal + vec3(combinedRipple * 0.12, 0.0, combinedRipple * 0.09));

    // ── 2. FRESNEL REFLECTION ──────────────────────────────────────────────
    float fresnel = pow(1.0 - max(0.0, dot(perturbedNormal, vViewDir)), 3.5);
    fresnel = clamp(fresnel, 0.0, 1.0);

    // ── 3. SUN PATH SPECULAR (the glowing lane of light on water) ─────────
    // Reflect sun direction off perturbed water surface
    vec3 reflectedSun = reflect(-sunDirection, perturbedNormal);
    float sunHighlight = pow(max(0.0, dot(reflectedSun, vViewDir)), 180.0);
    // Softer wide halo around the sun path
    float sunHalo      = pow(max(0.0, dot(reflectedSun, vViewDir)), 22.0);

    // Sun path "lane" — stretched directional lane across the water
    float sunLane = sunHalo * 0.38 + sunHighlight * 1.2;
    sunLane = min(sunLane, 1.4); // Cap brightness

    // ── 4. DEPTH COLOR GRADIENT ───────────────────────────────────────────
    vec3 deepColor    = vec3(0.04, 0.26, 0.58);  // Deep sapphire blue
    vec3 midColor     = vec3(0.10, 0.52, 0.78);  // Mid cyan-blue
    vec3 shallowColor = vec3(0.22, 0.75, 0.88);  // Aquamarine shore

    // Radial depth: center = deep, edge = shallow
    vec3 depthColor = mix(deepColor, midColor, smoothstep(0.0, 0.6, distFromCenter));
    depthColor      = mix(depthColor, shallowColor, smoothstep(0.55, 0.95, distFromCenter));

    // Apply ripple brightness variation
    depthColor += combinedRipple * 0.04;

    // ── 5. SUN REFLECTION TINT ────────────────────────────────────────────
    vec3 sunTint = sunColor * sunLane;
    depthColor   = depthColor + sunTint;

    // ── 6. FRESNEL SKY REFLECTION (edges of lake reflect sky blue) ────────
    vec3 skyReflectColor = vec3(0.55, 0.80, 0.95);
    depthColor = mix(depthColor, skyReflectColor, fresnel * 0.45);

    // ── 7. SHORE FOAM RING ────────────────────────────────────────────────
    vec3  foamColor = vec3(0.92, 0.97, 1.0);
    float foam      = smoothstep(0.88, 0.98, distFromCenter)
                    * (0.4 + 0.3 * sin(time * 2.8 + centeredUv.x * 22.0 + centeredUv.y * 18.0));
    depthColor = mix(depthColor, foamColor, foam);

    // ── 8. OPACITY — deep opaque, edges transparent ────────────────────────
    float alpha = mix(0.92, 0.72, smoothstep(0.6, 0.98, distFromCenter));
    // Foam ring is more opaque
    alpha = max(alpha, foam * 0.7);

    gl_FragColor = vec4(depthColor, alpha);
  }
`;

// Organic lake shape (unchanged — already great)
function createOrganicLakeShape(radius: number, scaleMultiplier = 1.0): THREE.BufferGeometry {
  const segments = 80;
  const geo = new THREE.CylinderGeometry(
    radius * scaleMultiplier,
    radius * scaleMultiplier,
    2, segments, 1
  );
  const pos = geo.attributes.position;

  for (let i = 0; i < pos.count; i++) {
    const x = pos.getX(i);
    const z = pos.getZ(i);

    if (Math.abs(x) < 0.1 && Math.abs(z) < 0.1) continue;

    const angle = Math.atan2(z, x);

    const perturb = 1.0
      + 0.14 * Math.sin(angle * 3.0)
      + 0.09 * Math.cos(angle * 5.2)
      + 0.07 * Math.sin(angle * 2.0 + 1.2)
      + 0.05 * Math.cos(angle * 7.0 + 0.4);

    pos.setX(i, x * perturb);
    pos.setZ(i, z * perturb);
  }

  geo.computeVertexNormals();
  return geo;
}

function createLakeEntity(radius: number): THREE.Group {
  const lakeGroup = new THREE.Group();

  const waterGeo = createOrganicLakeShape(radius, 1.0);
  waterGeo.translate(0, -0.5, 0); // Slightly submerged in terrain bowl

  // Sun direction matches SceneManager directional light: (800, 1800, 400) normalized
  const sunDir = new THREE.Vector3(800, 1800, 400).normalize();

  const waterMat = new THREE.ShaderMaterial({
    uniforms: {
      time:         { value: 0.0 },
      sunDirection: { value: sunDir },
      sunColor:     { value: new THREE.Color(0xfff4d6) }, // Match warm sun color
    },
    vertexShader:   waterVertexShader,
    fragmentShader: waterFragmentShader,
    transparent: true,
    depthWrite:  false,
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

    const seedAngle = (water.id.charCodeAt(water.id.length - 1) % 10) * 0.6;
    mesh.rotation.y = seedAngle;

    sceneManager.scene.add(mesh);
    sceneManager.meshes.set(meshId, mesh);
  } else {
    const waterSurface = mesh.getObjectByName('waterSurface') as THREE.Mesh | undefined;
    if (waterSurface) {
      const mat = waterSurface.material as THREE.ShaderMaterial;
      if (mat.uniforms?.time) {
        mat.uniforms.time.value = time;
      }
    }
  }
}