import { Component, OnInit } from '@angular/core';
import { Router } from '@angular/router';
import { AsesoresService } from 'src/app/services/asesores.service';
import { ToastController } from '@ionic/angular';

interface Asesor {
  _id: string;
  asesorUid?: string | null;
  nombre: string;
  apellidos: string;
  rol?: string;
  telefono?: string;
  email?: string;
  lada?: string;
  foto?: string | null;
  fotoPerfil?: string | null;
}

@Component({
  selector: 'app-asesores',
  templateUrl: './asesores.page.html',
  styleUrls: ['./asesores.page.scss'],
  standalone: false,
})
export class AsesoresPage implements OnInit {

  asesores: Asesor[] = [];
  cargando = true;
  error = false;

  isAdmin = false;
  eliminandoId: string | null = null;

  // ✅ Modal eliminar (HTML)
  modalEliminarOpen = false;
  asesorAEliminar: Asesor | null = null;

  constructor(
    private asesoresService: AsesoresService,
    private router: Router,
    private toastCtrl: ToastController
  ) { }

  ngOnInit() {
    this.detectarAdmin();
    this.cargarAsesores();
  }

  private safeParse(raw: string | null): any {
    try { return raw ? JSON.parse(raw) : null; } catch { return null; }
  }

  private detectarAdmin() {
    const user = this.safeParse(localStorage.getItem('user'));
    const rol = (user?.role || user?.rol || user?.perfil?.rol || '').toString().toLowerCase();
    this.isAdmin = rol === 'admin' || rol === 'superadmin';
  }

  async toast(msg: string, color: 'success' | 'danger' | 'warning' | 'medium' = 'medium') {
    const t = await this.toastCtrl.create({
      message: msg,
      duration: 2000,
      position: 'top',
      color,
    });
    t.present();
  }

  cargarAsesores() {
    this.cargando = true;
    this.error = false;

    const token = localStorage.getItem('token');
    if (!token) {
      this.error = true;
      this.cargando = false;
      return;
    }

    this.asesoresService.getAsesores(token).subscribe({
      next: (res: any) => {
        const lista: Asesor[] = res?.asesores ?? [];
        this.asesores = lista;
        this.cargando = false;
      },
      error: (err) => {
        console.error('❌ Error getAsesores:', err);
        this.error = true;
        this.cargando = false;
      }
    });
  }

  nombreCompleto(a: Asesor): string {
    return `${a?.nombre || ''} ${a?.apellidos || ''}`.trim();
  }

  getIniciales(nombre: string = ''): string {
    if (!nombre) return '';
    const partes = nombre.trim().split(' ').filter(Boolean);
    return partes.slice(0, 2).map(p => p.charAt(0).toUpperCase()).join('');
  }

  abrirLink(telefono?: string) {
    if (!telefono) return;
    window.open(`https://wa.me/52${telefono}`, '_blank');
  }

  editarAsesor(a: Asesor) {
    if (!a?._id) return;
    this.router.navigate(['/asesores-edit', a._id]);
  }

  // ==========================
  // ✅ ELIMINAR (MODAL EN HTML)
  // ==========================
  confirmarEliminar(a: Asesor) {
    if (!this.isAdmin) {
      this.toast('Solo el admin puede eliminar asesores.', 'danger');
      return;
    }
    if (!a?._id) return;

    this.asesorAEliminar = a;
    this.modalEliminarOpen = true;
  }

  cerrarModalEliminar() {
    this.modalEliminarOpen = false;
    this.asesorAEliminar = null;
  }

  confirmarEliminarModal() {
    const id = this.asesorAEliminar?._id;
    if (!id) return;

    this.cerrarModalEliminar();
    this.eliminarAsesor(id);
  }

  eliminarAsesor(id: string) {
    const token = localStorage.getItem('token');
    if (!token) {
      this.toast('No hay sesión.', 'danger');
      return;
    }

    this.eliminandoId = id;

    this.asesoresService.deleteAsesor(id, token).subscribe({
      next: () => {
        this.asesores = this.asesores.filter(a => a._id !== id);
        this.eliminandoId = null;
        this.toast('Asesor eliminado.', 'success');
      },
      error: (err) => {
        console.error('❌ deleteAsesor:', err);
        this.eliminandoId = null;
        const msg = err?.error?.message || 'No se pudo eliminar.';
        this.toast(msg, 'danger');
      }
    });
  }
}
