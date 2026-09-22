import * as THREE from 'three';

// ── SCENE SETUP — Full Atmospheric Sky, Sun, Lighting ─────────────────────
export class SceneManager {
  public scene: THREE.Scene;
  public camera: THREE.PerspectiveCamera;
  public renderer: THREE.WebGLRenderer;
  public width: number = window.innerWidth;
  public height: number = window.innerHeight;

  public meshes = new Map<string, THREE.Object3D>();

  // Sun disk object (animated)
  private sunMesh!: THREE.Mesh;
  private sunLens!: THREE.Mesh;

  constructor(canvasId: string) {
    const canvas = document.getElementById(canvasId) as HTMLCanvasElement;
    if (!canvas) throw new Error(`Canvas #${canvasId} not found`);

    this.renderer = new THREE.WebGLRenderer({
      canvas,
      antialias: true,
      alpha: false,
    });
    this.renderer.setSize(this.width, this.height);
    this.renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
    this.renderer.shadowMap.enabled = true;
    this.renderer.shadowMap.type = THREE.PCFSoftShadowMap;
    this.renderer.toneMapping = THREE.ACESFilmicToneMapping;
    this.renderer.toneMappingExposure = 1.15;

    // ── Scene with gradient sky atmosphere ──────────────────────────────
    this.scene = new THREE.Scene();
    this.scene.background = new THREE.Color(0x7ec8e3); // Bright daytime sky blue
    this.scene.fog = new THREE.FogExp2(0x9dd6ee, 0.00022); // Exponential fog — distant mountains fade naturally

    // ── Camera ────────────────────────────────────────────────────────
    this.camera = new THREE.PerspectiveCamera(52, this.width / this.height, 2, 6000);
    this.camera.position.set(0, 1000, 800);
    this.camera.lookAt(0, 0, 0);

    // ── Lighting ──────────────────────────────────────────────────────
    this.setupLighting();

    // ── Sun disk & lens glow ──────────────────────────────────────────
    this.setupSun();

    window.addEventListener('resize', this.onResize.bind(this));
  }

  private setupLighting(): void {
    // 1. Hemisphere light: warm sky top / cool earth bottom
    const hemiLight = new THREE.HemisphereLight(
      0xbde0f5, // Sky color: soft blue-white daylight from above
      0x3a5c2e, // Ground color: dark forest green bounce
      0.65
    );
    hemiLight.name = 'hemiLight';
    this.scene.add(hemiLight);

    // 2. Directional sun light — warm golden angle
    const dirLight = new THREE.DirectionalLight(0xfff4d6, 1.45); // Warm golden sunlight
    dirLight.name = 'sunLight';
    dirLight.position.set(800, 1800, 400); // Slightly angled for dramatic mountain shadows
    dirLight.castShadow = true;
    dirLight.shadow.bias = -0.0003; // Prevents shadow acne on terrain
    dirLight.shadow.normalBias = 0.05;
    dirLight.shadow.mapSize.width  = 2048;
    dirLight.shadow.mapSize.height = 2048;
    dirLight.shadow.camera.left   = -2200;
    dirLight.shadow.camera.right  =  2200;
    dirLight.shadow.camera.top    =  2200;
    dirLight.shadow.camera.bottom = -2200;
    dirLight.shadow.camera.near   = 10;
    dirLight.shadow.camera.far    = 5000;
    dirLight.shadow.radius = 2.5; // Soft shadow edges
    this.scene.add(dirLight);

    // 3. Soft fill light from opposite side (simulate sky scatter)
    const fillLight = new THREE.DirectionalLight(0xc8e8ff, 0.28); // Cool blue fill
    fillLight.position.set(-400, 600, -800);
    fillLight.castShadow = false;
    this.scene.add(fillLight);
  }

  private setupSun(): void {
    // Sun sphere — highly emissive, no lighting affect from scene
    const sunGeo = new THREE.SphereGeometry(28, 16, 16);
    const sunMat = new THREE.MeshBasicMaterial({
      color: 0xfff5a0, // Bright warm yellow
    });
    this.sunMesh = new THREE.Mesh(sunGeo, sunMat);
    this.sunMesh.name = 'sunDisk';

    // Position sun in sky aligned with the directional light angle
    // Normalize: dirLight is at (800, 1800, 400), so sun goes far in that direction
    const sunDir = new THREE.Vector3(800, 1800, 400).normalize();
    const sunDist = 4200;
    this.sunMesh.position.copy(sunDir.multiplyScalar(sunDist));
    this.scene.add(this.sunMesh);

    // Sun corona glow ring (slightly larger, additive blending)
    const coronaGeo = new THREE.SphereGeometry(52, 16, 16);
    const coronaMat = new THREE.MeshBasicMaterial({
      color: 0xffdd66,
      transparent: true,
      opacity: 0.18,
      depthWrite: false,
    });
    this.sunLens = new THREE.Mesh(coronaGeo, coronaMat);
    this.sunLens.position.copy(this.sunMesh.position);
    this.scene.add(this.sunLens);
  }

  private onResize(): void {
    this.width  = window.innerWidth;
    this.height = window.innerHeight;
    this.renderer.setSize(this.width, this.height);
    this.camera.aspect = this.width / this.height;
    this.camera.updateProjectionMatrix();
  }

  public setCameraTarget(target: { x: number; y: number }): void {
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

  public render(): void {
    this.renderer.render(this.scene, this.camera);
  }
}