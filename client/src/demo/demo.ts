import * as THREE from 'three';
import { PALETTE } from '../assets/palette.js';
import { createCastle, animateCastleFlag, createCastleFlag } from '../models/castle.js';
import { createBuilding } from '../models/buildings.js';
import { createUnit, createSelectionRing, animateUnit } from '../models/units.js';
import { createTree, createRock, createBridge, createShrine, animateShrine, createGoldMine, createBerryBush, createNeutralCamp, animateCampFire } from '../models/nature.js';
import { createLightingRig, updateDayNight } from '../world/lighting.js';
import { initAllLakes, updateAllLakes } from '../world/water.js';
import { createDecorInstances, createRoadMesh } from '../world/decor.js';
import { ParticleSystem, createDustEffect, createSparkEffect } from '../fx/particles.js';
import { FloatingTextManager } from '../fx/floatingText.js';
import { HUDManager } from '../ui/hud.js';
import { RTSCamera } from '../rendering/RTSCamera.js';
import type { GameClientState } from '../state/gameClientState.js';

let demoActive = false;

export function isDemoActive(): boolean {
  return demoActive;
}

export function setDemoActive(v: boolean): void {
  demoActive = v;
}

export function initDemoScene(scene: THREE.Scene, camera: THREE.PerspectiveCamera, renderer: THREE.WebGLRenderer): (timestamp: number) => void {
  setDemoActive(true);

  // 1. Setup lighting
  const lightingRig = createLightingRig(scene);

  // 2. Ground plane
  const groundGeo = new THREE.PlaneGeometry(4500, 4500);
  const groundMat = new THREE.MeshStandardMaterial({
    color: 0x3E8E3A,
    roughness: 0.9,
    metalness: 0,
    flatShading: true
  });
  const ground = new THREE.Mesh(groundGeo, groundMat);
  ground.rotation.x = -Math.PI / 2;
  ground.receiveShadow = true;
  scene.add(ground);

  // 3. Lakes
  const lakeGroups = initAllLakes(scene);

  // 4. Road
  const roadMesh = createRoadMesh(4500);
  scene.add(roadMesh);

  // 5. Two castles
  const blueCastle = createCastle('blue', 2);
  blueCastle.position.set(700, 0, 700);
  blueCastle.scale.setScalar(8);
  scene.add(blueCastle);

  const redCastle = createCastle('red', 2);
  redCastle.position.set(3800, 0, 3800);
  redCastle.scale.setScalar(8);
  scene.add(redCastle);

  // 6. Bridge at center
  const bridge = createBridge();
  bridge.position.set(2250, 0, 2250);
  bridge.scale.setScalar(6);
  bridge.rotation.y = Math.PI / 4;
  scene.add(bridge);

  // 7. Shrine at center
  const shrine = createShrine();
  shrine.position.set(2250, 0, 2100);
  shrine.scale.setScalar(6);
  scene.add(shrine);

  // 8. Neutral camp near center
  const camp = createNeutralCamp();
  camp.position.set(1800, 0, 1800);
  camp.scale.setScalar(5);
  scene.add(camp);

  // 9. Gold mine
  const goldMine = createGoldMine();
  goldMine.position.set(2000, 0, 1200);
  goldMine.scale.setScalar(4);
  scene.add(goldMine);

  // 10. Scatter trees and nature
  const treePositions = [
    {x: 500, z: 1200}, {x: 600, z: 1300}, {x: 400, z: 1100}, {x: 900, z: 1500}, {x: 1000, z: 1400},
    {x: 3500, z: 1000}, {x: 3600, z: 900}, {x: 3400, z: 1100}, {x: 3800, z: 1200}, {x: 3700, z: 1300},
    {x: 1500, z: 3000}, {x: 1600, z: 3100}, {x: 1400, z: 3200}, {x: 1700, z: 2900}, {x: 1800, z: 2800},
    {x: 2500, z: 1000}, {x: 2600, z: 900}, {x: 2400, z: 1100}, {x: 2700, z: 800}, {x: 2800, z: 700},
    {x: 1000, z: 3500}, {x: 1100, z: 3600}, {x: 900, z: 3400}, {x: 1200, z: 3700}, {x: 1300, z: 3800}
  ];
  const treeVariants: ('dark'|'light'|'autumn'|'mushroom')[] = ['dark', 'light', 'autumn', 'mushroom'];
  treePositions.forEach((pos, i) => {
    const variant = treeVariants[i % treeVariants.length]!;
    const tree = createTree(variant);
    tree.position.set(pos.x, 0, pos.z);
    tree.scale.setScalar(6 + Math.random() * 4);
    scene.add(tree);
  });

  // 11. Rocks
  const rockSizes: ('small'|'medium'|'large')[] = ['small', 'medium', 'large', 'small', 'medium', 'large', 'small', 'medium', 'large', 'medium'];
  for (let i = 0; i < 10; i++) {
    const rock = createRock(rockSizes[i]!);
    rock.position.set(1000 + Math.random() * 2500, 0, 1000 + Math.random() * 2500);
    rock.scale.setScalar(5 + Math.random() * 5);
    scene.add(rock);
  }

  // 12. Berry bushes
  for (let i = 0; i < 5; i++) {
    const bush = createBerryBush();
    bush.position.set(1200 + Math.random() * 2000, 0, 1200 + Math.random() * 2000);
    bush.scale.setScalar(4 + Math.random() * 2);
    scene.add(bush);
  }

  // 13. Decorative instances
  createDecorInstances(scene, 4500);

  // 14. Buildings (near blue castle)
  const buildingTypes: import('../models/buildings.js').BuildingType[] = [
    'barracks', 'archery', 'stable', 'catapult', 'farm', 'storage', 'watchtower'
  ];
  const bPositions = [
    {x: 850, z: 700}, {x: 1000, z: 700}, {x: 1150, z: 700}, {x: 1300, z: 700},
    {x: 850, z: 850}, {x: 1000, z: 850}, {x: 1150, z: 850}
  ];
  buildingTypes.forEach((type, i) => {
    const building = createBuilding(type, 'blue', 'ready');
    building.position.set(bPositions[i]!.x, 0, bPositions[i]!.z);
    building.scale.setScalar(8);
    scene.add(building);
  });

  // 15. Units
  type UnitType = 'swordsman' | 'archer' | 'worker';
  interface DemoUnit {
    mesh: THREE.Group;
    type: UnitType;
    team: 'blue' | 'red';
  }

  const blueUnits: DemoUnit[] = [];
  const redUnits: DemoUnit[] = [];

  const createUnitGroup = (team: 'blue'|'red', baseX: number, baseZ: number, arr: DemoUnit[]) => {
    let count = 0;
    for (let i = 0; i < 50; i++) {
      let type: UnitType = 'swordsman';
      if (i >= 30 && i < 40) type = 'archer';
      if (i >= 40) type = 'worker';

      const unitMesh = createUnit(type, team);
      
      const row = Math.floor(i / 10);
      const col = i % 10;
      
      unitMesh.position.set(baseX + col * 20 - 100, 0, baseZ + row * 20 + 150);
      unitMesh.scale.setScalar(6);
      
      const ring = createSelectionRing(team);
      ring.position.y = 0.1;
      unitMesh.add(ring);
      
      scene.add(unitMesh);
      arr.push({ mesh: unitMesh, type, team });
    }
  };

  createUnitGroup('blue', 700, 700, blueUnits);
  createUnitGroup('red', 3800, 3800, redUnits);

  // 16. Particle system & Floating Text
  const particleSystem = new ParticleSystem(scene);
  const floatingTextMgr = new FloatingTextManager(scene);

  // 17. HUD
  const hudManager = new HUDManager();

  // 18. RTS Camera
  const rtsCamera = new RTSCamera(camera, 4500);
  rtsCamera.focusOn({x: 2250, z: 2250});

  // 19. Minimap canvas
  const minimapCanvas = document.createElement('canvas');
  minimapCanvas.width = 160;
  minimapCanvas.height = 160;
  const mmContainer = document.getElementById('minimap-container');
  if (mmContainer) {
    mmContainer.appendChild(minimapCanvas);
  }

  // Variables for loop
  let time = 0;
  let lastTime = 0;

  // Update function
  return function demoUpdate(timestamp: number): void {
    if (!isDemoActive()) return;

    const dt = Math.min(0.05, (timestamp - lastTime) / 1000);
    lastTime = timestamp;
    time += dt;

    // Day/night cycle
    updateDayNight(lightingRig, time, dt);

    // Animate water
    updateAllLakes(lakeGroups, time);

    // Animate shrine
    animateShrine(shrine, time, null);

    // Animate campfire
    animateCampFire(camp, time);

    // Animate castle flags
    const blueFlag = blueCastle.userData.flagGroup as THREE.Group | undefined;
    const redFlag = redCastle.userData.flagGroup as THREE.Group | undefined;
    if (blueFlag) animateCastleFlag(blueFlag, time);
    if (redFlag) animateCastleFlag(redFlag, time);

    // Animate units
    for (const u of blueUnits) animateUnit(u.mesh, time + u.mesh.id * 0.1, 'walk');
    for (const u of redUnits) animateUnit(u.mesh, time + u.mesh.id * 0.1, 'walk');

    // Occasional particle effect
    if (Math.floor(time) % 5 === 0 && dt < 0.02) {
      const pos = new THREE.Vector3(700 + Math.random() * 200, 0, 700 + Math.random() * 200);
      const dust = createDustEffect(pos);
      particleSystem.addEffect(dust);

      floatingTextMgr.showResourcePickup(
        new THREE.Vector3(700 + Math.random() * 100, 2, 700 + Math.random() * 100),
        Math.floor(Math.random() * 10) + 1,
        'wood'
      );
    }

    // Update systems
    particleSystem.update(dt);
    floatingTextMgr.update(dt);
    rtsCamera.update(dt);

    // Update HUD with mock data
    const mockState: Partial<GameClientState> = {
      players: {},
      ctf: {
        flags: {
          blue: { team: 'blue', status: 'AT_HOME', position: {x:700,y:700}, carrierId: null, homePosition: {x:700,y:700}, dropTimer: 0 },
          red:  { team: 'red',  status: 'AT_HOME', position: {x:3800,y:3800}, carrierId: null, homePosition: {x:3800,y:3800}, dropTimer: 0 },
        },
        scores: { blue: 1, red: 0 },
        winner: null,
      },
      mapSize: 4500,
      localPlayerId: null,
    };
    hudManager.update(mockState as GameClientState, { wood: 120, gold: 80, stone: 40, food: 60, population: 42, maxPopulation: 100 });

    // Render
    renderer.render(scene, camera);
  };
}
