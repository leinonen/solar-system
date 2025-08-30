import * as THREE from 'three';

export class Skybox {
  private scene: THREE.Scene;
  private skybox: THREE.Mesh;
  private starFieldMode: boolean = false;

  constructor(scene: THREE.Scene) {
    this.scene = scene;
    this.createSkybox();
  }

  private createSkybox(): void {
    // Create a large sphere for the skybox
    const geometry = new THREE.SphereGeometry(10000, 64, 64);
    let material: THREE.Material;
    
    if (this.starFieldMode) {
      // Use procedural star field
      material = this.createStarField();
    } else {
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
        // Fallback to star field if texture fails
        material = this.createStarField();
      }
    }
    
    this.skybox = new THREE.Mesh(geometry, material);
    this.scene.add(this.skybox);
  }

  public setVisible(visible: boolean): void {
    this.skybox.visible = visible;
  }

  public setStarFieldMode(useStarField: boolean): void {
    this.starFieldMode = useStarField;
    this.scene.remove(this.skybox);
    this.createSkybox();
  }

  private createStarField(): THREE.Material {
    // Create procedural star field
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
        
        // Generate stars using noise
        float star1 = sin(normalizedPos.x * 1000.0) * cos(normalizedPos.y * 1000.0) * sin(normalizedPos.z * 1000.0);
        float star2 = sin(normalizedPos.x * 1500.0) * cos(normalizedPos.y * 1500.0) * sin(normalizedPos.z * 1500.0);
        float stars = smoothstep(0.99, 1.0, star1) + smoothstep(0.995, 1.0, star2) * 0.5;
        
        // Deep space gradient
        float intensity = pow(0.7 - dot(normalizedPos, vec3(0.0, 1.0, 0.0)), 2.0);
        vec3 color1 = vec3(0.01, 0.01, 0.02);
        vec3 color2 = vec3(0.02, 0.02, 0.05);
        vec3 color3 = vec3(0.05, 0.03, 0.08);
        
        vec3 color = mix(color1, color2, intensity);
        color = mix(color, color3, pow(intensity, 3.0));
        
        // Add stars
        color += vec3(stars);
        
        gl_FragColor = vec4(color, 1.0);
      }
    `;
    
    return new THREE.ShaderMaterial({
      vertexShader,
      fragmentShader,
      side: THREE.BackSide,
      depthWrite: false,
    });
  }
}