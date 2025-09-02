import * as THREE from 'three';

// WebHID type declarations
declare global {
  interface Navigator {
    hid: {
      getDevices(): Promise<HIDDevice[]>;
      requestDevice(options: { filters: Array<{ vendorId: number; productId?: number }> }): Promise<HIDDevice[]>;
    };
  }
  
  interface HIDDevice {
    vendorId: number;
    productId: number;
    productName: string;
    opened: boolean;
    open(): Promise<void>;
    close(): Promise<void>;
    addEventListener(type: 'inputreport', listener: (event: HIDInputReportEvent) => void): void;
  }
  
  interface HIDInputReportEvent extends Event {
    data: DataView;
    reportId: number;
  }
}

export class SpaceMouseController {
  private camera: THREE.PerspectiveCamera;
  private device: HIDDevice | null = null;
  private isConnected: boolean = false;
  
  // Base sensitivities (will be multiplied by user settings)
  private basePanSensitivity: number = 0.005;
  private baseZoomSensitivity: number = 0.01;
  private baseRotationSensitivity: number = 0.001;
  
  // User adjustable settings
  private panSensitivity: number = 1.0;
  private zoomSensitivity: number = 1.0;
  private rotationSensitivity: number = 1.0;
  private deadZone: number = 15;
  private exponentialCurve: number = 1.5; // Power for exponential response
  private smoothingFactor: number = 0.15; // For momentum/smoothing
  
  // Momentum/smoothing state
  private translationVelocity: THREE.Vector3 = new THREE.Vector3();
  private rotationVelocity: THREE.Vector3 = new THREE.Vector3();
  private enableMomentum: boolean = true;
  
  // Input visualization
  private showInputOverlay: boolean = false;
  private lastInputTime: number = 0;
  private currentTranslation: THREE.Vector3 = new THREE.Vector3();
  private currentRotation: THREE.Vector3 = new THREE.Vector3();
  
  constructor(camera: THREE.PerspectiveCamera) {
    this.camera = camera;
    this.loadSettings();
    this.initializeSpaceMouse();
    this.createInputOverlay();
  }
  
  private loadSettings(): void {
    const settings = localStorage.getItem('spaceMouseSettings');
    if (settings) {
      const parsed = JSON.parse(settings);
      this.panSensitivity = parsed.panSensitivity ?? 1.0;
      this.zoomSensitivity = parsed.zoomSensitivity ?? 1.0;
      this.rotationSensitivity = parsed.rotationSensitivity ?? 1.0;
      this.deadZone = parsed.deadZone ?? 15;
      this.exponentialCurve = parsed.exponentialCurve ?? 1.5;
      this.smoothingFactor = parsed.smoothingFactor ?? 0.15;
      this.enableMomentum = parsed.enableMomentum ?? true;
      this.showInputOverlay = parsed.showInputOverlay ?? false;
    }
  }
  
  private saveSettings(): void {
    const settings = {
      panSensitivity: this.panSensitivity,
      zoomSensitivity: this.zoomSensitivity,
      rotationSensitivity: this.rotationSensitivity,
      deadZone: this.deadZone,
      exponentialCurve: this.exponentialCurve,
      smoothingFactor: this.smoothingFactor,
      enableMomentum: this.enableMomentum,
      showInputOverlay: this.showInputOverlay
    };
    localStorage.setItem('spaceMouseSettings', JSON.stringify(settings));
  }
  
  private createInputOverlay(): void {
    const overlay = document.createElement('div');
    overlay.id = 'spacemouse-overlay';
    overlay.style.cssText = `
      position: fixed;
      bottom: 80px;
      left: 20px;
      padding: 8px;
      background: rgba(0, 0, 0, 0.7);
      color: #00ff00;
      font-family: monospace;
      font-size: 11px;
      border-radius: 5px;
      display: none;
      z-index: 1000;
      width: 140px;
    `;
    document.body.appendChild(overlay);
  }

  private async initializeSpaceMouse(): Promise<void> {
    // Check if WebHID is available
    if (!('hid' in navigator)) {
      console.log('WebHID API not available');
      this.showConnectButton();
      return;
    }

    // Try to connect automatically if we have permission
    try {
      const devices = await (navigator as any).hid.getDevices();
      const spaceMouse = devices.find((d: HIDDevice) => 
        d.vendorId === 0x046d && // Logitech vendor ID (3Dconnexion)
        (d.productId === 0xc626 || // SpaceNavigator
         d.productId === 0xc628 || // SpaceNavigator for Notebooks
         d.productId === 0xc62b)   // SpaceMouse Pro
      );

      if (spaceMouse) {
        await this.connectDevice(spaceMouse);
      } else {
        this.showConnectButton();
      }
    } catch (error) {
      console.log('SpaceMouse initialization error:', error);
      this.showConnectButton();
    }
  }

  private showConnectButton(): void {
    const button = document.getElementById('connect-spacemouse');
    const status = document.getElementById('spacemouse-state');
    
    if (button) {
      button.classList.remove('hidden');
      button.addEventListener('click', this.requestDevice.bind(this));
    }
    
    if (status) {
      status.textContent = 'Not Connected';
      status.classList.remove('connected');
    }
  }

  private async requestDevice(): Promise<void> {
    try {
      const devices = await (navigator as any).hid.requestDevice({
        filters: [
          { vendorId: 0x046d, productId: 0xc626 },
          { vendorId: 0x046d, productId: 0xc628 },
          { vendorId: 0x046d, productId: 0xc62b },
          { vendorId: 0x256f }, // 3Dconnexion vendor ID
        ]
      });

      if (devices.length > 0) {
        await this.connectDevice(devices[0]);
      }
    } catch (error) {
      console.error('Failed to connect SpaceMouse:', error);
    }
  }

  private async connectDevice(device: HIDDevice): Promise<void> {
    try {
      if (!device.opened) {
        await device.open();
      }
      
      this.device = device;
      this.isConnected = true;
      
      // Update UI
      const button = document.getElementById('connect-spacemouse');
      const status = document.getElementById('spacemouse-state');
      const settingsBtn = document.getElementById('spacemouse-settings-toggle');
      
      if (button) {
        button.classList.add('hidden');
      }
      
      if (status) {
        status.textContent = 'Connected';
        status.classList.add('connected');
      }
      
      if (settingsBtn) {
        settingsBtn.classList.remove('hidden');
      }
      
      // Start listening for input
      device.addEventListener('inputreport', this.handleInput.bind(this));
      
      console.log('SpaceMouse connected successfully');
    } catch (error) {
      console.error('Failed to open SpaceMouse:', error);
    }
  }

  private applyExponentialCurve(value: number, max: number = 350): number {
    if (value === 0) return 0;
    const sign = Math.sign(value);
    const normalized = Math.abs(value) / max;
    const curved = Math.pow(normalized, this.exponentialCurve);
    return sign * curved * max;
  }
  
  private handleInput(event: HIDInputReportEvent): void {
    const { data, reportId } = event;
    this.lastInputTime = Date.now();
    
    if (reportId === 1) {
      // Translation data
      const rawX = this.getSignedInt16(data, 0);
      const rawY = this.getSignedInt16(data, 2);
      const rawZ = this.getSignedInt16(data, 4);
      
      // Debug logging to see raw values
      console.log('Raw SpaceMouse input:', { rawX, rawY, rawZ });
      
      // Apply dead zone to all axes
      let x = Math.abs(rawX) > this.deadZone ? rawX : 0;
      let y = Math.abs(rawY) > this.deadZone ? rawY : 0;
      let z = Math.abs(rawZ) > this.deadZone ? rawZ : 0;
      
      // Apply exponential response curve
      x = this.applyExponentialCurve(x);
      y = this.applyExponentialCurve(y);
      z = this.applyExponentialCurve(z);
      
      // Normalize to -1 to 1 range
      const normalizedX = x / 350;
      const normalizedY = y / 350;
      const normalizedZ = z / 350;
      
      // Store for visualization
      this.currentTranslation.set(normalizedX, normalizedY, normalizedZ);
      
      // Increased speed for better responsiveness
      const moveSpeed = 10.0;
      
      // Forward/Backward movement (Y axis) - WORKING
      if (normalizedY !== 0) {
        console.log('Moving forward/backward:', normalizedY);
        
        const forward = new THREE.Vector3(0, 0, -1);
        forward.applyQuaternion(this.camera.quaternion);
        const movement = forward.multiplyScalar(-normalizedY * moveSpeed * this.zoomSensitivity);
        
        // Direct movement (no momentum)
        this.camera.position.add(movement);
      }
      
      // Left/Right movement (X axis) - WORKING
      if (normalizedX !== 0) {
        console.log('Moving left/right:', normalizedX);
        
        const right = new THREE.Vector3(1, 0, 0);
        right.applyQuaternion(this.camera.quaternion);
        const movement = right.multiplyScalar(normalizedX * moveSpeed * this.panSensitivity);
        
        // Direct movement (no momentum)
        this.camera.position.add(movement);
      }
      
      // Up/Down movement (Z axis) - INVERTED TO MATCH EXPECTATION
      if (normalizedZ !== 0) {
        console.log('Moving up/down:', normalizedZ);
        
        const up = new THREE.Vector3(0, 1, 0);
        up.applyQuaternion(this.camera.quaternion);
        const movement = up.multiplyScalar(-normalizedZ * moveSpeed * this.panSensitivity);  // Negated Z
        
        // Direct movement (no momentum)
        this.camera.position.add(movement);
      }
      
    } else if (reportId === 2) {
      // Rotation data
      const rawRx = this.getSignedInt16(data, 0);
      const rawRy = this.getSignedInt16(data, 2);
      const rawRz = this.getSignedInt16(data, 4);
      
      console.log('Raw rotation input:', { rawRx, rawRy, rawRz });
      
      // Apply dead zone to pitch and twist (skip yaw)
      let rx = Math.abs(rawRx) > this.deadZone ? rawRx : 0;
      let ry = 0;  // Skip yaw - feels weird
      let rz = Math.abs(rawRz) > this.deadZone ? rawRz : 0;  // Use twist for turning
      
      // Apply exponential response curve
      rx = this.applyExponentialCurve(rx);
      rz = this.applyExponentialCurve(rz);
      
      // Normalize to -1 to 1 range
      const normalizedRx = rx / 350;
      const normalizedRy = ry / 350;
      const normalizedRz = rz / 350;
      
      // Store for visualization
      this.currentRotation.set(normalizedRx, normalizedRy, normalizedRz);
      
      // Rotation speed
      const rotSpeed = 0.02;
      
      // Pitch rotation (X axis) - WORKING
      if (normalizedRx !== 0) {
        console.log('Rotating pitch:', normalizedRx);
        
        const right = new THREE.Vector3(1, 0, 0);
        right.applyQuaternion(this.camera.quaternion);
        const pitchQuat = new THREE.Quaternion().setFromAxisAngle(
          right, 
          -normalizedRx * rotSpeed * this.rotationSensitivity
        );
        this.camera.quaternion.multiplyQuaternions(pitchQuat, this.camera.quaternion);
      }
      
      // SKIP YAW - Use twist for turning instead
      
      // Twist to turn (use Y axis for turning, not roll) - NOW TESTING
      if (normalizedRz !== 0) {
        console.log('Twisting to turn:', normalizedRz);
        
        // Use Y axis (up) for turning left/right when twisting
        const turnQuat = new THREE.Quaternion().setFromAxisAngle(
          new THREE.Vector3(0, 1, 0), 
          normalizedRz * rotSpeed * this.rotationSensitivity
        );
        this.camera.quaternion.multiplyQuaternions(turnQuat, this.camera.quaternion);
      }
      
    } else if (reportId === 3) {
      // Button data
      const buttons = data.getUint8(0);
      this.handleButtons(buttons);
    }
  }

  private getSignedInt16(data: DataView, offset: number): number {
    const value = data.getInt16(offset, true); // Little-endian
    return value;
  }

  private handleButtons(buttons: number): void {
    // Button 1: Reset view
    if (buttons & 0x01) {
      this.resetView();
    }
    
    // Button 2: Toggle between perspective/orthographic (if needed)
    if (buttons & 0x02) {
      // Could implement view mode toggle
    }
  }

  private resetView(): void {
    this.camera.position.set(300, 150, 300);
    this.camera.lookAt(0, 0, 0);
  }

  public update(): void {
    if (!this.isConnected) return;
    
    // MOMENTUM DISABLED FOR TESTING
    // // Apply momentum if enabled
    // if (this.enableMomentum) {
    //   // Apply translation velocity
    //   if (this.translationVelocity.lengthSq() > 0.001) {
    //     this.camera.position.add(this.translationVelocity);
    //     // Dampen velocity
    //     this.translationVelocity.multiplyScalar(0.9);
    //   }
    // }
    
    // Update input overlay
    this.updateInputOverlay();
  }
  
  private updateInputOverlay(): void {
    const overlay = document.getElementById('spacemouse-overlay');
    if (!overlay) return;
    
    if (this.showInputOverlay && this.isConnected) {
      const timeSinceInput = Date.now() - this.lastInputTime;
      if (timeSinceInput < 2000) { // Show for 2 seconds after last input
        overlay.style.display = 'block';
        overlay.innerHTML = `
          <div style="color: #0f0; font-weight: bold;">SpaceMouse</div>
          <div style="color: #888; font-size: 10px;">Move:</div>
          <div style="font-size: 10px;">X:${(this.currentTranslation.x * 100).toFixed(0)}% Y:${(this.currentTranslation.y * 100).toFixed(0)}% Z:${(this.currentTranslation.z * 100).toFixed(0)}%</div>
          <div style="color: #888; font-size: 10px; margin-top: 3px;">Rotate:</div>
          <div style="font-size: 10px;">P:${(this.currentRotation.x * 100).toFixed(0)}% Y:${(this.currentRotation.y * 100).toFixed(0)}% R:${(this.currentRotation.z * 100).toFixed(0)}%</div>
        `;
      } else {
        overlay.style.display = 'none';
        this.currentTranslation.set(0, 0, 0);
        this.currentRotation.set(0, 0, 0);
      }
    } else {
      overlay.style.display = 'none';
    }
  }
  
  // Settings methods for UI integration
  public setPanSensitivity(value: number): void {
    this.panSensitivity = value;
    this.saveSettings();
  }
  
  public setZoomSensitivity(value: number): void {
    this.zoomSensitivity = value;
    this.saveSettings();
  }
  
  public setRotationSensitivity(value: number): void {
    this.rotationSensitivity = value;
    this.saveSettings();
  }
  
  public setDeadZone(value: number): void {
    this.deadZone = value;
    this.saveSettings();
  }
  
  public setExponentialCurve(value: number): void {
    this.exponentialCurve = value;
    this.saveSettings();
  }
  
  public setSmoothingFactor(value: number): void {
    this.smoothingFactor = value;
    this.saveSettings();
  }
  
  public setEnableMomentum(value: boolean): void {
    this.enableMomentum = value;
    if (!value) {
      // Clear velocities when disabling momentum
      this.translationVelocity.set(0, 0, 0);
      this.rotationVelocity.set(0, 0, 0);
    }
    this.saveSettings();
  }
  
  public setShowInputOverlay(value: boolean): void {
    this.showInputOverlay = value;
    this.saveSettings();
  }
  
  public getSettings() {
    return {
      panSensitivity: this.panSensitivity,
      zoomSensitivity: this.zoomSensitivity,
      rotationSensitivity: this.rotationSensitivity,
      deadZone: this.deadZone,
      exponentialCurve: this.exponentialCurve,
      smoothingFactor: this.smoothingFactor,
      enableMomentum: this.enableMomentum,
      showInputOverlay: this.showInputOverlay
    };
  }

  public disconnect(): void {
    if (this.device && this.device.opened) {
      this.device.close();
      this.device = null;
      this.isConnected = false;
      
      const status = document.getElementById('spacemouse-state');
      if (status) {
        status.textContent = 'Disconnected';
        status.classList.remove('connected');
      }
    }
  }

  public isActive(): boolean {
    return this.isConnected;
  }
}