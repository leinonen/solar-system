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
  private showDistanceLabels: boolean = true;
  private distanceLabels: THREE.Sprite[] = [];
  private distanceLines: THREE.Line[] = [];
  private timeScale: number = 1;
  private currentTime: number = 0;
  private referenceJD: number = 2451545.0; // J2000.0 epoch
  private planetScale: number = 3;
  private camera?: THREE.Camera;

  constructor(scene: THREE.Scene) {
    this.scene = scene;
    this.createSun();
    this.createPlanets();
    this.createOrbits();
    this.createDistanceLabels();
  }

  private createSun(): void {
    const sunRadius = getScaledRadius(SUN_DATA.radius, true);
    const geometry = new THREE.SphereGeometry(sunRadius, 64, 64);
    
    // Try to load sun texture, fallback to color
    const textureLoader = new THREE.TextureLoader();
    let material: THREE.Material;
    
    try {
      const sunTexture = textureLoader.load(
        '/textures/sun.jpg',
        undefined,
        undefined,
        () => {
          console.warn('Sun texture not found, using color fallback');
        }
      );
      
      material = new THREE.MeshBasicMaterial({
        map: sunTexture,
        color: 0xffffff,
      });
    } catch (error) {
      material = new THREE.MeshBasicMaterial({
        color: SUN_DATA.color,
      });
    }
    
    this.sun = new THREE.Mesh(geometry, material);
    this.sun.position.set(0, 0, 0);
    this.scene.add(this.sun);
    
    // Add sun light
    this.sunLight = new THREE.PointLight(0xffffff, 5, 0, 0);
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
    
    // Create exponential radial gradient
    const gradient = context.createRadialGradient(256, 256, 0, 256, 256, 256);
    gradient.addColorStop(0, 'rgba(255, 255, 100, 1.0)');
    gradient.addColorStop(0.2, 'rgba(255, 220, 80, 0.9)');
    gradient.addColorStop(0.3, 'rgba(255, 180, 60, 0.7)');
    gradient.addColorStop(0.45, 'rgba(255, 140, 40, 0.4)');
    gradient.addColorStop(0.6, 'rgba(255, 100, 30, 0.15)');
    gradient.addColorStop(0.75, 'rgba(255, 80, 20, 0.05)');
    gradient.addColorStop(0.9, 'rgba(255, 60, 15, 0.02)');
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
      const segments = 200;
      
      const points = [];
      for (let i = 0; i <= segments; i++) {
        const angle = (i / segments) * Math.PI * 2;
        const x = Math.cos(angle) * orbitRadius;
        const z = Math.sin(angle) * orbitRadius;
        points.push(new THREE.Vector3(x, 0, z));
      }
      
      const geometry = new THREE.BufferGeometry().setFromPoints(points);
      
      // Initialize vertex colors array
      const colors = new Float32Array(points.length * 3);
      geometry.setAttribute('color', new THREE.BufferAttribute(colors, 3));
      
      const material = new THREE.LineBasicMaterial({
        vertexColors: true,
        transparent: true,
        opacity: 0.8,
        linewidth: 2,
      });
      
      const orbit = new THREE.Line(geometry, material);
      orbit.rotation.x = THREE.MathUtils.degToRad(planetData.inclination);
      orbit.visible = this.showOrbits;
      orbit.userData = { 
        orbitRadius: orbitRadius,
        planetName: planetData.name 
      };
      
      this.orbits.push(orbit);
      this.scene.add(orbit);
    });
  }

  private createDistanceLabels(): void {
    // Get sorted orbital radii (including sun at center)
    const orbitalRadii = [0, ...PLANETS.map(p => getScaledOrbitRadius(p.orbitalRadius))].sort((a, b) => a - b);
    
    // Create distance labels and lines between adjacent orbits
    for (let i = 0; i < orbitalRadii.length - 1; i++) {
      const innerRadius = orbitalRadii[i];
      const outerRadius = orbitalRadii[i + 1];
      const distance = outerRadius - innerRadius;
      const middleRadius = (innerRadius + outerRadius) / 2;
      
      // Convert distance back to AU for display
      const distanceAU = distance / 30; // Since getScaledOrbitRadius multiplies by 30
      
      // Create text canvas
      const canvas = document.createElement('canvas');
      const context = canvas.getContext('2d')!;
      canvas.width = 256;
      canvas.height = 64;
      
      // Draw text
      context.fillStyle = 'rgba(255, 255, 255, 0.9)';
      context.font = 'bold 20px Arial';
      context.textAlign = 'center';
      context.textBaseline = 'middle';
      context.fillText(`${distanceAU.toFixed(2)} AU`, 128, 32);
      
      // Create sprite material
      const texture = new THREE.CanvasTexture(canvas);
      const spriteMaterial = new THREE.SpriteMaterial({
        map: texture,
        transparent: true,
        depthTest: false,
      });
      
      // Create sprite and position it
      const sprite = new THREE.Sprite(spriteMaterial);
      sprite.scale.set(8, 2, 1);
      sprite.position.set(middleRadius, 2, 0); // Slightly above the orbital plane
      sprite.visible = this.showDistanceLabels;
      
      this.distanceLabels.push(sprite);
      this.scene.add(sprite);
      
      // Create line between orbits
      const lineGeometry = new THREE.BufferGeometry();
      const linePoints = [
        new THREE.Vector3(innerRadius, 0, 0),
        new THREE.Vector3(outerRadius, 0, 0)
      ];
      lineGeometry.setFromPoints(linePoints);
      
      const lineMaterial = new THREE.LineBasicMaterial({
        color: 0x888888,
        transparent: true,
        opacity: 0.6,
      });
      
      const line = new THREE.Line(lineGeometry, lineMaterial);
      line.visible = this.showDistanceLabels;
      
      this.distanceLines.push(line);
      this.scene.add(line);
      
      // Create arrow at the end of the line
      const arrowGeometry = new THREE.ConeGeometry(0.5, 2, 8);
      const arrowMaterial = new THREE.MeshBasicMaterial({ color: 0x888888 });
      const arrow = new THREE.Mesh(arrowGeometry, arrowMaterial);
      arrow.position.set(outerRadius - 1, 0, 0);
      arrow.rotation.z = -Math.PI / 2; // Point right
      arrow.visible = this.showDistanceLabels;
      
      this.distanceLines.push(arrow);
      this.scene.add(arrow);
    }
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
    
    // Update orbit shading
    if (this.camera && this.showOrbits) {
      this.updateOrbitShading();
    }
  }
  
  private updateOrbitShading(): void {
    if (!this.camera) return;
    
    this.orbits.forEach((orbit) => {
      const geometry = orbit.geometry as THREE.BufferGeometry;
      const colorAttribute = geometry.getAttribute('color') as THREE.BufferAttribute;
      const positionAttribute = geometry.getAttribute('position') as THREE.BufferAttribute;
      
      if (!colorAttribute || !positionAttribute) return;
      
      const colors = colorAttribute.array as Float32Array;
      const positions = positionAttribute.array as Float32Array;
      
      // Get orbit's world matrix for transforming local positions
      orbit.updateMatrixWorld();
      
      for (let i = 0; i < positionAttribute.count; i++) {
        // Get local position
        const localPos = new THREE.Vector3(
          positions[i * 3],
          positions[i * 3 + 1],
          positions[i * 3 + 2]
        );
        
        // Transform to world space
        const worldPos = localPos.clone().applyMatrix4(orbit.matrixWorld);
        
        // Calculate distance from camera to this point
        const distance = this.camera.position.distanceTo(worldPos);
        
        // Calculate relative brightness based on distance
        // Closer points are brighter, farther points are dimmer
        const maxDistance = 800;
        const minDistance = 50;
        
        let brightness;
        if (distance < minDistance) {
          brightness = 1.0; // Maximum brightness for very close points
        } else if (distance > maxDistance) {
          brightness = 0.2; // Minimum brightness for distant points
        } else {
          // Smooth gradient between min and max distance
          const t = (distance - minDistance) / (maxDistance - minDistance);
          brightness = 1.0 - (t * 0.8); // Range from 1.0 to 0.2
        }
        
        // Apply slight blue tint to make it look more space-like
        colors[i * 3] = brightness * 0.7;     // Red
        colors[i * 3 + 1] = brightness * 0.8; // Green  
        colors[i * 3 + 2] = brightness;       // Blue
      }
      
      colorAttribute.needsUpdate = true;
    });
  }
  
  public setCamera(camera: THREE.Camera): void {
    this.camera = camera;
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

  public setShowDistanceLabels(show: boolean): void {
    this.showDistanceLabels = show;
    this.distanceLabels.forEach(label => {
      label.visible = show;
    });
    this.distanceLines.forEach(line => {
      line.visible = show;
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

  public getSunData() {
    return SUN_DATA;
  }
}