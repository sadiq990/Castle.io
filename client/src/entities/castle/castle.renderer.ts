import * as THREE from 'three';
import type { SceneManager } from '../../core/SceneManager.js';
import type { CastleState, Team } from 'shared/types/entities.js';
import { getTerrainHeight } from '../../terrain/TerrainGenerator.js';

// ── SENTRY SOLDIER FACTORY ────────────────────────────────────────────────
// Low-poly medieval royal guard standing watch on battlements
function createSentrySoldier(team: Team, facingAngle: number): THREE.Group {
  const sentry = new THREE.Group();
  sentry.name = 'castleSentry';

  const isBlue = team === 'blue';
  const tabardColor = isBlue ? 0x2563eb : 0xdc2626; // Royal Blue / Battle Red
  const steelColor  = 0x94a3b8; // Polished steel armour
  const ironColor   = 0x27272a; // Dark iron boots / mail
  const goldColor   = 0xf59e0b; // Brass belt buckle & rivets

  const steelMat  = new THREE.MeshStandardMaterial({ color: steelColor, roughness: 0.32, metalness: 0.82 });
  const ironMat   = new THREE.MeshStandardMaterial({ color: ironColor,  roughness: 0.75, metalness: 0.45 });
  const tabardMat = new THREE.MeshStandardMaterial({ color: tabardColor, roughness: 0.70 });
  const woodMat   = new THREE.MeshStandardMaterial({ color: 0x451a03,   roughness: 0.88 });

  // 1. Boots & Lower Legs
  const legL = new THREE.Mesh(new THREE.BoxGeometry(2.4, 6.5, 2.4), ironMat);
  legL.position.set(-1.6, 3.25, 0);
  sentry.add(legL);

  const legR = new THREE.Mesh(new THREE.BoxGeometry(2.4, 6.5, 2.4), ironMat);
  legR.position.set(1.6, 3.25, 0);
  sentry.add(legR);

  // 2. Torso in Team Tabard / Surcoat
  const torso = new THREE.Mesh(new THREE.BoxGeometry(6.8, 8.5, 4.4), tabardMat);
  torso.position.y = 10.5;
  torso.castShadow = true;
  sentry.add(torso);

  // Leather Belt with Brass Buckle
  const belt = new THREE.Mesh(new THREE.BoxGeometry(7.1, 1.4, 4.6), ironMat);
  belt.position.y = 7.2;
  sentry.add(belt);

  const buckle = new THREE.Mesh(new THREE.BoxGeometry(2.2, 1.6, 4.8), new THREE.MeshStandardMaterial({ color: goldColor, metalness: 0.8 }));
  buckle.position.y = 7.2;
  sentry.add(buckle);

  // Steel Pauldrons (Shoulder Guards)
  const pauldronGeo = new THREE.BoxGeometry(2.2, 2.8, 4.2);
  const pauldronL = new THREE.Mesh(pauldronGeo, steelMat);
  pauldronL.position.set(-4.0, 13.5, 0);
  sentry.add(pauldronL);

  const pauldronR = new THREE.Mesh(pauldronGeo, steelMat);
  pauldronR.position.set(4.0, 13.5, 0);
  sentry.add(pauldronR);

  // 3. Head & Steel Kettle Helm with Nasal Guard
  const head = new THREE.Mesh(new THREE.SphereGeometry(2.4, 6, 5), new THREE.MeshStandardMaterial({ color: 0xd4a373 }));
  head.position.y = 16.5;
  sentry.add(head);

  // Steel Kettle Helmet
  const helmGeo = new THREE.ConeGeometry(3.6, 3.8, 7);
  const helm = new THREE.Mesh(helmGeo, steelMat);
  helm.position.y = 18.4;
  sentry.add(helm);

  // Helm Brim (wide brim deflecting arrows)
  const brimGeo = new THREE.CylinderGeometry(4.4, 4.4, 0.6, 8);
  const brim = new THREE.Mesh(brimGeo, steelMat);
  brim.position.y = 16.8;
  sentry.add(brim);

  // 4. Upright Halberd / Poleaxe (Gleaming Steel Blade on Tall Shaft)
  const halberdShaft = new THREE.Mesh(new THREE.CylinderGeometry(0.45, 0.45, 28, 5), woodMat);
  halberdShaft.position.set(4.4, 14, 2.2);
  sentry.add(halberdShaft);

  // Halberd Axe Blade
  const axeBlade = new THREE.Mesh(new THREE.BoxGeometry(0.4, 5.5, 3.5), steelMat);
  axeBlade.position.set(4.4, 24.5, 3.8);
  sentry.add(axeBlade);

  // Halberd Spear Spike
  const spearSpike = new THREE.Mesh(new THREE.ConeGeometry(0.8, 5.0, 4), steelMat);
  spearSpike.position.set(4.4, 28.5, 2.2);
  sentry.add(spearSpike);

  // 5. Kite Shield on Left Arm (Team Heraldic Colors)
  const shield = new THREE.Mesh(new THREE.BoxGeometry(1.2, 10, 6), tabardMat);
  shield.position.set(-4.2, 10.5, 1.8);
  shield.rotation.y = 0.25;
  sentry.add(shield);

  // Shield steel boss & rim
  const shieldRim = new THREE.Mesh(new THREE.BoxGeometry(1.3, 10.4, 0.6), steelMat);
  shieldRim.position.set(-4.2, 10.5, 1.8);
  sentry.add(shieldRim);

  sentry.rotation.y = facingAngle;
  sentry.scale.set(1.15, 1.15, 1.15);
  sentry.userData.baseAngle = facingAngle;

  return sentry;
}

// ── EPIC MEDIEVAL CASTLE ──────────────────────────────────────────────────
function createCastleMesh(team: Team): THREE.Group {
  const group = new THREE.Group();
  const isBlue = team === 'blue';

  // ── COLOUR PALETTE ────────────────────────────────────────────────────
  // Stone wall: authentic cool granite for blue, warm fortress limestone for red
  const stoneColor  = isBlue ? 0xb4c0cc : 0xc6b696;
  const darkStone   = isBlue ? 0x7e8f9d : 0x9c7f5f;
  const roofColor   = isBlue ? 0x1e3a8a : 0x7f1d1d;
  const flagColor   = isBlue ? 0x3b82f6 : 0xef4444;
  const glowColor   = isBlue ? 0x60a5fa : 0xf87171;
  const torchColor  = 0xf97316; // Warm flickering orange
  const mossColor1  = 0x3f6212; // Deep forest moss
  const mossColor2  = 0x4d7c0f; // Vibrant creeping ivy
  const windowGlow  = 0xffb703; // Warm interior candle glow

  const wallMat     = new THREE.MeshStandardMaterial({ color: stoneColor,  roughness: 0.88, metalness: 0.04, flatShading: true });
  const darkMat     = new THREE.MeshStandardMaterial({ color: darkStone,   roughness: 0.92, metalness: 0.02, flatShading: true });
  const roofMat     = new THREE.MeshStandardMaterial({ color: roofColor,   roughness: 0.68, metalness: 0.08, flatShading: true });
  const gateMat     = new THREE.MeshStandardMaterial({ color: 0x221711,    roughness: 0.96, metalness: 0.02 });
  const ironMat     = new THREE.MeshStandardMaterial({ color: 0x18181b,    roughness: 0.55, metalness: 0.85 });
  const woodMat     = new THREE.MeshStandardMaterial({ color: 0x5c3d2e,    roughness: 0.90 });
  const mossMat1    = new THREE.MeshStandardMaterial({ color: mossColor1,  roughness: 0.95, flatShading: true });
  const mossMat2    = new THREE.MeshStandardMaterial({ color: mossColor2,  roughness: 0.92, flatShading: true });
  const candleMat   = new THREE.MeshBasicMaterial({ color: windowGlow });

  // ── 1. TERRITORY AURA RING ────────────────────────────────────────────
  const auraGeo = new THREE.RingGeometry(210, 260, 52);
  auraGeo.rotateX(-Math.PI / 2);
  const auraMat = new THREE.MeshBasicMaterial({ color: glowColor, transparent: true, opacity: 0.20, side: THREE.DoubleSide, depthWrite: false });
  const aura = new THREE.Mesh(auraGeo, auraMat);
  aura.name = 'territoryAura';
  aura.position.y = 0.8;
  group.add(aura);

  // ── 2. COBBLESTONE GROUND COURTYARD ───────────────────────────────────
  const yardGeo = new THREE.CylinderGeometry(205, 205, 2, 8);
  const yardMat = new THREE.MeshStandardMaterial({ color: isBlue ? 0x687888 : 0x857563, roughness: 0.95, flatShading: true });
  const yard = new THREE.Mesh(yardGeo, yardMat);
  yard.position.y = 0.2;
  yard.receiveShadow = true;
  group.add(yard);

  // ── 3. OUTER CURTAIN WALLS (4 sides with battered talus plinths) ───────
  const WALL_W = 340;
  const WALL_H = 48;
  const WALL_T = 22;

  const wallConfigs = [
    { w: WALL_W, d: WALL_T, x:  0,           z:  WALL_W / 2 - WALL_T / 2 },
    { w: WALL_W, d: WALL_T, x:  0,           z: -WALL_W / 2 + WALL_T / 2 },
    { w: WALL_T, d: WALL_W, x:  WALL_W / 2 - WALL_T / 2, z: 0 },
    { w: WALL_T, d: WALL_W, x: -WALL_W / 2 + WALL_T / 2, z: 0 },
  ];

  for (const wc of wallConfigs) {
    // Main wall body
    const wGeo = new THREE.BoxGeometry(wc.w, WALL_H, wc.d);
    const wall = new THREE.Mesh(wGeo, wallMat);
    wall.position.set(wc.x, WALL_H / 2, wc.z);
    wall.castShadow    = true;
    wall.receiveShadow = true;
    group.add(wall);

    // Battered Talus Base (flared stone base along the bottom to deflect catapult boulders)
    const talusGeo = new THREE.BoxGeometry(wc.w + 2, 10, wc.d + 6);
    const talus = new THREE.Mesh(talusGeo, darkMat);
    talus.position.set(wc.x, 5, wc.z);
    talus.receiveShadow = true;
    group.add(talus);

    // Horizontal string course (decorative masonry ledge along mid-height)
    const stringGeo = new THREE.BoxGeometry(wc.w + 1, 2.5, wc.d + 3);
    const stringLedge = new THREE.Mesh(stringGeo, darkMat);
    stringLedge.position.set(wc.x, 32, wc.z);
    group.add(stringLedge);
  }

  // ── 4. BATTLEMENT MERLONS (crenellations) ON OUTER WALLS ──────────────
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

      // Add cross-slit arrow loop detail on every alternating merlon!
      if (i % 2 === 1) {
        const slit = new THREE.Mesh(new THREE.BoxGeometry(1.6, 8, 1.6), ironMat);
        if (axis === 'x') {
          slit.position.set(startX + i * spacing, y, z + (z > 0 ? merlonD / 2 + 0.2 : -merlonD / 2 - 0.2));
        } else {
          slit.position.set(z + (z > 0 ? merlonD / 2 + 0.2 : -merlonD / 2 - 0.2), y, startX + i * spacing);
        }
        group.add(slit);
      }
    }
  }

  const merlonY  = WALL_H + merlonH / 2;
  const merlonSp = 28;
  const wallHalf = WALL_W / 2 - 20;

  addMerlonRow(11, merlonSp,  -wallHalf + 20, merlonY, +WALL_W / 2 - 11, 'x');
  addMerlonRow(11, merlonSp,  -wallHalf + 20, merlonY, -WALL_W / 2 + 11, 'x');
  addMerlonRow(11, merlonSp, -wallHalf + 20,  merlonY, +WALL_W / 2 - 11, 'z');
  addMerlonRow(11, merlonSp, -wallHalf + 20,  merlonY, -WALL_W / 2 + 11, 'z');

  // ── 5. FOUR CORNER TOWERS WITH MULTI-TIER ARROW SLITS & SENTRIES ─────
  const TOWER_R = 38;
  const TOWER_H = 130;
  const SPIRE_H = 60;
  const towerPositions: [number, number, number][] = [
    [-WALL_W / 2 + 10,  WALL_W / 2 - 10,  Math.PI * 0.75], // Top-Left looking out
    [ WALL_W / 2 - 10,  WALL_W / 2 - 10,  Math.PI * 0.25], // Top-Right looking out
    [-WALL_W / 2 + 10, -WALL_W / 2 + 10, -Math.PI * 0.75], // Bottom-Left looking out
    [ WALL_W / 2 - 10, -WALL_W / 2 + 10, -Math.PI * 0.25], // Bottom-Right looking out
  ];

  const towerGeo = new THREE.CylinderGeometry(TOWER_R - 4, TOWER_R, TOWER_H, 10);
  const spireGeo = new THREE.ConeGeometry(TOWER_R + 2, SPIRE_H, 10);

  for (const [tx, tz, angleOut] of towerPositions) {
    // 5A. Tower Body
    const tower = new THREE.Mesh(towerGeo, wallMat);
    tower.position.set(tx, TOWER_H / 2, tz);
    tower.castShadow    = true;
    tower.receiveShadow = true;
    group.add(tower);

    // Flared Stone Plinth at bottom of tower
    const plinth = new THREE.Mesh(new THREE.CylinderGeometry(TOWER_R + 2, TOWER_R + 6, 16, 10), darkMat);
    plinth.position.set(tx, 8, tz);
    plinth.receiveShadow = true;
    group.add(plinth);

    // Horizontal Masonry String Courses (decorative stone belts around tower)
    const belt1 = new THREE.Mesh(new THREE.CylinderGeometry(TOWER_R + 1.2, TOWER_R + 1.2, 3, 10), darkMat);
    belt1.position.set(tx, 48, tz);
    group.add(belt1);

    const belt2 = new THREE.Mesh(new THREE.CylinderGeometry(TOWER_R - 1.2, TOWER_R - 1.2, 3, 10), darkMat);
    belt2.position.set(tx, 92, tz);
    group.add(belt2);

    // 5B. Multi-Tier Medieval Arrow Slits (Windows with Candle Light)
    const slitLevels = [38, 70, 104];
    for (const slitY of slitLevels) {
      // Outward facing window
      const winX = tx + Math.cos(angleOut) * (TOWER_R - 1.5);
      const winZ = tz + Math.sin(angleOut) * (TOWER_R - 1.5);

      // Dark window aperture
      const winAperture = new THREE.Mesh(new THREE.BoxGeometry(2.4, 9.5, 2.2), ironMat);
      winAperture.position.set(winX, slitY, winZ);
      winAperture.rotation.y = -angleOut + Math.PI / 2;
      group.add(winAperture);

      // Stone window lintel/frame
      const winFrame = new THREE.Mesh(new THREE.BoxGeometry(5.2, 12, 1.2), darkMat);
      winFrame.position.set(winX, slitY, winZ);
      winFrame.rotation.y = -angleOut + Math.PI / 2;
      group.add(winFrame);

      // Subtle warm interior candle light glowing from slit
      const glow = new THREE.Mesh(new THREE.BoxGeometry(1.4, 6.0, 1.4), candleMat);
      glow.position.set(winX * 0.98 + tx * 0.02, slitY, winZ * 0.98 + tz * 0.02);
      group.add(glow);
    }

    // 5C. Tower Spire (Conical Roof)
    const spire = new THREE.Mesh(spireGeo, roofMat);
    spire.position.set(tx, TOWER_H + SPIRE_H / 2, tz);
    spire.castShadow = true;
    group.add(spire);

    // Spire Gold Finial
    const finial = new THREE.Mesh(new THREE.SphereGeometry(3.5, 6, 6), new THREE.MeshBasicMaterial({ color: 0xffd700 }));
    finial.position.set(tx, TOWER_H + SPIRE_H + 3.0, tz);
    group.add(finial);

    // Battlement ring on tower top
    const battleRingCount = 8;
    for (let b = 0; b < battleRingCount; b++) {
      const angle = (b / battleRingCount) * Math.PI * 2;
      const bMesh = new THREE.Mesh(new THREE.BoxGeometry(10, 14, 10), darkMat);
      bMesh.position.set(
        tx + Math.cos(angle) * (TOWER_R - 2),
        TOWER_H + 7,
        tz + Math.sin(angle) * (TOWER_R - 2)
      );
      group.add(bMesh);
    }

    // 5D. SYMBOLIC SENTRY GUARD STANDING ON EACH CORNER TOWER!
    const sentry = createSentrySoldier(team, angleOut);
    sentry.position.set(
      tx + Math.cos(angleOut) * (TOWER_R - 14),
      TOWER_H + 0.5,
      tz + Math.sin(angleOut) * (TOWER_R - 14)
    );
    group.add(sentry);

    // 5E. Parapet Torch at each corner tower
    const torchWood = new THREE.Mesh(new THREE.CylinderGeometry(1.5, 1.5, 12, 5), woodMat);
    torchWood.position.set(tx, TOWER_H + 16, tz);
    group.add(torchWood);

    const flame = new THREE.Mesh(new THREE.SphereGeometry(5, 6, 5), new THREE.MeshBasicMaterial({ color: torchColor }));
    flame.position.set(tx, TOWER_H + 26, tz);
    flame.name = 'torchFlame';
    group.add(flame);
  }

  // ── 6. CENTRAL KEEP (DONJON) WITH MASONRY QUOINS & GOTHIC WINDOWS ────
  const KEEP_W = 100;
  const KEEP_H = 160;
  const keepGeo = new THREE.BoxGeometry(KEEP_W, KEEP_H, KEEP_W);
  const keep    = new THREE.Mesh(keepGeo, wallMat);
  keep.position.set(0, KEEP_H / 2, 0);
  keep.castShadow    = true;
  keep.receiveShadow = true;
  group.add(keep);

  // 6A. Corner Quoins (Alternating Chiseled Stone Blocks on all 4 Keep Corners)
  const quoinHeight = 12;
  const quoinCount  = Math.floor(KEEP_H / quoinHeight);
  const quoinOffsets: [number, number][] = [
    [-KEEP_W / 2, -KEEP_W / 2],
    [ KEEP_W / 2, -KEEP_W / 2],
    [-KEEP_W / 2,  KEEP_W / 2],
    [ KEEP_W / 2,  KEEP_W / 2],
  ];

  for (let q = 1; q < quoinCount; q++) {
    const qy = q * quoinHeight;
    const isAlt = q % 2 === 0;
    const qMat = isAlt ? darkMat : wallMat;
    const qSizeA = isAlt ? 12 : 7;
    const qSizeB = isAlt ? 7 : 12;

    for (const [qx, qz] of quoinOffsets) {
      const quoinMesh = new THREE.Mesh(new THREE.BoxGeometry(qSizeA, quoinHeight - 1.5, qSizeB), qMat);
      quoinMesh.position.set(qx + (qx > 0 ? -qSizeA / 2 + 1.2 : qSizeA / 2 - 1.2), qy, qz + (qz > 0 ? -qSizeB / 2 + 1.2 : qSizeB / 2 - 1.2));
      quoinMesh.receiveShadow = true;
      group.add(quoinMesh);
    }
  }

  // Horizontal Stone Ledges (Belts around Keep)
  const keepBelt1 = new THREE.Mesh(new THREE.BoxGeometry(KEEP_W + 4, 3, KEEP_W + 4), darkMat);
  keepBelt1.position.set(0, 55, 0);
  group.add(keepBelt1);

  const keepBelt2 = new THREE.Mesh(new THREE.BoxGeometry(KEEP_W + 4, 3, KEEP_W + 4), darkMat);
  keepBelt2.position.set(0, 115, 0);
  group.add(keepBelt2);

  // 6B. Gothic Double Lancet Windows on all 4 sides of Keep
  const winYLevels = [78, 134];
  for (const wy of winYLevels) {
    const winSides: [number, number, number][] = [
      [ 0,  KEEP_W / 2 + 0.5, 0],           // Front (+Z)
      [ 0, -KEEP_W / 2 - 0.5, Math.PI],     // Back (-Z)
      [ KEEP_W / 2 + 0.5, 0,  Math.PI / 2], // Right (+X)
      [-KEEP_W / 2 - 0.5, 0, -Math.PI / 2], // Left (-X)
    ];

    for (const [wx, wz, wRot] of winSides) {
      const windowGroup = new THREE.Group();
      windowGroup.position.set(wx, wy, wz);
      windowGroup.rotation.y = wRot;

      // Outer stone window frame with Gothic arch
      const frame = new THREE.Mesh(new THREE.BoxGeometry(18, 22, 2.5), darkMat);
      windowGroup.add(frame);

      // Left arched glass pane with warm amber glow
      const paneL = new THREE.Mesh(new THREE.BoxGeometry(5.5, 16, 1.8), candleMat);
      paneL.position.set(-4, 0, 0.4);
      windowGroup.add(paneL);

      // Right arched glass pane with warm amber glow
      const paneR = new THREE.Mesh(new THREE.BoxGeometry(5.5, 16, 1.8), candleMat);
      paneR.position.set(4, 0, 0.4);
      windowGroup.add(paneR);

      // Center stone mullion dividing the double window
      const mullion = new THREE.Mesh(new THREE.BoxGeometry(1.8, 18, 3.2), darkMat);
      windowGroup.add(mullion);

      // Stone sill shelf at bottom
      const sill = new THREE.Mesh(new THREE.BoxGeometry(22, 2.5, 4.0), darkMat);
      sill.position.set(0, -11, 0.8);
      windowGroup.add(sill);

      group.add(windowGroup);
    }
  }

  // 6C. Keep Roof & Main Donjon Spire
  const keepRoofGeo = new THREE.BoxGeometry(KEEP_W + 10, 18, KEEP_W + 10);
  const keepRoof    = new THREE.Mesh(keepRoofGeo, darkMat);
  keepRoof.position.set(0, KEEP_H + 9, 0);
  keepRoof.castShadow = true;
  group.add(keepRoof);

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
  const pole     = new THREE.Mesh(poleGeo, woodMat);
  pole.position.set(0, KEEP_H + 18 + 70 + 40, 0);
  group.add(pole);

  // Flag banner — wide royal heraldic banner
  const flagGeo  = new THREE.BoxGeometry(44, 28, 4);
  const flagMat  = new THREE.MeshStandardMaterial({ color: flagColor, roughness: 0.75, metalness: 0.05 });
  const flag     = new THREE.Mesh(flagGeo, flagMat);
  flag.position.set(22, KEEP_H + 18 + 70 + 72, 0);
  flag.name = 'castleFlag';
  group.add(flag);

  // Flag finial (gold ball)
  const finialGeo = new THREE.SphereGeometry(4, 6, 6);
  const finialMat = new THREE.MeshBasicMaterial({ color: 0xffd700 });
  const finial    = new THREE.Mesh(finialGeo, finialMat);
  finial.position.set(0, KEEP_H + 18 + 70 + 80, 0);
  group.add(finial);

  // ── 8. GATEHOUSE FORTIFICATION, PORTCULLIS & HERALDIC SHIELDS ─────────
  const GH_W = 76, GH_H = 75, GH_D = 44;
  const gateHouseGeo = new THREE.BoxGeometry(GH_W, GH_H, GH_D);
  const gateHouse    = new THREE.Mesh(gateHouseGeo, wallMat);
  gateHouse.position.set(0, GH_H / 2, WALL_W / 2 + GH_D / 2 - 10);
  gateHouse.castShadow    = true;
  gateHouse.receiveShadow = true;
  group.add(gateHouse);

  // Gate opening (dark stone vaulted passage)
  const archGeo = new THREE.BoxGeometry(32, 44, GH_D + 6);
  const arch    = new THREE.Mesh(archGeo, gateMat);
  arch.position.set(0, 22, WALL_W / 2 + GH_D / 2 - 10);
  group.add(arch);

  // Heavy Studded Wooden Double Gates
  const gateDoor = new THREE.Mesh(new THREE.BoxGeometry(29, 38, 3.5), new THREE.MeshStandardMaterial({ color: 0x3d2010, roughness: 0.95 }));
  gateDoor.position.set(0, 19, WALL_W / 2 + GH_D / 2 - 12);
  group.add(gateDoor);

  // Lowered Iron Portcullis (şaquli dəmir şəbəkəli asma qəfəs)
  const portcullisGroup = new THREE.Group();
  portcullisGroup.position.set(0, 22, WALL_W / 2 + GH_D / 2 + 2);

  // Vertical iron bars with downward pointed spikes
  for (let b = -4; b <= 4; b++) {
    const bar = new THREE.Mesh(new THREE.CylinderGeometry(0.55, 0.55, 34, 5), ironMat);
    bar.position.set(b * 3.2, 0, 0);
    portcullisGroup.add(bar);

    const spike = new THREE.Mesh(new THREE.ConeGeometry(0.85, 3.0, 4), ironMat);
    spike.position.set(b * 3.2, -18.5, 0);
    spike.rotation.x = Math.PI;
    portcullisGroup.add(spike);
  }
  // Horizontal iron crossbars
  for (const hy of [-10, 0, 10]) {
    const hBar = new THREE.Mesh(new THREE.BoxGeometry(30, 1.2, 1.2), ironMat);
    hBar.position.y = hy;
    portcullisGroup.add(hBar);
  }
  group.add(portcullisGroup);

  // Round top arch trim
  const archTopGeo = new THREE.CylinderGeometry(16, 16, GH_D + 6, 8, 1, false, 0, Math.PI);
  archTopGeo.rotateX(Math.PI / 2);
  const archTopMesh = new THREE.Mesh(archTopGeo, darkMat);
  archTopMesh.position.set(0, 44, WALL_W / 2 + GH_D / 2 - 10);
  group.add(archTopMesh);

  // Two Royal War Shields mounted above the gate entrance
  const shieldGeo = new THREE.BoxGeometry(7, 10, 1.5);
  const shieldMat = new THREE.MeshStandardMaterial({ color: isBlue ? 0x1d4ed8 : 0xb91c1c, roughness: 0.6 });

  const shieldL = new THREE.Mesh(shieldGeo, shieldMat);
  shieldL.position.set(-9, 56, WALL_W / 2 + GH_D - 7);
  group.add(shieldL);

  const shieldR = new THREE.Mesh(shieldGeo, shieldMat);
  shieldR.position.set(9, 56, WALL_W / 2 + GH_D - 7);
  group.add(shieldR);

  // Two Gatehouse Watch Sentries on the Parapet Deck!
  const sentryGateL = createSentrySoldier(team, 0);
  sentryGateL.position.set(-22, GH_H + 1.2, WALL_W / 2 + GH_D / 2);
  group.add(sentryGateL);

  const sentryGateR = createSentrySoldier(team, 0);
  sentryGateR.position.set(22, GH_H + 1.2, WALL_W / 2 + GH_D / 2);
  group.add(sentryGateR);

  // Gatehouse roof
  const ghRoofGeo = new THREE.ConeGeometry(GH_W * 0.72, 45, 4);
  ghRoofGeo.rotateY(Math.PI / 4);
  const ghRoof = new THREE.Mesh(ghRoofGeo, roofMat);
  ghRoof.position.set(0, GH_H + 22, WALL_W / 2 + GH_D / 2 - 10);
  ghRoof.castShadow = true;
  group.add(ghRoof);

  // ── 9. INNER WALLS (Secondary Fortress Ring) ──────────────────────────
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

  // ── 10. HISTORIC MOSS, CREEPING IVY & WEATHERED ROCK PATCHES ─────────
  // Low-poly moss and ivy patches growing along damp foundations
  const mossPositions: [number, number, number, number, boolean][] = [
    // [x, y, z, scale, isVibrant]
    [-WALL_W / 2 + 18, 4,  WALL_W / 2 - 32, 2.8, true],
    [-WALL_W / 2 + 25, 7,  WALL_W / 2 - 30, 2.0, false],
    [ WALL_W / 2 - 22, 5,  WALL_W / 2 - 28, 2.5, true],
    [-WALL_W / 2 + 20, 6, -WALL_W / 2 + 30, 3.2, false],
    [ 22,              3,  WALL_W / 2 + GH_D - 12, 2.2, true],
    [-24,              4,  WALL_W / 2 + GH_D - 12, 2.6, false],
    [-55,              6,  0,                      2.8, true],
    [ 55,              5,  20,                     2.4, false],
    [ 0,               4, -80,                     3.5, true],
  ];

  for (const [mx, my, mz, ms, isVib] of mossPositions) {
    const mGeo = new THREE.DodecahedronGeometry(ms, 0);
    mGeo.scale(1.2, 0.65, 1.2);
    const moss = new THREE.Mesh(mGeo, isVib ? mossMat2 : mossMat1);
    moss.position.set(mx, my, mz);
    group.add(moss);
  }

  // ── 11. INNER COURTYARD FORTRESS LIFE (Water Well, Supply Barrels & Crates)
  // Stone Water Well with Timber Canopy in courtyard
  const wellBase = new THREE.Mesh(new THREE.CylinderGeometry(7, 8, 5, 8), darkMat);
  wellBase.position.set(-55, 2.5, -45);
  group.add(wellBase);

  // Well water reflection
  const wellWater = new THREE.Mesh(new THREE.CylinderGeometry(5.8, 5.8, 1, 8), new THREE.MeshStandardMaterial({ color: 0x0284c7, roughness: 0.1 }));
  wellWater.position.set(-55, 3.5, -45);
  group.add(wellWater);

  // Well wooden roof posts & peaked roof
  const post1 = new THREE.Mesh(new THREE.BoxGeometry(1.2, 10, 1.2), woodMat);
  post1.position.set(-55, 7.5, -49);
  group.add(post1);

  const post2 = new THREE.Mesh(new THREE.BoxGeometry(1.2, 10, 1.2), woodMat);
  post2.position.set(-55, 7.5, -41);
  group.add(post2);

  const wellRoof = new THREE.Mesh(new THREE.ConeGeometry(9.5, 6, 4), roofMat);
  wellRoof.position.set(-55, 14, -45);
  wellRoof.rotation.y = Math.PI / 4;
  group.add(wellRoof);

  // Oak supply barrels
  const barrelPositions: [number, number, number][] = [
    [-65, 4.5, 45],
    [-70, 4.5, 48],
    [-66, 4.5, 53],
    [ 62, 4.5, -42],
    [ 67, 4.5, -45],
  ];
  for (const [bx, by, bz] of barrelPositions) {
    const barrel = new THREE.Mesh(new THREE.CylinderGeometry(3.0, 3.0, 7.5, 7), woodMat);
    barrel.position.set(bx, by, bz);
    group.add(barrel);

    // Iron bands on barrel
    const band = new THREE.Mesh(new THREE.CylinderGeometry(3.1, 3.1, 1.2, 7), ironMat);
    band.position.set(bx, by, bz);
    group.add(band);
  }

  // Wooden supply crates
  const cratePositions: [number, number, number, number][] = [
    [-75, 4, 38, 8],
    [-73, 11, 40, 6],
    [ 72, 4, -52, 8],
  ];
  for (const [cx, cy, cz, cs] of cratePositions) {
    const crate = new THREE.Mesh(new THREE.BoxGeometry(cs, cs, cs), woodMat);
    crate.position.set(cx, cy, cz);
    crate.castShadow = true;
    group.add(crate);
  }

  return group;
}

// ── ANIMATION & UPDATE ────────────────────────────────────────────────────
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

  // 1. Breathing territorial aura pulse
  const aura = mesh.getObjectByName('territoryAura') as THREE.Mesh | undefined;
  if (aura) {
    (aura.material as THREE.MeshBasicMaterial).opacity = 0.14 + Math.sin(time * 1.8) * 0.07;
  }

  // 2. Royal flag wave animation
  const flag = mesh.getObjectByName('castleFlag') as THREE.Mesh | undefined;
  if (flag) {
    flag.rotation.y = Math.sin(time * 1.4) * 0.18;
    flag.position.z = Math.sin(time * 1.4) * 3.0;
  }

  // 3. Torches flickering (organic flame pulse)
  mesh.traverse((child) => {
    if (child.name === 'torchFlame') {
      const flicker = 0.85 + Math.sin(time * 8.5 + child.position.x) * 0.18;
      child.scale.setScalar(flicker);
    }
    // 4. Sentry guards alert scanning animation (slowly looking across the horizon)
    else if (child.name === 'castleSentry' && child.userData.baseAngle !== undefined) {
      const baseA = child.userData.baseAngle as number;
      child.rotation.y = baseA + Math.sin(time * 0.9 + child.position.x * 0.1) * 0.32;
    }
  });
}