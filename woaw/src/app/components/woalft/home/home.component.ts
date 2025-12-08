import { Component, OnInit, OnDestroy, CUSTOM_ELEMENTS_SCHEMA } from '@angular/core';
import { CommonModule } from '@angular/common';
import { IonicModule } from '@ionic/angular';
import { ReactiveFormsModule } from '@angular/forms';
import { Router } from '@angular/router';
import { Capacitor } from '@capacitor/core';

@Component({
  selector: 'app-home-woalft',
  templateUrl: './home.component.html',
  styleUrls: ['./home.component.scss'],
  standalone: true,
  imports: [IonicModule, CommonModule, ReactiveFormsModule],
  schemas: [CUSTOM_ELEMENTS_SCHEMA],
})
export class HomeComponent implements OnInit, OnDestroy {

  private readonly STORAGE_KEY = 'woalf_last_shown';
  private readonly COOLDOWN_MINUTES = 1; // Minutos (solo NATIVO)

  texts = [
    { text: "¿Necesitas apoyo? Soy Woalf estoy para ayudarte", route: "/soporte" },
  ];

  displayedText = "";
  index = 0;
  textIndex = 0;
  typingSpeed = 40;
  isTyping = true;

  showWoalf = false;
  showFab = false;

  private timer: any;

  constructor(private router: Router) { }

  ngOnInit() {
    this.checkAndShowWoalf();
  }

  ngOnDestroy() {
    if (this.timer) {
      clearTimeout(this.timer);
    }
  }

  private checkAndShowWoalf(): void {
    const platform = Capacitor.getPlatform(); // 'web', 'android', 'ios', etc.

    // 👉 SI ES WEB: siempre mostrar Woalf sin restricciones
    if (platform === 'web') {
      this.showWoalf = true;
      this.typeText();
      return;
    }

    // 👉 SI ES NATIVO (android / ios): usar cooldown con localStorage
    const lastShown = this.getLastShownTime();
    const now = new Date().getTime();

    if (!lastShown || (now - lastShown) > (this.COOLDOWN_MINUTES * 60 * 1000)) {
      this.showWoalf = true;
      this.typeText();
      this.updateLastShownTime();
    } else {
      this.showFab = true;
    }
  }

  private getLastShownTime(): number | null {
    try {
      const stored = localStorage.getItem(this.STORAGE_KEY);
      return stored ? parseInt(stored, 10) : null;
    } catch (error) {
      console.error('Error reading from localStorage:', error);
      return null;
    }
  }

  private updateLastShownTime(): void {
    try {
      localStorage.setItem(this.STORAGE_KEY, new Date().getTime().toString());
    } catch (error) {
      console.error('Error writing to localStorage:', error);
    }
  }

  typeText() {
    this.isTyping = true;
    const currentText = this.texts[this.textIndex].text;

    const interval = setInterval(() => {
      if (this.index < currentText.length) {
        this.displayedText += this.fullSafeChar(currentText[this.index]);
        this.index++;
      } else {
        clearInterval(interval);
        this.isTyping = false;

        if (this.textIndex < this.texts.length - 1) {
          setTimeout(() => this.nextText(), 2000);
        } else {
          this.timer = setTimeout(() => {
            this.showWoalf = false;
            this.showFab = true;
          }, 7000);
        }
      }
    }, this.typingSpeed);
  }

  nextText() {
    this.index = 0;
    this.displayedText = "";
    this.textIndex++;

    if (this.textIndex >= this.texts.length) {
      this.textIndex = this.texts.length - 1;
      return;
    }

    this.typeText();
  }

  onBubbleClick() {
    if (this.isTyping) return;

    const route = this.texts[this.textIndex].route;
    if (!route) return;

    this.router.navigate([route]);
  }

  onFabClick() {
    this.router.navigate(['/soporte']);
  }

  forceShowWoalf(): void {
    localStorage.removeItem(this.STORAGE_KEY);
    this.showWoalf = true;
    this.showFab = false;
    this.displayedText = "";
    this.index = 0;
    this.textIndex = 0;
    this.typeText();
    this.updateLastShownTime();
  }

  private fullSafeChar(char: string): string {
    return char;
  }
}
