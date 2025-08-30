import * as THREE from 'three';

export class StarField {
  private scene: THREE.Scene;
  private stars!: THREE.Points;
  private starCount: number = 15000;

  constructor(scene: THREE.Scene) {
    this.scene = scene;
    this.createStarField();
  }

  private createStarField(): void {
    const geometry = new THREE.BufferGeometry();
    const positions = new Float32Array(this.starCount * 3);
    const colors = new Float32Array(this.starCount * 3);
    const sizes = new Float32Array(this.starCount);

    for (let i = 0; i < this.starCount; i++) {
      const i3 = i * 3;
      
      // Random position in a distant sphere (much farther away)
      const radius = 5000 + Math.random() * 5000;
      const theta = Math.random() * Math.PI * 2;
      const phi = Math.acos(2 * Math.random() - 1);
      
      positions[i3] = radius * Math.sin(phi) * Math.cos(theta);
      positions[i3 + 1] = radius * Math.sin(phi) * Math.sin(theta);
      positions[i3 + 2] = radius * Math.cos(phi);
      
      // Random star color (white to blue to yellow)
      const colorChoice = Math.random();
      if (colorChoice < 0.3) {
        // Blue star
        colors[i3] = 0.7;
        colors[i3 + 1] = 0.8;
        colors[i3 + 2] = 1.0;
      } else if (colorChoice < 0.6) {
        // White star
        colors[i3] = 1.0;
        colors[i3 + 1] = 1.0;
        colors[i3 + 2] = 1.0;
      } else if (colorChoice < 0.9) {
        // Yellow star
        colors[i3] = 1.0;
        colors[i3 + 1] = 0.9;
        colors[i3 + 2] = 0.7;
      } else {
        // Red star
        colors[i3] = 1.0;
        colors[i3 + 1] = 0.6;
        colors[i3 + 2] = 0.4;
      }
      
      // Random star size
      sizes[i] = Math.random() * 2 + 0.5;
    }

    geometry.setAttribute('position', new THREE.BufferAttribute(positions, 3));
    geometry.setAttribute('color', new THREE.BufferAttribute(colors, 3));
    geometry.setAttribute('size', new THREE.BufferAttribute(sizes, 1));

    const material = new THREE.PointsMaterial({
      size: 1,
      sizeAttenuation: true,
      vertexColors: true,
      transparent: true,
      opacity: 0.8,
      blending: THREE.AdditiveBlending,
      depthWrite: false,
      depthTest: true,
    });

    this.stars = new THREE.Points(geometry, material);
    this.scene.add(this.stars);
    
    // Add some brighter foreground stars
    this.createBrightStars();
  }

  private createBrightStars(): void {
    const brightStarCount = 100;
    const geometry = new THREE.BufferGeometry();
    const positions = new Float32Array(brightStarCount * 3);
    const colors = new Float32Array(brightStarCount * 3);

    for (let i = 0; i < brightStarCount; i++) {
      const i3 = i * 3;
      
      // Distant bright stars (but closer than main star field)
      const radius = 3000 + Math.random() * 2000;
      const theta = Math.random() * Math.PI * 2;
      const phi = Math.acos(2 * Math.random() - 1);
      
      positions[i3] = radius * Math.sin(phi) * Math.cos(theta);
      positions[i3 + 1] = radius * Math.sin(phi) * Math.sin(theta);
      positions[i3 + 2] = radius * Math.cos(phi);
      
      // Bright white color
      colors[i3] = 1.0;
      colors[i3 + 1] = 1.0;
      colors[i3 + 2] = 1.0;
    }

    geometry.setAttribute('position', new THREE.BufferAttribute(positions, 3));
    geometry.setAttribute('color', new THREE.BufferAttribute(colors, 3));

    const material = new THREE.PointsMaterial({
      size: 3,
      sizeAttenuation: true,
      vertexColors: true,
      transparent: true,
      opacity: 1,
      blending: THREE.AdditiveBlending,
      depthWrite: false,
      depthTest: true,
    });

    const brightStars = new THREE.Points(geometry, material);
    this.scene.add(brightStars);
  }

  public update(time: number): void {
    // Slowly rotate the star field for a dynamic effect
    this.stars.rotation.y = time * 0.0001;
  }
}