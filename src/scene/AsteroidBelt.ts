import * as THREE from 'three';

export interface AsteroidData {
  position: THREE.Vector3;
  scale: number;
  rotationSpeed: THREE.Vector3;
  orbitalRadius: number;
  orbitalSpeed: number;
  initialAngle: number;
  inclination: number;
}

export class AsteroidBelt {
  private scene: THREE.Scene;
  private instancedMesh: THREE.InstancedMesh;
  private asteroids: AsteroidData[] = [];
  private isVisible: boolean = false;
  private dummy: THREE.Object3D = new THREE.Object3D();
  private count: number;
  private innerRadius: number;
  private outerRadius: number;

  constructor(scene: THREE.Scene, count: number = 2000) {
    this.scene = scene;
    this.count = count;
    
    // Asteroid belt is between Mars (1.524 AU) and Jupiter (5.204 AU)
    // Main belt spans roughly 2.2 to 3.3 AU
    // Use progressive scaling matching planet orbits (2.2-3.3 AU falls in 60-80 range)
    this.innerRadius = 2.2 * 80; // Convert AU to scene units using gas giant scaling
    this.outerRadius = 3.3 * 80;
    
    this.createAsteroidBelt();
  }

  private createAsteroidBelt(): void {
    // Create a simple geometry for asteroids (irregular looking)
    const geometry = this.createAsteroidGeometry();
    
    // Create material for asteroids with more realistic properties
    const material = new THREE.MeshStandardMaterial({
      color: 0x6B5B4F, // Darker brownish-gray asteroid color
      roughness: 0.95,  // Very rough surface like real asteroids
      metalness: 0.05,  // Slight metallic content
      // Add subtle color variation through vertex colors later
    });

    // Create instanced mesh
    this.instancedMesh = new THREE.InstancedMesh(geometry, material, this.count);
    this.instancedMesh.visible = this.isVisible;
    this.instancedMesh.castShadow = false; // Asteroids too small/sparse to cast meaningful shadows
    this.instancedMesh.receiveShadow = true;
    
    this.scene.add(this.instancedMesh);

    // Generate asteroid data
    this.generateAsteroids();
    this.updateInstanceMatrices();
  }

  private createAsteroidGeometry(): THREE.BufferGeometry {
    // Create a more detailed irregular asteroid shape
    const baseGeometry = new THREE.IcosahedronGeometry(0.1, 1); // More organic base shape
    const positions = baseGeometry.attributes.position.array as Float32Array;
    
    // Apply Perlin-like noise for more realistic irregular surface
    for (let i = 0; i < positions.length; i += 3) {
      const x = positions[i];
      const y = positions[i + 1];
      const z = positions[i + 2];
      
      // Calculate distance from center for radial deformation
      const distance = Math.sqrt(x * x + y * y + z * z);
      
      // Create multiple noise layers for more complex surface (deterministic)
      const noise1 = (Math.sin(x * 15) * Math.cos(y * 12) * Math.sin(z * 18)) * 0.15;
      const noise2 = (Math.sin(x * 8) * Math.cos(y * 7) * Math.sin(z * 9)) * 0.25;
      const noise3 = (Math.sin(x * 25 + y * 17) * Math.cos(z * 23)) * 0.08; // Deterministic fine detail
      
      const totalNoise = noise1 + noise2 + noise3;
      const deformationFactor = 1 + totalNoise;
      
      // Apply deformation along the normal direction
      positions[i] = x * deformationFactor;
      positions[i + 1] = y * deformationFactor;
      positions[i + 2] = z * deformationFactor;
    }
    
    // Update normals for proper lighting
    baseGeometry.computeVertexNormals();
    
    return baseGeometry;
  }

  private generateAsteroids(): void {
    this.asteroids = [];
    
    for (let i = 0; i < this.count; i++) {
      // Random orbital radius within the belt
      const orbitalRadius = this.innerRadius + Math.random() * (this.outerRadius - this.innerRadius);
      
      // Random starting angle
      const angle = Math.random() * Math.PI * 2;
      
      // Generate inclination with realistic distribution
      // Most asteroids have low inclinations (< 10 degrees)
      // Use a normal-like distribution centered around 0
      let inclination: number;
      const inclinationRandom = Math.random();
      if (inclinationRandom < 0.7) {
        // 70% have low inclination (0-5 degrees)
        inclination = (Math.random() - 0.5) * 10 * (Math.PI / 180);
      } else if (inclinationRandom < 0.95) {
        // 25% have moderate inclination (5-15 degrees)
        inclination = (Math.random() - 0.5) * 30 * (Math.PI / 180);
      } else {
        // 5% have high inclination (15-30 degrees)
        inclination = (Math.random() - 0.5) * 60 * (Math.PI / 180);
      }
      
      // Calculate position with inclination
      const x = Math.cos(angle) * orbitalRadius;
      const z = Math.sin(angle) * orbitalRadius;
      
      // Apply inclination to y-coordinate
      // The y-offset represents the height above/below the ecliptic plane
      const y = Math.tan(inclination) * orbitalRadius;
      
      // Random scale (asteroids vary in size)
      const scale = 0.5 + Math.random() * 2; // 0.5x to 2.5x base size
      
      // Random rotation speeds
      const rotationSpeed = new THREE.Vector3(
        (Math.random() - 0.5) * 0.02,
        (Math.random() - 0.5) * 0.02,
        (Math.random() - 0.5) * 0.02
      );
      
      // Calculate orbital period using Kepler's third law
      // T² = a³ where T is in Earth years and a is in AU
      const orbitalRadiusAU = orbitalRadius / 80; // Convert scene units to AU (using gas giant scaling)
      const orbitalPeriodYears = Math.sqrt(Math.pow(orbitalRadiusAU, 3));
      const orbitalPeriodDays = orbitalPeriodYears * 365.256;
      
      // Calculate angular speed in radians per second (matching Planet.ts approach)
      const orbitalSpeed = (2 * Math.PI) / (orbitalPeriodDays * 24 * 3600);
      
      this.asteroids.push({
        position: new THREE.Vector3(x, y, z),
        scale,
        rotationSpeed,
        orbitalRadius,
        orbitalSpeed: orbitalSpeed, // radians per second
        initialAngle: angle,
        inclination
      });
    }
  }

  private updateInstanceMatrices(): void {
    for (let i = 0; i < this.asteroids.length; i++) {
      const asteroid = this.asteroids[i];
      
      // Set position
      this.dummy.position.copy(asteroid.position);
      
      // Set scale
      this.dummy.scale.set(asteroid.scale, asteroid.scale, asteroid.scale);
      
      // Update matrix
      this.dummy.updateMatrix();
      this.instancedMesh.setMatrixAt(i, this.dummy.matrix);
    }
    
    this.instancedMesh.instanceMatrix.needsUpdate = true;
  }

  public update(delta: number, time: number): void {
    if (!this.isVisible) return;

    let needsUpdate = false;

    // Update asteroid positions and rotations
    for (let i = 0; i < this.asteroids.length; i++) {
      const asteroid = this.asteroids[i];
      
      // Calculate current orbital angle based on time
      const currentAngle = asteroid.initialAngle + time * asteroid.orbitalSpeed;
      
      // Calculate new position with inclination
      const x = Math.cos(currentAngle) * asteroid.orbitalRadius;
      const z = Math.sin(currentAngle) * asteroid.orbitalRadius;
      
      // Maintain the inclination-based y-coordinate
      const y = Math.tan(asteroid.inclination) * asteroid.orbitalRadius;
      
      asteroid.position.x = x;
      asteroid.position.y = y;
      asteroid.position.z = z;
      
      needsUpdate = true;
    }

    if (needsUpdate) {
      this.updateInstanceMatrices();
    }
  }

  public setVisible(visible: boolean): void {
    this.isVisible = visible;
    this.instancedMesh.visible = visible;
  }

  public getVisible(): boolean {
    return this.isVisible;
  }

  public setEnableShadows(enable: boolean): void {
    // Asteroids should not cast shadows (too small/sparse in reality)
    // but they should receive shadows for proper lighting
    this.instancedMesh.castShadow = false;
    this.instancedMesh.receiveShadow = enable;
  }

  public dispose(): void {
    if (this.instancedMesh) {
      this.scene.remove(this.instancedMesh);
      this.instancedMesh.geometry.dispose();
      if (Array.isArray(this.instancedMesh.material)) {
        this.instancedMesh.material.forEach(material => material.dispose());
      } else {
        this.instancedMesh.material.dispose();
      }
    }
  }

  public getInstancedMesh(): THREE.InstancedMesh {
    return this.instancedMesh;
  }

  public getCount(): number {
    return this.count;
  }

  public getInnerRadius(): number {
    return this.innerRadius;
  }

  public getOuterRadius(): number {
    return this.outerRadius;
  }
}