import * as THREE from 'three';
import { SolarSystem } from '../scene/SolarSystem';
import { getScaledRadius, getScaledMoonRadius } from '../data/PlanetData';

export class Selection {
  private solarSystem: SolarSystem;
  private camera: THREE.PerspectiveCamera;
  private selectionBox?: THREE.LineSegments;
  private selectedPlanet?: string;
  private selectedMoon?: string;
  private selectedObject?: THREE.Object3D;
  private onSelectionChange?: (selectionInfo: any) => void;

  constructor(solarSystem: SolarSystem, camera: THREE.PerspectiveCamera) {
    this.solarSystem = solarSystem;
    this.camera = camera;
  }

  public selectPlanet(planetName: string): void {
    this.clearSelection();
    this.selectedPlanet = planetName;
    this.selectedMoon = undefined;
    
    if (planetName === 'Sun') {
      this.selectedObject = this.solarSystem.getSun();
    } else {
      const planet = this.solarSystem.getPlanets().find(p => p.name === planetName);
      this.selectedObject = planet?.getMesh();
    }
    
    this.createSelectionBox(planetName);
    
    if (this.onSelectionChange) {
      const selectionInfo = planetName === 'Sun' ? 
        { type: 'sun', name: planetName } : 
        { type: 'planet', name: planetName };
      this.onSelectionChange(selectionInfo);
    }
  }

  public selectMoon(moonName: string, planetName: string): void {
    this.clearSelection();
    this.selectedMoon = moonName;
    this.selectedPlanet = planetName;
    
    // Find the moon mesh
    const planet = this.solarSystem.getPlanets().find(p => p.name === planetName);
    if (planet) {
      const moonMesh = planet.getMoons().find(moon => 
        moon.userData?.moon?.name === moonName
      );
      this.selectedObject = moonMesh;
    }
    
    this.createMoonSelectionBox(moonName, planetName);
    
    if (this.onSelectionChange) {
      this.onSelectionChange({ type: 'moon', name: moonName, planetName });
    }
  }

  public clearSelection(): void {
    if (this.selectionBox) {
      this.solarSystem.getScene().remove(this.selectionBox);
      this.selectionBox = undefined;
    }
    this.selectedPlanet = undefined;
    this.selectedMoon = undefined;
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
      if (Array.isArray(this.selectionBox.material)) {
        this.selectionBox.material[0].opacity = pulse;
      } else {
        this.selectionBox.material.opacity = pulse;
      }
    }
  }

  public getSelectedPlanet(): string | undefined {
    return this.selectedPlanet;
  }

  public setOnSelectionChange(callback: (selectionInfo: any) => void): void {
    this.onSelectionChange = callback;
  }

  private createMoonSelectionBox(moonName: string, planetName: string): void {
    // Find the moon to get its radius
    const planetData = this.solarSystem.getPlanetData(planetName);
    const moonData = planetData?.moons?.find(m => m.name === moonName);
    if (!moonData) return;

    // Use scaled radius for moon but make selection box more visible
    const radius = getScaledMoonRadius(moonData.radius);
    
    // Create a billboard rectangle that always faces the camera
    // Make moon selection boxes larger relative to their size for better visibility
    const size = Math.max(radius * 4, 1.5); // Minimum size of 1.5 units
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
}