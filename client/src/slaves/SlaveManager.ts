import * as THREE from 'three';
import type { SceneManager } from '../core/SceneManager.js';
import type { Team, Vector2 } from 'shared/types/entities.js';
import { getTerrainHeight } from '../terrain/TerrainGenerator.js';
import { RESOURCE_ZONES, addPlayerResources, type ResourceZone } from '../resources/ResourceManager.js';

export type SlaveState = 'IDLE' | 'MOVING_TO_RESOURCE' | 'HARVESTING' | 'RETURNING';

export interface SlaveUnit {
  id: string;
  team: Team;
  position: Vector2;
  state: SlaveState;
  assignedZone: ResourceZone | null;
  targetPos: Vector2;
  carriedResource: 'wood' | 'stone' | null;
  harvestTimer: number;
  facing: number;
  speed: number;
  mesh?: THREE.Group;
}

const slaves: SlaveUnit[] = [];
let selectedSlaveId: string | null = null;
let slavesInitialized = false;

export function getSelectedSlaveId(): string | null {
  return selectedSlaveId;
}

export function selectSlave(id: string | null): void {
  selectedSlaveId = id;
}

// Low-poly 3D Villager/Slave Mesh
function createSlaveMesh(team: Team): THREE.Group {
  const group = new THREE.Group();
  const teamColor = team === 'blue' ? 0x2e6fe0 : 0xd9302f;

  // 1. Body Capsule (Tunic)
  const bodyGeo = new THREE.CapsuleGeometry(6.5, 9, 4, 8);
  const bodyMat = new THREE.MeshStandardMaterial({
    color: 0x9a7b56, // Peasant burlap tunic
    roughness: 0.8,
  });
  const body = new THREE.Mesh(bodyGeo, bodyMat);
  body.position.y = 8;
  body.castShadow = true;
  group.add(body);

  // 2. Team belt / sash
  const beltGeo = new THREE.CylinderGeometry(7.0, 7.0, 2.5, 8);
  const beltMat = new THREE.MeshStandardMaterial({ color: teamColor, roughness: 0.5 });
  const belt = new THREE.Mesh(beltGeo, beltMat);
  belt.position.y = 7;
  group.add(belt);

  // 3. Straw conical worker hat
  const hatGeo = new THREE.ConeGeometry(9.5, 4.5, 8);
  const hatMat = new THREE.MeshStandardMaterial({ color: 0xd4a373, roughness: 0.7 });
  const hat = new THREE.Mesh(hatGeo, hatMat);
  hat.position.y = 15.5;
  group.add(hat);

  // 4. Carried Wood Log (Hidden until carried)
  const logGeo = new THREE.CylinderGeometry(2.4, 2.4, 12, 6);
  logGeo.rotateZ(Math.PI / 2);
  const logMat = new THREE.MeshStandardMaterial({ color: 0x5c4033, roughness: 0.9 });
  const woodLog = new THREE.Mesh(logGeo, logMat);
  woodLog.name = 'carriedWood';
  woodLog.position.set(0, 9, -5.5);
  woodLog.visible = false;
  group.add(woodLog);

  // 5. Carried Stone Chunk (Hidden until carried)
  const stoneGeo = new THREE.DodecahedronGeometry(3.5, 0);
  const stoneMat = new THREE.MeshStandardMaterial({ color: 0x8a979e, roughness: 0.9, flatShading: true });
  const stoneChunk = new THREE.Mesh(stoneGeo, stoneMat);
  stoneChunk.name = 'carriedStone';
  stoneChunk.position.set(0, 9, -5.5);
  stoneChunk.visible = false;
  group.add(stoneChunk);

  // 6. Selection Ring Indicator
  const selGeo = new THREE.RingGeometry(8.5, 11.5, 20);
  selGeo.rotateX(-Math.PI / 2);
  const selMat = new THREE.MeshBasicMaterial({
    color: 0x22c55e,
    transparent: true,
    opacity: 0.0,
    side: THREE.DoubleSide,
  });
  const selRing = new THREE.Mesh(selGeo, selMat);
  selRing.name = 'selectionRing';
  selRing.position.y = 0.3;
  group.add(selRing);

  return group;
}

export function initSlaves(sceneManager: SceneManager, team: Team): void {
  if (slavesInitialized) return;
  slavesInitialized = true;

  const homeCastlePos = team === 'blue' ? { x: 500, y: 500 } : { x: 2500, y: 2500 };

  // Spawn 10 villagers around home castle
  for (let i = 0; i < 10; i++) {
    const angle = (i / 10) * Math.PI * 2;
    const dist = 45 + (i % 3) * 15;
    const x = homeCastlePos.x + Math.cos(angle) * dist;
    const y = homeCastlePos.y + Math.sin(angle) * dist;

    const mesh = createSlaveMesh(team);
    const groundY = getTerrainHeight(x, y);
    mesh.position.set(x, groundY, y);
    sceneManager.scene.add(mesh);

    const slave: SlaveUnit = {
      id: `slave-${team}-${i + 1}`,
      team,
      position: { x, y },
      state: 'IDLE',
      assignedZone: null,
      targetPos: { x, y },
      carriedResource: null,
      harvestTimer: 0,
      facing: 0,
      speed: 110 + Math.random() * 20, // World units/sec
      mesh,
    };

    slaves.push(slave);
  }
}

// Order a specific slave to a target zone
export function commandSlave(slaveId: string, zoneType: 'FOREST' | 'MINE'): void {
  const slave = slaves.find(s => s.id === slaveId);
  if (!slave) return;

  const zone = RESOURCE_ZONES.find(z => z.team === slave.team && z.type === zoneType);
  if (!zone) return;

  slave.assignedZone = zone;
  slave.state = 'MOVING_TO_RESOURCE';
  slave.carriedResource = null;

  // Scatter slightly inside zone
  const offsetAngle = Math.random() * Math.PI * 2;
  const offsetDist = Math.random() * (zone.radius * 0.6);
  slave.targetPos = {
    x: zone.center.x + Math.cos(offsetAngle) * offsetDist,
    y: zone.center.y + Math.sin(offsetAngle) * offsetDist,
  };
}

// Quick Command: Order all 10 slaves at once!
export function commandAllSlaves(command: 'FOREST' | 'MINE' | 'IDLE'): void {
  for (const s of slaves) {
    if (command === 'IDLE') {
      s.state = 'IDLE';
      s.assignedZone = null;
      s.carriedResource = null;
    } else {
      commandSlave(s.id, command);
    }
  }
}

// Raycast/click detection to select slave
export function checkSelectSlaveAt(worldX: number, worldY: number): boolean {
  for (const s of slaves) {
    if (Math.hypot(s.position.x - worldX, s.position.y - worldY) < 26) {
      selectedSlaveId = s.id;
      return true;
    }
  }
  return false;
}

export function updateSlaves3D(dt: number, time: number): void {
  for (const s of slaves) {
    const homeCastlePos = s.team === 'blue' ? { x: 500, y: 500 } : { x: 2500, y: 2500 };

    // State Machine
    switch (s.state) {
      case 'IDLE': {
        // Stand near castle
        break;
      }

      case 'MOVING_TO_RESOURCE': {
        const dx = s.targetPos.x - s.position.x;
        const dy = s.targetPos.y - s.position.y;
        const dist = Math.hypot(dx, dy);

        if (dist < 18) {
          // Arrived at resource zone -> start harvesting!
          s.state = 'HARVESTING';
          s.harvestTimer = 2.4; // 2.4s harvest animation
        } else {
          s.facing = Math.atan2(dy, dx);
          s.position.x += (dx / dist) * s.speed * dt;
          s.position.y += (dy / dist) * s.speed * dt;
        }
        break;
      }

      case 'HARVESTING': {
        s.harvestTimer -= dt;

        // Subtle chop/mine wobble animation
        if (s.mesh) {
          s.mesh.rotation.z = Math.sin(time * 16.0) * 0.12;
        }

        if (s.harvestTimer <= 0) {
          // Harvesting complete -> load resource & return!
          s.carriedResource = s.assignedZone?.type === 'FOREST' ? 'wood' : 'stone';
          s.state = 'RETURNING';

          // Set return target to home castle gate
          const gateAngle = Math.random() * Math.PI * 2;
          s.targetPos = {
            x: homeCastlePos.x + Math.cos(gateAngle) * 55,
            y: homeCastlePos.y + Math.sin(gateAngle) * 55,
          };
        }
        break;
      }

      case 'RETURNING': {
        const dx = s.targetPos.x - s.position.x;
        const dy = s.targetPos.y - s.position.y;
        const dist = Math.hypot(dx, dy);

        if (dist < 25) {
          // Arrived back at home castle -> Deposit resource!
          if (s.carriedResource === 'wood') {
            addPlayerResources(5, 0);
          } else if (s.carriedResource === 'stone') {
            addPlayerResources(0, 3);
          }

          s.carriedResource = null;

          // Automatically loop back to harvesting if zone assigned!
          if (s.assignedZone) {
            s.state = 'MOVING_TO_RESOURCE';
            const offsetAngle = Math.random() * Math.PI * 2;
            const offsetDist = Math.random() * (s.assignedZone.radius * 0.6);
            s.targetPos = {
              x: s.assignedZone.center.x + Math.cos(offsetAngle) * offsetDist,
              y: s.assignedZone.center.y + Math.sin(offsetAngle) * offsetDist,
            };
          } else {
            s.state = 'IDLE';
          }
        } else {
          s.facing = Math.atan2(dy, dx);
          // Carrying load is slightly slower (0.85x speed)
          const carrySpeed = s.speed * 0.85;
          s.position.x += (dx / dist) * carrySpeed * dt;
          s.position.y += (dy / dist) * carrySpeed * dt;
        }
        break;
      }
    }

    // Update 3D Mesh Position & Visuals
    if (s.mesh) {
      const terrainY = getTerrainHeight(s.position.x, s.position.y);
      s.mesh.position.set(s.position.x, terrainY, s.position.y);
      s.mesh.rotation.y = -s.facing + Math.PI / 2;

      // Update Carried Resource visibility
      const woodLog = s.mesh.getObjectByName('carriedWood');
      if (woodLog) woodLog.visible = s.carriedResource === 'wood';

      const stoneChunk = s.mesh.getObjectByName('carriedStone');
      if (stoneChunk) stoneChunk.visible = s.carriedResource === 'stone';

      // Update Selection Ring
      const selRing = s.mesh.getObjectByName('selectionRing') as THREE.Mesh | undefined;
      if (selRing) {
        const mat = selRing.material as THREE.MeshBasicMaterial;
        if (s.id === selectedSlaveId) {
          mat.opacity = 0.6 + Math.sin(time * 6.0) * 0.3;
          selRing.scale.set(1.0 + Math.sin(time * 6.0) * 0.1, 1, 1.0 + Math.sin(time * 6.0) * 0.1);
        } else {
          mat.opacity = 0.0;
        }
      }
    }
  }
}