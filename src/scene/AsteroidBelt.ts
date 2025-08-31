import * as THREE from 'three';

export interface AsteroidData {
  position: THREE.Vector3;
  scale: number;
  rotationSpeed: THREE.Vector3;
  orbitalRadius: number;
  orbitalSpeed: number;
  angle: number;
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
    this.innerRadius = 2.2 * 30; // Convert AU to scene units
    this.outerRadius = 3.3 * 30;
    
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
      
      // Calculate position
      const x = Math.cos(angle) * orbitalRadius;
      const z = Math.sin(angle) * orbitalRadius;
      
      // Add vertical spread (belt has some thickness)
      const y = (Math.random() - 0.5) * 4; // ±2 units vertical spread
      
      // Random scale (asteroids vary in size)
      const scale = 0.5 + Math.random() * 2; // 0.5x to 2.5x base size
      
      // Random rotation speeds
      const rotationSpeed = new THREE.Vector3(
        (Math.random() - 0.5) * 0.02,
        (Math.random() - 0.5) * 0.02,
        (Math.random() - 0.5) * 0.02
      );
      
      // Orbital speed inversely related to distance (Kepler's laws)
      const orbitalSpeed = 0.5 / Math.sqrt(orbitalRadius / 30); // Adjust for scene scale
      
      this.asteroids.push({
        position: new THREE.Vector3(x, y, z),
        scale,
        rotationSpeed,
        orbitalRadius,
        orbitalSpeed: orbitalSpeed * 0.0001, // Scale down for reasonable motion
        angle
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

  public update(delta: number, timeScale: number): void {
    if (!this.isVisible) return;

    let needsUpdate = false;

    // Update asteroid positions and rotations
    for (let i = 0; i < this.asteroids.length; i++) {
      const asteroid = this.asteroids[i];
      
      // Update orbital position
      asteroid.angle += asteroid.orbitalSpeed * delta * timeScale;
      
      // Calculate new position
      const x = Math.cos(asteroid.angle) * asteroid.orbitalRadius;
      const z = Math.sin(asteroid.angle) * asteroid.orbitalRadius;
      
      asteroid.position.x = x;
      asteroid.position.z = z;
      // Y position stays constant (vertical spread doesn't change)
      
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