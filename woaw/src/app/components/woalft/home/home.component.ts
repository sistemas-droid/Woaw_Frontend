import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { IonicModule } from '@ionic/angular';
import { ReactiveFormsModule } from '@angular/forms';
import { CUSTOM_ELEMENTS_SCHEMA } from '@angular/core';
import { Router } from '@angular/router';

@Component({
  selector: 'app-home-woalft',
  templateUrl: './home.component.html',
  styleUrls: ['./home.component.scss'],
  standalone: true,
  imports: [IonicModule, CommonModule, ReactiveFormsModule],
  schemas: [CUSTOM_ELEMENTS_SCHEMA],
})
export class HomeComponent implements OnInit {

  texts = [
    // { text: "¡Bienvenido a WOAW!", route: null },
    { text: "Necesitas apoyo? Soy walf estoy para ayudarte", route: "/soporte" },
  ];

  displayedText = "";
  index = 0;         // letra actual
  textIndex = 0;     // texto actual
  typingSpeed = 40;  // velocidad de escritura
  isTyping = true;   // desactiva click mientras escribe

  showWoalf = true;  // diálogos visibles
  showFab = false;   // botón flotante visible

  constructor(private router: Router) { }

  ngOnInit() {
    this.typeText();
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

        // Si NO es el último texto, pasa al siguiente
        if (this.textIndex < this.texts.length - 1) {
          setTimeout(() => this.nextText(), 2000);
        } else {
          // Es el último texto: esperar 2s y mostrar FAB
          setTimeout(() => {
            this.showWoalf = false;
            this.showFab = true;
          }, 2000);
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
    if (this.isTyping) return;  // no click mientras escribe

    const route = this.texts[this.textIndex].route;
    if (!route) return;         // bienvenida no navega

    this.router.navigate([route]);
  }

  onFabClick() {
    // Aquí decides a dónde manda el botón flotante
    this.router.navigate(['/soporte']);
  }

  private fullSafeChar(char: string): string {
    return char; // helper por si luego quieres filtrar caracteres especiales
  }
}
