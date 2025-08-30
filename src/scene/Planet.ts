import * as THREE from 'three';
import { PlanetData } from '../types/planet';
import { getScaledRadius, getScaledOrbitRadius, EARTH_RADIUS } from '../data/PlanetData';

export class Planet {
  private scene: THREE.Scene;
  private data: PlanetData;
  private mesh: THREE.Mesh;
  private group: THREE.Group;
  private moons: THREE.Mesh[] = [];
  private rings?: THREE.Mesh;
  private baseScale: number;
  private currentScale: number;
  private orbitAngle: number = 0;
  private rotationAngle: number = 0;
  private referenceJD: number = 2451545.0; // J2000.0 epoch
  private initialOrbitAngle: number = 0;
  public name: string;
  public radius: number;

  constructor(data: PlanetData, scene: THREE.Scene, scale: number = 1) {
    this.scene = scene;
    this.data = data;
    this.name = data.name;
    this.baseScale = scale;
    this.currentScale = scale;
    this.radius = getScaledRadius(data.radius) * scale;
    
    this.group = new THREE.Group();
    this.scene.add(this.group);
    
    this.createPlanet();
    this.createMoons();
    this.createRings();
    
    // Calculate initial position based on reference date
    this.initialOrbitAngle = this.calculateOrbitAngleForDate(this.referenceJD);
    this.orbitAngle = this.initialOrbitAngle;
    this.updatePosition(0);
  }

  private createPlanet(): void {
    const radius = getScaledRadius(this.data.radius) * this.currentScale;
    const geometry = new THREE.SphereGeometry(radius, 64, 64);
    
    const material = new THREE.MeshLambertMaterial({
      color: this.data.color,
    });
    
    this.mesh = new THREE.Mesh(geometry, material);
    this.mesh.castShadow = true;
    this.mesh.receiveShadow = true;
    this.mesh.userData = { planet: this };
    this.group.add(this.mesh);
  }

  private createMoons(): void {
    if (!this.data.moons) return;
    
    this.data.moons.forEach((moonData) => {
      const moonRadius = getScaledRadius(moonData.radius) * this.currentScale * 2;
      const geometry = new THREE.SphereGeometry(moonRadius, 16, 16);
      
      const material = new THREE.MeshPhongMaterial({
        color: 0xcccccc,
        emissive: 0x222222,
        emissiveIntensity: 0.1,
      });
      
      const moon = new THREE.Mesh(geometry, material);
      moon.castShadow = true;
      moon.receiveShadow = true;
      
      // Position moon relative to planet
      const moonOrbitRadius = moonData.orbitalRadius * 1000 * this.currentScale;
      moon.position.x = moonOrbitRadius;
      
      this.moons.push(moon);
      this.group.add(moon);
    });
  }

  private createRings(): void {
    if (!this.data.rings) return;
    
    this.data.rings.forEach((ringData) => {
      const innerRadius = ringData.innerRadius * this.currentScale;
      const outerRadius = ringData.outerRadius * this.currentScale;
      
      const geometry = new THREE.RingGeometry(innerRadius, outerRadius, 64);
      const material = new THREE.MeshBasicMaterial({
        color: 0xccaa77,
        side: THREE.DoubleSide,
        transparent: true,
        opacity: 0.6,
      });
      
      this.rings = new THREE.Mesh(geometry, material);
      this.rings.rotation.x = Math.PI / 2;
      this.mesh.add(this.rings);
    });
  }

  public update(delta: number, time: number): void {
    // Update orbital position
    const orbitalSpeed = (2 * Math.PI) / (this.data.orbitalPeriod * 24 * 3600);
    this.orbitAngle = this.initialOrbitAngle + time * orbitalSpeed * 1000; // Speed up for visualization
    this.updatePosition(time);
    
    // Update planet rotation
    const rotationSpeed = (2 * Math.PI) / (Math.abs(this.data.rotationPeriod) * 3600);
    const rotationDirection = this.data.rotationPeriod < 0 ? -1 : 1;
    this.rotationAngle = time * rotationSpeed * rotationDirection * 1000;
    this.mesh.rotation.y = this.rotationAngle;
    
    // Update moon orbits
    this.moons.forEach((moon, index) => {
      if (this.data.moons) {
        const moonData = this.data.moons[index];
        const moonOrbitSpeed = (2 * Math.PI) / (Math.abs(moonData.orbitalPeriod) * 24 * 3600);
        const moonAngle = time * moonOrbitSpeed * 1000;
        const moonOrbitRadius = moonData.orbitalRadius * 1000 * this.currentScale;
        
        moon.position.x = Math.cos(moonAngle) * moonOrbitRadius;
        moon.position.z = Math.sin(moonAngle) * moonOrbitRadius;
      }
    });
  }

  private updatePosition(time: number): void {
    const orbitRadius = getScaledOrbitRadius(this.data.orbitalRadius);
    
    // Calculate position using Kepler's equations (simplified)
    const a = orbitRadius;
    const e = this.data.eccentricity;
    
    // Mean anomaly
    const M = this.orbitAngle;
    
    // Eccentric anomaly (simplified - would need iteration for accuracy)
    const E = M + e * Math.sin(M);
    
    // True anomaly
    const v = 2 * Math.atan2(
      Math.sqrt(1 + e) * Math.sin(E / 2),
      Math.sqrt(1 - e) * Math.cos(E / 2)
    );
    
    // Distance from focus
    const r = a * (1 - e * e) / (1 + e * Math.cos(v));
    
    // Position in orbital plane
    const x = r * Math.cos(v);
    const z = r * Math.sin(v);
    
    // Apply inclination
    const i = THREE.MathUtils.degToRad(this.data.inclination);
    this.group.position.x = x;
    this.group.position.y = z * Math.sin(i);
    this.group.position.z = z * Math.cos(i);
  }

  public setScale(scale: number): void {
    this.currentScale = scale;
    const newRadius = getScaledRadius(this.data.radius) * scale;
    
    // Update planet scale
    this.mesh.scale.setScalar(scale / this.baseScale);
    
    // Update moons
    this.moons.forEach((moon, index) => {
      moon.scale.setScalar(scale / this.baseScale * 2);
      if (this.data.moons) {
        const moonOrbitRadius = this.data.moons[index].orbitalRadius * 1000 * scale;
        // Moon position will be updated in the update loop
      }
    });
    
    // Update rings
    if (this.rings && this.data.rings) {
      this.rings.scale.setScalar(scale / this.baseScale);
    }
    
    this.radius = newRadius;
  }

  public setRealisticScale(realistic: boolean): void {
    if (realistic) {
      this.setScale(1);
    } else {
      this.setScale(this.baseScale);
    }
  }

  public getMesh(): THREE.Mesh {
    return this.mesh;
  }

  public getPosition(): THREE.Vector3 {
    return this.group.position.clone();
  }

  public setReferenceDate(julianDay: number): void {
    this.referenceJD = julianDay;
    this.initialOrbitAngle = this.calculateOrbitAngleForDate(julianDay);
    this.orbitAngle = this.initialOrbitAngle;
  }

  private calculateOrbitAngleForDate(julianDay: number): number {
    // Calculate mean longitude at epoch for this planet
    // Using simplified orbital elements - in reality you'd use proper ephemeris data
    const daysSinceJ2000 = julianDay - 2451545.0;
    const meanMotion = (2 * Math.PI) / (this.data.orbitalPeriod * 365.25);
    
    // Add the planet's longitude at epoch (simplified approximation)
    const longitudeAtEpoch = this.getPlanetLongitudeAtEpoch();
    
    return (longitudeAtEpoch + meanMotion * daysSinceJ2000) % (2 * Math.PI);
  }

  private getPlanetLongitudeAtEpoch(): number {
    // Approximate mean longitudes at J2000.0 epoch (in radians)
    const longitudes: { [key: string]: number } = {
      'Mercury': THREE.MathUtils.degToRad(252.25),
      'Venus': THREE.MathUtils.degToRad(181.98),
      'Earth': THREE.MathUtils.degToRad(100.47),
      'Mars': THREE.MathUtils.degToRad(355.43),
      'Jupiter': THREE.MathUtils.degToRad(34.35),
      'Saturn': THREE.MathUtils.degToRad(50.08),
      'Uranus': THREE.MathUtils.degToRad(314.05),
      'Neptune': THREE.MathUtils.degToRad(304.35),
    };
    
    return longitudes[this.name] || Math.random() * Math.PI * 2;
  }
}