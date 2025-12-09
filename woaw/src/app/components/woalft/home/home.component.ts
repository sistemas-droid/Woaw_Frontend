import {
  Component,
  OnInit,
  OnDestroy,
  CUSTOM_ELEMENTS_SCHEMA,
  NgZone,
} from '@angular/core';
import { CommonModule } from '@angular/common';
import { IonicModule } from '@ionic/angular';
import { ReactiveFormsModule } from '@angular/forms';
import { Router } from '@angular/router';
import { Capacitor } from '@capacitor/core';
import { App } from '@capacitor/app';

@Component({
  selector: 'app-home-woalft',
  templateUrl: './home.component.html',
  styleUrls: ['./home.component.scss'],
  standalone: true,
  imports: [IonicModule, CommonModule, ReactiveFormsModule],
  schemas: [CUSTOM_ELEMENTS_SCHEMA],
})
export class HomeComponent implements OnInit, OnDestroy {
  private readonly COOLDOWN_MINUTES = 1;  // Minutos para que vuelva a salir Woalf
  private readonly HIDE_DELAY = 7000;     // ms que se queda Woalf visible tras terminar

  texts = [
    { text: '¿Necesitas apoyo? Soy Woalf, estoy para ayudarte', route: '/soporte' },
  ];

  displayedText = '';
  textIndex = 0;
  charIndex = 0;
  isTyping = false;

  showWoalf = false;
  showFab = false;

  // Timers
  private hideTimer: any = null;
  private reappearTimeout: any = null;
  private typingTimeout: any = null;
  private timer: any;
  private cooldownTimer: any;

  // Para invalidar animaciones viejas
  private typingSessionId = 0;

  // Estado de app
  private appStateListener: any = null;
  private wasInBackground = false;

  constructor(
    private router: Router,
    private ngZone: NgZone
  ) {}

  ngOnInit() {
    const platform = Capacitor.getPlatform();

    // Siempre arrancamos Woalf al entrar
    this.startWoalf();

    // Solo en móvil nos interesa el estado de la app
    if (platform !== 'web') {
      App.addListener('appStateChange', ({ isActive }) => {
        // Esto asegura que Angular se entere de los cambios
        this.ngZone.run(() => {
          if (!isActive) {
            this.handleAppBackground();
          } else {
            this.handleAppForeground();
          }
        });
      }).then((listener) => {
        this.appStateListener = listener;
      });
    }
  }

  ngOnDestroy() {
    this.cleanupAll();
    if (this.appStateListener) {
      this.appStateListener.remove();
      this.appStateListener = null;
    }
    if (this.cooldownTimer) {
      clearTimeout(this.cooldownTimer);
    }
  }

  // ========================
  // ESTADO APP (FONDO / FRENTE)
  // ========================

  private handleAppBackground() {
    this.wasInBackground = true;

    // invalidar animación actual
    this.typingSessionId++;

    // limpiar todo
    this.cleanupAll();

    // reset visual
    this.resetWoalfState();
  }

  private handleAppForeground() {
    if (!this.wasInBackground) return;
    this.wasInBackground = false;

    // arrancar desde cero, como si se montara otra vez
    this.startWoalf();
  }

  // ========================
  // ESTADO WOALF
  // ========================

  private resetWoalfState() {
    this.displayedText = '';
    this.textIndex = 0;
    this.charIndex = 0;
    this.isTyping = false;
    this.showWoalf = false;
    this.showFab = false;
  }

  private startWoalf() {
    // Limpia todo lo que hubiera antes
    this.cleanupAll();
    this.resetWoalfState();

    this.showWoalf = true;
    this.showFab = false;

    this.isTyping = true;
    this.displayedText = '';
    this.charIndex = 0;

    const fullText = this.texts[this.textIndex].text;
    const sessionId = ++this.typingSessionId;

    this.typeNextChar(sessionId, fullText);
  }

  /**
   * Tipeo letra por letra con setTimeout
   */
  private typeNextChar(sessionId: number, fullText: string) {
    // si la sesión ya no es la actual, abortamos
    if (sessionId !== this.typingSessionId) {
      return;
    }

    if (!this.isTyping) return;

    if (this.charIndex < fullText.length) {
      this.displayedText += fullText[this.charIndex];
      this.charIndex++;

      // siguiente letra
      this.typingTimeout = setTimeout(() => {
        this.typeNextChar(sessionId, fullText);
      }, 45); // Ajusta la velocidad si quieres más rápido/lento
    } else {
      // Terminó el texto
      this.isTyping = false;
      this.typingTimeout = null;

      // Después de un rato, ocultamos Woalf y mostramos el FAB
      this.hideTimer = setTimeout(() => {
        this.showWoalf = false;
        this.showFab = true;

        this.scheduleWoalfReappearance();
      }, this.HIDE_DELAY);
    }
  }

  /**
   * Reaparición de Woalf cada minuto en móvil
   */
  private scheduleWoalfReappearance() {
    const platform = Capacitor.getPlatform();
    if (platform === 'web') return;

    if (this.reappearTimeout) {
      clearTimeout(this.reappearTimeout);
    }

    this.reappearTimeout = setTimeout(() => {
      this.startWoalf();
    }, this.COOLDOWN_MINUTES * 60 * 1000);
  }

  /**
   * Limpia todos los timers
   */
  private cleanupAll() {
    if (this.typingTimeout) {
      clearTimeout(this.typingTimeout);
      this.typingTimeout = null;
    }

    if (this.hideTimer) {
      clearTimeout(this.hideTimer);
      this.hideTimer = null;
    }

    if (this.reappearTimeout) {
      clearTimeout(this.reappearTimeout);
      this.reappearTimeout = null;
    }
  }

  // ========================
  //  CLICKS
  // ========================

  onBubbleClick() {
    // si todavía está escribiendo, no hacemos nada
    if (this.isTyping) return;

    const route = this.texts[this.textIndex].route;
    if (!route) return;

    this.router.navigate([route]);
  }

  onFabClick() {
    this.router.navigate(['/soporte']);
  }
}
