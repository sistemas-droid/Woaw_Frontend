import { Component, OnInit } from '@angular/core';
import { GeneralService } from '../../services/general.service';

@Component({
  selector: 'app-soporte',
  templateUrl: './soporte.page.html',
  styleUrls: ['./soporte.page.scss'],
  standalone: false
})
export class SoportePage implements OnInit {

  public tipoDispocitivo: 'computadora' | 'telefono' | 'tablet' = 'computadora';

  // 🔎 Texto del buscador de FAQs
  public searchTerm: string = '';

  constructor(
    private generalService: GeneralService
  ) { }

  ngOnInit() {
    this.generalService.dispositivo$.subscribe((tipo) => {
      this.tipoDispocitivo = tipo;
    });
  }

  sendMail() {
    window.location.href = 'mailto:comercial@wo-aw.com';
  }

  // ⌨️ Cada que escriben en el buscador
  onSearchChange(event: any) {
    const value = event?.detail?.value ?? '';
    this.searchTerm = value.toString().toLowerCase().trim();
  }

  // Normaliza: quita acentos y pasa a minúsculas
  private normalize(text: string): string {
    return (text || '')
      .normalize('NFD')
      .replace(/[\u0300-\u036f]/g, '')
      .toLowerCase();
  }

  /**
   * Busca el término EXACTO que escribió el user como substring
   * dentro de todos los textos concatenados.
   * 
   * Ej:
   *  - "whats" encuentra "WhatsApp"
   *  - "soporte whats" encuentra "soporte en nuestro WhatsApp oficial"
   */
  matchesSearch(...texts: string[]): boolean {
    if (!this.searchTerm) {
      return true; // sin búsqueda, se muestra todo
    }

    const haystack = this.normalize(texts.join(' ')); // todo el texto junto
    const needle   = this.normalize(this.searchTerm); // lo que escribió el user

    return haystack.includes(needle);
  }

  /**
   * Para usar si quieres filtrar la tarjeta completa (faq-block)
   * en vez de solo los acordeones.
   */
  blockMatches(...texts: string[]): boolean {
    return this.matchesSearch(...texts);
  }

}