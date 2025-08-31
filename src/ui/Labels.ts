import * as THREE from 'three';
import { SolarSystem } from '../scene/SolarSystem';

interface LabelSprite extends THREE.Sprite {
  planetName?: string;
  moonName?: string;
  parentPlanet?: string;
}

interface LabelLine extends THREE.Line {
  planetName?: string;
  moonName?: string;
  parentPlanet?: string;
}

export class Labels {
  private solarSystem: SolarSystem;
  private camera: THREE.PerspectiveCamera;
  private labels: Map<string, LabelSprite> = new Map();
  private labelLines: Map<string, LabelLine> = new Map();
  private visible: boolean = true;
  private onPlanetClick?: (planetName: string) => void;
  private onMoonClick?: (moonName: string, planetName: string) => void;
  private raycaster: THREE.Raycaster;
  private mouse: THREE.Vector2;
  private canvas: HTMLCanvasElement;

  constructor(solarSystem: SolarSystem, camera: THREE.PerspectiveCamera, renderer: THREE.WebGLRenderer) {
    this.solarSystem = solarSystem;
    this.camera = camera;
    this.raycaster = new THREE.Raycaster();
    this.mouse = new THREE.Vector2();
    this.canvas = renderer.domElement;
    
    this.createLabels();
    this.setupEventListeners();
  }

  private createLabels(): void {
    const sunLabel = this.createLabelSprite('Sun', '#ffff00');
    sunLabel.position.set(0, 12, 0);
    this.solarSystem.getSun().add(sunLabel);
    this.labels.set('Sun', sunLabel);
    
    // Create Sun label line
    const sunLabelLine = this.createLabelLine('Sun', 12);
    this.solarSystem.getSun().add(sunLabelLine);
    this.labelLines.set('Sun', sunLabelLine);
    
    this.solarSystem.getPlanets().forEach(planet => {
      const label = this.createLabelSprite(planet.name);
      const yOffset = Math.max(planet.radius * 2 + 4, 6);
      label.position.set(0, yOffset, 0);
      planet.getGroup().add(label);
      this.labels.set(planet.name, label);
      
      // Create planet label line
      const labelLine = this.createLabelLine(planet.name, yOffset);
      planet.getGroup().add(labelLine);
      this.labelLines.set(planet.name, labelLine);
      
      // Create moon labels
      const planetData = this.solarSystem.getPlanetData(planet.name);
      if (planetData?.moons) {
        planet.getMoons().forEach((moonMesh, index) => {
          const moonData = planetData.moons![index];
          const moonLabel = this.createMoonLabelSprite(moonData.name, planet.name);
          
          // Position moon label further above the moon for better visibility
          const moonRadius = moonMesh.geometry.parameters.radius;
          const yOffset = Math.max(moonRadius * 6 + 3, 5);
          moonLabel.position.set(0, yOffset, 0);
          
          moonMesh.add(moonLabel);
          this.labels.set(`${planet.name}-${moonData.name}`, moonLabel);
          
          // Create moon label line
          const moonLabelLine = this.createMoonLabelLine(moonData.name, planet.name, yOffset);
          moonMesh.add(moonLabelLine);
          this.labelLines.set(`${planet.name}-${moonData.name}`, moonLabelLine);
        });
      }
    });
  }

  private createLabelSprite(text: string, color: string = '#ffffff'): LabelSprite {
    const canvas = document.createElement('canvas');
    const context = canvas.getContext('2d')!;
    
    const fontSize = 48;
    context.font = `${fontSize}px Arial`;
    const metrics = context.measureText(text);
    const textWidth = metrics.width;
    
    const padding = 20;
    canvas.width = textWidth + padding * 2;
    canvas.height = fontSize + padding;
    
    context.font = `${fontSize}px Arial`;
    context.fillStyle = 'rgba(0, 0, 0, 0.7)';
    context.roundRect(0, 0, canvas.width, canvas.height, 10);
    context.fill();
    
    context.fillStyle = color;
    context.textAlign = 'center';
    context.textBaseline = 'middle';
    context.fillText(text, canvas.width / 2, canvas.height / 2);
    
    const texture = new THREE.CanvasTexture(canvas);
    texture.needsUpdate = true;
    
    const spriteMaterial = new THREE.SpriteMaterial({
      map: texture,
      sizeAttenuation: true,
      depthTest: true,
      depthWrite: false,
      transparent: true
    });
    
    const sprite = new THREE.Sprite(spriteMaterial) as LabelSprite;
    sprite.planetName = text;
    
    const aspect = canvas.width / canvas.height;
    sprite.scale.set(aspect * 10, 10, 1);
    
    return sprite;
  }

  private createMoonLabelSprite(moonName: string, planetName: string, color: string = '#cccccc'): LabelSprite {
    const canvas = document.createElement('canvas');
    const context = canvas.getContext('2d')!;
    
    const fontSize = 32; // Smaller font for moons
    context.font = `${fontSize}px Arial`;
    const metrics = context.measureText(moonName);
    const textWidth = metrics.width;
    
    const padding = 16;
    canvas.width = textWidth + padding * 2;
    canvas.height = fontSize + padding;
    
    context.font = `${fontSize}px Arial`;
    context.fillStyle = 'rgba(0, 0, 0, 0.6)';
    context.roundRect(0, 0, canvas.width, canvas.height, 8);
    context.fill();
    
    context.fillStyle = color;
    context.textAlign = 'center';
    context.textBaseline = 'middle';
    context.fillText(moonName, canvas.width / 2, canvas.height / 2);
    
    const texture = new THREE.CanvasTexture(canvas);
    texture.needsUpdate = true;
    
    const spriteMaterial = new THREE.SpriteMaterial({
      map: texture,
      sizeAttenuation: true,
      depthTest: true,
      depthWrite: false,
      transparent: true
    });
    
    const sprite = new THREE.Sprite(spriteMaterial) as LabelSprite;
    sprite.moonName = moonName;
    sprite.parentPlanet = planetName;
    
    const aspect = canvas.width / canvas.height;
    sprite.scale.set(aspect * 6, 6, 1); // Smaller than planet labels
    
    return sprite;
  }

  private createLabelLine(text: string, yOffset: number): LabelLine {
    const geometry = new THREE.BufferGeometry().setFromPoints([
      new THREE.Vector3(0, 0, 0), // Planet center
      new THREE.Vector3(0, yOffset - 1, 0) // Bottom of label (slightly below label position)
    ]);
    
    const material = new THREE.LineBasicMaterial({
      color: 0xffffff,
      transparent: true,
      opacity: 0.3,
      depthTest: true,
      depthWrite: false
    });
    
    const line = new THREE.Line(geometry, material) as LabelLine;
    line.planetName = text;
    
    return line;
  }

  private createMoonLabelLine(moonName: string, planetName: string, yOffset: number): LabelLine {
    const geometry = new THREE.BufferGeometry().setFromPoints([
      new THREE.Vector3(0, 0, 0), // Moon center
      new THREE.Vector3(0, yOffset - 0.2, 0) // Bottom of label (slightly below label position)
    ]);
    
    const material = new THREE.LineBasicMaterial({
      color: 0xcccccc,
      transparent: true,
      opacity: 0.25,
      depthTest: true,
      depthWrite: false
    });
    
    const line = new THREE.Line(geometry, material) as LabelLine;
    line.moonName = moonName;
    line.parentPlanet = planetName;
    
    return line;
  }

  private setupEventListeners(): void {
    this.canvas.addEventListener('click', this.onCanvasClick.bind(this));
  }

  private onCanvasClick(event: MouseEvent): void {
    if (!this.visible) return;
    
    const rect = this.canvas.getBoundingClientRect();
    this.mouse.x = ((event.clientX - rect.left) / rect.width) * 2 - 1;
    this.mouse.y = -((event.clientY - rect.top) / rect.height) * 2 + 1;
    
    this.raycaster.setFromCamera(this.mouse, this.camera);
    
    const labelSprites = Array.from(this.labels.values());
    const intersects = this.raycaster.intersectObjects(labelSprites, false);
    
    if (intersects.length > 0) {
      const clickedSprite = intersects[0].object as LabelSprite;
      if (clickedSprite.moonName && clickedSprite.parentPlanet && this.onMoonClick) {
        // Handle moon label clicks - select the moon
        this.onMoonClick(clickedSprite.moonName, clickedSprite.parentPlanet);
      } else if (clickedSprite.planetName && this.onPlanetClick) {
        // Handle planet/sun label clicks
        this.onPlanetClick(clickedSprite.planetName);
      }
    }
  }

  public update(): void {
    if (!this.visible) return;
    
    this.labels.forEach((sprite, name) => {
      if (!sprite.parent) return;
      
      const worldPosition = new THREE.Vector3();
      sprite.parent.getWorldPosition(worldPosition);
      const distance = this.camera.position.distanceTo(worldPosition);
      
      const maxDistance = 2000;
      const minDistance = 2;
      
      if (distance < maxDistance && distance > minDistance) {
        sprite.visible = true;
        
        // Progressive scaling based on distance - optimized for space exploration
        let scaleFactor = 1;
        
        // Improved scaling curve to prevent oversized labels when very close
        if (distance < 3) {
          // Extremely close: microscopic labels
          scaleFactor = Math.max(0.003, Math.min(0.02, distance / 100));
        } else if (distance < 10) {
          // Very close range: very tiny labels
          scaleFactor = Math.max(0.02, Math.min(0.08, distance / 50));
        } else if (distance < 25) {
          // Close range: small labels
          scaleFactor = Math.max(0.08, Math.min(0.25, distance / 60));
        } else if (distance < 50) {
          // Medium range: moderate scaling
          scaleFactor = Math.max(0.25, Math.min(1.0, distance / 50));
        } else {
          // Long range: linear scaling for distant exploration
          scaleFactor = Math.min(3.0, distance / 50);
        }
        
        // Different base scales for different object types
        let baseScale = 2.5;
        if (name === 'Sun') {
          baseScale = 4;
        } else if (sprite.moonName) {
          baseScale = 1.5; // Smaller scale for moon labels
        }
        
        const aspect = sprite.scale.x / sprite.scale.y;
        sprite.scale.set(aspect * baseScale * scaleFactor, baseScale * scaleFactor, 1);
        
        // Fade out labels when very close or approaching max distance
        let opacity = 1;
        if (distance < minDistance * 3) {
          opacity = Math.max(0, (distance - minDistance) / (minDistance * 2));
        } else if (distance > maxDistance * 0.8) {
          opacity = 1 - ((distance - maxDistance * 0.8) / (maxDistance * 0.2));
        }
        sprite.material.opacity = opacity;
        
        // Update corresponding line visibility and opacity
        const line = this.labelLines.get(name);
        if (line) {
          line.visible = true;
          (line.material as THREE.LineBasicMaterial).opacity = opacity * 0.3; // Make lines even more transparent
        }
      } else {
        sprite.visible = false;
        // Hide corresponding line
        const line = this.labelLines.get(name);
        if (line) {
          line.visible = false;
        }
      }
      
      sprite.lookAt(this.camera.position);
    });
  }

  public setVisible(visible: boolean): void {
    this.visible = visible;
    this.labels.forEach(sprite => {
      sprite.visible = visible;
    });
    this.labelLines.forEach(line => {
      line.visible = visible;
    });
  }

  public setOnPlanetClick(callback: (planetName: string) => void): void {
    this.onPlanetClick = callback;
  }

  public setOnMoonClick(callback: (moonName: string, planetName: string) => void): void {
    this.onMoonClick = callback;
  }
}