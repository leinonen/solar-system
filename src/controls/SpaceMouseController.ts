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
  private panSensitivity: number = 0.01;
  private zoomSensitivity: number = 0.02;
  private rotationSensitivity: number = 0.0003;
  private deadZone: number = 2;
  
  constructor(camera: THREE.PerspectiveCamera) {
    this.camera = camera;
    this.initializeSpaceMouse();
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
      
      if (button) {
        button.classList.add('hidden');
      }
      
      if (status) {
        status.textContent = 'Connected';
        status.classList.add('connected');
      }
      
      // Start listening for input
      device.addEventListener('inputreport', this.handleInput.bind(this));
      
      console.log('SpaceMouse connected successfully');
    } catch (error) {
      console.error('Failed to open SpaceMouse:', error);
    }
  }

  private handleInput(event: HIDInputReportEvent): void {
    const { data, reportId } = event;
    
    if (reportId === 1) {
      // Translation data
      const x = this.getSignedInt16(data, 0);
      const y = this.getSignedInt16(data, 2);
      const z = this.getSignedInt16(data, 4);
      
      // Apply dead zone to reduce jitter
      const filteredX = Math.abs(x) > this.deadZone ? x : 0;
      const filteredY = Math.abs(y) > this.deadZone ? y : 0;
      const filteredZ = Math.abs(z) > this.deadZone ? z : 0;
      
      
      // Pan movement (X) - move left/right relative to camera
      if (filteredX !== 0) {
        const right = new THREE.Vector3(1, 0, 0);
        right.applyQuaternion(this.camera.quaternion);
        
        const movement = new THREE.Vector3();
        movement.addScaledVector(right, filteredX * this.panSensitivity);
        this.camera.position.add(movement);
      }
      
      // Forward/Backward movement (Y) - move forward/backward along camera direction
      if (filteredY !== 0) {
        const forward = new THREE.Vector3(0, 0, -1);
        forward.applyQuaternion(this.camera.quaternion);
        forward.multiplyScalar(-filteredY * this.zoomSensitivity);
        this.camera.position.add(forward);
      }
      
      // Up/Down movement (Z) - move up/down relative to orbital plane (world Y)
      if (filteredZ !== 0) {
        const worldUp = new THREE.Vector3(0, 1, 0);
        const movement = new THREE.Vector3();
        movement.addScaledVector(worldUp, filteredZ * this.panSensitivity);
        this.camera.position.add(movement);
      }
      
    } else if (reportId === 2) {
      // Rotation data
      const rx = this.getSignedInt16(data, 0);
      const ry = this.getSignedInt16(data, 2);
      const rz = this.getSignedInt16(data, 4);
      
      // Apply dead zone to reduce jitter
      const filteredRx = Math.abs(rx) > this.deadZone ? rx : 0;
      const filteredRy = Math.abs(ry) > this.deadZone ? ry : 0;
      const filteredRz = Math.abs(rz) > this.deadZone ? rz : 0;
      
      // Apply rotations directly
      if (filteredRx !== 0) {
        const right = new THREE.Vector3(1, 0, 0);
        right.applyQuaternion(this.camera.quaternion);
        const pitchQuat = new THREE.Quaternion().setFromAxisAngle(
          right,
          -filteredRx * this.rotationSensitivity
        );
        this.camera.quaternion.multiplyQuaternions(pitchQuat, this.camera.quaternion);
      }
      
      if (filteredRy !== 0) {
        const yawQuat = new THREE.Quaternion().setFromAxisAngle(
          new THREE.Vector3(0, 1, 0),
          -filteredRy * this.rotationSensitivity
        );
        this.camera.quaternion.multiplyQuaternions(yawQuat, this.camera.quaternion);
      }
      
      // Twist rotation (Z) - rotate around orbital plane axis (world Y)
      if (filteredRz !== 0) {
        const rollQuat = new THREE.Quaternion().setFromAxisAngle(
          new THREE.Vector3(0, 1, 0),
          filteredRz * this.rotationSensitivity
        );
        this.camera.quaternion.multiplyQuaternions(rollQuat, this.camera.quaternion);
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
    // All movement is now handled directly in handleInput()
    // No momentum system - immediate response only
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