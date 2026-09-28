import * as THREE from 'three';
import { PALETTE } from '../assets/palette.js';

export type BuildingType = 'barracks' | 'archery' | 'stable' | 'catapult' | 'farm' | 'watchtower' | 'storage';
export type BuildingState = 'plan' | 'building' | 'ready';

function createMaterial(color: number, state: BuildingState): THREE.Material {
    if (state === 'plan') {
        return new THREE.MeshBasicMaterial({
            color: 0x00ff88,
            wireframe: true,
            transparent: true,
            opacity: 0.4
        });
    }
    
    return new THREE.MeshStandardMaterial({
        color: color,
        roughness: 0.9,
        metalness: 0,
        flatShading: true,
        transparent: state === 'building',
        opacity: state === 'building' ? 0.6 : 1.0
    });
}

function addScaffolding(group: THREE.Group, width: number, height: number, depth: number) {
    const woodMat = new THREE.MeshStandardMaterial({ color: 0x8B5A2B, flatShading: true });
    const scaffoldGeo = new THREE.BoxGeometry(0.2, height, 0.2);
    scaffoldGeo.computeVertexNormals();
    
    const positions = [
        [width/2 + 0.5, depth/2 + 0.5],
        [-width/2 - 0.5, depth/2 + 0.5],
        [width/2 + 0.5, -depth/2 - 0.5],
        [-width/2 - 0.5, -depth/2 - 0.5]
    ];
    
    positions.forEach(pos => {
        const post = new THREE.Mesh(scaffoldGeo, woodMat);
        post.position.set(pos[0] ?? 0, height/2, pos[1] ?? 0);
        post.castShadow = true;
        post.receiveShadow = true;
        group.add(post);
    });
}

export function createBuilding(type: BuildingType, team: 'blue' | 'red', state: BuildingState): THREE.Group {
    const group = new THREE.Group();
    const teamColor = team === 'blue' ? 0x0000ff : 0xff0000;
    
    const stoneMat = createMaterial(0x888888, state);
    const woodMat = createMaterial(0x8B5A2B, state);
    const teamMat = createMaterial(teamColor, state);
    const darkWoodMat = createMaterial(0x5C4033, state);
    const grassMat = createMaterial(0x228B22, state);
    
    let w = 4, h = 4, d = 4;

    switch (type) {
        case 'barracks': { // Kazarma
            w = 6; h = 4; d = 5;
            const baseGeo = new THREE.BoxGeometry(w, h, d);
            baseGeo.computeVertexNormals();
            const base = new THREE.Mesh(baseGeo, stoneMat);
            base.position.y = h/2;
            group.add(base);
            
            const roofGeo = new THREE.BoxGeometry(w + 0.5, 0.4, d + 0.5);
            roofGeo.computeVertexNormals();
            const roof = new THREE.Mesh(roofGeo, teamMat);
            roof.position.y = h + 0.2;
            group.add(roof);
            
            // Sword icon
            const swordGeo = new THREE.BoxGeometry(0.2, 2, 0.2);
            swordGeo.computeVertexNormals();
            const sword1 = new THREE.Mesh(swordGeo, darkWoodMat);
            sword1.position.set(0, h/2, d/2 + 0.1);
            sword1.rotation.z = Math.PI / 4;
            const sword2 = new THREE.Mesh(swordGeo, darkWoodMat);
            sword2.position.set(0, h/2, d/2 + 0.1);
            sword2.rotation.z = -Math.PI / 4;
            group.add(sword1, sword2);
            break;
        }
        case 'archery': { // Atıcılıq meydanı
            w = 6; h = 4; d = 6;
            const roofGeo = new THREE.BoxGeometry(w, 0.4, d);
            roofGeo.computeVertexNormals();
            const roof = new THREE.Mesh(roofGeo, woodMat);
            roof.position.y = h;
            group.add(roof);
            
            const postPos = [
                [w/2 - 0.5, d/2 - 0.5], [-w/2 + 0.5, d/2 - 0.5],
                [w/2 - 0.5, -d/2 + 0.5], [-w/2 + 0.5, -d/2 + 0.5]
            ];
            postPos.forEach(p => {
                const postGeo = new THREE.CylinderGeometry(0.2, 0.2, h, 8);
                postGeo.computeVertexNormals();
                const post = new THREE.Mesh(postGeo, darkWoodMat);
                post.position.set(p[0] ?? 0, h/2, p[1] ?? 0);
                group.add(post);
            });
            
            const targetGeo = new THREE.PlaneGeometry(1.5, 1.5);
            targetGeo.computeVertexNormals();
            const targetMat = createMaterial(0xffffff, state); 
            const target = new THREE.Mesh(targetGeo, targetMat);
            target.position.set(0, h/2, -d/2 + 1);
            group.add(target);
            break;
        }
        case 'stable': { // Tövlə
            w = 9; h = 3; d = 5;
            const baseGeo = new THREE.BoxGeometry(w, h, d);
            baseGeo.computeVertexNormals();
            const base = new THREE.Mesh(baseGeo, woodMat);
            base.position.y = h/2;
            group.add(base);
            
            const roof1Geo = new THREE.BoxGeometry(w + 1, 0.4, d/2 + 0.5);
            roof1Geo.computeVertexNormals();
            const roof1 = new THREE.Mesh(roof1Geo, teamMat);
            roof1.position.set(0, h + 0.8, -d/4);
            roof1.rotation.x = Math.PI / 6;
            
            const roof2 = new THREE.Mesh(roof1Geo, teamMat);
            roof2.position.set(0, h + 0.8, d/4);
            roof2.rotation.x = -Math.PI / 6;
            
            group.add(roof1, roof2);
            
            // Fence
            const fenceGeo = new THREE.BoxGeometry(w + 2, 1, 0.2);
            fenceGeo.computeVertexNormals();
            const fence = new THREE.Mesh(fenceGeo, darkWoodMat);
            fence.position.set(0, 0.5, d/2 + 2);
            group.add(fence);
            break;
        }
        case 'catapult': { // Mancınıq emalatxanası
            w = 5; h = 3; d = 5;
            const baseGeo = new THREE.BoxGeometry(w, h, d);
            baseGeo.computeVertexNormals();
            const base = new THREE.Mesh(baseGeo, woodMat);
            base.position.y = h/2;
            group.add(base);
            
            const wheelGeo = new THREE.TorusGeometry(1.5, 0.3, 8, 16);
            wheelGeo.computeVertexNormals();
            const wheel = new THREE.Mesh(wheelGeo, darkWoodMat);
            wheel.position.set(w/2 + 0.5, 1.5, 0);
            wheel.rotation.y = Math.PI / 2;
            group.add(wheel);
            break;
        }
        case 'farm': { // Ev/Ferma
            w = 4; h = 3; d = 4;
            const baseGeo = new THREE.BoxGeometry(w, h, d);
            baseGeo.computeVertexNormals();
            const base = new THREE.Mesh(baseGeo, woodMat);
            base.position.set(-2, h/2, 0);
            group.add(base);
            
            const fieldGeo = new THREE.PlaneGeometry(7, 7);
            fieldGeo.computeVertexNormals();
            const field = new THREE.Mesh(fieldGeo, grassMat);
            field.rotation.x = -Math.PI / 2;
            field.position.set(3, 0.05, 0);
            group.add(field);
            
            const chimneyGeo = new THREE.CylinderGeometry(0.3, 0.3, 2, 8);
            chimneyGeo.computeVertexNormals();
            const chimney = new THREE.Mesh(chimneyGeo, stoneMat);
            chimney.position.set(-3, h + 1, -1);
            group.add(chimney);
            break;
        }
        case 'watchtower': { // Qüllə
            w = 3; h = 8; d = 3;
            const baseGeo = new THREE.CylinderGeometry(1.2, 1.5, h, 8);
            baseGeo.computeVertexNormals();
            const base = new THREE.Mesh(baseGeo, stoneMat);
            base.position.y = h/2;
            group.add(base);
            
            const topGeo = new THREE.BoxGeometry(w, 0.4, d);
            topGeo.computeVertexNormals();
            const top = new THREE.Mesh(topGeo, woodMat);
            top.position.y = h + 0.2;
            group.add(top);
            
            const ringGeo = new THREE.TorusGeometry(3, 0.2, 8, 32);
            ringGeo.computeVertexNormals();
            const ring = new THREE.Mesh(ringGeo, teamMat);
            ring.rotation.x = -Math.PI / 2;
            ring.position.y = 0.1;
            group.add(ring);
            break;
        }
        case 'storage': { // Anbar
            w = 7; h = 4; d = 6;
            const baseGeo = new THREE.BoxGeometry(w, h, d);
            baseGeo.computeVertexNormals();
            const base = new THREE.Mesh(baseGeo, woodMat);
            base.position.y = h/2;
            group.add(base);
            
            const dockGeo = new THREE.BoxGeometry(w, 0.5, 2);
            dockGeo.computeVertexNormals();
            const dock = new THREE.Mesh(dockGeo, darkWoodMat);
            dock.position.set(0, 0.25, d/2 + 1);
            group.add(dock);
            
            const crateGeo = new THREE.BoxGeometry(1, 1, 1);
            crateGeo.computeVertexNormals();
            const crate1 = new THREE.Mesh(crateGeo, teamMat);
            crate1.position.set(2, 1, d/2 + 1);
            const crate2 = new THREE.Mesh(crateGeo, teamMat);
            crate2.position.set(1, 1, d/2 + 1);
            group.add(crate1, crate2);
            break;
        }
    }
    
    if (state === 'building') {
        addScaffolding(group, w, h, d);
    }
    
    group.traverse((child) => {
        if (child instanceof THREE.Mesh) {
            child.castShadow = true;
            child.receiveShadow = true;
        }
    });
    
    return group;
}

export function createBuildingSmoke(position: THREE.Vector3, intensity: 'light' | 'heavy'): THREE.Points {
    const particleCount = intensity === 'heavy' ? 30 : 10;
    const geometry = new THREE.BufferGeometry();
    const positions = new Float32Array(particleCount * 3);
    const velocities = [];
    
    for (let i = 0; i < particleCount; i++) {
        positions[i * 3] = position.x + (Math.random() - 0.5);
        positions[i * 3 + 1] = position.y + Math.random();
        positions[i * 3 + 2] = position.z + (Math.random() - 0.5);
        
        velocities.push({
            x: (Math.random() - 0.5) * 0.05,
            y: Math.random() * 0.1 + 0.05,
            z: (Math.random() - 0.5) * 0.05
        });
    }
    
    geometry.setAttribute('position', new THREE.BufferAttribute(positions, 3));
    
    const material = new THREE.PointsMaterial({
        color: 0xcccccc,
        size: 0.5,
        transparent: true,
        opacity: 0.6
    });
    
    const points = new THREE.Points(geometry, material);
    points.userData.velocities = velocities;
    
    return points;
}

export function createPlotIndicator(canBuild: boolean): THREE.Mesh {
    const geo = new THREE.PlaneGeometry(8, 8);
    const mat = new THREE.MeshBasicMaterial({
        color: canBuild ? 0x00ff00 : 0xff0000,
        transparent: true,
        opacity: 0.35,
        side: THREE.DoubleSide
    });
    const mesh = new THREE.Mesh(geo, mat);
    mesh.rotation.x = -Math.PI / 2;
    mesh.position.y = 0.05;
    return mesh;
}
