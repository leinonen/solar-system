import * as THREE from 'three';
import { StarField } from './StarField';

export class Skybox {
  private scene: THREE.Scene;
  private skybox: THREE.Mesh | null = null;
  private starField: StarField | null = null;
  private starFieldMode: boolean = true;

  constructor(scene: THREE.Scene) {
    this.scene = scene;
    this.createSkybox();
  }

  private createSkybox(): void {
    if (this.starFieldMode) {
      // Use StarField class instead of skybox
      this.starField = new StarField(this.scene);
      return;
    }
    
    // Create a large sphere for the skybox
    const geometry = new THREE.SphereGeometry(10000, 64, 64);
    let material: THREE.Material;
    
    // Try to load Milky Way texture, fallback to gradient
    const textureLoader = new THREE.TextureLoader();
    
    try {
      const milkyWayTexture = textureLoader.load(
        '/textures/milkyway.jpg',
        undefined,
        undefined,
        () => {
          console.warn('Milky Way texture not found, using gradient fallback');
        }
      );
      
      // Apply shader to enhance contrast and reduce JPEG artifacts
      material = new THREE.ShaderMaterial({
        uniforms: {
          milkyWayTexture: { value: milkyWayTexture }
        },
        vertexShader: `
          varying vec2 vUv;
          void main() {
            vUv = uv;
            gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
          }
        `,
        fragmentShader: `
          uniform sampler2D milkyWayTexture;
          varying vec2 vUv;
          
          void main() {
            vec4 texColor = texture2D(milkyWayTexture, vUv);
            
            // Calculate luminance for contrast adjustments
            float luminance = dot(texColor.rgb, vec3(0.299, 0.587, 0.114));
            
            // Very gentle enhancement to preserve Milky Way visibility
            float contrastFactor = pow(luminance, 1.2);
            
            // Only reduce artifacts in extremely dark areas
            float smoothing = smoothstep(0.0, 0.01, luminance);
            contrastFactor = mix(0.0, contrastFactor, smoothing);
            
            // Preserve Milky Way structure by boosting mid-tones
            float milkyWayBoost = smoothstep(0.05, 0.4, luminance) * 0.5;
            
            // Enhance bright stars
            float starBoost = smoothstep(0.8, 1.0, luminance) * 0.2;
            
            // Apply gentle enhancement while preserving colors
            vec3 enhancedColor = texColor.rgb * (contrastFactor + milkyWayBoost + starBoost + 0.5);
            
            gl_FragColor = vec4(enhancedColor, 1.0);
          }
        `,
        side: THREE.BackSide,
        depthWrite: false,
      });
    } catch (error) {
      // Fallback to basic gradient
      material = new THREE.MeshBasicMaterial({
        color: 0x000511,
        side: THREE.BackSide,
        transparent: true,
        opacity: 0.8,
      });
    }
    
    this.skybox = new THREE.Mesh(geometry, material);
    this.scene.add(this.skybox);
  }

  public setVisible(visible: boolean): void {
    if (this.skybox) {
      this.skybox.visible = visible;
    }
  }

  public setStarFieldMode(useStarField: boolean): void {
    this.starFieldMode = useStarField;
    
    // Clean up existing objects
    if (this.skybox) {
      this.scene.remove(this.skybox);
      this.skybox = null;
    }
    if (this.starField) {
      // StarField doesn't have cleanup method, but it's managed by scene
      this.starField = null;
    }
    
    this.createSkybox();
  }
}