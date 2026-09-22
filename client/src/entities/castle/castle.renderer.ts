import * as THREE from 'three';
import type { SceneManager } from '../../core/SceneManager.js';
import type { CastleState, Team } from 'shared/types/entities.js';
import { getTerrainHeight } from '../../terrain/TerrainGenerator.js';

// ── EPIC MEDIEVAL CASTLE ──────────────────────────────────────────────────
function createCastleMesh(team: Team): THREE.Group {
  const group = new THREE.Group();
  const isBlue = team === 'blue';

  // ── COLOUR PALETTE ────────────────────────────────────────────────────
  // Stone wall: cool grey for blue, warm sandstone for red
  const stoneColor  = isBlue ? 0xb8c4cf : 0xc9b99a;
  const darkStone   = isBlue ? 0x8a9ba8 : 0xa08060;
  const roofColor   = isBlue ? 0x1e3a8a : 0x7f1d1d;
  const flagColor   = isBlue ? 0x3b82f6 : 0xef4444;
  const glowColor   = isBlue ? 0x60a5fa : 0xf87171;
  const torchColor  = 0xf97316; // warm orange torch

  const wallMat  = new THREE.MeshStandardMaterial({ color: stoneColor, roughness: 0.88, metalness: 0.04, flatShading: true });
  const darkMat  = new THREE.MeshStandardMaterial({ color: darkStone,  roughness: 0.92, metalness: 0.02, flatShading: true });
  const roofMat  = new THREE.MeshStandardMaterial({ color: roofColor,  roughness: 0.70, metalness: 0.08, flatShading: true });
  const gateMat  = new THREE.MeshStandardMaterial({ color: 0x1c1410,   roughness: 0.98, metalness: 0.01 });

  // ── 1. TERRITORY AURA RING ────────────────────────────────────────────
  const auraGeo = new THREE.RingGeometry(200, 250, 52);
  auraGeo.rotateX(-Math.PI / 2);
  const auraMat = new THREE.MeshBasicMaterial({ color: glowColor, transparent: true, opacity: 0.20, side: THREE.DoubleSide, depthWrite: false });
  const aura = new THREE.Mesh(auraGeo, auraMat);
  aura.name = 'territoryAura';
  aura.position.y = 0.8;
  group.add(aura);

  // ── 2. COBBLESTONE GROUND COURTYARD ───────────────────────────────────
  const yardGeo = new THREE.CylinderGeometry(195, 195, 2, 8);
  const yardMat = new THREE.MeshStandardMaterial({ color: isBlue ? 0x6b7d8f : 0x8a7a6a, roughness: 0.95, flatShading: true });
  const yard = new THREE.Mesh(yardGeo, yardMat);
  yard.position.y = 0.2;
  yard.receiveShadow = true;
  group.add(yard);

  // ── 3. OUTER CURTAIN WALLS (4 sides) ──────────────────────────────────
  const WALL_W = 340;  // Total outer wall span
  const WALL_H = 48;
  const WALL_T = 22;   // Thickness

  const wallConfigs = [
    { w: WALL_W, d: WALL_T, x:  0,           z:  WALL_W / 2 - WALL_T / 2, ry: 0           },
    { w: WALL_W, d: WALL_T, x:  0,           z: -WALL_W / 2 + WALL_T / 2, ry: 0           },
    { w: WALL_T, d: WALL_W, x:  WALL_W / 2 - WALL_T / 2, z: 0,           ry: 0           },
    { w: WALL_T, d: WALL_W, x: -WALL_W / 2 + WALL_T / 2, z: 0,           ry: 0           },
  ];

  for (const wc of wallConfigs) {
    const wGeo = new THREE.BoxGeometry(wc.w, WALL_H, wc.d);
    const wall = new THREE.Mesh(wGeo, wallMat);
    wall.position.set(wc.x, WALL_H / 2, wc.z);
    wall.castShadow    = true;
    wall.receiveShadow = true;
    group.add(wall);
  }

  // ── 4. BATTLEMENT MERLONS (crenellations) on outer walls ──────────────
  const merlonW = 14, merlonH = 18, merlonD = 14;
  const merlonGeo = new THREE.BoxGeometry(merlonW, merlonH, merlonD);

  function addMerlonRow(
    count: number, spacing: number,
    startX: number, y: number, z: number,
    axis: 'x' | 'z'
  ) {
    for (let i = 0; i < count; i++) {
      const merlon = new THREE.Mesh(merlonGeo, darkMat);
      if (axis === 'x') {
        merlon.position.set(startX + i * spacing, y, z);
      } else {
        merlon.position.set(z, y, startX + i * spacing);
      }
      merlon.castShadow = true;
      group.add(merlon);
    }
  }

  const merlonY  = WALL_H + merlonH / 2;
  const merlonSp = 28;
  const wallHalf = WALL_W / 2 - 20;

  // Front & back walls (along X)
  addMerlonRow(11, merlonSp,  -wallHalf + 20, merlonY, +WALL_W / 2 - 11, 'x');
  addMerlonRow(11, merlonSp,  -wallHalf + 20, merlonY, -WALL_W / 2 + 11, 'x');
  // Side walls (along Z)
  addMerlonRow(11, merlonSp, -wallHalf + 20,  merlonY, +WALL_W / 2 - 11, 'z');
  addMerlonRow(11, merlonSp, -wallHalf + 20,  merlonY, -WALL_W / 2 + 11, 'z');

  // ── 5. FOUR CORNER TOWERS ─────────────────────────────────────────────
  const TOWER_R = 38;
  const TOWER_H = 130;
  const SPIRE_H = 60;
  const towerPositions: [number, number][] = [
    [-WALL_W / 2 + 10,  WALL_W / 2 - 10],
    [ WALL_W / 2 - 10,  WALL_W / 2 - 10],
    [-WALL_W / 2 + 10, -WALL_W / 2 + 10],
    [ WALL_W / 2 - 10, -WALL_W / 2 + 10],
  ];

  const towerGeo = new THREE.CylinderGeometry(TOWER_R - 4, TOWER_R, TOWER_H, 10);
  const spireGeo = new THREE.ConeGeometry(TOWER_R + 2, SPIRE_H, 10);

  for (const [tx, tz] of towerPositions) {
    // Tower body
    const tower = new THREE.Mesh(towerGeo, wallMat);
    tower.position.set(tx, TOWER_H / 2, tz);
    tower.castShadow    = true;
    tower.receiveShadow = true;
    group.add(tower);

    // Tower spire (pointy roof)
    const spire = new THREE.Mesh(spireGeo, roofMat);
    spire.position.set(tx, TOWER_H + SPIRE_H / 2, tz);
    spire.castShadow = true;
    group.add(spire);

    // Battlement ring on tower top
    const battleRingCount = 8;
    for (let b = 0; b < battleRingCount; b++) {
      const angle = (b / battleRingCount) * Math.PI * 2;
      const bGeo = new THREE.BoxGeometry(10, 14, 10);
      const bMesh = new THREE.Mesh(bGeo, darkMat);
      bMesh.position.set(
        tx + Math.cos(angle) * (TOWER_R - 2),
        TOWER_H + 7,
        tz + Math.sin(angle) * (TOWER_R - 2)
      );
      group.add(bMesh);
    }

    // Torch at each corner tower
    const torchGeo  = new THREE.CylinderGeometry(1.5, 1.5, 12, 5);
    const torchMat  = new THREE.MeshStandardMaterial({ color: 0x5c3d2e, roughness: 0.9 });
    const torch     = new THREE.Mesh(torchGeo, torchMat);
    torch.position.set(tx, TOWER_H + 16, tz);
    group.add(torch);

    // Torch glow
    const flameGeo = new THREE.SphereGeometry(5, 6, 5);
    const flameMat = new THREE.MeshBasicMaterial({ color: torchColor });
    const flame    = new THREE.Mesh(flameGeo, flameMat);
    flame.position.set(tx, TOWER_H + 26, tz);
    flame.name = 'torchFlame';
    group.add(flame);
  }

  // ── 6. CENTRAL KEEP (main donjon) ─────────────────────────────────────
  const KEEP_W = 100;
  const KEEP_H = 160;
  const keepGeo = new THREE.BoxGeometry(KEEP_W, KEEP_H, KEEP_W);
  const keep    = new THREE.Mesh(keepGeo, wallMat);
  keep.position.set(0, KEEP_H / 2, 0);
  keep.castShadow    = true;
  keep.receiveShadow = true;
  group.add(keep);

  // Keep roof
  const keepRoofGeo = new THREE.BoxGeometry(KEEP_W + 10, 18, KEEP_W + 10);
  const keepRoof    = new THREE.Mesh(keepRoofGeo, darkMat);
  keepRoof.position.set(0, KEEP_H + 9, 0);
  keepRoof.castShadow = true;
  group.add(keepRoof);

  // Keep top spire
  const keepSpireGeo = new THREE.ConeGeometry(38, 70, 8);
  const keepSpire    = new THREE.Mesh(keepSpireGeo, roofMat);
  keepSpire.position.set(0, KEEP_H + 18 + 35, 0);
  keepSpire.castShadow = true;
  group.add(keepSpire);

  // Keep battlements (4 corner merlons on top)
  const keepMerlonOffsets: [number, number][] = [[-42, -42], [42, -42], [-42, 42], [42, 42]];
  const keepMGeo = new THREE.BoxGeometry(16, 20, 16);
  for (const [mx, mz] of keepMerlonOffsets) {
    const km = new THREE.Mesh(keepMGeo, darkMat);
    km.position.set(mx, KEEP_H + 10, mz);
    km.castShadow = true;
    group.add(km);
  }

  // ── 7. FLAG POLE + FLAG ───────────────────────────────────────────────
  const poleGeo  = new THREE.CylinderGeometry(1.8, 1.8, 80, 5);
  const poleMat  = new THREE.MeshStandardMaterial({ color: 0x8b7355, roughness: 0.8 });
  const pole     = new THREE.Mesh(poleGeo, poleMat);
  pole.position.set(0, KEEP_H + 18 + 70 + 40, 0);
  group.add(pole);

  // Flag banner — wide rectangle waving from pole top
  const flagGeo  = new THREE.BoxGeometry(44, 28, 4);
  const flagMat  = new THREE.MeshStandardMaterial({ color: flagColor, roughness: 0.75, metalness: 0.05 });
  const flag     = new THREE.Mesh(flagGeo, flagMat);
  flag.position.set(22, KEEP_H + 18 + 70 + 72, 0);
  flag.name = 'castleFlag';
  group.add(flag);

  // Flag finial (top tip sphere)
  const finialGeo = new THREE.SphereGeometry(4, 6, 6);
  const finialMat = new THREE.MeshBasicMaterial({ color: 0xffd700 }); // Gold
  const finial    = new THREE.Mesh(finialGeo, finialMat);
  finial.position.set(0, KEEP_H + 18 + 70 + 80, 0);
  group.add(finial);

  // ── 8. GATEHOUSE (front entrance) ─────────────────────────────────────
  const GH_W = 70, GH_H = 75, GH_D = 40;
  const gateHouseGeo = new THREE.BoxGeometry(GH_W, GH_H, GH_D);
  const gateHouse    = new THREE.Mesh(gateHouseGeo, wallMat);
  gateHouse.position.set(0, GH_H / 2, WALL_W / 2 + GH_D / 2 - 10);
  gateHouse.castShadow    = true;
  gateHouse.receiveShadow = true;
  group.add(gateHouse);

  // Gate opening (dark arch)
  const archGeo = new THREE.BoxGeometry(30, 42, GH_D + 4);
  const arch    = new THREE.Mesh(archGeo, gateMat);
  arch.position.set(0, 21, WALL_W / 2 + GH_D / 2 - 10);
  group.add(arch);

  // Gate arch topper (round top trim)
  const archTopGeo = new THREE.CylinderGeometry(15, 15, GH_D + 4, 8, 1, false, 0, Math.PI);
  archTopGeo.rotateX(Math.PI / 2);
  const archTopMesh = new THREE.Mesh(archTopGeo, gateMat);
  archTopMesh.position.set(0, 42, WALL_W / 2 + GH_D / 2 - 10);
  group.add(archTopMesh);

  // Gatehouse roof
  const ghRoofGeo = new THREE.ConeGeometry(GH_W * 0.72, 45, 4);
  ghRoofGeo.rotateY(Math.PI / 4);
  const ghRoof = new THREE.Mesh(ghRoofGeo, roofMat);
  ghRoof.position.set(0, GH_H + 22, WALL_W / 2 + GH_D / 2 - 10);
  ghRoof.castShadow = true;
  group.add(ghRoof);

  // ── 9. INNER WALLS (secondary ring inside outer) ──────────────────────
  const IW_W = 200, IW_H = 36, IW_T = 16;
  const innerWallConfigs = [
    { w: IW_W, d: IW_T, x: 0,         z:  IW_W / 2 - IW_T / 2 },
    { w: IW_W, d: IW_T, x: 0,         z: -IW_W / 2 + IW_T / 2 },
    { w: IW_T, d: IW_W, x:  IW_W / 2 - IW_T / 2, z: 0 },
    { w: IW_T, d: IW_W, x: -IW_W / 2 + IW_T / 2, z: 0 },
  ];
  for (const wc of innerWallConfigs) {
    const iw = new THREE.Mesh(new THREE.BoxGeometry(wc.w, IW_H, wc.d), darkMat);
    iw.position.set(wc.x, IW_H / 2, wc.z);
    iw.castShadow    = true;
    iw.receiveShadow = true;
    group.add(iw);
  }

  return group;
}

// ── ANIMATION ─────────────────────────────────────────────────────────────
export function updateCastle3D(
  sceneManager: SceneManager,
  castle: CastleState,
  time: number
): void {
  const meshId = 'castle-' + castle.id;
  let mesh = sceneManager.meshes.get(meshId);

  if (!mesh) {
    const team: Team = castle.team || (castle.id === 'castle-1' ? 'blue' : 'red');
    mesh = createCastleMesh(team);
    const y = getTerrainHeight(castle.position.x, castle.position.y);
    mesh.position.set(castle.position.x, y, castle.position.y);
    sceneManager.scene.add(mesh);
    sceneManager.meshes.set(meshId, mesh);
  }

  // Breathing aura pulse
  const aura = mesh.getObjectByName('territoryAura') as THREE.Mesh | undefined;
  if (aura) {
    (aura.material as THREE.MeshBasicMaterial).opacity = 0.14 + Math.sin(time * 1.8) * 0.07;
  }

  // Flag wave animation (gentle sine oscillation)
  const flag = mesh.getObjectByName('castleFlag') as THREE.Mesh | undefined;
  if (flag) {
    flag.rotation.y = Math.sin(time * 1.4) * 0.18;
    flag.position.z = Math.sin(time * 1.4) * 3.0;
  }

  // Torch flicker (random-ish brightness via scale pulse)
  mesh.traverse((child) => {
    if (child.name === 'torchFlame') {
      const flicker = 0.85 + Math.sin(time * 8.5 + child.position.x) * 0.18;
      child.scale.setScalar(flicker);
    }
  });
}