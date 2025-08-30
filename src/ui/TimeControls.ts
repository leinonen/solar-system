import { SolarSystem } from '../scene/SolarSystem';

export class TimeControls {
  private solarSystem: SolarSystem;
  private isPaused: boolean = false;
  private timeScale: number = 1;
  private playPauseBtn: HTMLElement | null;
  private timeSpeedSlider: HTMLInputElement | null;
  private timeDisplay: HTMLElement | null;
  private datePicker: HTMLInputElement | null;

  constructor(solarSystem: SolarSystem) {
    this.solarSystem = solarSystem;
    this.initializeControls();
  }

  private initializeControls(): void {
    this.playPauseBtn = document.getElementById('play-pause');
    this.timeSpeedSlider = document.getElementById('time-speed') as HTMLInputElement;
    this.timeDisplay = document.getElementById('time-display');
    this.datePicker = document.getElementById('date-picker') as HTMLInputElement;

    if (this.playPauseBtn) {
      this.playPauseBtn.addEventListener('click', this.togglePlayPause.bind(this));
    }

    if (this.timeSpeedSlider) {
      this.timeSpeedSlider.addEventListener('input', this.onTimeSpeedChange.bind(this));
    }

    if (this.datePicker) {
      // Set current date
      const today = new Date().toISOString().split('T')[0];
      this.datePicker.value = today;
      this.datePicker.addEventListener('change', this.onDateChange.bind(this));
    }
  }

  private togglePlayPause(): void {
    this.isPaused = !this.isPaused;
    if (this.playPauseBtn) {
      this.playPauseBtn.textContent = this.isPaused ? '▶️' : '⏸';
    }
    
    if (this.isPaused) {
      this.solarSystem.setTimeScale(0);
    } else {
      this.solarSystem.setTimeScale(this.timeScale);
    }
  }

  private onTimeSpeedChange(event: Event): void {
    const slider = event.target as HTMLInputElement;
    const value = parseFloat(slider.value);
    
    if (value === 0) {
      this.timeScale = 1;
      this.updateTimeDisplay('Real Time');
    } else if (value > 0) {
      this.timeScale = Math.pow(10, value / 20);
      this.updateTimeDisplay(`${this.timeScale.toFixed(1)}x faster`);
    } else {
      this.timeScale = -Math.pow(10, -value / 20);
      this.updateTimeDisplay(`${Math.abs(this.timeScale).toFixed(1)}x reverse`);
    }
    
    if (!this.isPaused) {
      this.solarSystem.setTimeScale(this.timeScale);
    }
  }

  private updateTimeDisplay(text: string): void {
    if (this.timeDisplay) {
      this.timeDisplay.textContent = text;
    }
  }

  private onDateChange(event: Event): void {
    const input = event.target as HTMLInputElement;
    const date = new Date(input.value);
    
    // Calculate Julian day number for the selected date
    const jd = this.dateToJulianDay(date);
    
    // Set the solar system's reference time to this date
    this.solarSystem.setReferenceDate(jd);
    
    console.log('Date changed to:', date, 'JD:', jd);
  }
  
  private dateToJulianDay(date: Date): number {
    const a = Math.floor((14 - (date.getMonth() + 1)) / 12);
    const y = date.getFullYear() + 4800 - a;
    const m = (date.getMonth() + 1) + 12 * a - 3;
    
    return date.getDate() + Math.floor((153 * m + 2) / 5) + 365 * y + 
           Math.floor(y / 4) - Math.floor(y / 100) + Math.floor(y / 400) - 32045;
  }
}