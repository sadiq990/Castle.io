import * as THREE from 'three';
import { PALETTE } from '../assets/palette.js';

export type ParticleEffect = {
  points: THREE.Points;
  velocity: Float32Array;
  life: Float32Array;
  maxLife: number;
  alive: boolean;
};

export function createDustEffect(position: THREE.Vector3, count: number = 30): ParticleEffect {
  const geometry = new THREE.BufferGeometry();
  const positions = new Float32Array(count * 3);
  const velocities = new Float32Array(count * 3);
  const lifetimes = new Float32Array(count);
  
  for (let i = 0; i < count; i++) {
    positions[i * 3] = position.x + (Math.random() * 2 - 1);
    positions[i * 3 + 1] = position.y + (Math.random() * 0.4 + 0.1);
    positions[i * 3 + 2] = position.z + (Math.random() * 2 - 1);
    
    velocities[i * 3] = (Math.random() * 2 - 1) * 0.5;
    velocities[i * 3 + 1] = Math.random() * 0.5 + 0.2;
    velocities[i * 3 + 2] = (Math.random() * 2 - 1) * 0.5;
    
    lifetimes[i] = 0.8;
  }
  
  geometry.setAttribute('position', new THREE.BufferAttribute(positions, 3));
  
  const material = new THREE.PointsMaterial({
    color: 0xC8B89A,
    size: 0.4,
    transparent: true,
    depthWrite: false
  });
  
  const points = new THREE.Points(geometry, material);
  
  return {
    points,
    velocity: velocities,
    life: lifetimes,
    maxLife: 0.8,
    alive: true
  };
}

export function createSparkEffect(position: THREE.Vector3, count: number = 20): ParticleEffect {
  const geometry = new THREE.BufferGeometry();
  const positions = new Float32Array(count * 3);
  const velocities = new Float32Array(count * 3);
  const lifetimes = new Float32Array(count);
  
  for (let i = 0; i < count; i++) {
    positions[i * 3] = position.x;
    positions[i * 3 + 1] = position.y;
    positions[i * 3 + 2] = position.z;
    
    velocities[i * 3] = (Math.random() * 2 - 1) * 5;
    velocities[i * 3 + 1] = (Math.random() * 2 - 1) * 5;
    velocities[i * 3 + 2] = (Math.random() * 2 - 1) * 5;
    
    lifetimes[i] = 0.4;
  }
  
  geometry.setAttribute('position', new THREE.BufferAttribute(positions, 3));
  
  const material = new THREE.PointsMaterial({
    color: 0xFFDD44,
    size: 0.25,
    transparent: true,
    depthWrite: false
  });
  
  const points = new THREE.Points(geometry, material);
  
  return {
    points,
    velocity: velocities,
    life: lifetimes,
    maxLife: 0.4,
    alive: true
  };
}

export function createArrowTrail(start: THREE.Vector3, end: THREE.Vector3): THREE.Line {
  const points = [start, end];
  const geometry = new THREE.BufferGeometry().setFromPoints(points);
  const material = new THREE.LineBasicMaterial({
    color: 0x8B6340,
    linewidth: 1
  });
  const line = new THREE.Line(geometry, material);
  return line;
}

export function createExplosionEffect(position: THREE.Vector3, radius: number = 1): ParticleEffect {
  const count = 60;
  const geometry = new THREE.BufferGeometry();
  const positions = new Float32Array(count * 3);
  const velocities = new Float32Array(count * 3);
  const lifetimes = new Float32Array(count);
  const colors = new Float32Array(count * 3);
  const sizes = new Float32Array(count);
  
  const dustColor = new THREE.Color(0xB89A6A);
  const rockColor = new THREE.Color(0x888888);
  
  for (let i = 0; i < count; i++) {
    positions[i * 3] = position.x + (Math.random() * 2 - 1) * radius * 0.5;
    positions[i * 3 + 1] = position.y + (Math.random() * radius * 0.5);
    positions[i * 3 + 2] = position.z + (Math.random() * 2 - 1) * radius * 0.5;
    
    velocities[i * 3] = (Math.random() * 2 - 1) * 8;
    velocities[i * 3 + 1] = Math.random() * 8 + 2;
    velocities[i * 3 + 2] = (Math.random() * 2 - 1) * 8;
    
    lifetimes[i] = 1.2;
    
    const color = Math.random() > 0.5 ? dustColor : rockColor;
    colors[i * 3] = color.r;
    colors[i * 3 + 1] = color.g;
    colors[i * 3 + 2] = color.b;
    
    sizes[i] = Math.random() * 0.5 + 0.3;
  }
  
  geometry.setAttribute('position', new THREE.BufferAttribute(positions, 3));
  geometry.setAttribute('color', new THREE.BufferAttribute(colors, 3));
  geometry.setAttribute('size', new THREE.BufferAttribute(sizes, 1));
  
  const material = new THREE.PointsMaterial({
    vertexColors: true,
    size: 0.5,
    transparent: true,
    depthWrite: false
  });
  
  const points = new THREE.Points(geometry, material);
  
  return {
    points,
    velocity: velocities,
    life: lifetimes,
    maxLife: 1.2,
    alive: true
  };
}

export function createLevelUpEffect(position: THREE.Vector3): ParticleEffect {
  const count = 80;
  const geometry = new THREE.BufferGeometry();
  const positions = new Float32Array(count * 3);
  const velocities = new Float32Array(count * 3);
  const lifetimes = new Float32Array(count);
  
  for (let i = 0; i < count; i++) {
    const angle = Math.random() * Math.PI * 2;
    const r = Math.random() * 2;
    positions[i * 3] = position.x + Math.cos(angle) * r;
    positions[i * 3 + 1] = position.y;
    positions[i * 3 + 2] = position.z + Math.sin(angle) * r;
    
    velocities[i * 3] = Math.cos(angle) * 0.5;
    velocities[i * 3 + 1] = Math.random() * 2 + 1;
    velocities[i * 3 + 2] = Math.sin(angle) * 0.5;
    
    lifetimes[i] = 2.0;
  }
  
  geometry.setAttribute('position', new THREE.BufferAttribute(positions, 3));
  
  const material = new THREE.PointsMaterial({
    color: 0xF5C542,
    size: 0.35,
    transparent: true,
    depthWrite: false
  });
  
  const points = new THREE.Points(geometry, material);
  
  return {
    points,
    velocity: velocities,
    life: lifetimes,
    maxLife: 2.0,
    alive: true
  };
}

export function createFlagCaptureEffect(position: THREE.Vector3, team: 'blue' | 'red'): ParticleEffect {
  const count = 50;
  const geometry = new THREE.BufferGeometry();
  const positions = new Float32Array(count * 3);
  const velocities = new Float32Array(count * 3);
  const lifetimes = new Float32Array(count);
  
  for (let i = 0; i < count; i++) {
    positions[i * 3] = position.x;
    positions[i * 3 + 1] = position.y + 1;
    positions[i * 3 + 2] = position.z;
    
    const theta = Math.random() * Math.PI * 2;
    const phi = Math.acos(Math.random() * 2 - 1);
    const speed = Math.random() * 5 + 2;
    
    velocities[i * 3] = speed * Math.sin(phi) * Math.cos(theta);
    velocities[i * 3 + 1] = speed * Math.cos(phi);
    velocities[i * 3 + 2] = speed * Math.sin(phi) * Math.sin(theta);
    
    lifetimes[i] = 1.0;
  }
  
  geometry.setAttribute('position', new THREE.BufferAttribute(positions, 3));
  
  const material = new THREE.PointsMaterial({
    color: team === 'blue' ? 0x2F7BFF : 0xFF3B3B,
    size: 0.3,
    transparent: true,
    depthWrite: false
  });
  
  const points = new THREE.Points(geometry, material);
  
  return {
    points,
    velocity: velocities,
    life: lifetimes,
    maxLife: 1.0,
    alive: true
  };
}

export function createFloatingResourceText(position: THREE.Vector3, amount: number, resourceType: 'wood' | 'gold' | 'stone' | 'food'): THREE.Sprite {
  const canvas = document.createElement('canvas');
  canvas.width = 128;
  canvas.height = 64;
  const ctx = canvas.getContext('2d');
  
  if (ctx) {
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    ctx.font = 'bold 36px Arial';
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    
    switch (resourceType) {
      case 'gold': ctx.fillStyle = 'yellow'; break;
      case 'wood': ctx.fillStyle = 'brown'; break;
      case 'stone': ctx.fillStyle = 'gray'; break;
      case 'food': ctx.fillStyle = 'green'; break;
    }
    
    ctx.fillText(`+${amount}`, canvas.width / 2, canvas.height / 2);
  }
  
  const texture = new THREE.CanvasTexture(canvas);
  const material = new THREE.SpriteMaterial({ map: texture, transparent: true, depthWrite: false });
  const sprite = new THREE.Sprite(material);
  
  sprite.position.copy(position);
  sprite.scale.set(1.5, 0.75, 1);
  sprite.userData = { velocity: { y: 1.5 }, life: 1.5 };
  
  return sprite;
}

export function updateParticleEffect(effect: ParticleEffect, deltaTime: number, gravity: number = -9.8 * 0.3): void {
  if (!effect.alive) return;
  
  const positions = effect.points.geometry.attributes['position']!.array as Float32Array;
  let allDead = true;
  
  for (let i = 0; i < effect.life.length; i++) {
    if (effect.life[i]! > 0) {
      allDead = false;
      effect.life[i] = effect.life[i]! - deltaTime;
      
      effect.velocity[i * 3 + 1] = effect.velocity[i * 3 + 1]! + gravity * deltaTime;
      
      positions[i * 3] = positions[i * 3]! + effect.velocity[i * 3]! * deltaTime;
      positions[i * 3 + 1] = positions[i * 3 + 1]! + effect.velocity[i * 3 + 1]! * deltaTime;
      positions[i * 3 + 2] = positions[i * 3 + 2]! + effect.velocity[i * 3 + 2]! * deltaTime;
    } else {
      positions[i * 3] = 99999;
      positions[i * 3 + 1] = 99999;
      positions[i * 3 + 2] = 99999;
    }
  }
  
  effect.points.geometry.attributes['position']!.needsUpdate = true;
  
  if (allDead) {
    effect.alive = false;
  }
  
  if (effect.points.material instanceof THREE.Material) {
    const material = effect.points.material as THREE.PointsMaterial;
    const maxLife = effect.maxLife;
    const avgLife = effect.life.reduce((a, b) => a + (b > 0 ? b : 0), 0) / effect.life.length;
    material.opacity = Math.max(0, avgLife / maxLife);
  }
}

export function updateFloatingText(sprite: THREE.Sprite, deltaTime: number): boolean {
  sprite.position.y += sprite.userData.velocity.y * deltaTime;
  sprite.userData.life -= deltaTime;
  sprite.material.opacity = Math.max(0, sprite.userData.life / 1.5);
  
  return sprite.userData.life > 0;
}

export class ParticleSystem {
  private effects: ParticleEffect[] = [];
  private sprites: THREE.Sprite[] = [];
  private scene: THREE.Scene;

  constructor(scene: THREE.Scene) {
    this.scene = scene;
  }

  addEffect(effect: ParticleEffect): void {
    this.effects.push(effect);
    this.scene.add(effect.points);
  }

  addFloatingText(sprite: THREE.Sprite): void {
    this.sprites.push(sprite);
    this.scene.add(sprite);
  }

  update(deltaTime: number): void {
    for (let i = this.effects.length - 1; i >= 0; i--) {
      const effect = this.effects[i]!;
      updateParticleEffect(effect, deltaTime);
      if (!effect.alive) {
        this.scene.remove(effect.points);
        effect.points.geometry.dispose();
        if (Array.isArray(effect.points.material)) {
            effect.points.material.forEach(m => m.dispose());
        } else {
            effect.points.material.dispose();
        }
        this.effects.splice(i, 1);
      }
    }

    for (let i = this.sprites.length - 1; i >= 0; i--) {
      const sprite = this.sprites[i]!;
      const alive = updateFloatingText(sprite, deltaTime);
      if (!alive) {
        this.scene.remove(sprite);
        if (sprite.material.map) {
          sprite.material.map.dispose();
        }
        sprite.material.dispose();
        this.sprites.splice(i, 1);
      }
    }
  }

  clear(): void {
    this.effects.forEach(effect => {
      this.scene.remove(effect.points);
      effect.points.geometry.dispose();
      if (Array.isArray(effect.points.material)) {
        effect.points.material.forEach(m => m.dispose());
      } else {
        effect.points.material.dispose();
      }
    });
    this.effects = [];

    this.sprites.forEach(sprite => {
      this.scene.remove(sprite);
      if (sprite.material.map) {
        sprite.material.map.dispose();
      }
      sprite.material.dispose();
    });
    this.sprites = [];
  }
}
