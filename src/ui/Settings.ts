interface AppInterface {
  setShowOrbits(show: boolean): void;
  setOrbitMode(mode: 'static' | 'trails'): void;
  setShowLabels(show: boolean): void;
  setShowMilkyWay(show: boolean): void;
  setShowDistanceLabels(show: boolean): void;
  setShowCoordinateSystem(show: boolean): void;
}

import { SolarSystem } from '../scene/SolarSystem';

export class Settings {
  private solarSystem: SolarSystem;
  private app: AppInterface;
  private settingsToggle: HTMLElement | null;
  private settingsContent: HTMLElement | null;
  private showOrbitsCheckbox: HTMLInputElement | null;
  private orbitModeSelect: HTMLSelectElement | null;
  private showLabelsCheckbox: HTMLInputElement | null;
  private showMilkyWayCheckbox: HTMLInputElement | null;
  private showDistanceLabelsCheckbox: HTMLInputElement | null;
  private showCoordinateSystemCheckbox: HTMLInputElement | null;
  private isOpen: boolean = false;

  constructor(solarSystem: SolarSystem, app: AppInterface) {
    this.solarSystem = solarSystem;
    this.app = app;
    this.initializeSettings();
  }

  private initializeSettings(): void {
    this.settingsToggle = document.getElementById('settings-toggle');
    this.settingsContent = document.getElementById('settings-content');
    this.showOrbitsCheckbox = document.getElementById('show-orbits') as HTMLInputElement;
    this.orbitModeSelect = document.getElementById('orbit-mode') as HTMLSelectElement;
    this.showLabelsCheckbox = document.getElementById('show-labels') as HTMLInputElement;
    this.showMilkyWayCheckbox = document.getElementById('show-milkyway') as HTMLInputElement;
    this.showDistanceLabelsCheckbox = document.getElementById('show-distance-labels') as HTMLInputElement;
    this.showCoordinateSystemCheckbox = document.getElementById('show-coordinate-system') as HTMLInputElement;

    if (this.settingsToggle && this.settingsContent) {
      this.settingsToggle.addEventListener('click', this.toggleSettings.bind(this));
    }

    if (this.showOrbitsCheckbox) {
      this.showOrbitsCheckbox.addEventListener('change', (e) => {
        const target = e.target as HTMLInputElement;
        this.app.setShowOrbits(target.checked);
      });
    }

    if (this.orbitModeSelect) {
      this.orbitModeSelect.addEventListener('change', (e) => {
        const target = e.target as HTMLSelectElement;
        this.app.setOrbitMode(target.value as 'static' | 'trails');
      });
    }

    if (this.showLabelsCheckbox) {
      this.showLabelsCheckbox.addEventListener('change', (e) => {
        const target = e.target as HTMLInputElement;
        this.app.setShowLabels(target.checked);
      });
    }


    if (this.showMilkyWayCheckbox) {
      this.showMilkyWayCheckbox.addEventListener('change', (e) => {
        const target = e.target as HTMLInputElement;
        this.app.setShowMilkyWay(target.checked);
      });
    }

    if (this.showDistanceLabelsCheckbox) {
      this.showDistanceLabelsCheckbox.addEventListener('change', (e) => {
        const target = e.target as HTMLInputElement;
        this.app.setShowDistanceLabels(target.checked);
      });
    }

    if (this.showCoordinateSystemCheckbox) {
      this.showCoordinateSystemCheckbox.addEventListener('change', (e) => {
        const target = e.target as HTMLInputElement;
        this.app.setShowCoordinateSystem(target.checked);
      });
    }
  }

  private toggleSettings(): void {
    this.isOpen = !this.isOpen;
    if (this.settingsContent) {
      if (this.isOpen) {
        this.settingsContent.classList.remove('hidden');
      } else {
        this.settingsContent.classList.add('hidden');
      }
    }
  }
}