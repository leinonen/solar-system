export class About {
  private aboutToggle: HTMLElement | null;
  private aboutContent: HTMLElement | null;
  private isOpen: boolean = false;

  constructor() {
    this.initializeAbout();
  }

  private initializeAbout(): void {
    this.aboutToggle = document.getElementById('about-toggle');
    this.aboutContent = document.getElementById('about-content');

    if (this.aboutToggle && this.aboutContent) {
      this.aboutToggle.addEventListener('click', this.toggleAbout.bind(this));
    }

    const closeButton = document.getElementById('about-close');
    if (closeButton) {
      closeButton.addEventListener('click', this.closeAbout.bind(this));
    }
  }

  private toggleAbout(): void {
    this.isOpen = !this.isOpen;
    if (this.aboutContent) {
      if (this.isOpen) {
        this.aboutContent.classList.remove('hidden');
      } else {
        this.aboutContent.classList.add('hidden');
      }
    }
  }

  private closeAbout(): void {
    this.isOpen = false;
    if (this.aboutContent) {
      this.aboutContent.classList.add('hidden');
    }
  }
}