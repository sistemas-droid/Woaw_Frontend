import { Component, OnInit } from '@angular/core';
import { Router } from '@angular/router';
import { AsesoresService } from 'src/app/services/asesores.service';
import { GeneralService } from 'src/app/services/general.service';
import { PdfFlyerService } from 'src/app/services/pdf-flyer.service';

@Component({
  selector: 'app-perfil',
  templateUrl: './perfil.page.html',
  styleUrls: ['./perfil.page.scss'],
  standalone: false
})
export class PerfilPage implements OnInit {

  public isLoggedIn: boolean = false;
  public MyRole: string | null = null;
  linkComision: string = '';
  cargando = false;
  error = false;
  generandoPdf = false;
  asesor: any = null;

  constructor(
    private generalService: GeneralService,
    private asesoresService: AsesoresService,
    private router: Router,
    private pdfFlyer: PdfFlyerService

  ) { }

  ngOnInit() {
    this.generalService.tokenExistente$.subscribe((estado) => {
      this.isLoggedIn = estado;
    });

    this.generalService.tipoRol$.subscribe((rol) => {
      this.MyRole = rol;
    });

    this.cargarPerfil();
  }

  private getUserLocal(): any | null {
    const raw = localStorage.getItem('user');
    if (!raw) return null;
    try { return JSON.parse(raw); } catch { return null; }
  }

  private buildBaseUrl(): string {
    const origin = window?.location?.origin || '';
    return origin.includes('http') ? origin : 'https://woaw.mx';
  }

  private buildLinkComision(code: string): string {
    const base = this.buildBaseUrl();
    return `${base}/home?code=${encodeURIComponent(code)}`;
  }

  cargarPerfil() {
    this.cargando = true;
    this.error = false;

    const user = this.getUserLocal();

    this.asesoresService.getAsesorById(user._id).subscribe({
      next: (res: any) => {
        this.asesor = res?.asesor || res || null;
        const code = this.asesor?.asesorUid;
        this.linkComision = code ? this.buildLinkComision(code) : '';
        this.cargando = false;
      },
      error: () => {
        this.error = true;
        this.cargando = false;
        this.generalService.alert('No se pudo cargar tu perfil.', 
          'Intenta de nuevo más tarde.',
          'danger');
      }
    });
  }

  nombreCompleto(a: any) {
    const n = (a?.nombre || '').trim();
    const ap = (a?.apellidos || '').trim();
    return `${n} ${ap}`.trim() || 'Asesor';
  }

  getIniciales(nombre: string) {
    const parts = (nombre || '').split(' ').filter(Boolean);
    const a = parts[0]?.[0] || '';
    const b = parts[1]?.[0] || '';
    return (a + b).toUpperCase() || 'A';
  }

  async copiar(valor: string) {
    try {
      await navigator.clipboard.writeText(valor);
      this.generalService.alert('Copiado ✅', 
        'El enlace de comisión ha sido copiado al portapapeles.',
        'success',);
    } catch (e) {
      this.generalService.alert('No se pudo copiar', 
        'Intenta de nuevo más tarde.',
        'danger',);
    }
  }

  irEditar() {
    if (!this.asesor?._id) return;

    // ✅ usa la misma ruta que ya tienes para editar (ajústala si es otra)
    // Si en tu app editas por /asesores/editar/:id, déjalo así:
    this.router.navigate(['/asesores-edit', this.asesor._id]);

    // Si tu ruta es diferente, dime cuál y te lo dejo exacto.
  }

  async descargarFlyer() {
    if (!this.asesor?._id || this.generandoPdf) return;
    this.generandoPdf = true;

    const flyers = [
      '/assets/flyers/IMAGEN_1.png',
      '/assets/flyers/IMAGEN_2.png',
    ];

    const plantillaUrl = flyers[Math.floor(Math.random() * flyers.length)];

    try {
      await this.pdfFlyer.generarFlyer({
        asesor: this.asesor,
        telefono: this.asesor?.telefono || '',
        linkComision: this.linkComision,
        plantillaUrl,
        logoUrl: '/assets/icon/LOGO-CROMADO.png',
        nombreArchivo: this.nombreCompleto(this.asesor),
      });

      this.generalService.alert('PDF listo',
        'El flyer ha sido generado correctamente.',
        'success',
      );
    } catch (e) {
      console.error(e);
      this.generalService.alert('No se pudo generar el PDF',
        'Intenta de nuevo más tarde.',
        'danger',
      );
    } finally {
      this.generandoPdf = false;
    }
  }

}
