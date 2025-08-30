import * as THREE from 'three';

interface SpaceMouseData {
  translation: { x: number; y: number; z: number };
  rotation: { x: number; y: number; z: number };
  buttons: number;
}

export class SpaceMouseController {
  private camera: THREE.PerspectiveCamera;
  private device: HIDDevice | null = null;
  private isConnected: boolean = false;
  private translation: THREE.Vector3;
  private rotation: THREE.Vector3;
  private sensitivity: number = 0.01;
  private rotationSensitivity: number = 0.001;
  
  constructor(camera: THREE.PerspectiveCamera) {
    this.camera = camera;
    this.translation = new THREE.Vector3();
    this.rotation = new THREE.Vector3();
    
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
      
      this.translation.set(x, -z, -y); // Adjust axes for Three.js coordinate system
      this.translation.multiplyScalar(this.sensitivity);
    } else if (reportId === 2) {
      // Rotation data
      const rx = this.getSignedInt16(data, 0);
      const ry = this.getSignedInt16(data, 2);
      const rz = this.getSignedInt16(data, 4);
      
      this.rotation.set(-rx, rz, ry); // Adjust axes for Three.js coordinate system
      this.rotation.multiplyScalar(this.rotationSensitivity);
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
    
    // Apply translation
    if (this.translation.length() > 0.001) {
      const movement = this.translation.clone();
      movement.applyQuaternion(this.camera.quaternion);
      this.camera.position.add(movement);
    }
    
    // Apply rotation
    if (this.rotation.length() > 0.001) {
      const euler = new THREE.Euler(
        this.rotation.x,
        this.rotation.y,
        this.rotation.z,
        'XYZ'
      );
      
      const quaternion = new THREE.Quaternion().setFromEuler(euler);
      this.camera.quaternion.multiplyQuaternions(quaternion, this.camera.quaternion);
    }
    
    // Decay translation and rotation for smooth stop
    this.translation.multiplyScalar(0.85);
    this.rotation.multiplyScalar(0.85);
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