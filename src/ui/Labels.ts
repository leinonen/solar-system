import * as THREE from 'three';
import { SolarSystem } from '../scene/SolarSystem';

interface LabelSprite extends THREE.Sprite {
  planetName?: string;
}

export class Labels {
  private solarSystem: SolarSystem;
  private camera: THREE.PerspectiveCamera;
  private labels: Map<string, LabelSprite> = new Map();
  private visible: boolean = true;
  private onPlanetClick?: (planetName: string) => void;
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
    sunLabel.position.set(0, 15, 0);
    this.solarSystem.getSun().add(sunLabel);
    this.labels.set('Sun', sunLabel);
    
    this.solarSystem.getPlanets().forEach(planet => {
      const label = this.createLabelSprite(planet.name);
      const yOffset = Math.max(planet.radius * 2 + 5, 8);
      label.position.set(0, yOffset, 0);
      planet.getMesh().add(label);
      this.labels.set(planet.name, label);
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

  private setupEventListeners(): void {
    this.canvas.addEventListener('click', this.onCanvasClick.bind(this));
  }

  private onCanvasClick(event: MouseEvent): void {
    if (!this.visible || !this.onPlanetClick) return;
    
    const rect = this.canvas.getBoundingClientRect();
    this.mouse.x = ((event.clientX - rect.left) / rect.width) * 2 - 1;
    this.mouse.y = -((event.clientY - rect.top) / rect.height) * 2 + 1;
    
    this.raycaster.setFromCamera(this.mouse, this.camera);
    
    const labelSprites = Array.from(this.labels.values());
    const intersects = this.raycaster.intersectObjects(labelSprites, false);
    
    if (intersects.length > 0) {
      const clickedSprite = intersects[0].object as LabelSprite;
      if (clickedSprite.planetName) {
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
      
      const maxDistance = 500;
      const minDistance = 2;
      
      if (distance < maxDistance && distance > minDistance) {
        sprite.visible = true;
        
        // Progressive scaling based on distance
        let scaleFactor = 1;
        
        if (distance < 10) {
          // Very close: scale down significantly to keep label small
          scaleFactor = 0.15 + (0.15 * (distance / 10));
        } else if (distance < 30) {
          // Close: moderate scaling
          scaleFactor = 0.3 + (0.4 * ((distance - 10) / 20));
        } else if (distance < 100) {
          // Medium distance: normal scaling
          scaleFactor = 0.7 + (0.3 * ((distance - 30) / 70));
        } else {
          // Far: slightly larger but capped
          scaleFactor = Math.min(1.2, 1 + (0.2 * ((distance - 100) / 400)));
        }
        
        const baseScale = name === 'Sun' ? 10 : 6;
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
      } else {
        sprite.visible = false;
      }
      
      sprite.lookAt(this.camera.position);
    });
  }

  public setVisible(visible: boolean): void {
    this.visible = visible;
    this.labels.forEach(sprite => {
      sprite.visible = visible;
    });
  }

  public setOnPlanetClick(callback: (planetName: string) => void): void {
    this.onPlanetClick = callback;
  }
}