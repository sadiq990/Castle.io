import * as THREE from 'three';
import { PALETTE } from '../assets/palette.js';

export type UnitType = 'worker' | 'swordsman' | 'archer' | 'cavalry' | 'catapult' | 'flagbearer';

const SKIN_TONE = 0xDEB887;
const BROWN = 0x8B4513;
const NEUTRAL_BROWN = 0xA0522D;
const GRAY = 0x7C8794;
const DARK_GRAY = 0x4A4A4A;
const SILVER = 0xC0C0C0;
const FOREST_GREEN = 0x2D5A27;

function getTeamColor(team: 'blue' | 'red'): number {
  return team === 'blue' ? (PALETTE as any).blue || 0x2196F3 : (PALETTE as any).red || 0xF44336;
}

export function createUnit(type: UnitType, team: 'blue' | 'red'): THREE.Group {
  const group = new THREE.Group();
  group.userData = { type, team, unitType: type };
  const teamColor = getTeamColor(team);

  const matSkin = new THREE.MeshStandardMaterial({ color: SKIN_TONE, roughness: 0.9, metalness: 0, flatShading: true });
  const matBrown = new THREE.MeshStandardMaterial({ color: NEUTRAL_BROWN, roughness: 0.9, metalness: 0, flatShading: true });
  const matDarkBrown = new THREE.MeshStandardMaterial({ color: BROWN, roughness: 0.9, metalness: 0, flatShading: true });
  const matGray = new THREE.MeshStandardMaterial({ color: GRAY, roughness: 0.9, metalness: 0, flatShading: true });
  const matDarkGray = new THREE.MeshStandardMaterial({ color: DARK_GRAY, roughness: 0.9, metalness: 0, flatShading: true });
  const matSilver = new THREE.MeshStandardMaterial({ color: SILVER, roughness: 0.4, metalness: 0.6, flatShading: true });
  const matGreen = new THREE.MeshStandardMaterial({ color: FOREST_GREEN, roughness: 0.9, metalness: 0, flatShading: true });
  const matTeam = new THREE.MeshStandardMaterial({ color: teamColor, roughness: 0.9, metalness: 0, flatShading: true });
  const matTeamEmissive = new THREE.MeshStandardMaterial({ color: teamColor, emissive: teamColor, emissiveIntensity: 0.5, roughness: 0.9, flatShading: true });

  switch (type) {
    case 'worker': {
      // Body
      const bodyGeo = new THREE.CylinderGeometry(0.25, 0.3, 0.7, 8);
      const body = new THREE.Mesh(bodyGeo, matBrown);
      body.position.y = 0.35;
      body.castShadow = true;
      body.receiveShadow = true;
      group.add(body);

      // Head
      const headGeo = new THREE.SphereGeometry(0.28, 8, 8);
      const head = new THREE.Mesh(headGeo, matSkin);
      head.position.y = 0.7 + 0.28;
      head.castShadow = true;
      head.receiveShadow = true;
      group.add(head);

      // Tool (Axe)
      const axeGroup = new THREE.Group();
      const handle = new THREE.Mesh(new THREE.BoxGeometry(0.05, 0.5, 0.05), matDarkBrown);
      handle.castShadow = true; handle.receiveShadow = true;
      const blade = new THREE.Mesh(new THREE.BoxGeometry(0.25, 0.2, 0.05), matSilver);
      blade.position.set(0.1, 0.2, 0);
      blade.castShadow = true; blade.receiveShadow = true;
      axeGroup.add(handle, blade);
      axeGroup.position.set(0.3, 0.4, 0.2);
      axeGroup.rotation.z = -Math.PI / 4;
      group.add(axeGroup);

      // Backpack
      const backpack = new THREE.Mesh(new THREE.BoxGeometry(0.2, 0.25, 0.15), matDarkBrown);
      backpack.position.set(0, 0.4, -0.2);
      backpack.castShadow = true; backpack.receiveShadow = true;
      group.add(backpack);

      // Hat
      const hat = new THREE.Mesh(new THREE.CylinderGeometry(0.3, 0.3, 0.08, 8), matBrown);
      hat.position.y = 0.7 + 0.28 + 0.25;
      hat.castShadow = true; hat.receiveShadow = true;
      group.add(hat);

      // Team color accent
      const stripe = new THREE.Mesh(new THREE.BoxGeometry(0.26, 0.1, 0.05), matTeam);
      stripe.position.set(0, 0.4, 0.28);
      stripe.castShadow = true; stripe.receiveShadow = true;
      group.add(stripe);
      break;
    }
    case 'swordsman': {
      // Body
      const bodyGeo = new THREE.CylinderGeometry(0.28, 0.32, 0.75, 8);
      const body = new THREE.Mesh(bodyGeo, matGray);
      body.position.y = 0.375;
      body.castShadow = true; body.receiveShadow = true;
      group.add(body);

      // Head
      const headGeo = new THREE.SphereGeometry(0.3, 8, 8);
      const head = new THREE.Mesh(headGeo, matSkin);
      head.position.y = 0.75 + 0.3;
      head.castShadow = true; head.receiveShadow = true;
      group.add(head);

      // Helmet
      const helmetCore = new THREE.Mesh(new THREE.CylinderGeometry(0.32, 0.28, 0.2, 8), matDarkGray);
      helmetCore.position.y = 0.75 + 0.3 + 0.15;
      helmetCore.castShadow = true; helmetCore.receiveShadow = true;
      const helmetBrim = new THREE.Mesh(new THREE.CylinderGeometry(0.38, 0.38, 0.05, 8), matDarkGray);
      helmetBrim.position.y = 0.75 + 0.3 + 0.05;
      helmetBrim.castShadow = true; helmetBrim.receiveShadow = true;
      group.add(helmetCore, helmetBrim);

      // Shield
      const shield = new THREE.Mesh(new THREE.BoxGeometry(0.4, 0.55, 0.06), matTeam);
      shield.position.set(-0.35, 0.4, 0.1);
      shield.rotation.y = Math.PI / 8;
      shield.castShadow = true; shield.receiveShadow = true;
      group.add(shield);

      // Sword
      const swordGroup = new THREE.Group();
      const blade = new THREE.Mesh(new THREE.BoxGeometry(0.04, 0.6, 0.04), matSilver);
      blade.position.y = 0.3;
      blade.castShadow = true; blade.receiveShadow = true;
      const guard = new THREE.Mesh(new THREE.BoxGeometry(0.2, 0.04, 0.04), matSilver);
      guard.castShadow = true; guard.receiveShadow = true;
      swordGroup.add(blade, guard);
      swordGroup.position.set(0.35, 0.3, 0.2);
      swordGroup.rotation.x = Math.PI / 4;
      group.add(swordGroup);
      break;
    }
    case 'archer': {
      // Body
      const body = new THREE.Mesh(new THREE.CylinderGeometry(0.25, 0.28, 0.7, 8), matGreen);
      body.position.y = 0.35;
      body.castShadow = true; body.receiveShadow = true;
      group.add(body);

      // Head
      const head = new THREE.Mesh(new THREE.SphereGeometry(0.28, 8, 8), matSkin);
      head.position.y = 0.7 + 0.28;
      head.castShadow = true; head.receiveShadow = true;
      group.add(head);

      // Hood/Cloak
      const hood = new THREE.Mesh(new THREE.ConeGeometry(0.35, 0.3, 6), matTeam);
      hood.position.y = 0.7 + 0.28 + 0.15;
      hood.castShadow = true; hood.receiveShadow = true;
      group.add(hood);

      // Bow
      const bow = new THREE.Mesh(new THREE.TorusGeometry(0.3, 0.025, 4, 12, Math.PI), matDarkBrown);
      bow.position.set(0.3, 0.4, 0.2);
      bow.rotation.z = -Math.PI / 2;
      bow.rotation.y = Math.PI / 4;
      bow.castShadow = true; bow.receiveShadow = true;
      group.add(bow);

      // Arrow
      const arrow = new THREE.Mesh(new THREE.CylinderGeometry(0.02, 0.02, 0.5, 4), matSilver);
      arrow.position.set(0.3, 0.4, 0.2);
      arrow.rotation.x = Math.PI / 2;
      arrow.rotation.y = Math.PI / 4;
      arrow.castShadow = true; arrow.receiveShadow = true;
      group.add(arrow);

      // Quiver
      const quiver = new THREE.Mesh(new THREE.CylinderGeometry(0.08, 0.1, 0.35, 6), matDarkBrown);
      quiver.position.set(0, 0.4, -0.25);
      quiver.rotation.z = Math.PI / 8;
      quiver.castShadow = true; quiver.receiveShadow = true;
      group.add(quiver);
      break;
    }
    case 'cavalry': {
      // Horse body
      const horseBody = new THREE.Mesh(new THREE.BoxGeometry(0.8, 0.6, 1.4), matDarkBrown);
      horseBody.position.y = 0.8;
      horseBody.castShadow = true; horseBody.receiveShadow = true;
      group.add(horseBody);

      // Horse legs
      const legGeo = new THREE.CylinderGeometry(0.1, 0.1, 0.5, 6);
      const positions = [
        [-0.3, 0.25, 0.5],
        [0.3, 0.25, 0.5],
        [-0.3, 0.25, -0.5],
        [0.3, 0.25, -0.5]
      ];
      positions.forEach(pos => {
        const leg = new THREE.Mesh(legGeo, matDarkBrown);
        leg.position.set(pos[0] ?? 0, pos[1] ?? 0, pos[2] ?? 0);
        leg.castShadow = true; leg.receiveShadow = true;
        group.add(leg);
      });

      // Horse head
      const horseHead = new THREE.Mesh(new THREE.BoxGeometry(0.25, 0.3, 0.4), matDarkBrown);
      horseHead.position.set(0, 1.2, 0.8);
      horseHead.castShadow = true; horseHead.receiveShadow = true;
      group.add(horseHead);

      // Rider body
      const riderBody = new THREE.Mesh(new THREE.CylinderGeometry(0.28, 0.3, 0.65, 8), matGray);
      riderBody.position.set(0, 1.425, -0.1);
      riderBody.castShadow = true; riderBody.receiveShadow = true;
      group.add(riderBody);

      // Rider head
      const riderHead = new THREE.Mesh(new THREE.SphereGeometry(0.28, 8, 8), matSkin);
      riderHead.position.set(0, 1.75 + 0.28, -0.1);
      riderHead.castShadow = true; riderHead.receiveShadow = true;
      group.add(riderHead);

      // Plume
      const plume = new THREE.Mesh(new THREE.ConeGeometry(0.1, 0.4, 4), matTeam);
      plume.position.set(0, 1.75 + 0.28 + 0.3, -0.1);
      plume.castShadow = true; plume.receiveShadow = true;
      group.add(plume);

      // Lance
      const lance = new THREE.Mesh(new THREE.CylinderGeometry(0.03, 0.03, 1.5, 6), matSilver);
      lance.position.set(0.4, 1.3, 0.4);
      lance.rotation.x = Math.PI / 4;
      lance.castShadow = true; lance.receiveShadow = true;
      group.add(lance);

      // Lance tip
      const lanceTip = new THREE.Mesh(new THREE.ConeGeometry(0.05, 0.2, 4), matTeam);
      lanceTip.position.set(0.4, 1.3 - 0.75 * Math.sin(Math.PI / 4) + 0.1, 0.4 + 0.75 * Math.cos(Math.PI / 4) + 0.1); // approx tip
      lanceTip.castShadow = true; lanceTip.receiveShadow = true;
      group.add(lanceTip);
      break;
    }
    case 'catapult': {
      const catapultGroup = new THREE.Group();
      
      // Frame
      const vertGeo = new THREE.BoxGeometry(0.15, 1.2, 0.15);
      const horizGeo = new THREE.BoxGeometry(1.0, 0.15, 0.15);
      
      const v1 = new THREE.Mesh(vertGeo, matDarkBrown);
      v1.position.set(-0.4, 0.6, 0);
      v1.castShadow = true; v1.receiveShadow = true;
      
      const v2 = new THREE.Mesh(vertGeo, matDarkBrown);
      v2.position.set(0.4, 0.6, 0);
      v2.castShadow = true; v2.receiveShadow = true;
      
      const h1 = new THREE.Mesh(horizGeo, matDarkBrown);
      h1.position.set(0, 0.15, 0.4);
      h1.castShadow = true; h1.receiveShadow = true;
      
      const h2 = new THREE.Mesh(horizGeo, matDarkBrown);
      h2.position.set(0, 0.15, -0.4);
      h2.castShadow = true; h2.receiveShadow = true;
      
      catapultGroup.add(v1, v2, h1, h2);

      // Wheels
      const wheelGeo = new THREE.TorusGeometry(0.4, 0.06, 4, 8);
      const w1 = new THREE.Mesh(wheelGeo, matDarkBrown);
      w1.position.set(-0.55, 0.4, 0);
      w1.rotation.y = Math.PI / 2;
      w1.castShadow = true; w1.receiveShadow = true;
      
      const w2 = new THREE.Mesh(wheelGeo, matDarkBrown);
      w2.position.set(0.55, 0.4, 0);
      w2.rotation.y = Math.PI / 2;
      w2.castShadow = true; w2.receiveShadow = true;
      
      catapultGroup.add(w1, w2);

      // Arm
      const armGroup = new THREE.Group();
      const arm = new THREE.Mesh(new THREE.BoxGeometry(0.1, 1.0, 0.1), matDarkBrown);
      arm.position.y = 0.5;
      arm.castShadow = true; arm.receiveShadow = true;
      
      const cup = new THREE.Mesh(new THREE.BoxGeometry(0.3, 0.1, 0.3), matDarkBrown);
      cup.position.y = 1.05;
      cup.castShadow = true; cup.receiveShadow = true;
      
      armGroup.add(arm, cup);
      armGroup.position.set(0, 0.15, 0);
      armGroup.rotation.x = -Math.PI / 3; // -60 degrees
      catapultGroup.add(armGroup);

      // Team color markers
      const teamMarker1 = new THREE.Mesh(new THREE.BoxGeometry(0.2, 0.2, 0.2), matTeam);
      teamMarker1.position.set(-0.4, 1.25, 0);
      teamMarker1.castShadow = true; teamMarker1.receiveShadow = true;
      
      const teamMarker2 = new THREE.Mesh(new THREE.BoxGeometry(0.2, 0.2, 0.2), matTeam);
      teamMarker2.position.set(0.4, 1.25, 0);
      teamMarker2.castShadow = true; teamMarker2.receiveShadow = true;
      
      catapultGroup.add(teamMarker1, teamMarker2);
      
      group.add(catapultGroup);
      break;
    }
    case 'flagbearer': {
      // Body
      const body = new THREE.Mesh(new THREE.CylinderGeometry(0.25, 0.28, 0.75, 8), matTeam);
      body.position.y = 0.375;
      body.castShadow = true; body.receiveShadow = true;
      group.add(body);

      // Head
      const head = new THREE.Mesh(new THREE.SphereGeometry(0.3, 8, 8), matSkin);
      head.position.y = 0.75 + 0.3;
      head.castShadow = true; head.receiveShadow = true;
      group.add(head);

      // Cloak
      const cloak = new THREE.Mesh(new THREE.ConeGeometry(0.4, 0.6, 6), matTeam);
      cloak.position.set(0, 0.45, -0.2);
      cloak.rotation.x = -Math.PI / 8;
      cloak.castShadow = true; cloak.receiveShadow = true;
      group.add(cloak);

      // Flag pole
      const pole = new THREE.Mesh(new THREE.CylinderGeometry(0.03, 0.03, 1.8, 6), matDarkBrown);
      pole.position.set(0.35, 0.9, 0.2);
      pole.castShadow = true; pole.receiveShadow = true;
      group.add(pole);

      // Flag cloth
      const flagCloth = new THREE.Mesh(new THREE.BoxGeometry(0.8, 0.5, 0.03), matTeam);
      flagCloth.position.set(0.35, 1.5, 0.2 + 0.4);
      flagCloth.userData.isFlag = true;
      flagCloth.castShadow = true; flagCloth.receiveShadow = true;
      group.add(flagCloth);

      // Glowing indicator
      const glow = new THREE.PointLight(teamColor, 0.8, 3);
      glow.position.set(0.35, 1.8, 0.2);
      group.add(glow);
      break;
    }
  }

  group.position.y = 0;
  return group;
}

export function createSelectionRing(team: 'blue' | 'red'): THREE.Mesh {
  const teamColor = getTeamColor(team);
  const geo = new THREE.TorusGeometry(0.55, 0.06, 4, 16);
  const mat = new THREE.MeshStandardMaterial({
    color: teamColor,
    emissive: teamColor,
    emissiveIntensity: 0.8,
    roughness: 0.9,
    metalness: 0,
    flatShading: true
  });
  const mesh = new THREE.Mesh(geo, mat);
  mesh.rotation.x = -Math.PI / 2;
  return mesh;
}

export function createHPBar(maxHP: number): THREE.Group {
  const group = new THREE.Group();
  group.position.y = 1.5;

  const bgGeo = new THREE.BoxGeometry(0.8, 0.1, 0.02);
  const bgMat = new THREE.MeshBasicMaterial({ color: 0x440000 });
  const bg = new THREE.Mesh(bgGeo, bgMat);
  
  const fgGeo = new THREE.BoxGeometry(0.8, 0.1, 0.02);
  const fgMat = new THREE.MeshBasicMaterial({ color: 0x44FF44 });
  const fg = new THREE.Mesh(fgGeo, fgMat);
  // Shift the origin to the left so scaling scales from the left
  fg.geometry.translate(0.4, 0, 0);
  fg.position.x = -0.4;
  // Push slightly forward to avoid Z-fighting
  fg.position.z = 0.01;

  group.add(bg, fg);

  group.userData.updateHP = (currentHP: number, maxHP: number) => {
    const ratio = Math.max(0, Math.min(1, currentHP / maxHP));
    fg.scale.x = ratio;
  };

  return group;
}

export function createFormationMarker(): THREE.Mesh {
  const geo = new THREE.SphereGeometry(0.12, 8, 8);
  const mat = new THREE.MeshStandardMaterial({
    color: 0x00FF00,
    emissive: 0x00FF00,
    emissiveIntensity: 0.8,
    roughness: 0.9,
    flatShading: true
  });
  const marker = new THREE.Mesh(geo, mat);
  return marker;
}

export function animateUnit(group: THREE.Group, time: number, state: 'walk' | 'attack' | 'work' | 'idle'): void {
  // Reset basic rotations and positions before applying new ones to avoid stacking
  group.position.y = 0;
  group.rotation.y = 0;
  group.rotation.z = 0;

  switch (state) {
    case 'walk':
      group.position.y = Math.sin(time * 8) * 0.08;
      break;
    case 'attack':
      group.rotation.z = Math.sin(time * 12) * 0.2;
      break;
    case 'work':
      if (group.children.length > 0) {
        // Find axe/tool to rotate, usually around index 2 for worker, but let's just animate the group itself like attack if we can't find it
        // Or if we specifically know the structure:
        if (group.userData.type === 'worker' && group.children[2]) {
          group.children[2].rotation.z = -Math.PI / 4 + Math.sin(time * 6) * 0.4;
        } else {
          group.rotation.z = Math.sin(time * 6) * 0.2;
        }
      }
      break;
    case 'idle':
      group.rotation.y = Math.sin(time * 0.8) * 0.05;
      break;
  }
}
