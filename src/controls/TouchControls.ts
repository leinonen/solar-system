import * as THREE from 'three';

export class TouchControls {
  private camera: THREE.PerspectiveCamera;
  private domElement: HTMLElement;
  private enabled: boolean = true;
  
  // Touch state
  private touches: Map<number, Touch> = new Map();
  private lastTouchDistance: number = 0;
  private lastTouchMidpoint: THREE.Vector2 = new THREE.Vector2();
  private rotateStart: THREE.Vector2 = new THREE.Vector2();
  private panStart: THREE.Vector2 = new THREE.Vector2();
  
  // Control settings
  private rotateSpeed: number = 1.0;
  private zoomSpeed: number = 1.0;
  private panSpeed: number = 1.0;
  
  // Camera state
  private spherical: THREE.Spherical = new THREE.Spherical();
  private target: THREE.Vector3 = new THREE.Vector3();
  
  constructor(camera: THREE.PerspectiveCamera, domElement: HTMLElement) {
    this.camera = camera;
    this.domElement = domElement;
    
    this.initializeEventListeners();
    this.updateCameraState();
  }
  
  private initializeEventListeners(): void {
    // Touch events
    this.domElement.addEventListener('touchstart', this.onTouchStart.bind(this), { passive: false });
    this.domElement.addEventListener('touchmove', this.onTouchMove.bind(this), { passive: false });
    this.domElement.addEventListener('touchend', this.onTouchEnd.bind(this), { passive: false });
    this.domElement.addEventListener('touchcancel', this.onTouchEnd.bind(this), { passive: false });
    
    // Prevent default gestures
    this.domElement.addEventListener('gesturestart', (e) => e.preventDefault());
    this.domElement.addEventListener('gesturechange', (e) => e.preventDefault());
    
    // Context menu prevention
    this.domElement.addEventListener('contextmenu', (e) => e.preventDefault());
  }
  
  private updateCameraState(): void {
    const offset = new THREE.Vector3();
    offset.copy(this.camera.position).sub(this.target);
    this.spherical.setFromVector3(offset);
  }
  
  private onTouchStart(event: TouchEvent): void {
    if (!this.enabled) return;
    event.preventDefault();
    
    // Store all touches
    for (let i = 0; i < event.touches.length; i++) {
      this.touches.set(event.touches[i].identifier, event.touches[i]);
    }
    
    if (event.touches.length === 1) {
      // Single touch - prepare for rotation
      const touch = event.touches[0];
      this.rotateStart.set(touch.clientX, touch.clientY);
      
    } else if (event.touches.length === 2) {
      // Two touches - prepare for pinch zoom and pan
      const touch1 = event.touches[0];
      const touch2 = event.touches[1];
      
      // Calculate initial distance for pinch zoom
      const dx = touch2.clientX - touch1.clientX;
      const dy = touch2.clientY - touch1.clientY;
      this.lastTouchDistance = Math.sqrt(dx * dx + dy * dy);
      
      // Calculate initial midpoint for panning
      this.lastTouchMidpoint.set(
        (touch1.clientX + touch2.clientX) / 2,
        (touch1.clientY + touch2.clientY) / 2
      );
      this.panStart.copy(this.lastTouchMidpoint);
    }
  }
  
  private onTouchMove(event: TouchEvent): void {
    if (!this.enabled) return;
    event.preventDefault();
    
    // Update stored touches
    for (let i = 0; i < event.touches.length; i++) {
      this.touches.set(event.touches[i].identifier, event.touches[i]);
    }
    
    if (event.touches.length === 1) {
      // Single touch - rotate camera
      const touch = event.touches[0];
      const deltaX = touch.clientX - this.rotateStart.x;
      const deltaY = touch.clientY - this.rotateStart.y;
      
      this.rotateCamera(deltaX, deltaY);
      
      this.rotateStart.set(touch.clientX, touch.clientY);
      
    } else if (event.touches.length === 2) {
      // Two touches - pinch zoom and pan
      const touch1 = event.touches[0];
      const touch2 = event.touches[1];
      
      // Calculate new distance for pinch zoom
      const dx = touch2.clientX - touch1.clientX;
      const dy = touch2.clientY - touch1.clientY;
      const distance = Math.sqrt(dx * dx + dy * dy);
      
      if (this.lastTouchDistance > 0) {
        const zoomDelta = (this.lastTouchDistance - distance) * 0.01;  // Inverted for natural feel
        this.zoomCamera(zoomDelta);
      }
      
      this.lastTouchDistance = distance;
      
      // Calculate new midpoint for panning
      const midpoint = new THREE.Vector2(
        (touch1.clientX + touch2.clientX) / 2,
        (touch1.clientY + touch2.clientY) / 2
      );
      
      const panDeltaX = midpoint.x - this.lastTouchMidpoint.x;
      const panDeltaY = midpoint.y - this.lastTouchMidpoint.y;
      
      this.panCamera(panDeltaX, panDeltaY);
      
      this.lastTouchMidpoint.copy(midpoint);
    }
  }
  
  private onTouchEnd(event: TouchEvent): void {
    if (!this.enabled) return;
    
    // Remove ended touches
    for (let i = 0; i < event.changedTouches.length; i++) {
      this.touches.delete(event.changedTouches[i].identifier);
    }
    
    // Reset states if no touches remain
    if (this.touches.size === 0) {
      this.lastTouchDistance = 0;
    }
    
    // If we go from 2 touches to 1, reset the rotation start
    if (event.touches.length === 1) {
      const touch = event.touches[0];
      this.rotateStart.set(touch.clientX, touch.clientY);
    }
  }
  
  private rotateCamera(deltaX: number, deltaY: number): void {
    const element = this.domElement;
    
    // Convert pixels to angle
    const rotateLeft = (2 * Math.PI * deltaX) / element.clientWidth * this.rotateSpeed;
    const rotateUp = (2 * Math.PI * deltaY) / element.clientHeight * this.rotateSpeed;
    
    // Update spherical coordinates
    this.spherical.theta -= rotateLeft;
    this.spherical.phi = Math.max(0.1, Math.min(Math.PI - 0.1, this.spherical.phi - rotateUp));
    
    // Apply to camera
    this.updateCameraFromSpherical();
  }
  
  private panCamera(deltaX: number, deltaY: number): void {
    const distance = this.camera.position.length();
    const panLeft = -deltaX * distance * 0.001 * this.panSpeed;
    const panUp = deltaY * distance * 0.001 * this.panSpeed;
    
    // Calculate pan vectors
    const panOffset = new THREE.Vector3();
    const cameraMatrix = this.camera.matrix;
    
    // Pan horizontally
    panOffset.setFromMatrixColumn(cameraMatrix, 0); // get X column of camera matrix
    panOffset.multiplyScalar(panLeft);
    this.target.add(panOffset);
    
    // Pan vertically
    panOffset.setFromMatrixColumn(cameraMatrix, 1); // get Y column of camera matrix
    panOffset.multiplyScalar(panUp);
    this.target.add(panOffset);
    
    this.updateCameraFromSpherical();
  }
  
  private zoomCamera(delta: number): void {
    const zoomFactor = Math.pow(0.95, -delta * this.zoomSpeed * 10);
    this.spherical.radius = Math.max(10, Math.min(10000, this.spherical.radius * zoomFactor));
    
    this.updateCameraFromSpherical();
  }
  
  private updateCameraFromSpherical(): void {
    const offset = new THREE.Vector3();
    offset.setFromSpherical(this.spherical);
    
    this.camera.position.copy(this.target).add(offset);
    this.camera.lookAt(this.target);
  }
  
  public update(): void {
    // Smooth updates could be added here if needed
  }
  
  public setEnabled(enabled: boolean): void {
    this.enabled = enabled;
  }
  
  public dispose(): void {
    this.domElement.removeEventListener('touchstart', this.onTouchStart.bind(this));
    this.domElement.removeEventListener('touchmove', this.onTouchMove.bind(this));
    this.domElement.removeEventListener('touchend', this.onTouchEnd.bind(this));
    this.domElement.removeEventListener('touchcancel', this.onTouchEnd.bind(this));
  }
}