import { Component, OnInit } from '@angular/core';
import { ToastController } from '@ionic/angular';
import { Router } from '@angular/router';
import { AsesoresService } from 'src/app/services/asesores.service';
import { GeneralService } from 'src/app/services/general.service';

@Component({
  selector: 'app-perfil',
  templateUrl: './perfil.page.html',
  styleUrls: ['./perfil.page.scss'],
  standalone: false
})
export class PerfilPage implements OnInit {

  public isLoggedIn: boolean = false;
  public MyRole: string | null = null;

  cargando = false;
  error = false;

  asesor: any = null;

  constructor(
    private generalService: GeneralService,
    private asesoresService: AsesoresService,
    private toastCtrl: ToastController,
    private router: Router
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

  private getAsesorIdDesdeUser(user: any): string | null {
    if (!user) return null;

    // cubrimos varias formas comunes
    return (
      user?._id ||
      user?.id ||
      user?.userId ||
      user?.uid ||
      user?.asesor?._id ||
      user?.asesorId ||
      null
    );
  }

  cargarPerfil() {
    this.cargando = true;
    this.error = false;

    const token = this.generalService.obtenerToken();
    const user = this.getUserLocal();
    const id = this.getAsesorIdDesdeUser(user);

    if (!token || !id) {
      this.error = true;
      this.cargando = false;
      this.toast('No encontré tu sesión completa. Inicia sesión de nuevo.');
      return;
    }

    this.asesoresService.getAsesorById(id, token).subscribe({
      next: (res: any) => {
        this.asesor = res?.asesor || res || null;
        this.cargando = false;
      },
      error: () => {
        this.error = true;
        this.cargando = false;
        this.toast('No se pudo cargar tu perfil.');
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

  async toast(msg: string) {
    const t = await this.toastCtrl.create({
      message: msg,
      duration: 1800,
      position: 'top',
    });
    t.present();
  }

  async copiar(valor: string) {
    try {
      await navigator.clipboard.writeText(valor);
      this.toast('Copiado ✅');
    } catch {
      this.toast('No se pudo copiar');
    }
  }

  irEditar() {
    if (!this.asesor?._id) return;

    // ✅ usa la misma ruta que ya tienes para editar (ajústala si es otra)
    // Si en tu app editas por /asesores/editar/:id, déjalo así:
    this.router.navigate(['/asesores-edit', this.asesor._id]);

    // Si tu ruta es diferente, dime cuál y te lo dejo exacto.
  }
}
