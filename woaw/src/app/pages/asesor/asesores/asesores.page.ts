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
  modalEliminarOpen = false;
  asesorAEliminar: Asesor | null = null;
  inviteLink: string = '';
  inviteExpira: Date | null = null;
  generandoLink = false;

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
        console.log('✅ Asesores cargados:', this.asesores);
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

  private b64urlEncode(obj: any): string {
    const json = JSON.stringify(obj);
    const b64 = btoa(unescape(encodeURIComponent(json)));
    return b64.replace(/\+/g, '-').replace(/\//g, '_').replace(/=+$/g, '');
  }

  private randomNonce(len = 16): string {
    const chars = 'abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789';
    let out = '';
    for (let i = 0; i < len; i++) out += chars[Math.floor(Math.random() * chars.length)];
    return out;
  }

  private extraerMs(res: any): number | null {
    const cands = [
      res?.now,
      res?.timestamp,
      res?.ms,
      res?.fechaHoraServidor,      // ✅ ESTA ES LA BUENA
      res?.data?.fechaHoraServidor,
      res?.horaServidor,
      res?.fecha,
      res?.date,
      res?.data?.now,
      res?.data?.timestamp,
      res?.data?.ms,
      res?.data?.horaServidor,
      res?.data?.fecha,
      res?.data?.date,
    ];

    for (const c of cands) {
      if (!c) continue;
      if (typeof c === 'number') return c;
      if (typeof c === 'string') {
        const t = Date.parse(c);
        if (!Number.isNaN(t)) return t;
      }
    }
    return null;
  }


  generarLinkInvitacion() {
    if (!this.isAdmin) {
      this.toast('Solo el admin puede generar links.', 'danger');
      return;
    }
    if (this.generandoLink) return;

    this.generandoLink = true;
    this.asesoresService.getHoraServidor().subscribe({
      next: (res: any) => {
        const serverNow = this.extraerMs(res);

        if (!serverNow) {
          this.generandoLink = false;
          this.toast('No pude leer la hora del servidor.', 'danger');
          return;
        }

        const expOpen = serverNow + 15 * 60_000; // 15 min para abrir
        const expMax = serverNow + 45 * 60_000;  // cap duro 45 min desde generación
        const payload = {
          v: 1,
          purpose: 'asesor_register',
          nonce: this.randomNonce(22),
          iat: serverNow,
          expOpen,     // si no se abre antes de esto, muere
          expMax,      // límite máximo duro
          windowMin: 30
        };

        const invite = this.b64urlEncode(payload);
        const origin = window.location.origin || 'https://wo-aw.com';
        this.inviteLink = `${origin}/registro-asesor?invite=${invite}`;
        this.inviteExpira = new Date(expOpen);
        this.generandoLink = false;
        this.toast('Link generado (15 min). Al abrir: 30 min para registrarse.', 'success');
      },
      error: (err) => {
        console.error('❌ hora-servidor:', err);
        this.generandoLink = false;
        this.toast('No pude obtener la hora del servidor.', 'danger');
      }
    });
  }

  async copiarInvite() {
    if (!this.inviteLink) return;

    try {
      await navigator.clipboard.writeText(this.inviteLink);
      this.toast('Link copiado.', 'success');
    } catch {
      window.prompt('Copia el link:', this.inviteLink);
    }
  }

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
