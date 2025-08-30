import * as THREE from 'three';

export class Skybox {
  private scene: THREE.Scene;
  private skybox: THREE.Mesh;

  constructor(scene: THREE.Scene) {
    this.scene = scene;
    this.createSkybox();
  }

  private createSkybox(): void {
    // Create a large sphere for the skybox
    const geometry = new THREE.SphereGeometry(10000, 64, 64);
    
    // Create a gradient material for space background
    const vertexShader = `
      varying vec3 vWorldPosition;
      void main() {
        vec4 worldPosition = modelMatrix * vec4(position, 1.0);
        vWorldPosition = worldPosition.xyz;
        gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
      }
    `;
    
    const fragmentShader = `
      varying vec3 vWorldPosition;
      
      void main() {
        vec3 normalizedPos = normalize(vWorldPosition);
        float intensity = pow(0.7 - dot(normalizedPos, vec3(0.0, 1.0, 0.0)), 2.0);
        
        // Deep space colors
        vec3 color1 = vec3(0.01, 0.01, 0.02); // Very dark blue
        vec3 color2 = vec3(0.02, 0.02, 0.05); // Slightly lighter blue
        vec3 color3 = vec3(0.05, 0.03, 0.08); // Purple tint
        
        // Blend colors based on position
        vec3 color = mix(color1, color2, intensity);
        color = mix(color, color3, pow(intensity, 3.0));
        
        // Add some variation for nebula effect
        float noise = sin(normalizedPos.x * 10.0) * cos(normalizedPos.y * 10.0) * 0.02;
        color += vec3(noise, noise * 0.5, noise * 0.8);
        
        gl_FragColor = vec4(color, 1.0);
      }
    `;
    
    const material = new THREE.ShaderMaterial({
      vertexShader,
      fragmentShader,
      side: THREE.BackSide,
      depthWrite: false,
    });
    
    this.skybox = new THREE.Mesh(geometry, material);
    this.scene.add(this.skybox);
    
    // Add a subtle milky way band
    this.createMilkyWay();
  }

  private createMilkyWay(): void {
    const geometry = new THREE.TorusGeometry(8000, 2000, 8, 100);
    
    const material = new THREE.MeshBasicMaterial({
      color: 0x443366,
      transparent: true,
      opacity: 0.05,
      side: THREE.DoubleSide,
      blending: THREE.AdditiveBlending,
      depthWrite: false,
    });
    
    const milkyWay = new THREE.Mesh(geometry, material);
    milkyWay.rotation.x = Math.PI / 4;
    milkyWay.rotation.y = Math.PI / 6;
    this.scene.add(milkyWay);
  }
}