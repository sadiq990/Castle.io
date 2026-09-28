import * as THREE from 'three';

export type LightingRig = {
  ambientLight: THREE.AmbientLight;
  sunLight: THREE.DirectionalLight;
  fillLight: THREE.DirectionalLight;
  timeOfDay: number;
};

export function createLightingRig(scene: THREE.Scene): LightingRig {
  const ambientLight = new THREE.AmbientLight(0xFFF5E0, 0.45);
  scene.add(ambientLight);

  const sunLight = new THREE.DirectionalLight(0xFFF2CC, 1.2);
  sunLight.position.set(800, 1800, 400);
  sunLight.castShadow = true;
  sunLight.shadow.mapSize.width = 2048;
  sunLight.shadow.mapSize.height = 2048;
  sunLight.shadow.bias = -0.0003;
  sunLight.shadow.normalBias = 0.05;
  
  sunLight.shadow.camera.left = -2200;
  sunLight.shadow.camera.right = 2200;
  sunLight.shadow.camera.top = 2200;
  sunLight.shadow.camera.bottom = -2200;
  sunLight.shadow.camera.near = 10;
  sunLight.shadow.camera.far = 5000;
  sunLight.shadow.radius = 2.5;
  scene.add(sunLight);

  const fillLight = new THREE.DirectionalLight(0xC8E8FF, 0.28);
  fillLight.position.set(-400, 600, -800);
  scene.add(fillLight);

  scene.fog = new THREE.Fog(0xBFE3F5, 2000, 6000);

  return {
    ambientLight,
    sunLight,
    fillLight,
    timeOfDay: 0.35
  };
}

export function updateDayNight(rig: LightingRig, time: number, deltaTime: number): void {
  rig.timeOfDay = (time / 600) % 1;
  
  const tod = rig.timeOfDay;
  rig.sunLight.position.set(
    Math.cos(tod * Math.PI * 2) * 2000,
    Math.abs(Math.sin(tod * Math.PI * 2)) * 1800 + 200,
    Math.sin(tod * Math.PI * 2) * 2000
  );

  const sunColor = new THREE.Color();
  if (tod >= 0.0 && tod < 0.25) {
    const t = tod / 0.25;
    sunColor.setHex(0xFF6633).lerp(new THREE.Color(0xFFF2CC), t);
    rig.sunLight.color.copy(sunColor);
    rig.sunLight.intensity = 0.3 + (1.2 - 0.3) * t;
    rig.ambientLight.intensity = 0.15 + (0.45 - 0.15) * t;
  } else if (tod >= 0.25 && tod < 0.75) {
    rig.sunLight.color.setHex(0xFFF2CC);
    rig.sunLight.intensity = 1.2;
    rig.ambientLight.intensity = 0.45;
  } else if (tod >= 0.75 && tod <= 1.0) {
    const t = (tod - 0.75) / 0.25;
    sunColor.setHex(0xFFF2CC).lerp(new THREE.Color(0x1a1a4a), t);
    rig.sunLight.color.copy(sunColor);
    rig.sunLight.intensity = 1.2 - (1.2 - 0.05) * t;
    rig.ambientLight.intensity = 0.45 - (0.45 - 0.15) * t;
  }
}
