import * as THREE from 'three';
import { SolarSystem } from '../scene/SolarSystem';
import { getScaledRadius } from '../data/PlanetData';

export class Selection {
  private solarSystem: SolarSystem;
  private camera: THREE.PerspectiveCamera;
  private selectionBox?: THREE.LineSegments;
  private selectedPlanet?: string;
  private selectedObject?: THREE.Object3D;
  private onSelectionChange?: (planetName: string | null) => void;

  constructor(solarSystem: SolarSystem, camera: THREE.PerspectiveCamera) {
    this.solarSystem = solarSystem;
    this.camera = camera;
  }

  public selectPlanet(planetName: string): void {
    this.clearSelection();
    this.selectedPlanet = planetName;
    
    if (planetName === 'Sun') {
      this.selectedObject = this.solarSystem.getSun();
    } else {
      const planet = this.solarSystem.getPlanets().find(p => p.name === planetName);
      this.selectedObject = planet?.getMesh();
    }
    
    this.createSelectionBox(planetName);
    
    if (this.onSelectionChange) {
      this.onSelectionChange(planetName);
    }
  }

  public clearSelection(): void {
    if (this.selectionBox) {
      this.solarSystem.getScene().remove(this.selectionBox);
      this.selectionBox = undefined;
    }
    this.selectedPlanet = undefined;
    this.selectedObject = undefined;
    
    if (this.onSelectionChange) {
      this.onSelectionChange(null);
    }
  }

  private createSelectionBox(planetName: string): void {
    let radius: number;

    if (planetName === 'Sun') {
      const sunData = this.solarSystem.getSunData();
      radius = getScaledRadius(sunData.radius, true);
    } else {
      const planet = this.solarSystem.getPlanets().find(p => p.name === planetName);
      if (!planet) return;
      radius = planet.radius; // This is already the scaled radius from Planet class
    }

    // Create a billboard rectangle that always faces the camera
    const size = radius * 2.4;
    const geometry = new THREE.PlaneGeometry(size, size);
    const edges = new THREE.EdgesGeometry(geometry);
    
    const material = new THREE.LineBasicMaterial({
      color: 0x00ff00,
      linewidth: 3,
      transparent: true,
      opacity: 0.8,
      depthTest: false,
      depthWrite: false
    });
    
    this.selectionBox = new THREE.LineSegments(edges, material);
    this.selectionBox.renderOrder = 999; // Render last
    
    // Add to scene as independent object
    this.solarSystem.getScene().add(this.selectionBox);
  }

  public update(): void {
    // Make selection box follow planet, face camera, and pulse
    if (this.selectionBox && this.selectedObject) {
      // Position the selection box at the planet's world position
      const worldPosition = new THREE.Vector3();
      this.selectedObject.getWorldPosition(worldPosition);
      this.selectionBox.position.copy(worldPosition);
      
      // Make it always face the camera with fixed orientation (no roll)
      this.selectionBox.quaternion.copy(this.camera.quaternion);
      
      const time = Date.now() * 0.003;
      const pulse = 0.8 + Math.sin(time) * 0.2;
      this.selectionBox.material.opacity = pulse;
    }
  }

  public getSelectedPlanet(): string | undefined {
    return this.selectedPlanet;
  }

  public setOnSelectionChange(callback: (planetName: string | null) => void): void {
    this.onSelectionChange = callback;
  }
}