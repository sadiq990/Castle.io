import * as THREE from 'three';

export type FloatingTextConfig = {
  text: string;
  color: string;
  position: THREE.Vector3;
  size?: number;
  duration?: number;
};

export function createFloatingText(config: FloatingTextConfig): THREE.Sprite {
  const canvas = document.createElement('canvas');
  canvas.width = 256;
  canvas.height = 128;
  const ctx = canvas.getContext('2d');
  
  if (ctx) {
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    ctx.font = 'bold 48px Arial';
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.fillStyle = config.color;
    // Outline for better visibility
    ctx.strokeStyle = 'black';
    ctx.lineWidth = 4;
    ctx.strokeText(config.text, canvas.width / 2, canvas.height / 2);
    ctx.fillText(config.text, canvas.width / 2, canvas.height / 2);
  }
  
  const texture = new THREE.CanvasTexture(canvas);
  const material = new THREE.SpriteMaterial({ map: texture, transparent: true, depthWrite: false });
  const sprite = new THREE.Sprite(material);
  
  sprite.position.copy(config.position);
  
  const scale = config.size || 1.5;
  sprite.scale.set(scale * 2, scale, 1);
  
  const duration = config.duration || 2.0;
  sprite.userData = { 
    life: duration, 
    maxLife: duration, 
    velocity: new THREE.Vector3(0, 2, 0) 
  };
  
  return sprite;
}

export class FloatingTextManager {
  private sprites: THREE.Sprite[] = [];
  private scene: THREE.Scene;

  constructor(scene: THREE.Scene) {
    this.scene = scene;
  }

  add(config: FloatingTextConfig): void {
    const sprite = createFloatingText(config);
    this.sprites.push(sprite);
    this.scene.add(sprite);
  }

  showResourcePickup(position: THREE.Vector3, amount: number, type: 'wood' | 'gold' | 'stone' | 'food'): void {
    let color = 'white';
    let icon = '';
    
    switch (type) {
      case 'wood': color = '#8B4513'; icon = '🪵'; break;
      case 'gold': color = '#FFD700'; icon = '💰'; break;
      case 'stone': color = '#808080'; icon = '🪨'; break;
      case 'food': color = '#32CD32'; icon = '🌾'; break;
    }
    
    this.add({
      text: `+${amount} ${icon}`,
      color,
      position: position.clone().add(new THREE.Vector3(0, 1, 0)),
      size: 1.5,
      duration: 2.0
    });
  }

  showDamage(position: THREE.Vector3, damage: number): void {
    this.add({
      text: `-${damage}`,
      color: '#FF0000',
      position: position.clone().add(new THREE.Vector3(0, 1, 0)),
      size: 1.2,
      duration: 1.5
    });
  }

  showNotification(position: THREE.Vector3, text: string, color: string = '#FFFFFF'): void {
    this.add({
      text,
      color,
      position: position.clone().add(new THREE.Vector3(0, 2, 0)),
      size: 1.8,
      duration: 3.0
    });
  }

  update(deltaTime: number): void {
    for (let i = this.sprites.length - 1; i >= 0; i--) {
      const sprite = this.sprites[i]!;
      
      sprite.position.addScaledVector(sprite.userData.velocity, deltaTime);
      sprite.userData.life -= deltaTime;
      
      const opacity = Math.max(0, sprite.userData.life / sprite.userData.maxLife);
      sprite.material.opacity = opacity;
      
      if (sprite.userData.life <= 0) {
        this.scene.remove(sprite);
        if (sprite.material.map) {
          sprite.material.map.dispose();
        }
        sprite.material.dispose();
        this.sprites.splice(i, 1);
      }
    }
  }
}
