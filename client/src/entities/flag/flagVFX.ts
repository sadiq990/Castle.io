import * as THREE from 'three';
import type { SceneManager } from '../../core/SceneManager.js';
import type { GameClientState } from '../../state/gameClientState.js';

interface TrailParticle {
  mesh: THREE.Mesh;
  life: number;
  maxLife: number;
  velocity: THREE.Vector3;
}

const activeParticles: TrailParticle[] = [];
let lastTrailEmit = 0;

export function updateFlagVFX(
  sceneManager: SceneManager,
  state: GameClientState,
  time: number
): void {
  const flags = Object.values(state.ctf.flags);

  // ── 1. CARRIER TRAIL PARTICLES ────────────────────────────
  for (const flag of flags) {
    if (flag.status === 'CARRIED' && flag.carrierId) {
      const carrier = state.players[flag.carrierId];
      if (!carrier) continue;

      // Emit particle every 0.09s (~11 particles/sec)
      if (time - lastTrailEmit > 0.09) {
        lastTrailEmit = time;

        const isBlue = flag.team === 'blue';
        const particleGeo = new THREE.SphereGeometry(2.5, 4, 4);
        const particleMat = new THREE.MeshBasicMaterial({
          color: isBlue ? 0x60A5FA : 0xF87171,
          transparent: true,
          opacity: 0.8,
        });

        const pMesh = new THREE.Mesh(particleGeo, particleMat);
        pMesh.position.set(
          carrier.position.x + (Math.random() - 0.5) * 6,
          2.0 + Math.random() * 2,
          carrier.position.y + (Math.random() - 0.5) * 6
        );

        sceneManager.scene.add(pMesh);

        activeParticles.push({
          mesh: pMesh,
          life: 0,
          maxLife: 0.65, // lives for 0.65 seconds
          velocity: new THREE.Vector3(
            (Math.random() - 0.5) * 8,
            6 + Math.random() * 8,
            (Math.random() - 0.5) * 8
          ),
        });
      }
    }
  }

  // ── 2. UPDATE & CLEANUP PARTICLES ─────────────────────────
  const dt = 0.016; // approximate frame dt
  for (let i = activeParticles.length - 1; i >= 0; i--) {
    const p = activeParticles[i];
    p.life += dt;

    // Movement & fading
    p.mesh.position.addScaledVector(p.velocity, dt);
    const progress = p.life / p.maxLife;
    const scale = Math.max(0.1, 1.0 - progress);
    p.mesh.scale.set(scale, scale, scale);

    (p.mesh.material as THREE.MeshBasicMaterial).opacity = 0.8 * (1.0 - progress);

    if (p.life >= p.maxLife) {
      sceneManager.scene.remove(p.mesh);
      p.mesh.geometry.dispose();
      (p.mesh.material as THREE.Material).dispose();
      activeParticles.splice(i, 1);
    }
  }
}