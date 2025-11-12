// services/reload.service.ts
import { Injectable } from '@angular/core';
import { Router } from '@angular/router';

@Injectable({
  providedIn: 'root'
})
export class ReloadService {
  
  constructor(private router: Router) {}

  /**
   * Recarga suave - alternativa segura a window.location.reload()
   */
  async softReload(): Promise<void> {
    try {
      // 1. Scroll to top suave
      this.scrollToTop();
      
      // 2. Pequeño delay para mejor UX
      await this.delay(100);
      
      // 3. Recarga la ruta actual sin recargar toda la app
      const currentUrl = this.router.url;
      await this.router.navigate([currentUrl]);
      
    } catch (error) {
      console.warn('Error en recarga suave:', error);
      // Fallback: recargar solo si es necesario
      await this.safeHardReload();
    }
  }

  /**
   * Recarga específica de una ruta
   */
  async reloadRoute(route: string): Promise<void> {
    try {
      this.scrollToTop();
      await this.delay(100);
      await this.router.navigateByUrl('/', { skipLocationChange: true });
      await this.router.navigate([route]);
    } catch (error) {
      console.warn('Error recargando ruta:', error);
      await this.safeHardReload();
    }
  }

  /**
   * Recarga de último recurso (más segura que window.location.reload())
   */
  private async safeHardReload(): Promise<void> {
    try {
      // Pequeño delay antes del hard reload
      await this.delay(300);
      window.location.reload();
    } catch (error) {
      console.error('Error crítico en recarga:', error);
    }
  }

  // --- Métodos auxiliares ---
  
  private scrollToTop(): void {
    try {
      window.scrollTo({ top: 0, behavior: 'smooth' });
      // Soporte para Ionic
      const content = document.querySelector('ion-content');
      if (content) {
        (content as any).scrollToTop(500);
      }
    } catch (error) {
      // Silencioso, no es crítico
    }
  }

  private delay(ms: number): Promise<void> {
    return new Promise(resolve => setTimeout(resolve, ms));
  }
}