import { SolarSystem } from '../scene/SolarSystem';

export class TimeControls {
  private solarSystem: SolarSystem;
  private isPaused: boolean = false;
  private timeScale: number = 1; // Default to real time
  private currentSimulationTime: number = 0; // Seconds since reference date
  private referenceDate: Date = new Date(); // Start with current date
  private playPauseBtn: HTMLElement | null = null;
  private timeSpeedSelect: HTMLSelectElement | null = null;
  private currentSpeedDisplay: HTMLElement | null = null;
  private currentDateDisplay: HTMLElement | null = null;
  private datePicker: HTMLInputElement | null = null;
  private resetToNowBtn: HTMLElement | null = null;
  
  // Time scale presets with their descriptions
  private readonly TIME_PRESETS = {
    '1': 'Real Time (1x)',
    '3600': '1 hour per second',
    '86400': '1 day per second', 
    '604800': '1 week per second',
    '2629800': '1 month per second',
    '525969': 'Earth orbit in 1 minute',
    '6238930': 'Jupiter orbit in 1 minute', 
    '15493277': 'Saturn orbit in 1 minute',
    '44191440': 'Uranus orbit in 1 minute',
    '86680800': 'Neptune orbit in 1 minute'
  };

  constructor(solarSystem: SolarSystem) {
    this.solarSystem = solarSystem;
    this.initializeControls();
  }

  private initializeControls(): void {
    this.playPauseBtn = document.getElementById('play-pause');
    this.timeSpeedSelect = document.getElementById('time-speed') as HTMLSelectElement;
    this.currentSpeedDisplay = document.getElementById('current-speed');
    this.currentDateDisplay = document.getElementById('current-date');
    this.datePicker = document.getElementById('date-picker') as HTMLInputElement;
    this.resetToNowBtn = document.getElementById('reset-to-now');

    if (this.playPauseBtn) {
      this.playPauseBtn.addEventListener('click', this.togglePlayPause.bind(this));
    }

    if (this.timeSpeedSelect) {
      this.timeSpeedSelect.addEventListener('change', this.onTimeSpeedChange.bind(this));
      // Initialize with default selection
      this.updateTimeScale();
    }

    if (this.datePicker) {
      // Set current date and time
      this.setDatePickerToNow();
      this.datePicker.addEventListener('change', this.onDateChange.bind(this));
    }

    if (this.resetToNowBtn) {
      this.resetToNowBtn.addEventListener('click', this.resetToCurrentDateTime.bind(this));
    }

    // Initialize with current date/time
    this.resetToCurrentDateTime();
    this.startTimeUpdate();
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
    this.updateTimeScale();
    // Make dropdown lose focus after selection
    (event.target as HTMLSelectElement).blur();
  }

  private updateTimeScale(): void {
    if (!this.timeSpeedSelect) return;
    
    const selectedValue = this.timeSpeedSelect.value;
    this.timeScale = parseFloat(selectedValue);
    
    // Update display
    const description = this.TIME_PRESETS[selectedValue as keyof typeof this.TIME_PRESETS] || `${this.timeScale}x speed`;
    this.updateCurrentSpeedDisplay(description);
    
    if (!this.isPaused) {
      this.solarSystem.setTimeScale(this.timeScale);
    }
  }

  private updateCurrentSpeedDisplay(text: string): void {
    if (this.currentSpeedDisplay) {
      this.currentSpeedDisplay.textContent = text;
    }
  }

  private updateCurrentDateDisplay(): void {
    if (!this.currentDateDisplay) return;
    
    // Calculate current simulation date
    const simulationDate = new Date(this.referenceDate.getTime() + (this.currentSimulationTime * 1000));
    
    // Format the date nicely
    const options: Intl.DateTimeFormatOptions = {
      year: 'numeric',
      month: 'short', 
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    };
    
    this.currentDateDisplay.textContent = simulationDate.toLocaleDateString('en-US', options);
  }

  private onDateChange(event: Event): void {
    const input = event.target as HTMLInputElement;
    const date = new Date(input.value);
    
    // Update our reference date and reset simulation time
    this.referenceDate = date;
    this.currentSimulationTime = 0;
    
    // Calculate Julian day number for the selected date
    const jd = this.dateToJulianDay(date);
    
    // Set the solar system's reference time to this date
    this.solarSystem.setReferenceDate(jd);
    
    // Update the display immediately
    this.updateCurrentDateDisplay();
    
    console.log('Date changed to:', date, 'JD:', jd);
  }

  private setDatePickerToNow(): void {
    if (!this.datePicker) return;
    const now = new Date();
    // Format for date input (YYYY-MM-DD)
    const dateString = now.getFullYear() + '-' + 
      String(now.getMonth() + 1).padStart(2, '0') + '-' + 
      String(now.getDate()).padStart(2, '0');
    this.datePicker.value = dateString;
  }

  private resetToCurrentDateTime(): void {
    // Reset to current date and time
    this.referenceDate = new Date();
    this.currentSimulationTime = 0;
    
    // Update date picker
    this.setDatePickerToNow();
    
    // Calculate Julian day and update solar system
    const jd = this.dateToJulianDay(this.referenceDate);
    this.solarSystem.setReferenceDate(jd);
    
    // Update display
    this.updateCurrentDateDisplay();
  }

  private startTimeUpdate(): void {
    // Update the current date display periodically
    setInterval(() => {
      if (!this.isPaused) {
        // Update simulation time based on time scale
        // delta is approximately 1/60 second (60 FPS)
        const deltaSeconds = 1/60;
        this.currentSimulationTime += deltaSeconds * this.timeScale;
        this.updateCurrentDateDisplay();
      }
    }, 1000/60); // 60 FPS updates
  }
  
  private dateToJulianDay(date: Date): number {
    const a = Math.floor((14 - (date.getMonth() + 1)) / 12);
    const y = date.getFullYear() + 4800 - a;
    const m = (date.getMonth() + 1) + 12 * a - 3;
    
    return date.getDate() + Math.floor((153 * m + 2) / 5) + 365 * y + 
           Math.floor(y / 4) - Math.floor(y / 100) + Math.floor(y / 400) - 32045;
  }
}