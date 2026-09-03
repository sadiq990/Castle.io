import * as THREE from 'three';
import type { SceneManager } from '../../core/SceneManager.js';
import type { FlagState, Team } from 'shared/types/entities.js';
import type { GameClientState } from '../../state/gameClientState.js';
import { getTerrainHeight } from '../../terrain/TerrainGenerator.js';

const flagVertexShader = `
  uniform float time;
  varying vec2 vUv;
  void main() {
    vUv = uv;
    vec3 pos = position;
    // Cloth waving effect along Z, amplitude increasing towards tip (uv.x)
    pos.z += sin(pos.x * 0.22 + time * 3.8) * 3.8 * uv.x;
    gl_Position = projectionMatrix * modelViewMatrix * vec4(pos, 1.0);
  }
`;

const flagFragmentShader = `
  uniform vec3 baseColor;
  uniform vec3 trimColor;
  varying vec2 vUv;
  void main() {
    // Glowing border trim on edges
    float edge = step(0.92, vUv.x) + step(vUv.y, 0.08) + step(0.92, vUv.y);
    vec3 col = mix(baseColor, trimColor, clamp(edge, 0.0, 1.0));
    gl_FragColor = vec4(col, 1.0);
  }
`;

function createFlagMesh(team: Team): THREE.Group {
  const group = new THREE.Group();

  const isBlue = team === 'blue';
  const baseColor = isBlue ? new THREE.Color(0x3B82F6) : new THREE.Color(0xEF4444);
  const trimColor = isBlue ? new THREE.Color(0x60A5FA) : new THREE.Color(0xF87171);

  // 1. Flagpole (dark polished wood with golden cap)
  const poleGeo = new THREE.CylinderGeometry(2, 2.5, 60, 8);
  const poleMat = new THREE.MeshStandardMaterial({ color: 0x4a3728, roughness: 0.7 });
  const pole = new THREE.Mesh(poleGeo, poleMat);
  pole.position.y = 30;
  pole.castShadow = true;
  group.add(pole);

  // Gold Finial Ball on top
  const ballGeo = new THREE.SphereGeometry(3.5, 8, 8);
  const ballMat = new THREE.MeshStandardMaterial({ color: 0xffd700, roughness: 0.3, metalness: 0.8 });
  const ball = new THREE.Mesh(ballGeo, ballMat);
  ball.position.y = 60;
  group.add(ball);

  // 2. Triangular Waving Cloth Banner
  // 38 width, 24 height triangular shape
  const clothGeo = new THREE.PlaneGeometry(38, 24, 12, 8);
  // Shift pivot so left edge begins exactly at x = 0
  clothGeo.translate(19, 0, 0);

  const clothMat = new THREE.ShaderMaterial({
    uniforms: {
      time: { value: 0.0 },
      baseColor: { value: baseColor },
      trimColor: { value: trimColor },
    },
    vertexShader: flagVertexShader,
    fragmentShader: flagFragmentShader,
    side: THREE.DoubleSide,
  });

  const cloth = new THREE.Mesh(clothGeo, clothMat);
  cloth.name = 'cloth';
  // Flush with the outer surface of the 2.0 radius pole
  cloth.position.set(2.0, 46, 0);
  cloth.castShadow = true;
  group.add(cloth);

  // 3. Metallic Attachment Clips (Rings binding cloth to flagpole)
  const clipMat = new THREE.MeshStandardMaterial({
    color: 0xffd700,
    metalness: 0.85,
    roughness: 0.25,
  });
  const clipHeights = [35, 46, 57];
  for (const ch of clipHeights) {
    const ringGeo = new THREE.CylinderGeometry(2.8, 2.8, 1.8, 12);
    const ring = new THREE.Mesh(ringGeo, clipMat);
    ring.position.set(0, ch, 0);
    group.add(ring);
  }

  // 3. Ground Pulsing Halo Ring (used when DROPPED)
  const ringGeo = new THREE.RingGeometry(18, 24, 32);
  ringGeo.rotateX(-Math.PI / 2);
  const ringMat = new THREE.MeshBasicMaterial({
    color: trimColor,
    transparent: true,
    opacity: 0.0, // hidden by default
    side: THREE.DoubleSide,
  });
  const haloRing = new THREE.Mesh(ringGeo, ringMat);
  haloRing.name = 'haloRing';
  haloRing.position.y = 0.5;
  group.add(haloRing);

  return group;
}

export function updateFlag3D(
  sceneManager: SceneManager,
  flag: FlagState,
  state: GameClientState,
  time: number
): void {
  const meshId = 'ctf-flag-' + flag.team;
  let mesh = sceneManager.meshes.get(meshId) as THREE.Group | undefined;

  if (!mesh) {
    mesh = createFlagMesh(flag.team);
    sceneManager.scene.add(mesh);
    sceneManager.meshes.set(meshId, mesh);
  }

  // Update cloth wind animation
  const cloth = mesh.getObjectByName('cloth') as THREE.Mesh | undefined;
  if (cloth) {
    const mat = cloth.material as THREE.ShaderMaterial;
    if (mat.uniforms?.time) {
      mat.uniforms.time.value = time;
    }
  }

  const haloRing = mesh.getObjectByName('haloRing') as THREE.Mesh | undefined;

  // ── AT_HOME STATE ──────────────────────────────────────────
  if (flag.status === 'AT_HOME') {
    mesh.visible = true;
    mesh.scale.set(1.1, 1.1, 1.1);
    // Planted firmly on the central castle keep roof (roof is at y = 110)
    const homeY = getTerrainHeight(flag.homePosition.x, flag.homePosition.y) + 110;
    mesh.position.set(flag.homePosition.x, homeY, flag.homePosition.y);
    mesh.rotation.set(0, 0, 0);

    if (haloRing) {
      (haloRing.material as THREE.MeshBasicMaterial).opacity = 0.0;
    }
  }

  // ── CARRIED STATE ──────────────────────────────────────────
  else if (flag.status === 'CARRIED' && flag.carrierId) {
    const carrier = state.players[flag.carrierId];
    if (carrier) {
      mesh.visible = true;
      mesh.scale.set(0.65, 0.65, 0.65);

      const facing = carrier.facing ?? 0;
      const backOffsetX = -Math.cos(facing) * 10;
      const backOffsetZ = -Math.sin(facing) * 10;
      const carrierY = getTerrainHeight(carrier.position.x, carrier.position.y) + 14.0;

      mesh.position.set(
        carrier.position.x + backOffsetX,
        carrierY,
        carrier.position.y + backOffsetZ
      );

      mesh.rotation.y = -facing + Math.PI / 2;
      mesh.rotation.x = 0.25 + Math.sin(time * 6.0) * 0.08;
      mesh.rotation.z = Math.cos(time * 6.0) * 0.08;
    } else {
      mesh.visible = false;
    }

    if (haloRing) {
      (haloRing.material as THREE.MeshBasicMaterial).opacity = 0.0;
    }
  }

  // ── DROPPED STATE ──────────────────────────────────────────
  else if (flag.status === 'DROPPED') {
    mesh.visible = true;
    mesh.scale.set(0.9, 0.9, 0.9);
    const floatY = 2 + Math.sin(time * 3.0) * 2;
    const groundY = getTerrainHeight(flag.position.x, flag.position.y);
    mesh.position.set(flag.position.x, groundY + floatY, flag.position.y);
    mesh.rotation.y = time * 1.5;
    mesh.rotation.x = 0.1;
    mesh.rotation.z = 0;

    if (haloRing) {
      const ringMat = haloRing.material as THREE.MeshBasicMaterial;
      ringMat.opacity = 0.4 + Math.sin(time * 4.0) * 0.25;
      const ringScale = 1.0 + Math.sin(time * 4.0) * 0.15;
      haloRing.scale.set(ringScale, 1, ringScale);
    }
  }
}