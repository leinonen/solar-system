import * as THREE from 'three';
import { Planet } from './Planet';
import { PLANETS, SUN_DATA, getScaledRadius, getScaledOrbitRadius } from '../data/PlanetData';
import { PlanetData } from '../types/planet';

export class SolarSystem {
  private scene: THREE.Scene;
  private sun!: THREE.Mesh;
  private sunLight!: THREE.PointLight;
  private planets: Planet[] = [];
  private orbits: THREE.Line[] = [];
  private showOrbits: boolean = true;
  private timeScale: number = 1;
  private currentTime: number = 0;
  private referenceJD: number = 2451545.0; // J2000.0 epoch
  private planetScale: number = 3;

  constructor(scene: THREE.Scene) {
    this.scene = scene;
    this.createSun();
    this.createPlanets();
    this.createOrbits();
  }

  private createSun(): void {
    const sunRadius = getScaledRadius(SUN_DATA.radius, true);
    const geometry = new THREE.SphereGeometry(sunRadius, 64, 64);
    
    const material = new THREE.MeshBasicMaterial({
      color: SUN_DATA.color,
    });
    
    this.sun = new THREE.Mesh(geometry, material);
    this.sun.position.set(0, 0, 0);
    this.scene.add(this.sun);
    
    // Add sun light
    this.sunLight = new THREE.PointLight(0xffffff, 500, 0);
    this.sunLight.position.set(0, 0, 0);
    this.sunLight.castShadow = true;
    this.sunLight.shadow.mapSize.width = 2048;
    this.sunLight.shadow.mapSize.height = 2048;
    this.sunLight.shadow.camera.near = 0.1;
    this.sunLight.shadow.camera.far = 1000;
    this.scene.add(this.sunLight);
    
    // Create radial gradient texture
    const canvas = document.createElement('canvas');
    canvas.width = 512;
    canvas.height = 512;
    const context = canvas.getContext('2d')!;
    
    // Create smooth radial gradient
    const gradient = context.createRadialGradient(256, 256, 0, 256, 256, 256);
    gradient.addColorStop(0, 'rgba(255, 255, 100, 1.0)');
    gradient.addColorStop(0.4, 'rgba(255, 200, 50, 0.8)');
    gradient.addColorStop(0.7, 'rgba(255, 150, 30, 0.4)');
    gradient.addColorStop(0.9, 'rgba(255, 100, 20, 0.1)');
    gradient.addColorStop(1, 'rgba(255, 50, 10, 0.0)');
    
    context.fillStyle = gradient;
    context.fillRect(0, 0, 512, 512);
    
    const gradientTexture = new THREE.CanvasTexture(canvas);
    
    // Create billboard sprite for glow that always faces camera
    const spriteMaterial = new THREE.SpriteMaterial({
      map: gradientTexture,
      transparent: true,
      blending: THREE.AdditiveBlending,
      depthWrite: false
    });
    
    const sunGlow = new THREE.Sprite(spriteMaterial);
    sunGlow.scale.set(sunRadius * 6, sunRadius * 6, 1);
    sunGlow.position.set(0, 0, 0);
    this.scene.add(sunGlow);
  }

  private createPlanets(): void {
    PLANETS.forEach((planetData) => {
      const planet = new Planet(planetData, this.scene, this.planetScale);
      this.planets.push(planet);
    });
  }

  private createOrbits(): void {
    PLANETS.forEach((planetData) => {
      const orbitRadius = getScaledOrbitRadius(planetData.orbitalRadius);
      const curve = new THREE.EllipseCurve(
        0, 0,
        orbitRadius, orbitRadius,
        0, 2 * Math.PI,
        false,
        0
      );
      
      const points = curve.getPoints(100);
      const geometry = new THREE.BufferGeometry().setFromPoints(
        points.map(p => new THREE.Vector3(p.x, 0, p.y))
      );
      
      const material = new THREE.LineBasicMaterial({
        color: 0x888888,
        transparent: true,
        opacity: 0.8,
        linewidth: 2,
      });
      
      const orbit = new THREE.Line(geometry, material);
      orbit.rotation.x = THREE.MathUtils.degToRad(planetData.inclination);
      orbit.visible = this.showOrbits;
      this.orbits.push(orbit);
      this.scene.add(orbit);
    });
  }

  public update(delta: number): void {
    // Update sun rotation
    this.sun.rotation.y += delta * 0.1;
    
    // Update time
    this.currentTime += delta * this.timeScale;
    
    // Update planets
    this.planets.forEach((planet) => {
      planet.update(delta, this.currentTime);
    });
  }

  public setTimeScale(scale: number): void {
    this.timeScale = scale;
  }

  public setReferenceDate(julianDay: number): void {
    this.referenceJD = julianDay;
    // Reset current time to start from the new reference date
    this.currentTime = 0;
    
    // Update all planets to use the new reference date
    this.planets.forEach((planet) => {
      planet.setReferenceDate(julianDay);
    });
  }

  public setShowOrbits(show: boolean): void {
    this.showOrbits = show;
    this.orbits.forEach(orbit => {
      orbit.visible = show;
    });
  }

  public setPlanetScale(scale: number): void {
    this.planetScale = scale;
    this.planets.forEach(planet => {
      planet.setScale(scale);
    });
  }

  public setRealisticScale(realistic: boolean): void {
    this.planets.forEach(planet => {
      planet.setRealisticScale(realistic);
    });
  }

  public getPlanetMeshes(): THREE.Object3D[] {
    return this.planets.map(p => p.getMesh());
  }

  public getPlanetByMesh(mesh: THREE.Object3D): Planet | undefined {
    return this.planets.find(p => p.getMesh() === mesh);
  }

  public getPlanetData(name: string): PlanetData | undefined {
    return PLANETS.find(p => p.name === name);
  }

  public getPlanets(): Planet[] {
    return this.planets;
  }

  public getSun(): THREE.Mesh {
    return this.sun;
  }
}