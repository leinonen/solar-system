interface AppInterface {
  setShowOrbits(show: boolean): void;
  setOrbitMode(mode: 'static' | 'trails'): void;
  setShowLabels(show: boolean): void;
  setShowMoons(show: boolean): void;
  setShowMoonOrbits(show: boolean): void;
  setShowAsteroidBelt(show: boolean): void;
  setShowMilkyWay(show: boolean): void;
  setShowDistanceLabels(show: boolean): void;
  setShowCoordinateSystem(show: boolean): void;
  setShowEquinoxMarkers(show: boolean): void;
  setEnableShadows(enable: boolean): void;
  setShowAxis(show: boolean): void;
  setShowPoles(show: boolean): void;
  setShowEquator(show: boolean): void;
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
  private showMoonsCheckbox: HTMLInputElement | null;
  private showMoonOrbitsCheckbox: HTMLInputElement | null;
  private showAsteroidBeltCheckbox: HTMLInputElement | null;
  private showMilkyWayCheckbox: HTMLInputElement | null;
  private showDistanceLabelsCheckbox: HTMLInputElement | null;
  private showCoordinateSystemCheckbox: HTMLInputElement | null;
  private showEquinoxMarkersCheckbox: HTMLInputElement | null;
  private enableShadowsCheckbox: HTMLInputElement | null;
  private showAxisCheckbox: HTMLInputElement | null;
  private showPolesCheckbox: HTMLInputElement | null;
  private showEquatorCheckbox: HTMLInputElement | null;
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
    this.showMoonsCheckbox = document.getElementById('show-moons') as HTMLInputElement;
    this.showMoonOrbitsCheckbox = document.getElementById('show-moon-orbits') as HTMLInputElement;
    this.showAsteroidBeltCheckbox = document.getElementById('show-asteroid-belt') as HTMLInputElement;
    this.showMilkyWayCheckbox = document.getElementById('show-milkyway') as HTMLInputElement;
    this.showDistanceLabelsCheckbox = document.getElementById('show-distance-labels') as HTMLInputElement;
    this.showCoordinateSystemCheckbox = document.getElementById('show-coordinate-system') as HTMLInputElement;
    this.showEquinoxMarkersCheckbox = document.getElementById('show-equinox-markers') as HTMLInputElement;
    this.enableShadowsCheckbox = document.getElementById('enable-shadows') as HTMLInputElement;
    this.showAxisCheckbox = document.getElementById('show-axis') as HTMLInputElement;
    this.showPolesCheckbox = document.getElementById('show-poles') as HTMLInputElement;
    this.showEquatorCheckbox = document.getElementById('show-equator') as HTMLInputElement;

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

    if (this.showMoonsCheckbox) {
      this.showMoonsCheckbox.addEventListener('change', (e) => {
        const target = e.target as HTMLInputElement;
        this.app.setShowMoons(target.checked);
      });
    }

    if (this.showMoonOrbitsCheckbox) {
      this.showMoonOrbitsCheckbox.addEventListener('change', (e) => {
        const target = e.target as HTMLInputElement;
        this.app.setShowMoonOrbits(target.checked);
      });
    }

    if (this.showAsteroidBeltCheckbox) {
      this.showAsteroidBeltCheckbox.addEventListener('change', (e) => {
        const target = e.target as HTMLInputElement;
        this.app.setShowAsteroidBelt(target.checked);
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

    if (this.showEquinoxMarkersCheckbox) {
      this.showEquinoxMarkersCheckbox.addEventListener('change', (e) => {
        const target = e.target as HTMLInputElement;
        this.app.setShowEquinoxMarkers(target.checked);
      });
    }

    if (this.enableShadowsCheckbox) {
      this.enableShadowsCheckbox.addEventListener('change', (e) => {
        const target = e.target as HTMLInputElement;
        this.app.setEnableShadows(target.checked);
      });
    }

    if (this.showAxisCheckbox) {
      this.showAxisCheckbox.addEventListener('change', (e) => {
        const target = e.target as HTMLInputElement;
        this.app.setShowAxis(target.checked);
      });
    }

    if (this.showPolesCheckbox) {
      this.showPolesCheckbox.addEventListener('change', (e) => {
        const target = e.target as HTMLInputElement;
        this.app.setShowPoles(target.checked);
      });
    }

    if (this.showEquatorCheckbox) {
      this.showEquatorCheckbox.addEventListener('change', (e) => {
        const target = e.target as HTMLInputElement;
        this.app.setShowEquator(target.checked);
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