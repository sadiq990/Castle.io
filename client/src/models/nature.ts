import * as THREE from 'three';
import { PALETTE } from '../assets/palette.js';

export function createTree(variant: 'dark' | 'light' | 'autumn' | 'mushroom'): THREE.Group {
    const group = new THREE.Group();
    group.userData.isTree = true;
    group.userData.variant = variant;
    group.userData.originalScale = 1.0;

    const brown = (PALETTE as any).WOOD_BROWN || 0x5c4033;
    const treeDark = (PALETTE as any).TREE_DARK || 0x1e3f20;
    const treeLight = (PALETTE as any).TREE_LIGHT || 0x2d5a27;
    const treeAutumn = (PALETTE as any).TREE_AUTUMN || 0xcc5500;
    const mushroomStem = 0xf5f5dc;
    const mushroomCap = 0xd44c2e;

    const trunkMat = new THREE.MeshStandardMaterial({ color: brown, roughness: 0.9, metalness: 0, flatShading: true });

    if (variant === 'dark' || variant === 'light') {
        const h = variant === 'dark' ? 1.5 : 1.2;
        const trunkGeo = new THREE.CylinderGeometry(0.2, 0.3, h, 5);
        const trunk = new THREE.Mesh(trunkGeo, trunkMat);
        trunk.position.y = h / 2;
        trunk.castShadow = true;
        trunk.receiveShadow = true;
        group.add(trunk);

        const leafColor = variant === 'dark' ? treeDark : treeLight;
        const leafMat = new THREE.MeshStandardMaterial({ color: leafColor, roughness: 0.9, metalness: 0, flatShading: true });
        
        const cone1Geo = new THREE.ConeGeometry(1.4, 2.5, 7);
        const cone1 = new THREE.Mesh(cone1Geo, leafMat);
        cone1.position.y = h + 0.5;
        cone1.castShadow = true;
        cone1.receiveShadow = true;
        group.add(cone1);

        const cone2Geo = new THREE.ConeGeometry(1.0, 2.0, 7);
        const cone2 = new THREE.Mesh(cone2Geo, leafMat);
        cone2.position.y = h + 1.8;
        cone2.castShadow = true;
        cone2.receiveShadow = true;
        group.add(cone2);
    } else if (variant === 'autumn') {
        const trunkGeo = new THREE.CylinderGeometry(0.2, 0.3, 1.2, 5);
        const trunk = new THREE.Mesh(trunkGeo, trunkMat);
        trunk.position.y = 0.6;
        trunk.castShadow = true;
        trunk.receiveShadow = true;
        group.add(trunk);

        const leafMat = new THREE.MeshStandardMaterial({ color: treeAutumn, roughness: 0.9, metalness: 0, flatShading: true });
        const leafGeo = new THREE.IcosahedronGeometry(1.2, 0);
        const leaves = new THREE.Mesh(leafGeo, leafMat);
        leaves.position.y = 1.8;
        leaves.rotation.set(Math.random() * Math.PI, Math.random() * Math.PI, Math.random() * Math.PI);
        leaves.castShadow = true;
        leaves.receiveShadow = true;
        group.add(leaves);
    } else if (variant === 'mushroom') {
        const stemMat = new THREE.MeshStandardMaterial({ color: mushroomStem, roughness: 0.9, metalness: 0, flatShading: true });
        const stemGeo = new THREE.CylinderGeometry(0.25, 0.35, 1.0, 6);
        const stem = new THREE.Mesh(stemGeo, stemMat);
        stem.position.y = 0.5;
        stem.castShadow = true;
        stem.receiveShadow = true;
        group.add(stem);

        const capMat = new THREE.MeshStandardMaterial({ color: mushroomCap, roughness: 0.9, metalness: 0, flatShading: true });
        const capGeo = new THREE.CylinderGeometry(0, 1.6, 0.8, 8);
        const cap = new THREE.Mesh(capGeo, capMat);
        cap.position.y = 1.0 + 0.4;
        cap.castShadow = true;
        cap.receiveShadow = true;
        group.add(cap);
    }

    return group;
}

export function createStump(): THREE.Group {
    const group = new THREE.Group();
    group.userData.isStump = true;
    const brown = (PALETTE as any).WOOD_BROWN || 0x5c4033;
    const mat = new THREE.MeshStandardMaterial({ color: brown, roughness: 0.9, metalness: 0, flatShading: true });
    const geo = new THREE.CylinderGeometry(0.25, 0.35, 0.4, 5);
    const mesh = new THREE.Mesh(geo, mat);
    mesh.position.y = 0.2;
    mesh.castShadow = true;
    mesh.receiveShadow = true;
    group.add(mesh);
    return group;
}

export function createRock(size: 'small' | 'medium' | 'large'): THREE.Group {
    const group = new THREE.Group();
    const rockColor = (PALETTE as any).ROCK || 0x888888;
    const goldColor = (PALETTE as any).GOLD || 0xffd700;
    const r = size === 'small' ? 0.4 : size === 'medium' ? 0.8 : 1.4;

    const rockMat = new THREE.MeshStandardMaterial({ color: rockColor, roughness: 0.9, metalness: 0, flatShading: true });
    const rockGeo = new THREE.IcosahedronGeometry(r, 0);
    const rock = new THREE.Mesh(rockGeo, rockMat);
    rock.position.y = r * 0.8;
    rock.rotation.set(Math.random() * Math.PI, Math.random() * Math.PI, Math.random() * Math.PI);
    rock.castShadow = true;
    rock.receiveShadow = true;
    group.add(rock);

    if (size === 'large') {
        const goldMat = new THREE.MeshStandardMaterial({ color: goldColor, roughness: 0.7, metalness: 0.2, flatShading: true });
        const numCrystals = 2 + Math.floor(Math.random() * 2); // 2-3 crystals
        for (let i = 0; i < numCrystals; i++) {
            const crystalGeo = new THREE.ConeGeometry(0.2, 0.8, 4);
            const crystal = new THREE.Mesh(crystalGeo, goldMat);
            crystal.position.set(
                (Math.random() - 0.5) * 1.0,
                r * 1.5,
                (Math.random() - 0.5) * 1.0
            );
            crystal.rotation.set(
                (Math.random() - 0.5) * 0.5,
                Math.random() * Math.PI,
                (Math.random() - 0.5) * 0.5
            );
            crystal.castShadow = true;
            group.add(crystal);
        }
    }

    return group;
}

export function createBridge(): THREE.Group {
    const group = new THREE.Group();
    const brown = (PALETTE as any).WOOD_BROWN || 0x6b4226;
    const woodMat = new THREE.MeshStandardMaterial({ color: brown, roughness: 0.9, metalness: 0, flatShading: true });

    // Floor (6 planks along Z)
    for (let i = 0; i < 6; i++) {
        const plankGeo = new THREE.BoxGeometry(4, 0.25, 2);
        const plank = new THREE.Mesh(plankGeo, woodMat);
        plank.position.set(0, 0.125, -5 + i * 2);
        plank.castShadow = true;
        plank.receiveShadow = true;
        group.add(plank);
    }

    // Side railings (2x horizontal beams)
    const railingGeo = new THREE.CylinderGeometry(0.08, 0.08, 14);
    
    const rail1 = new THREE.Mesh(railingGeo, woodMat);
    rail1.rotation.x = Math.PI / 2;
    rail1.position.set(-1.9, 0.8, 0);
    rail1.castShadow = true;
    group.add(rail1);

    const rail2 = new THREE.Mesh(railingGeo, woodMat);
    rail2.rotation.x = Math.PI / 2;
    rail2.position.set(1.9, 0.8, 0);
    rail2.castShadow = true;
    group.add(rail2);

    // Support posts (4 corners)
    const postGeo = new THREE.CylinderGeometry(0.12, 0.12, 1.5);
    const postPositions = [
        [-1.9, -6], [-1.9, 6], [1.9, -6], [1.9, 6]
    ];
    for (const [x, z] of postPositions) {
        const post = new THREE.Mesh(postGeo, woodMat);
        post.position.set(x ?? 0, 0.75, z ?? 0);
        post.castShadow = true;
        group.add(post);
    }

    // Torches at ends
    const torchPositions = [
        [-1.9, 1.5, -6], [1.9, 1.5, 6]
    ];
    const torchGeo = new THREE.CylinderGeometry(0.08, 0.1, 0.5);
    for (const [x, y, z] of torchPositions) {
        const torch = new THREE.Mesh(torchGeo, woodMat);
        torch.position.set(x ?? 0, y ?? 0, z ?? 0);
        group.add(torch);
        
        const light = new THREE.PointLight(0xff8844, 1.2, 4);
        light.position.set(x ?? 0, (y ?? 0) + 0.3, z ?? 0);
        group.add(light);
    }

    return group;
}

export function createShrine(): THREE.Group {
    const group = new THREE.Group();
    
    // Base platform
    const stoneMat = new THREE.MeshStandardMaterial({ color: 0x888888, roughness: 0.9, metalness: 0, flatShading: true });
    const baseGeo = new THREE.CylinderGeometry(3, 3.5, 0.6, 8);
    const base = new THREE.Mesh(baseGeo, stoneMat);
    base.position.y = 0.3;
    base.castShadow = true;
    base.receiveShadow = true;
    group.add(base);

    // Pillars
    const pillarGeo = new THREE.CylinderGeometry(0.3, 0.35, 4, 6);
    for (let i = 0; i < 4; i++) {
        const angle = (i * Math.PI) / 2 + Math.PI / 4;
        const pillar = new THREE.Mesh(pillarGeo, stoneMat);
        pillar.position.set(Math.cos(angle) * 2.5, 2, Math.sin(angle) * 2.5);
        pillar.castShadow = true;
        group.add(pillar);
    }

    // Crystal
    const crystalGeo = new THREE.IcosahedronGeometry(0.8, 1);
    const crystalMat = new THREE.MeshStandardMaterial({
        color: 0x88ffcc,
        emissive: 0x44aaff,
        emissiveIntensity: 0.8,
        transparent: true,
        opacity: 0.9,
        flatShading: true
    });
    const crystal = new THREE.Mesh(crystalGeo, crystalMat);
    crystal.position.y = 3;
    group.add(crystal);
    group.userData.crystal = crystal;

    const crystalLight = new THREE.PointLight(0x44aaff, 2, 8);
    crystalLight.position.y = 3;
    group.add(crystalLight);
    group.userData.crystalLight = crystalLight;

    // Ring on ground
    const ringGeo = new THREE.TorusGeometry(3.5, 0.15, 4, 32);
    const ringMat = new THREE.MeshStandardMaterial({ color: 0x888888, emissive: 0x44aaff, emissiveIntensity: 0.5 });
    const ring = new THREE.Mesh(ringGeo, ringMat);
    ring.rotation.x = Math.PI / 2;
    ring.position.y = 0.1;
    group.add(ring);
    group.userData.ring = ring;

    return group;
}

export function animateShrine(shrineGroup: THREE.Group, time: number, capturedByTeam: 'blue' | 'red' | null): void {
    if (shrineGroup.userData.crystal) {
        shrineGroup.userData.crystal.rotation.y = time;
        shrineGroup.userData.crystal.position.y = 3 + Math.sin(time * 1.5) * 0.2;
    }
    
    let color = 0x44aaff;
    if (capturedByTeam === 'blue') color = (PALETTE as any).TEAM_BLUE || 0x0044ff;
    if (capturedByTeam === 'red') color = (PALETTE as any).TEAM_RED || 0xff0000;
    
    const intensity = capturedByTeam ? 1.5 : 0.8;

    if (shrineGroup.userData.crystal) {
        (shrineGroup.userData.crystal.material as THREE.MeshStandardMaterial).emissive.setHex(color);
        (shrineGroup.userData.crystal.material as THREE.MeshStandardMaterial).emissiveIntensity = intensity;
    }
    if (shrineGroup.userData.ring) {
        (shrineGroup.userData.ring.material as THREE.MeshStandardMaterial).emissive.setHex(color);
        (shrineGroup.userData.ring.material as THREE.MeshStandardMaterial).emissiveIntensity = intensity;
    }
    if (shrineGroup.userData.crystalLight) {
        shrineGroup.userData.crystalLight.color.setHex(color);
        shrineGroup.userData.crystalLight.intensity = capturedByTeam ? 3 : 2;
    }
}

export function createNeutralCamp(): THREE.Group {
    const group = new THREE.Group();
    const tentMat = new THREE.MeshStandardMaterial({ color: 0x8b7355, roughness: 0.9, metalness: 0, flatShading: true });
    
    const tentGeo = new THREE.ConeGeometry(1.5, 2.5, 5);
    const tent1 = new THREE.Mesh(tentGeo, tentMat);
    tent1.position.set(-2, 1.25, -2);
    tent1.castShadow = true;
    group.add(tent1);

    const tent2 = new THREE.Mesh(tentGeo, tentMat);
    tent2.position.set(2, 1.25, -1);
    tent2.rotation.y = Math.PI / 4;
    tent2.castShadow = true;
    group.add(tent2);

    const fireMat = new THREE.MeshStandardMaterial({ color: 0x333333, roughness: 0.9, metalness: 0, flatShading: true });
    const fireGeo = new THREE.CylinderGeometry(0.3, 0.1, 0.2, 6);
    const fire = new THREE.Mesh(fireGeo, fireMat);
    fire.position.set(0, 0.1, 1.5);
    group.add(fire);

    const fireLight = new THREE.PointLight(0xff6600, 1.5, 5);
    fireLight.position.set(0, 0.5, 1.5);
    group.add(fireLight);
    group.userData.fireLight = fireLight;

    const logMat = new THREE.MeshStandardMaterial({ color: (PALETTE as any).WOOD_BROWN || 0x5c4033, roughness: 0.9, metalness: 0, flatShading: true });
    const logGeo = new THREE.CylinderGeometry(0.2, 0.2, 0.35, 6);
    for (let i = 0; i < 3; i++) {
        const angle = (i * Math.PI * 2) / 3;
        const log = new THREE.Mesh(logGeo, logMat);
        log.position.set(Math.cos(angle) * 1.0, 0.175, 1.5 + Math.sin(angle) * 1.0);
        log.castShadow = true;
        group.add(log);
    }

    return group;
}

export function animateCampFire(campGroup: THREE.Group, time: number): void {
    if (campGroup.userData.fireLight) {
        campGroup.userData.fireLight.intensity = Math.sin(time * 7) * 0.3 + Math.sin(time * 13) * 0.2 + 1.2;
    }
}

export function createGoldMine(): THREE.Group {
    const group = new THREE.Group();
    const rockMat = new THREE.MeshStandardMaterial({ color: 0x888888, roughness: 0.9, metalness: 0, flatShading: true });
    const rockGeo = new THREE.IcosahedronGeometry(2.0, 0);
    const rock = new THREE.Mesh(rockGeo, rockMat);
    rock.position.y = 1.5;
    rock.castShadow = true;
    rock.receiveShadow = true;
    group.add(rock);

    const crystals: THREE.Mesh[] = [];
    const goldMat = new THREE.MeshStandardMaterial({
        color: (PALETTE as any).GOLD || 0xffd700,
        emissive: 0xffaa00,
        emissiveIntensity: 0.4,
        roughness: 0.3,
        metalness: 0.8,
        flatShading: true
    });
    const crystalGeo = new THREE.ConeGeometry(0.25, 0.9, 4);

    for (let i = 0; i < 5; i++) {
        const crystal = new THREE.Mesh(crystalGeo, goldMat);
        const angle = (i * Math.PI * 2) / 5;
        crystal.position.set(
            Math.cos(angle) * 1.2,
            2.5 + Math.random() * 0.5,
            Math.sin(angle) * 1.2
        );
        crystal.rotation.set(
            (Math.random() - 0.5),
            Math.random() * Math.PI,
            (Math.random() - 0.5)
        );
        crystal.castShadow = true;
        group.add(crystal);
        crystals.push(crystal);
    }

    group.userData.crystals = crystals;

    const light = new THREE.PointLight(0xffcc00, 0.8, 6);
    light.position.y = 3.5;
    group.add(light);

    return group;
}

export function animateGoldMine(mineGroup: THREE.Group, time: number): void {
    if (mineGroup.userData.crystals) {
        mineGroup.userData.crystals.forEach((crystal: THREE.Mesh, index: number) => {
            if (crystal.material instanceof THREE.MeshStandardMaterial) {
                crystal.material.emissiveIntensity = 0.4 + Math.sin(time * 2 + index) * 0.15;
            }
        });
    }
}

export function createBerryBush(): THREE.Group {
    const group = new THREE.Group();
    const bushMat = new THREE.MeshStandardMaterial({ color: 0x2d7a2d, roughness: 0.9, metalness: 0, flatShading: true });
    const bushGeo = new THREE.IcosahedronGeometry(0.7, 0);
    const bush = new THREE.Mesh(bushGeo, bushMat);
    bush.position.y = 0.5;
    bush.castShadow = true;
    bush.receiveShadow = true;
    group.add(bush);

    const berryMat = new THREE.MeshStandardMaterial({ color: 0xcc2222, roughness: 0.7, metalness: 0, flatShading: true });
    const berryGeo = new THREE.SphereGeometry(0.12, 4, 4);
    
    for (let i = 0; i < 6; i++) {
        const berry = new THREE.Mesh(berryGeo, berryMat);
        const theta = Math.random() * Math.PI * 2;
        const phi = Math.random() * Math.PI;
        const r = 0.7;
        berry.position.set(
            r * Math.sin(phi) * Math.cos(theta),
            0.5 + r * Math.cos(phi),
            r * Math.sin(phi) * Math.sin(theta)
        );
        berry.castShadow = true;
        group.add(berry);
    }

    return group;
}
