import { SpaceMouseController } from '../controls/SpaceMouseController';

export class SpaceMouseSettings {
  private controller: SpaceMouseController;
  private settingsToggle: HTMLElement | null;
  private settingsPanel: HTMLElement | null;
  private isOpen: boolean = false;

  constructor(controller: SpaceMouseController) {
    this.controller = controller;
    this.settingsToggle = document.getElementById('spacemouse-settings-toggle');
    this.settingsPanel = document.getElementById('spacemouse-settings');
    
    this.initializeUI();
    this.setupEventListeners();
    this.loadSettingsToUI();
  }

  private initializeUI(): void {
    // Show settings button when SpaceMouse is connected
    const updateSettingsVisibility = () => {
      if (this.controller.isActive() && this.settingsToggle) {
        this.settingsToggle.classList.remove('hidden');
      }
    };
    
    // Check periodically for connection status
    setInterval(updateSettingsVisibility, 1000);
  }

  private setupEventListeners(): void {
    // Toggle settings panel
    this.settingsToggle?.addEventListener('click', () => {
      this.toggleSettings();
    });

    // Close settings when clicking outside
    document.addEventListener('click', (e) => {
      if (this.isOpen && 
          !this.settingsPanel?.contains(e.target as Node) && 
          e.target !== this.settingsToggle) {
        this.closeSettings();
      }
    });

    // Sensitivity sliders
    this.setupSlider('sm-pan-sensitivity', 'sm-pan-value', 
      (value) => this.controller.setPanSensitivity(value));
    
    this.setupSlider('sm-zoom-sensitivity', 'sm-zoom-value',
      (value) => this.controller.setZoomSensitivity(value));
    
    this.setupSlider('sm-rotation-sensitivity', 'sm-rotation-value',
      (value) => this.controller.setRotationSensitivity(value));
    
    // Advanced settings
    this.setupSlider('sm-deadzone', 'sm-deadzone-value',
      (value) => this.controller.setDeadZone(value), 1);
    
    this.setupSlider('sm-curve', 'sm-curve-value',
      (value) => this.controller.setExponentialCurve(value));
    
    this.setupSlider('sm-smoothing', 'sm-smoothing-value',
      (value) => this.controller.setSmoothingFactor(value));
    
    // Checkboxes
    const momentumCheckbox = document.getElementById('sm-momentum') as HTMLInputElement;
    momentumCheckbox?.addEventListener('change', () => {
      this.controller.setEnableMomentum(momentumCheckbox.checked);
    });
    
    const overlayCheckbox = document.getElementById('sm-overlay') as HTMLInputElement;
    overlayCheckbox?.addEventListener('change', () => {
      this.controller.setShowInputOverlay(overlayCheckbox.checked);
    });
    
    // Reset button
    document.getElementById('sm-reset-settings')?.addEventListener('click', () => {
      this.resetToDefaults();
    });
  }

  private setupSlider(sliderId: string, displayId: string, 
                     callback: (value: number) => void, decimals: number = 1): void {
    const slider = document.getElementById(sliderId) as HTMLInputElement;
    const display = document.getElementById(displayId);
    
    if (slider && display) {
      slider.addEventListener('input', () => {
        const value = parseFloat(slider.value);
        display.textContent = value.toFixed(decimals);
        callback(value);
      });
    }
  }

  private loadSettingsToUI(): void {
    const settings = this.controller.getSettings();
    
    // Update sliders
    this.updateSliderValue('sm-pan-sensitivity', 'sm-pan-value', settings.panSensitivity);
    this.updateSliderValue('sm-zoom-sensitivity', 'sm-zoom-value', settings.zoomSensitivity);
    this.updateSliderValue('sm-rotation-sensitivity', 'sm-rotation-value', settings.rotationSensitivity);
    this.updateSliderValue('sm-deadzone', 'sm-deadzone-value', settings.deadZone, 0);
    this.updateSliderValue('sm-curve', 'sm-curve-value', settings.exponentialCurve);
    this.updateSliderValue('sm-smoothing', 'sm-smoothing-value', settings.smoothingFactor);
    
    // Update checkboxes
    const momentumCheckbox = document.getElementById('sm-momentum') as HTMLInputElement;
    if (momentumCheckbox) momentumCheckbox.checked = settings.enableMomentum;
    
    const overlayCheckbox = document.getElementById('sm-overlay') as HTMLInputElement;
    if (overlayCheckbox) overlayCheckbox.checked = settings.showInputOverlay;
  }

  private updateSliderValue(sliderId: string, displayId: string, value: number, decimals: number = 1): void {
    const slider = document.getElementById(sliderId) as HTMLInputElement;
    const display = document.getElementById(displayId);
    
    if (slider) slider.value = value.toString();
    if (display) display.textContent = value.toFixed(decimals);
  }

  private toggleSettings(): void {
    if (this.isOpen) {
      this.closeSettings();
    } else {
      this.openSettings();
    }
  }

  private openSettings(): void {
    if (this.settingsPanel) {
      this.settingsPanel.classList.remove('hidden');
      this.isOpen = true;
    }
  }

  private closeSettings(): void {
    if (this.settingsPanel) {
      this.settingsPanel.classList.add('hidden');
      this.isOpen = false;
    }
  }

  private resetToDefaults(): void {
    // Reset to default values
    this.controller.setPanSensitivity(1.0);
    this.controller.setZoomSensitivity(1.0);
    this.controller.setRotationSensitivity(1.0);
    this.controller.setDeadZone(15);
    this.controller.setExponentialCurve(1.5);
    this.controller.setSmoothingFactor(0.15);
    this.controller.setEnableMomentum(true);
    this.controller.setShowInputOverlay(false);
    
    // Reload UI
    this.loadSettingsToUI();
  }
}