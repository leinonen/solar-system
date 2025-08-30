import * as THREE from 'three';
import { CSS2DRenderer, CSS2DObject } from 'three/examples/jsm/renderers/CSS2DRenderer.js';
import { SolarSystem } from '../scene/SolarSystem';

export class Labels {
  private solarSystem: SolarSystem;
  private camera: THREE.PerspectiveCamera;
  private renderer: THREE.WebGLRenderer;
  private labelRenderer: CSS2DRenderer;
  private labels: Map<string, CSS2DObject> = new Map();
  private visible: boolean = true;

  constructor(solarSystem: SolarSystem, camera: THREE.PerspectiveCamera, renderer: THREE.WebGLRenderer) {
    this.solarSystem = solarSystem;
    this.camera = camera;
    this.renderer = renderer;
    
    this.labelRenderer = new CSS2DRenderer();
    this.labelRenderer.setSize(window.innerWidth, window.innerHeight);
    this.labelRenderer.domElement.style.position = 'absolute';
    this.labelRenderer.domElement.style.top = '0px';
    this.labelRenderer.domElement.style.pointerEvents = 'none';
    
    const labelsContainer = document.getElementById('labels');
    if (labelsContainer) {
      labelsContainer.appendChild(this.labelRenderer.domElement);
    }
    
    this.createLabels();
    
    window.addEventListener('resize', this.onWindowResize.bind(this));
  }

  private createLabels(): void {
    // Create label for sun
    const sunLabel = this.createLabel('Sun', '#ffff00');
    this.solarSystem.getSun().add(sunLabel);
    this.labels.set('Sun', sunLabel);
    
    // Create labels for planets
    this.solarSystem.getPlanets().forEach(planet => {
      const label = this.createLabel(planet.name);
      planet.getMesh().add(label);
      this.labels.set(planet.name, label);
    });
  }

  private createLabel(text: string, color: string = '#ffffff'): CSS2DObject {
    const labelDiv = document.createElement('div');
    labelDiv.className = 'planet-label';
    labelDiv.textContent = text;
    labelDiv.style.color = color;
    labelDiv.style.fontSize = '14px';
    labelDiv.style.padding = '4px 8px';
    labelDiv.style.background = 'rgba(0, 0, 0, 0.7)';
    labelDiv.style.borderRadius = '4px';
    labelDiv.style.whiteSpace = 'nowrap';
    labelDiv.style.pointerEvents = 'auto';
    
    const label = new CSS2DObject(labelDiv);
    label.position.set(0, -2, 0); // Position below the planet
    
    return label;
  }

  public update(): void {
    if (!this.visible) return;
    
    // Update label visibility based on distance
    this.labels.forEach((label, name) => {
      const element = label.element as HTMLElement;
      const object = label.parent;
      
      if (object) {
        const distance = this.camera.position.distanceTo(object.position);
        const maxDistance = 500;
        
        if (distance < maxDistance) {
          element.style.opacity = '1';
          element.style.display = 'block';
          
          // Scale font size based on distance
          const scale = Math.max(0.8, Math.min(1.5, 50 / distance));
          element.style.fontSize = `${14 * scale}px`;
        } else {
          element.style.display = 'none';
        }
      }
    });
    
    this.labelRenderer.render(this.solarSystem.getSun().parent || this.solarSystem.getSun(), this.camera);
  }

  public setVisible(visible: boolean): void {
    this.visible = visible;
    this.labelRenderer.domElement.style.display = visible ? 'block' : 'none';
  }

  private onWindowResize(): void {
    this.labelRenderer.setSize(window.innerWidth, window.innerHeight);
  }
}