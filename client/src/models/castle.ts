import * as THREE from 'three';
import { PALETTE } from '../assets/palette.js';

function createMaterial(color: number | string): THREE.MeshStandardMaterial {
    return new THREE.MeshStandardMaterial({
        color: color,
        roughness: 0.9,
        metalness: 0,
        flatShading: true
    });
}

export function createCastleFlag(team: 'blue' | 'red'): THREE.Group {
    const group = new THREE.Group();
    
    const poleGeo = new THREE.CylinderGeometry(0.1, 0.1, 3, 8);
    poleGeo.computeVertexNormals();
    const poleMat = createMaterial(0x888888);
    const pole = new THREE.Mesh(poleGeo, poleMat);
    pole.position.y = 1.5;
    pole.castShadow = true;
    pole.receiveShadow = true;
    group.add(pole);
    
    const flagGeo = new THREE.BoxGeometry(1.5, 1.0, 0.05);
    flagGeo.computeVertexNormals();
    const flagMat = createMaterial(team === 'blue' ? 0x0000ff : 0xff0000);
    const flag = new THREE.Mesh(flagGeo, flagMat);
    // Position flag so its left edge is at the pole
    flag.position.set(0.75, 2.5, 0);
    flag.castShadow = true;
    flag.receiveShadow = true;
    
    group.add(flag);
    group.userData.flagMesh = flag;
    
    return group;
}

export function animateCastleFlag(flagGroup: THREE.Group, time: number): void {
    const flagMesh = flagGroup.userData.flagMesh as THREE.Mesh;
    if (flagMesh) {
        // Simple wave animation
        const wave = Math.sin(time * 5);
        flagMesh.scale.x = 1 + wave * 0.1;
    }
}

export function createEmptyFlagPost(): THREE.Group {
    const group = new THREE.Group();
    
    const poleGeo = new THREE.CylinderGeometry(0.1, 0.1, 3, 8);
    poleGeo.computeVertexNormals();
    const poleMat = createMaterial(0x888888);
    const pole = new THREE.Mesh(poleGeo, poleMat);
    pole.position.y = 1.5;
    pole.castShadow = true;
    pole.receiveShadow = true;
    group.add(pole);
    
    const light = new THREE.PointLight(0xffffff, 1, 10);
    light.position.y = 3;
    group.add(light);
    
    return group;
}

export function createCastleLevelUpEffect(position: THREE.Vector3): THREE.Points {
    const particleCount = 80;
    const geometry = new THREE.BufferGeometry();
    const positions = new Float32Array(particleCount * 3);
    const velocities = [];
    
    for (let i = 0; i < particleCount; i++) {
        const theta = Math.random() * Math.PI * 2;
        const radius = Math.random() * 2;
        
        positions[i * 3] = position.x + Math.cos(theta) * radius;
        positions[i * 3 + 1] = position.y + Math.random();
        positions[i * 3 + 2] = position.z + Math.sin(theta) * radius;
        
        velocities.push({
            x: (Math.random() - 0.5) * 0.1,
            y: Math.random() * 0.2 + 0.1,
            z: (Math.random() - 0.5) * 0.1
        });
    }
    
    geometry.setAttribute('position', new THREE.BufferAttribute(positions, 3));
    
    const material = new THREE.PointsMaterial({
        color: 0xffd700,
        size: 0.3,
        transparent: true,
        opacity: 0.8
    });
    
    const points = new THREE.Points(geometry, material);
    points.userData.velocities = velocities;
    
    return points;
}

export function createCastle(team: 'blue' | 'red', level: 1 | 2 | 3): THREE.Group {
    const group = new THREE.Group();
    const woodMat = createMaterial(0x8B5A2B);
    const stoneMat = createMaterial(0x808080);
    const teamColor = team === 'blue' ? 0x0000ff : 0xff0000;
    
    // Shadow plane
    const shadowGeo = new THREE.PlaneGeometry(16, 16);
    const shadowMat = new THREE.MeshBasicMaterial({ color: 0x000000, transparent: true, opacity: 0.4 });
    const shadow = new THREE.Mesh(shadowGeo, shadowMat);
    shadow.rotation.x = -Math.PI / 2;
    shadow.position.y = 0.05;
    group.add(shadow);
    
    // Team ring
    const ringGeo = new THREE.TorusGeometry(8, 0.3, 8, 32);
    ringGeo.computeVertexNormals();
    const ringMat = createMaterial(teamColor);
    const ring = new THREE.Mesh(ringGeo, ringMat);
    ring.rotation.x = -Math.PI / 2;
    ring.position.y = 0.1;
    group.add(ring);
    
    let tallestPoint = 0;
    
    if (level === 1) {
        // Cabin
        const cabinGeo = new THREE.BoxGeometry(6, 4, 6);
        cabinGeo.computeVertexNormals();
        const cabin = new THREE.Mesh(cabinGeo, woodMat);
        cabin.position.y = 2;
        cabin.castShadow = true;
        cabin.receiveShadow = true;
        group.add(cabin);
        tallestPoint = 4;
        
        // Fence posts
        for (let i = 0; i < 8; i++) {
            const angle = (i / 8) * Math.PI * 2;
            const postGeo = new THREE.BoxGeometry(0.5, 3, 0.5);
            postGeo.computeVertexNormals();
            const post = new THREE.Mesh(postGeo, woodMat);
            post.position.set(Math.cos(angle) * 7, 1.5, Math.sin(angle) * 7);
            post.castShadow = true;
            post.receiveShadow = true;
            group.add(post);
        }
    } else if (level === 2) {
        // Walls
        const wallPositions = [
            { x: 0, z: -7, rotY: 0 },
            { x: 0, z: 7, rotY: 0 },
            { x: -7, z: 0, rotY: Math.PI / 2 },
            { x: 7, z: 0, rotY: Math.PI / 2 },
        ];
        wallPositions.forEach(pos => {
            const wallGeo = new THREE.BoxGeometry(14, 4, 1);
            wallGeo.computeVertexNormals();
            const wall = new THREE.Mesh(wallGeo, stoneMat);
            wall.position.set(pos.x, 2, pos.z);
            wall.rotation.y = pos.rotY;
            wall.castShadow = true;
            wall.receiveShadow = true;
            group.add(wall);
        });
        
        // Towers
        const towerPositions = [
            { x: -7, z: -7 }, { x: 7, z: -7 }, { x: -7, z: 7 }, { x: 7, z: 7 }
        ];
        towerPositions.forEach(pos => {
            const towerGeo = new THREE.CylinderGeometry(1.5, 1.5, 6, 8);
            towerGeo.computeVertexNormals();
            const tower = new THREE.Mesh(towerGeo, stoneMat);
            tower.position.set(pos.x, 3, pos.z);
            tower.castShadow = true;
            tower.receiveShadow = true;
            group.add(tower);
        });
        
        // Gate arch
        const archGeo = new THREE.BoxGeometry(4, 5, 2);
        archGeo.computeVertexNormals();
        const arch = new THREE.Mesh(archGeo, stoneMat);
        arch.position.set(0, 2.5, 7.5);
        arch.castShadow = true;
        arch.receiveShadow = true;
        group.add(arch);
        
        tallestPoint = 6;
    } else if (level === 3) {
        // Central Keep
        const keepGeo = new THREE.BoxGeometry(8, 8, 8);
        keepGeo.computeVertexNormals();
        const keep = new THREE.Mesh(keepGeo, stoneMat);
        keep.position.y = 4;
        keep.castShadow = true;
        keep.receiveShadow = true;
        group.add(keep);
        tallestPoint = 8;
        
        // Walls
        const wallPositions = [
            { x: 0, z: -7, rotY: 0 }, { x: 0, z: 7, rotY: 0 },
            { x: -7, z: 0, rotY: Math.PI / 2 }, { x: 7, z: 0, rotY: Math.PI / 2 },
        ];
        wallPositions.forEach(pos => {
            const wallGeo = new THREE.BoxGeometry(14, 5, 1.5);
            wallGeo.computeVertexNormals();
            const wall = new THREE.Mesh(wallGeo, stoneMat);
            wall.position.set(pos.x, 2.5, pos.z);
            wall.rotation.y = pos.rotY;
            wall.castShadow = true;
            wall.receiveShadow = true;
            group.add(wall);
            
            // Crenellations
            for (let i = -6; i <= 6; i += 2) {
                const crenGeo = new THREE.BoxGeometry(1, 1, 1.5);
                crenGeo.computeVertexNormals();
                const cren = new THREE.Mesh(crenGeo, stoneMat);
                if (pos.rotY === 0) {
                    cren.position.set(pos.x + i, 5.5, pos.z);
                } else {
                    cren.position.set(pos.x, 5.5, pos.z + i);
                }
                cren.castShadow = true;
                cren.receiveShadow = true;
                group.add(cren);
            }
        });
        
        // 4 Main Towers
        const towerPositions = [
            { x: -7, z: -7 }, { x: 7, z: -7 }, { x: -7, z: 7 }, { x: 7, z: 7 }
        ];
        towerPositions.forEach(pos => {
            const towerGeo = new THREE.CylinderGeometry(2, 2, 8, 8);
            towerGeo.computeVertexNormals();
            const tower = new THREE.Mesh(towerGeo, stoneMat);
            tower.position.set(pos.x, 4, pos.z);
            tower.castShadow = true;
            tower.receiveShadow = true;
            group.add(tower);
        });
        
        // 2 Side Towers
        const sideTowerPos = [{ x: -8, z: 0 }, { x: 8, z: 0 }];
        sideTowerPos.forEach(pos => {
            const towerGeo = new THREE.CylinderGeometry(1.5, 1.5, 7, 8);
            towerGeo.computeVertexNormals();
            const tower = new THREE.Mesh(towerGeo, stoneMat);
            tower.position.set(pos.x, 3.5, pos.z);
            tower.castShadow = true;
            tower.receiveShadow = true;
            group.add(tower);
        });
    }
    
    // Flag
    const flag = createCastleFlag(team);
    flag.position.y = tallestPoint;
    group.add(flag);
    
    return group;
}
