import * as THREE from 'three';

export type CameraState = {
    target: THREE.Vector3;
    distance: number;
    azimuth: number;
    elevation: number;
    velocity: THREE.Vector3;
};

export class RTSCamera {
    private camera: THREE.PerspectiveCamera;
    private state: CameraState;
    private keys: Set<string>;
    private isDragging: boolean;
    private lastMousePos: { x: number, y: number };
    private mapSize: number;
    private onClickCallback: ((worldPos: THREE.Vector3) => void) | null;
    private onRightClickCallback: ((worldPos: THREE.Vector3) => void) | null;
    private shakeIntensity: number;
    private shakeTime: number;

    private desiredTarget: THREE.Vector3;
    private screenEdgeDir: THREE.Vector3;

    constructor(camera: THREE.PerspectiveCamera, mapSize: number = 4500) {
        this.camera = camera;
        this.mapSize = mapSize;
        this.state = {
            target: new THREE.Vector3(2250, 0, 2250),
            distance: 35,
            azimuth: 0,
            elevation: 55,
            velocity: new THREE.Vector3()
        };
        this.desiredTarget = this.state.target.clone();
        
        this.keys = new Set();
        this.isDragging = false;
        this.lastMousePos = { x: 0, y: 0 };
        this.onClickCallback = null;
        this.onRightClickCallback = null;
        this.shakeIntensity = 0;
        this.shakeTime = 0;
        this.screenEdgeDir = new THREE.Vector3();

        this.bindInputListeners();
        this.updateCameraPosition();
    }

    private bindInputListeners(): void {
        window.addEventListener('keydown', (e) => {
            this.keys.add(e.code);
            if (e.code === 'KeyF') {
                // Focus on local player to be handled by consumer
            }
            if (e.code === 'Escape') {
                this.isDragging = false;
            }
        });

        window.addEventListener('keyup', (e) => {
            this.keys.delete(e.code);
        });

        window.addEventListener('wheel', (e) => {
            this.state.distance += e.deltaY * 0.05;
            this.state.distance = Math.max(15, Math.min(60, this.state.distance));
        });

        window.addEventListener('mousedown', (e) => {
            if (e.button === 1 || e.button === 2) {
                this.isDragging = true;
                this.lastMousePos = { x: e.clientX, y: e.clientY };
            }
        });

        window.addEventListener('mouseup', (e) => {
            if (e.button === 1 || e.button === 2) {
                this.isDragging = false;
            }
        });

        window.addEventListener('mousemove', (e) => {
            if (this.isDragging) {
                const dx = e.clientX - this.lastMousePos.x;
                const dy = e.clientY - this.lastMousePos.y;

                if (e.buttons & 4) { // Middle click
                    this.state.azimuth -= dx * 0.5;
                    this.state.elevation -= dy * 0.5;
                    this.state.elevation = Math.max(20, Math.min(80, this.state.elevation));
                } else if (e.buttons & 2) { // Right click
                    const elevRad = this.state.elevation * Math.PI / 180;
                    const azimRad = this.state.azimuth * Math.PI / 180;
                    
                    const forward = new THREE.Vector3(
                        -Math.sin(azimRad),
                        0,
                        -Math.cos(azimRad)
                    ).normalize();
                    
                    const right = new THREE.Vector3(
                        Math.cos(azimRad),
                        0,
                        -Math.sin(azimRad)
                    ).normalize();

                    const panSpeed = this.state.distance * 0.02;
                    this.desiredTarget.add(right.multiplyScalar(-dx * panSpeed));
                    this.desiredTarget.add(forward.multiplyScalar(-dy * panSpeed));
                }
                this.lastMousePos = { x: e.clientX, y: e.clientY };
            }

            // Edge scroll detection
            this.screenEdgeDir.set(0, 0, 0);
            const edgeThreshold = 40;
            if (e.clientX < edgeThreshold) this.screenEdgeDir.x = -1;
            if (e.clientX > window.innerWidth - edgeThreshold) this.screenEdgeDir.x = 1;
            if (e.clientY < edgeThreshold) this.screenEdgeDir.z = -1;
            if (e.clientY > window.innerHeight - edgeThreshold) this.screenEdgeDir.z = 1;
        });
        
        window.addEventListener('contextmenu', e => e.preventDefault());
    }

    private updateCameraPosition(): void {
        const elevRad = this.state.elevation * Math.PI / 180;
        const azimRad = this.state.azimuth * Math.PI / 180;

        let shakeOffset = new THREE.Vector3();
        if (this.shakeIntensity > 0) {
            shakeOffset.x = (Math.random() - 0.5) * this.shakeIntensity;
            shakeOffset.y = (Math.random() - 0.5) * this.shakeIntensity;
            shakeOffset.z = (Math.random() - 0.5) * this.shakeIntensity;
        }

        this.camera.position.x = this.state.target.x + this.state.distance * Math.cos(elevRad) * Math.sin(azimRad) + shakeOffset.x;
        this.camera.position.y = this.state.target.y + this.state.distance * Math.sin(elevRad) + shakeOffset.y;
        this.camera.position.z = this.state.target.z + this.state.distance * Math.cos(elevRad) * Math.cos(azimRad) + shakeOffset.z;
        
        this.camera.lookAt(this.state.target);
    }

    update(deltaTime: number): void {
        // 1. Handle WASD/Arrow movement
        const moveSpeed = 60 * deltaTime * (this.state.distance / 35);
        const azimRad = this.state.azimuth * Math.PI / 180;
        
        const forward = new THREE.Vector3(
            -Math.sin(azimRad),
            0,
            -Math.cos(azimRad)
        ).normalize();
        
        const right = new THREE.Vector3(
            Math.cos(azimRad),
            0,
            -Math.sin(azimRad)
        ).normalize();

        const inputDir = new THREE.Vector3();
        if (this.keys.has('KeyW') || this.keys.has('ArrowUp')) inputDir.z -= 1;
        if (this.keys.has('KeyS') || this.keys.has('ArrowDown')) inputDir.z += 1;
        if (this.keys.has('KeyA') || this.keys.has('ArrowLeft')) inputDir.x -= 1;
        if (this.keys.has('KeyD') || this.keys.has('ArrowRight')) inputDir.x += 1;

        if (inputDir.lengthSq() > 0) {
            inputDir.normalize();
        } else if (this.screenEdgeDir.lengthSq() > 0) {
            inputDir.copy(this.screenEdgeDir).normalize();
        }

        if (inputDir.lengthSq() > 0) {
            const movement = new THREE.Vector3();
            movement.add(right.clone().multiplyScalar(inputDir.x));
            movement.add(forward.clone().multiplyScalar(-inputDir.z)); // Invert z for forward
            
            this.state.velocity.add(movement.multiplyScalar(moveSpeed * 0.1));
        }

        this.desiredTarget.add(this.state.velocity);
        
        // Clamp to map bounds
        this.desiredTarget.x = Math.max(0, Math.min(this.mapSize, this.desiredTarget.x));
        this.desiredTarget.z = Math.max(0, Math.min(this.mapSize, this.desiredTarget.z));

        // 2. Apply velocity damping
        this.state.velocity.multiplyScalar(0.88);

        // 4. Apply shake
        if (this.shakeIntensity > 0) {
            this.shakeTime += deltaTime;
            this.shakeIntensity *= Math.exp(-deltaTime * 5); // decay
            if (this.shakeIntensity < 0.01) this.shakeIntensity = 0;
        }

        // 5. Smooth lerp target
        this.state.target.lerp(this.desiredTarget, 0.2);

        // 6. Update position
        this.updateCameraPosition();
    }

    focusOn(worldPos: { x: number, z?: number, y?: number }): void {
        this.desiredTarget.x = worldPos.x;
        this.desiredTarget.y = worldPos.y ?? 0;
        this.desiredTarget.z = worldPos.z ?? 0;
    }

    shake(intensity: number, duration: number): void {
        this.shakeIntensity = intensity;
        this.shakeTime = 0;
    }

    setTarget(worldX: number, worldZ: number): void {
        this.desiredTarget.set(worldX, 0, worldZ);
        this.state.target.set(worldX, 0, worldZ);
    }

    getGroundIntersection(screenX: number, screenY: number, screenW: number, screenH: number): THREE.Vector3 | null {
        const ndcX = (screenX / screenW) * 2 - 1;
        const ndcY = -(screenY / screenH) * 2 + 1;
        const raycaster = new THREE.Raycaster();
        raycaster.setFromCamera(new THREE.Vector2(ndcX, ndcY), this.camera);
        
        const plane = new THREE.Plane(new THREE.Vector3(0, 1, 0), 0);
        const target = new THREE.Vector3();
        const hit = raycaster.ray.intersectPlane(plane, target);
        
        return hit ? target : null;
    }

    get position(): THREE.Vector3 {
        return this.camera.position;
    }

    get lookTarget(): THREE.Vector3 {
        return this.state.target;
    }
}
