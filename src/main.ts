import * as THREE from 'three';
import { SolarSystem } from './scene/SolarSystem';
import { Skybox } from './scene/Skybox';
import { FallbackControls } from './controls/FallbackControls';
import { SpaceMouseController } from './controls/SpaceMouseController';
import { TimeControls } from './ui/TimeControls';
import { Settings } from './ui/Settings';
import { Labels } from './ui/Labels';

class App {
  private scene: THREE.Scene;
  private camera!: THREE.PerspectiveCamera;
  private renderer!: THREE.WebGLRenderer;
  private solarSystem: SolarSystem;
  private skybox: Skybox;
  private controls: FallbackControls;
  private spaceMouseController: SpaceMouseController;
  private timeControls: TimeControls;
  private settings: Settings;
  private labels: Labels;
  private clock: THREE.Clock;
  private raycaster: THREE.Raycaster;
  private mouse: THREE.Vector2;

  constructor() {
    this.scene = new THREE.Scene();
    this.clock = new THREE.Clock();
    this.raycaster = new THREE.Raycaster();
    this.mouse = new THREE.Vector2();
    
    this.setupRenderer();
    this.setupCamera();
    this.setupLights();
    
    this.solarSystem = new SolarSystem(this.scene);
    this.skybox = new Skybox(this.scene);
    
    this.controls = new FallbackControls(this.camera, this.renderer.domElement);
    this.spaceMouseController = new SpaceMouseController(this.camera);
    
    this.timeControls = new TimeControls(this.solarSystem);
    this.settings = new Settings(this.solarSystem, this);
    this.labels = new Labels(this.solarSystem, this.camera, this.renderer);
    
    this.labels.setOnPlanetClick((planetName: string) => {
      this.focusOnPlanetByName(planetName);
    });
    
    this.setupEventListeners();
    this.animate();
  }

  private setupRenderer(): void {
    const canvas = document.getElementById('canvas') as HTMLCanvasElement;
    this.renderer = new THREE.WebGLRenderer({
      canvas,
      antialias: true,
      logarithmicDepthBuffer: true,
    });
    this.renderer.setSize(window.innerWidth, window.innerHeight);
    this.renderer.setPixelRatio(window.devicePixelRatio);
    this.renderer.shadowMap.enabled = true;
    this.renderer.shadowMap.type = THREE.PCFSoftShadowMap;
    this.renderer.toneMapping = THREE.NoToneMapping;
  }

  private setupCamera(): void {
    this.camera = new THREE.PerspectiveCamera(
      60,
      window.innerWidth / window.innerHeight,
      0.1,
      1000000
    );
    this.camera.position.set(300, 150, 300);
    this.camera.lookAt(0, 0, 0);
  }

  private setupLights(): void {
    const ambientLight = new THREE.AmbientLight(0x404040, 0.2);
    this.scene.add(ambientLight);
  }

  private setupEventListeners(): void {
    window.addEventListener('resize', this.onWindowResize.bind(this));
    window.addEventListener('mousemove', this.onMouseMove.bind(this));
    window.addEventListener('click', this.onMouseClick.bind(this));
  }

  private onWindowResize(): void {
    this.camera.aspect = window.innerWidth / window.innerHeight;
    this.camera.updateProjectionMatrix();
    this.renderer.setSize(window.innerWidth, window.innerHeight);
  }

  private onMouseMove(event: MouseEvent): void {
    this.mouse.x = (event.clientX / window.innerWidth) * 2 - 1;
    this.mouse.y = -(event.clientY / window.innerHeight) * 2 + 1;
    
    this.raycaster.setFromCamera(this.mouse, this.camera);
    const intersects = this.raycaster.intersectObjects(
      this.solarSystem.getPlanetMeshes()
    );
    
    if (intersects.length > 0) {
      const planet = this.solarSystem.getPlanetByMesh(intersects[0].object);
      if (planet) {
        this.updatePlanetInfo(planet.name);
        document.body.style.cursor = 'pointer';
      }
    } else {
      document.body.style.cursor = 'default';
      this.updatePlanetInfo(null);
    }
  }

  private onMouseClick(_event: MouseEvent): void {
    this.raycaster.setFromCamera(this.mouse, this.camera);
    const intersects = this.raycaster.intersectObjects(
      this.solarSystem.getPlanetMeshes()
    );
    
    if (intersects.length > 0) {
      const planet = this.solarSystem.getPlanetByMesh(intersects[0].object);
      if (planet) {
        this.focusOnPlanet(planet);
      }
    }
  }

  private focusOnPlanet(planet: any): void {
    const targetPosition = planet.getPosition();
    const distance = planet.radius * 5;
    
    const offset = new THREE.Vector3(distance, distance * 0.5, distance);
    const cameraTarget = targetPosition.clone().add(offset);
    
    this.controls.smoothMoveTo(cameraTarget, targetPosition);
  }

  private focusOnPlanetByName(planetName: string): void {
    if (planetName === 'Sun') {
      const sunPosition = this.solarSystem.getSun().position;
      const distance = 50;
      const offset = new THREE.Vector3(distance, distance * 0.5, distance);
      const cameraTarget = sunPosition.clone().add(offset);
      this.controls.smoothMoveTo(cameraTarget, sunPosition);
    } else {
      const planet = this.solarSystem.getPlanets().find(p => p.name === planetName);
      if (planet) {
        this.focusOnPlanet(planet);
      }
    }
  }

  private updatePlanetInfo(planetName: string | null): void {
    const infoElement = document.getElementById('planet-info');
    if (!infoElement) return;
    
    if (planetName) {
      const planet = this.solarSystem.getPlanetData(planetName);
      if (planet) {
        infoElement.innerHTML = `
          <strong>${planet.name}</strong><br>
          Radius: ${planet.radius.toLocaleString()} km<br>
          Mass: ${planet.mass.toExponential(2)} kg<br>
          Orbital Period: ${planet.orbitalPeriod.toFixed(1)} days<br>
          Distance from Sun: ${planet.orbitalRadius} AU<br>
          ${planet.temperature ? 
            `Temperature: ${planet.temperature.min}°C to ${planet.temperature.max}°C` : ''}
        `;
      }
    } else {
      infoElement.textContent = 'Hover over a planet for information';
    }
  }

  private animate(): void {
    requestAnimationFrame(this.animate.bind(this));
    
    const delta = this.clock.getDelta();
    
    if (!this.spaceMouseController.isActive()) {
      this.controls.update();
    }
    this.spaceMouseController.update();
    this.solarSystem.update(delta);
    this.labels.update();
    
    this.renderer.render(this.scene, this.camera);
  }

  public setShowOrbits(show: boolean): void {
    this.solarSystem.setShowOrbits(show);
  }

  public setShowLabels(show: boolean): void {
    this.labels.setVisible(show);
  }

  public setPlanetScale(scale: number): void {
    this.solarSystem.setPlanetScale(scale);
  }


  public setShowStarField(show: boolean): void {
    this.skybox.setStarFieldMode(show);
  }
}

// Initialize the app when DOM is ready
document.addEventListener('DOMContentLoaded', () => {
  new App();
});