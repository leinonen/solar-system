import * as THREE from 'three';

export class FallbackControls {
  private camera: THREE.PerspectiveCamera;
  private domElement: HTMLElement;
  private target: THREE.Vector3;
  private spherical: THREE.Spherical;
  private targetSpherical: THREE.Spherical;
  private targetPosition: THREE.Vector3;
  private currentTarget: THREE.Vector3;
  private isAnimating: boolean = false;
  private isPositionAnimating: boolean = false;
  private startPosition: THREE.Vector3;
  private startTarget: THREE.Vector3;
  private animationProgress: number = 0;
  
  private mouseDown: boolean = false;
  private mouseX: number = 0;
  private mouseY: number = 0;
  private mouseDeltaX: number = 0;
  private mouseDeltaY: number = 0;
  
  private keys: { [key: string]: boolean } = {};
  private moveSpeed: number = 5;
  private rotateSpeed: number = 0.005;
  private zoomSpeed: number = 0.1;
  private dampingFactor: number = 0.1;

  constructor(camera: THREE.PerspectiveCamera, domElement: HTMLElement) {
    this.camera = camera;
    this.domElement = domElement;
    this.target = new THREE.Vector3(0, 0, 0);
    this.currentTarget = new THREE.Vector3(0, 0, 0);
    this.targetPosition = this.camera.position.clone();
    this.startPosition = new THREE.Vector3();
    this.startTarget = new THREE.Vector3();
    
    // Initialize spherical coordinates
    const offset = this.camera.position.clone().sub(this.target);
    this.spherical = new THREE.Spherical().setFromVector3(offset);
    this.targetSpherical = this.spherical.clone();
    
    this.setupEventListeners();
  }

  private setupEventListeners(): void {
    this.domElement.addEventListener('mousedown', this.onMouseDown.bind(this));
    document.addEventListener('mouseup', this.onMouseUp.bind(this));
    document.addEventListener('mousemove', this.onMouseMove.bind(this));
    this.domElement.addEventListener('wheel', this.onWheel.bind(this));
    
    document.addEventListener('keydown', this.onKeyDown.bind(this));
    document.addEventListener('keyup', this.onKeyUp.bind(this));
  }

  private onMouseDown(event: MouseEvent): void {
    if (event.button === 0 || event.button === 2) {
      this.mouseDown = true;
      this.mouseX = event.clientX;
      this.mouseY = event.clientY;
      event.preventDefault();
    }
  }

  private onMouseUp(event: MouseEvent): void {
    this.mouseDown = false;
  }

  private onMouseMove(event: MouseEvent): void {
    if (!this.mouseDown) return;
    
    this.mouseDeltaX = event.clientX - this.mouseX;
    this.mouseDeltaY = event.clientY - this.mouseY;
    
    this.mouseX = event.clientX;
    this.mouseY = event.clientY;
    
    // Rotate camera around target
    this.targetSpherical.theta -= this.mouseDeltaX * this.rotateSpeed;
    this.targetSpherical.phi += this.mouseDeltaY * this.rotateSpeed;
    
    // Limit phi to prevent flipping
    this.targetSpherical.phi = Math.max(0.1, Math.min(Math.PI - 0.1, this.targetSpherical.phi));
  }

  private onWheel(event: WheelEvent): void {
    event.preventDefault();
    
    const delta = event.deltaY > 0 ? 1 : -1;
    this.targetSpherical.radius *= 1 + delta * this.zoomSpeed;
    this.targetSpherical.radius = Math.max(1, Math.min(5000, this.targetSpherical.radius));
  }

  private onKeyDown(event: KeyboardEvent): void {
    this.keys[event.key.toLowerCase()] = true;
  }

  private onKeyUp(event: KeyboardEvent): void {
    this.keys[event.key.toLowerCase()] = false;
  }

  public update(): void {
    // Handle keyboard movement
    const moveVector = new THREE.Vector3();
    
    if (this.keys['w']) moveVector.z -= this.moveSpeed;
    if (this.keys['s']) moveVector.z += this.moveSpeed;
    if (this.keys['a']) moveVector.x -= this.moveSpeed;
    if (this.keys['d']) moveVector.x += this.moveSpeed;
    if (this.keys['q']) moveVector.y -= this.moveSpeed;
    if (this.keys['e']) moveVector.y += this.moveSpeed;
    
    // Speed boost with shift
    if (this.keys['shift']) {
      moveVector.multiplyScalar(3);
    }
    
    // Apply movement in camera space
    if (moveVector.length() > 0) {
      moveVector.applyQuaternion(this.camera.quaternion);
      this.currentTarget.add(moveVector);
      this.targetPosition.add(moveVector);
    }
    
    // Smooth transitions
    if (this.isPositionAnimating) {
      this.animationProgress += 0.02;
      if (this.animationProgress >= 1) {
        this.animationProgress = 1;
        this.isPositionAnimating = false;
      }
      
      // Smooth easing function
      const t = this.easeInOutCubic(this.animationProgress);
      
      // Interpolate camera position
      this.camera.position.lerpVectors(this.startPosition, this.targetPosition, t);
      
      // Interpolate look-at target
      this.currentTarget.lerpVectors(this.startTarget, this.target, t);
      this.camera.lookAt(this.currentTarget);
      
      // Update spherical coordinates to match current state
      const offset = this.camera.position.clone().sub(this.currentTarget);
      this.spherical.setFromVector3(offset);
      this.targetSpherical.copy(this.spherical);
    } else if (this.isAnimating) {
      this.currentTarget.lerp(this.target, 0.1);
      if (this.currentTarget.distanceTo(this.target) < 0.1) {
        this.isAnimating = false;
      }
    } else {
      this.target.copy(this.currentTarget);
    }
    
    // Only update spherical coordinates if not doing position animation
    if (!this.isPositionAnimating) {
      // Smooth spherical coordinate updates
      this.spherical.theta += (this.targetSpherical.theta - this.spherical.theta) * this.dampingFactor;
      this.spherical.phi += (this.targetSpherical.phi - this.spherical.phi) * this.dampingFactor;
      this.spherical.radius += (this.targetSpherical.radius - this.spherical.radius) * this.dampingFactor;
      
      // Update camera position from spherical coordinates
      const offset = new THREE.Vector3();
      offset.setFromSpherical(this.spherical);
      this.camera.position.copy(this.target).add(offset);
      this.camera.lookAt(this.target);
    }
    
    // Reset mouse deltas
    this.mouseDeltaX = 0;
    this.mouseDeltaY = 0;
  }

  public smoothMoveTo(position: THREE.Vector3, lookAt: THREE.Vector3): void {
    this.startPosition.copy(this.camera.position);
    this.startTarget.copy(this.currentTarget);
    this.targetPosition.copy(position);
    this.target.copy(lookAt);
    
    this.animationProgress = 0;
    this.isPositionAnimating = true;
    this.isAnimating = false;
  }

  private easeInOutCubic(t: number): number {
    return t < 0.5 ? 4 * t * t * t : 1 - Math.pow(-2 * t + 2, 3) / 2;
  }

  public setTarget(target: THREE.Vector3): void {
    this.target.copy(target);
    this.currentTarget.copy(target);
  }

  public getTarget(): THREE.Vector3 {
    return this.target.clone();
  }
}