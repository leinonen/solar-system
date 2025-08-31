import * as THREE from 'three';
import { PlanetData } from '../types/planet';
import { getScaledRadius, getScaledOrbitRadius, getScaledMoonRadius, getScaledMoonOrbitRadius, EARTH_RADIUS } from '../data/PlanetData';

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
  private axis?: THREE.Line;
  private northPole?: THREE.Mesh;
  private southPole?: THREE.Mesh;
  private equatorPlane?: THREE.Mesh;
  private rotationGroup?: THREE.Group; // For planet's tilted rotation
  private showAxis: boolean = false;
  private showPoles: boolean = false;
  private showEquator: boolean = false;
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
    
    // Create Earth-specific features if this is Earth (after rotationGroup is created)
    if (this.name === 'Earth') {
      this.createEarthAxis();
      this.createEarthPoles();
      this.createEarthEquator();
    }
    
    // Calculate initial position based on reference date
    this.initialOrbitAngle = this.calculateOrbitAngleForDate(this.referenceJD);
    this.orbitAngle = this.initialOrbitAngle;
    this.updatePosition(0);
  }

  private createPlanet(): void {
    const radius = getScaledRadius(this.data.radius) * this.currentScale;
    const geometry = new THREE.SphereGeometry(radius, 64, 64);
    
    const textureLoader = new THREE.TextureLoader();
    const texturePath = `/textures/${this.name.toLowerCase()}.jpg`;
    
    let material: THREE.Material;
    
    // Try to load texture, fallback to color if not found
    try {
      const texture = textureLoader.load(
        texturePath,
        undefined, // onLoad
        undefined, // onProgress
        () => {
          // onError - fallback to color
          console.warn(`Texture not found for ${this.name}, using color fallback`);
        }
      );
      
      // Dim Saturn and Jupiter
      const isDimPlanet = this.name === 'Saturn' || this.name === 'Jupiter';
      const colorTint = isDimPlanet ? 0x888888 : 0xffffff;
      
      material = new THREE.MeshLambertMaterial({
        map: texture,
        color: colorTint,
      });
    } catch (error) {
      // Fallback to color material
      material = new THREE.MeshLambertMaterial({
        color: this.data.color,
      });
    }
    
    this.mesh = new THREE.Mesh(geometry, material);
    this.mesh.castShadow = true;
    this.mesh.receiveShadow = true;
    this.mesh.userData = { planet: this };
    
    // Create a tilted rotation group for all planets with significant tilt
    const axialTiltRad = THREE.MathUtils.degToRad(this.data.axialTilt);
    const hasSignificantTilt = Math.abs(this.data.axialTilt) > 0.1; // Only apply tilt if > 0.1 degrees
    
    if (hasSignificantTilt) {
      this.rotationGroup = new THREE.Group();
      this.rotationGroup.rotation.z = -axialTiltRad; // Apply tilt
      this.rotationGroup.add(this.mesh);
      this.group.add(this.rotationGroup);
    } else {
      this.group.add(this.mesh);
    }
  }

  private createMoons(): void {
    if (!this.data.moons) return;
    
    this.data.moons.forEach((moonData) => {
      const moonRadius = getScaledMoonRadius(moonData.radius) * this.currentScale;
      const geometry = new THREE.SphereGeometry(moonRadius, 16, 16);
      
      const textureLoader = new THREE.TextureLoader();
      const texturePath = `/textures/${moonData.name.toLowerCase()}.jpg`;
      
      let material: THREE.Material;
      
      try {
        const texture = textureLoader.load(
          texturePath,
          undefined,
          undefined,
          () => {
            console.warn(`Texture not found for ${moonData.name}, using color fallback`);
          }
        );
        
        material = new THREE.MeshLambertMaterial({
          map: texture,
          color: 0xffffff,
        });
      } catch (error) {
        material = new THREE.MeshLambertMaterial({
          color: 0xcccccc,
          emissive: 0x111111,
        });
      }
      
      const moon = new THREE.Mesh(geometry, material);
      moon.castShadow = true;
      moon.receiveShadow = true;
      moon.userData = { moon: moonData, planet: this };
      
      // Position moon relative to planet
      const moonOrbitRadius = getScaledMoonOrbitRadius(moonData.orbitalRadius, this.name) * this.currentScale;
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

  private createEarthAxis(): void {
    const radius = getScaledRadius(this.data.radius) * this.currentScale;
    const axisLength = radius * 2.5;
    
    // Create a simple vertical axis - the tilt will be applied by the rotation group
    const geometry = new THREE.BufferGeometry().setFromPoints([
      new THREE.Vector3(0, -axisLength, 0), // South pole end
      new THREE.Vector3(0, axisLength, 0),  // North pole end
    ]);
    
    const material = new THREE.LineBasicMaterial({
      color: 0xff0000,
      transparent: true,
      opacity: 0.8,
    });
    
    this.axis = new THREE.Line(geometry, material);
    this.axis.visible = this.showAxis;
    
    // Add the axis to the same rotation group so it tilts together
    if (this.rotationGroup) {
      this.rotationGroup.add(this.axis);
    } else {
      this.group.add(this.axis);
    }
  }

  private createEarthPoles(): void {
    const radius = getScaledRadius(this.data.radius) * this.currentScale;
    const poleRadius = radius * 0.1;
    const poleDistance = radius * 1.1;
    
    const geometry = new THREE.SphereGeometry(poleRadius, 8, 8);
    
    // North Pole (red) - simple vertical position, will be tilted by rotation group
    const northMaterial = new THREE.MeshBasicMaterial({
      color: 0xff0000,
      transparent: true,
      opacity: 0.9,
    });
    this.northPole = new THREE.Mesh(geometry, northMaterial);
    this.northPole.position.set(0, poleDistance, 0);
    this.northPole.visible = this.showPoles;
    
    // South Pole (blue) - simple vertical position, will be tilted by rotation group
    const southMaterial = new THREE.MeshBasicMaterial({
      color: 0x0000ff,
      transparent: true,
      opacity: 0.9,
    });
    this.southPole = new THREE.Mesh(geometry.clone(), southMaterial);
    this.southPole.position.set(0, -poleDistance, 0);
    this.southPole.visible = this.showPoles;
    
    // Add poles to the rotation group so they tilt with Earth
    if (this.rotationGroup) {
      this.rotationGroup.add(this.northPole);
      this.rotationGroup.add(this.southPole);
    } else {
      this.group.add(this.northPole);
      this.group.add(this.southPole);
    }
  }

  private createEarthEquator(): void {
    const radius = getScaledRadius(this.data.radius) * this.currentScale;
    const equatorRadius = radius * 1.05;
    
    const geometry = new THREE.RingGeometry(equatorRadius * 0.98, equatorRadius * 1.02, 64);
    const material = new THREE.MeshBasicMaterial({
      color: 0x00ff00,
      side: THREE.DoubleSide,
      transparent: true,
      opacity: 0.6,
    });
    
    this.equatorPlane = new THREE.Mesh(geometry, material);
    
    // Simple horizontal plane - the tilt will be applied by the rotation group
    this.equatorPlane.rotation.x = Math.PI / 2; // Make it horizontal
    
    this.equatorPlane.visible = this.showEquator;
    
    // Add equator to the rotation group so it tilts with Earth
    if (this.rotationGroup) {
      this.rotationGroup.add(this.equatorPlane);
    } else {
      this.group.add(this.equatorPlane);
    }
  }

  public update(delta: number, time: number): void {
    // Update orbital position
    const orbitalSpeed = (2 * Math.PI) / (this.data.orbitalPeriod * 24 * 3600);
    this.orbitAngle = this.initialOrbitAngle + time * orbitalSpeed;
    this.updatePosition(time);
    
    // Update planet rotation  
    const rotationSpeed = (2 * Math.PI) / (Math.abs(this.data.rotationPeriod) * 3600);
    const rotationDirection = this.data.rotationPeriod < 0 ? -1 : 1;
    this.rotationAngle = time * rotationSpeed * rotationDirection;
    
    // All planets rotate around Y-axis within their rotation group (if tilted) or directly
    this.mesh.rotation.y = this.rotationAngle;
    
    // Update moon orbits
    this.moons.forEach((moon, index) => {
      if (this.data.moons) {
        const moonData = this.data.moons[index];
        const moonOrbitSpeed = (2 * Math.PI) / (Math.abs(moonData.orbitalPeriod) * 24 * 3600);
        const moonAngle = time * moonOrbitSpeed;
        const moonOrbitRadius = getScaledMoonOrbitRadius(moonData.orbitalRadius, this.name) * this.currentScale;
        
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
      moon.scale.setScalar(scale / this.baseScale);
      if (this.data.moons) {
        // Moon orbit radius will be updated in the update loop
      }
    });
    
    // Update rings
    if (this.rings && this.data.rings) {
      this.rings.scale.setScalar(scale / this.baseScale);
    }
    
    // Update Earth-specific features if this is Earth
    if (this.name === 'Earth') {
      const poleDistance = newRadius * 1.1;
      
      if (this.axis) {
        this.axis.scale.setScalar(scale / this.baseScale);
      }
      if (this.northPole) {
        this.northPole.scale.setScalar(scale / this.baseScale);
        // Simple vertical position - tilt is handled by rotation group
        this.northPole.position.set(0, poleDistance, 0);
      }
      if (this.southPole) {
        this.southPole.scale.setScalar(scale / this.baseScale);
        // Simple vertical position - tilt is handled by rotation group
        this.southPole.position.set(0, -poleDistance, 0);
      }
      if (this.equatorPlane) {
        this.equatorPlane.scale.setScalar(scale / this.baseScale);
      }
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

  public getMoons(): THREE.Mesh[] {
    return this.moons;
  }

  public getPosition(): THREE.Vector3 {
    return this.group.position.clone();
  }

  public getPlanetData(): PlanetData {
    return this.data;
  }

  public setReferenceDate(julianDay: number): void {
    this.referenceJD = julianDay;
    this.initialOrbitAngle = this.calculateOrbitAngleForDate(julianDay);
    this.orbitAngle = this.initialOrbitAngle;
  }

  public setEnableShadows(enable: boolean): void {
    // Update planet mesh
    this.mesh.castShadow = enable;
    this.mesh.receiveShadow = enable;
    
    // Update moons
    this.moons.forEach(moon => {
      moon.castShadow = enable;
      moon.receiveShadow = enable;
    });
    
    // Update rings if they exist
    if (this.rings) {
      this.rings.receiveShadow = enable;
    }
  }

  public setShowEarthAxis(show: boolean): void {
    if (this.name !== 'Earth' || !this.axis) return;
    this.showAxis = show;
    this.axis.visible = show;
  }

  public setShowEarthPoles(show: boolean): void {
    if (this.name !== 'Earth' || !this.northPole || !this.southPole) return;
    this.showPoles = show;
    this.northPole.visible = show;
    this.southPole.visible = show;
  }

  public setShowEarthEquator(show: boolean): void {
    if (this.name !== 'Earth' || !this.equatorPlane) return;
    this.showEquator = show;
    this.equatorPlane.visible = show;
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