import { Component, OnInit } from '@angular/core';
import { Router } from '@angular/router';
import { AsesoresService } from 'src/app/services/asesores.service';
import { ToastController } from '@ionic/angular';

import * as Highcharts from 'highcharts';
import * as XLSX from 'xlsx';
import { saveAs } from 'file-saver';
import { GeneralService } from "../../../services/general.service";



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
  totalAsesores = 0;
  isAdmin = false;
  eliminandoId: string | null = null;
  modalEliminarOpen = false;
  asesorAEliminar: Asesor | null = null;
  inviteLink: string = '';
  inviteExpira: Date | null = null;
  generandoLink = false;
  asesoresCont: any[] = [];

  // Paginación
  pageSize = 5;
  paginaActual = 1;

  public graficaEstatus: boolean = false;
  private chart?: Highcharts.Chart;

  constructor(
    private asesoresService: AsesoresService,
    private router: Router,
    private generalService: GeneralService,
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

  // async toast(msg: string, color: 'success' | 'danger' | 'warning' | 'medium' = 'medium') {
  //   const t = await this.toastCtrl.create({
  //     message: msg,
  //     duration: 2000,
  //     position: 'top',
  //     color,
  //   });
  //   t.present();
  // }



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
        this.paginaActual = 1;
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
      this.generalService.alert('Ups!!', 'Solo el admin puede generar links', 'danger');
      return;
    }
    if (this.generandoLink) return;

    this.generandoLink = true;
    this.asesoresService.getHoraServidor().subscribe({
      next: (res: any) => {
        const serverNow = this.extraerMs(res);

        if (!serverNow) {
          this.generandoLink = false;
          this.generalService.alert('Ups!!', 'No pude leer la hora del servidor', 'danger');
          return;
        }

        const expOpen = serverNow + 15 * 60_000; // 15 min para abrir
        const expMax = serverNow + 45 * 60_000;  // cap duro 45 min desde generación
        const payload = {
          v: 1,
          purpose: 'asesor_register',
          nonce: this.randomNonce(22),
          iat: serverNow,
        };

        const invite = this.b64urlEncode(payload);
        const origin = window.location.origin || 'https://wo-aw.com';
        this.inviteLink = `${origin}/registro-asesor?invite=${invite}`;
        this.generandoLink = false;
        this.inviteExpira = null;
        this.generalService.alert('Listo!', 'Link generado', 'success');
      },
      error: (err) => {
        console.error('❌ hora-servidor:', err);
        this.generandoLink = false;
        this.generalService.alert('Ups!!', 'No pude obtener la hora del servidor', 'danger');
      }
    });
  }

  async copiarInvite() {
    if (!this.inviteLink) return;

    try {
      await navigator.clipboard.writeText(this.inviteLink);
      this.generalService.alert('Listo!', 'Link copiado', 'success');
    } catch {
      window.prompt('Copia el link:', this.inviteLink);
    }
  }

  confirmarEliminar(a: Asesor) {
    if (!this.isAdmin) {
      this.generalService.alert('Ups!!', 'Solo el admin puede eliminar asesores', 'danger');
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
      this.generalService.alert('Ups!!', 'No hay sesión', 'danger');
      return;
    }

    this.eliminandoId = id;
    this.asesoresService.deleteAsesor(id, token).subscribe({
      next: () => {
        this.asesores = this.asesores.filter(a => a._id !== id);
        this.eliminandoId = null;
        this.generalService.alert('Listo!', 'Asesor eliminado', 'success');
      },
      error: (err) => {
        console.error('❌ deleteAsesor:', err);
        this.eliminandoId = null;
        const msg = err?.error?.message || 'No se pudo eliminar.';
        this.generalService.alert('', msg, 'danger');
      }
    });
  }






  public regresarALista() {
    this.graficaEstatus = !this.graficaEstatus;
  }

  cargarAsesoresContador() {
    this.asesoresService.getAsesoresCont().subscribe({
      next: (res: any) => {
        this.asesoresCont = res?.asesores ?? [];
        this.totalAsesores = this.asesoresCont.length;
        if (this.graficaEstatus) {
          this.renderChartFromAsesores(this.asesoresCont);
        }
      },
      error: (err) => {
        console.error('❌ Error getAsesores:', err);
      }
    });
  }

  public generarGraficas() {
    this.graficaEstatus = !this.graficaEstatus;

    if (this.graficaEstatus) {
      setTimeout(() => this.cargarAsesoresContador(), 0);
    } else {
      this.chart?.destroy();
      this.chart = undefined;
    }
  }



  private renderChartFromAsesores(asesores: any[]) {
    const el = document.getElementById('chartAsesores');
    if (!el) return;

    const ordenados = [...asesores].sort((a, b) => (b?.contador ?? 0) - (a?.contador ?? 0));

    const categories = ordenados.map(a =>
      `${a?.nombre ?? ''} ${a?.apellidos ?? ''}`.trim() || a?.email || 'Sin nombre'
    );

    // 🎨 Paleta de 8 colores (puedes cambiarlos a tu gusto)
    const palette = [
      '#06bb06', '#ff3b30', '#007aff', '#ff9500',
      '#af52de', '#34c759', '#5ac8fa', '#ff2d55'
    ];

    // 🔒 hash simple para asignar color estable por nombre
    const hash = (s: string) => {
      let h = 0;
      for (let i = 0; i < s.length; i++) h = (h * 31 + s.charCodeAt(i)) >>> 0;
      return h;
    };

    const seriesData = ordenados.map(a => {
      const name = (`${a?.nombre ?? ''} ${a?.apellidos ?? ''}`.trim() || a?.email || 'Sin nombre');
      const y = Number(a?.contador ?? 0);
      const color = palette[hash(name) % palette.length];
      return { name, y, color };
    });

    this.chart?.destroy();

    const options: Highcharts.Options = {
      chart: { type: 'column', backgroundColor: 'transparent' },
      title: { text: undefined },
      credits: { enabled: false },
      legend: { enabled: false },

      xAxis: {
        categories,
        lineWidth: 0,
        tickLength: 0,
        labels: { style: { color: '#000000ff', fontSize: '11px' }, rotation: -45 }
      },

      yAxis: {
        min: 0,
        title: { text: undefined },
        gridLineColor: 'rgba(255,255,255,0.08)',
        labels: { style: { color: '#000000ff' } }
      },

      tooltip: {
        backgroundColor: '#b0b0b0ff',
        borderColor: 'rgba(162, 162, 162, 0.12)',
        style: { color: '#550101ff' },
        formatter: function (this: any) {
          return `<b>${this.key}</b><br/>Contador: <b>${this.y}</b>`;
        }
      },

      plotOptions: {
        column: {
          borderWidth: 0,
          borderRadius: 10 as any,
          pointPadding: 0.05,
          groupPadding: 0.15
        }
      },

      series: [
        {
          type: 'column',
          name: 'Contador',
          colorByPoint: true, // ✅ cada barra puede tener color
          data: seriesData as any
        }
      ]
    };

    this.chart = Highcharts.chart(el as any, options);
  }







  get totalPaginas(): number {
    return Math.max(1, Math.ceil(this.asesores.length / this.pageSize));
  }

  get asesoresPaginados(): Asesor[] {
    const start = (this.paginaActual - 1) * this.pageSize;
    return this.asesores.slice(start, start + this.pageSize);
  }

  get paginasVisibles(): number[] {
    // Ventanita de páginas tipo: 1 2 3 4 5 (centrado)
    const total = this.totalPaginas;
    const actual = this.paginaActual;
    const windowSize = 5;

    let start = Math.max(1, actual - Math.floor(windowSize / 2));
    let end = Math.min(total, start + windowSize - 1);

    // Ajuste si quedamos cortos al final
    start = Math.max(1, end - windowSize + 1);

    const pages: number[] = [];
    for (let p = start; p <= end; p++) pages.push(p);
    return pages;
  }


  goToPage(p: number) {
    if (p < 1 || p > this.totalPaginas) return;
    this.paginaActual = p;
  }

  nextPage() {
    if (this.paginaActual < this.totalPaginas) this.paginaActual++;
  }

  prevPage() {
    if (this.paginaActual > 1) this.paginaActual--;
  }

  // Útil: si borras un asesor y te quedas en una página vacía
  private ajustarPaginaSiSeSale() {
    const total = this.totalPaginas;
    if (this.paginaActual > total) this.paginaActual = total;
  }


  exportarExcel() {
    if (!this.asesores.length) {
      this.generalService.alert('', 'No hay asesores para exportaro', 'warning');
      return;
    }

    const data = this.asesores.map(a => ({
      Nombre: this.nombreCompleto(a),
      Rol: a.rol || 'Asesor Comercial',
      Teléfono: `${a.lada ?? ''}${a.telefono ?? ''}`.trim(),
      Email: a.email || ''
    }));

    const worksheet: XLSX.WorkSheet = XLSX.utils.json_to_sheet(data);
    const workbook: XLSX.WorkBook = {
      Sheets: { 'Asesores': worksheet },
      SheetNames: ['Asesores']
    };

    const excelBuffer = XLSX.write(workbook, {
      bookType: 'xlsx',
      type: 'array'
    });

    const blob = new Blob(
      [excelBuffer],
      { type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet' }
    );

    const fecha = new Date().toISOString().slice(0, 10);
    saveAs(blob, `asesores-${fecha}.xlsx`);
  }


}
