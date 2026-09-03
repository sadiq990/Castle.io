import * as THREE from 'three';
import type { Vector2 } from 'shared/types/entities.js';

export class SceneManager {
  public scene: THREE.Scene;
  public camera: THREE.PerspectiveCamera;
  public renderer: THREE.WebGLRenderer;
  public width: number = window.innerWidth;
  public height: number = window.innerHeight;

  public meshes = new Map<string, THREE.Object3D>();

  constructor(canvasId: string) {
    const canvas = document.getElementById(canvasId) as HTMLCanvasElement;
    if (!canvas) throw new Error(`Canvas #${canvasId} not found`);

    this.renderer = new THREE.WebGLRenderer({ canvas, antialias: true, alpha: false });
    this.renderer.setSize(this.width, this.height);
    this.renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
    this.renderer.shadowMap.enabled = true;
    this.renderer.shadowMap.type = THREE.PCFSoftShadowMap;

    this.scene = new THREE.Scene();
    const skyColor = new THREE.Color(0x7ec8e3); // Serene oceanic horizon sky
    this.scene.background = skyColor; 
    this.scene.fog = new THREE.Fog(0x7ec8e3, 3500, 9500); // Distant horizon fog blending ocean into sky

    this.camera = new THREE.PerspectiveCamera(50, this.width / this.height, 1, 12000);
    this.camera.position.set(0, 1000, 800); 
    this.camera.lookAt(0, 0, 0);

    const ambient = new THREE.AmbientLight(0xffffff, 0.65);
    this.scene.add(ambient);

    const dirLight = new THREE.DirectionalLight(0xfffaea, 1.3);
    dirLight.position.set(500, 1500, 500);
    dirLight.castShadow = true;
    dirLight.shadow.mapSize.width = 2048;
    dirLight.shadow.mapSize.height = 2048;
    dirLight.shadow.camera.left = -2000;
    dirLight.shadow.camera.right = 2000;
    dirLight.shadow.camera.top = 2000;
    dirLight.shadow.camera.bottom = -2000;
    dirLight.shadow.camera.far = 4000;
    this.scene.add(dirLight);

    window.addEventListener('resize', this.onResize.bind(this));
  }

  private onResize() {
    this.width = window.innerWidth;
    this.height = window.innerHeight;
    this.renderer.setSize(this.width, this.height);
    this.camera.aspect = this.width / this.height;
    this.camera.updateProjectionMatrix();
  }

  public setCameraTarget(target: Vector2) {
    const camOffsetZ = 800; 
    const camOffsetY = 1000; 

    this.camera.position.x = target.x;
    this.camera.position.y = camOffsetY;
    this.camera.position.z = target.y + camOffsetZ;

    this.camera.lookAt(target.x, 0, target.y);
  }

  public getGroundIntersection(screenX: number, screenY: number): THREE.Vector3 | null {
    const mouse = new THREE.Vector2(
      (screenX / this.width) * 2 - 1,
      -(screenY / this.height) * 2 + 1
    );
    const raycaster = new THREE.Raycaster();
    raycaster.setFromCamera(mouse, this.camera);
    const plane = new THREE.Plane(new THREE.Vector3(0, 1, 0), 0);
    const target = new THREE.Vector3();
    const hit = raycaster.ray.intersectPlane(plane, target);
    return hit;
  }

  public render() {
    this.renderer.render(this.scene, this.camera);
  }
}