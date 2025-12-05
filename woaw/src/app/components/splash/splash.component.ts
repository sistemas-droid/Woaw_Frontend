import { Component, OnInit, OnChanges, Input, SimpleChanges, ChangeDetectorRef } from '@angular/core';
import { CommonModule } from '@angular/common';
import { IonicModule } from '@ionic/angular';
import { ReactiveFormsModule } from '@angular/forms';
import { CUSTOM_ELEMENTS_SCHEMA } from '@angular/core';


@Component({
  selector: 'app-splash',
  templateUrl: './splash.component.html',
  styleUrls: ['./splash.component.scss'],
  standalone: true,
  imports: [IonicModule, CommonModule, ReactiveFormsModule],
  schemas: [CUSTOM_ELEMENTS_SCHEMA],
})
export class SplashComponent implements OnInit {
  showSplash: boolean = true;
  animate: boolean = false;
  showWelcome: boolean = false;
  private timer: any;

  particles: Array<{ x: number, y: number, delay: number }> = [];

  ngOnInit() {
    // Generar partículas aleatorias
    this.generateParticles();

    // Iniciar animación después de un breve delay
    setTimeout(() => {
      this.animate = true;
    }, 100);

    // Mostrar mensaje de bienvenida después de que las letras estén en posición
    setTimeout(() => {
      this.showWelcome = true;
    }, 1500);

    // Ocultar splash después de 3 segundos
    this.timer = setTimeout(() => {
      this.showSplash = false;
    }, 2000);
  }

  generateParticles() {
    for (let i = 0; i < 20; i++) {
      this.particles.push({
        x: Math.random() * 100,
        y: Math.random() * 100,
        delay: Math.random() * 1000
      });
    }
  }

  ngOnDestroy() {
    if (this.timer) {
      clearTimeout(this.timer);
    }
  }

}
