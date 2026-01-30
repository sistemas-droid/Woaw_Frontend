import { Component, OnInit } from '@angular/core';
import { ActivatedRoute, Router } from '@angular/router';
import { ToastController, LoadingController } from '@ionic/angular';
import { AsesoresService } from 'src/app/services/asesores.service';
import { HttpClient } from '@angular/common/http';

@Component({
  selector: 'app-asesores-edit',
  templateUrl: './asesores-edit.page.html',
  styleUrls: ['./asesores-edit.page.scss'],
  standalone: false,
})
export class AsesoresEditPage implements OnInit {

  asesorId: any = null;

  cargando = true;
  guardando = false;
  error = false;

  // 👇 Form model
  form = {
    nombre: '',
    apellidos: '',
    lada: '+52',
    telefono: '',
    foto: '', // url/base64 si quieres
  };

  // ✅ LADAS
  paises: any[] = [];
  paisesFiltrados: any[] = [];
  mostrarModal = false;
  filtroPais = '';

  ladaSeleccionada = {
    codigo: '+52',
    bandera: 'mx',
  };

  // Para mostrar iniciales/preview
  get nombreCompleto(): string {
    return `${this.form.nombre} ${this.form.apellidos}`.trim();
  }

  constructor(
    private route: ActivatedRoute,
    private router: Router,
    private asesoresService: AsesoresService,
    private toastCtrl: ToastController,
    private loadingCtrl: LoadingController,
    private http: HttpClient
  ) { }

  ngOnInit() {
    // Ruta puede venir como /asesores-edit/:id
    this.asesorId = this.route.snapshot.paramMap.get('id');

    // Si no viene id, asumimos "mi perfil" y lo sacas del localStorage
    if (!this.asesorId) {
      const user = this.safeParse(localStorage.getItem('user'));
      this.asesorId = user?._id || user?.id || null;
    }

    this.apiBanderas();
    this.cargarAsesor();
  }

  private safeParse(raw: string | null): any {
    try { return raw ? JSON.parse(raw) : null; } catch { return null; }
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

  // =========================
  // ✅ LADAS / PAISES
  // =========================
  apiBanderas() {
    this.http
      .get<any[]>(
        'https://restcountries.com/v3.1/all?fields=idd,flags,name,cca2'
      )
      .subscribe({
        next: (data) => {
          this.paises = (data || [])
            .filter((p) => p.idd && p.idd.root)
            .map((p) => {
              const code = String(p.cca2 || '').toLowerCase();
              return {
                nombre: p.name?.common || 'Sin nombre',
                codigo: `${p.idd.root}${p.idd.suffixes?.[0] || ''}`,
                banderaUrl: `https://flagcdn.com/w40/${code}.png`,
              };
            })
            .sort((a, b) => a.nombre.localeCompare(b.nombre));

          this.paisesFiltrados = [...this.paises];
        },
        error: () => {
          this.paises = [];
          this.paisesFiltrados = [];
        }
      });
  }

  abrirModalLadas() {
    this.mostrarModal = true;
    this.filtroPais = '';
    this.paisesFiltrados = [...this.paises];
  }

  cerrarModal() {
    this.mostrarModal = false;
  }

  filtrarPaises() {
    const q = (this.filtroPais || '').toLowerCase().trim();
    if (!q) {
      this.paisesFiltrados = [...this.paises];
      return;
    }
    this.paisesFiltrados = this.paises.filter((p) => {
      const nombre = String(p.nombre || '').toLowerCase();
      const codigo = String(p.codigo || '').toLowerCase();
      return nombre.includes(q) || codigo.includes(q);
    });
  }

  seleccionarLada(pais: any) {
    const banderaCode =
      pais?.banderaUrl?.split('/').pop()?.split('.')[0] || 'mx';

    this.ladaSeleccionada = {
      codigo: pais.codigo,
      bandera: banderaCode,
    };

    // ✅ sincroniza con el form
    this.form.lada = this.ladaSeleccionada.codigo;

    this.mostrarModal = false;
  }

  cargarAsesor() {
    this.cargando = true;
    this.error = false;

    this.asesoresService.getAsesorById(this.asesorId).subscribe({
      next: (res: any) => {
        const a = res?.asesor || res?.data || res;

        this.form.nombre = a?.nombre || '';
        this.form.apellidos = a?.apellidos || '';
        this.form.lada = a?.lada || '+52';
        this.form.telefono = a?.telefono || '';
        this.form.foto = a?.foto || a?.foto || '';

        // ✅ al cargar perfil, reflejarlo también en el selector con bandera
        this.setLadaDesdeValor(this.form.lada);

        this.cargando = false;
      },
      error: (err) => {
        console.error('❌ getAsesorById:', err);
        this.error = true;
        this.cargando = false;
        this.toast('No se pudo cargar el perfil.', 'danger');
      }
    });
  }

  // ✅ intenta resolver la bandera según la lada que traiga el asesor
  private setLadaDesdeValor(lada: string) {
    // Si ya tenemos paises cargados, buscamos coincidencia exacta
    const found = this.paises.find(p => String(p.codigo) === String(lada));
    if (found) {
      const banderaCode = found.banderaUrl?.split('/').pop()?.split('.')[0] || 'mx';
      this.ladaSeleccionada = { codigo: found.codigo, bandera: banderaCode };
      this.form.lada = found.codigo;
      return;
    }

    // fallback: si no encuentra, deja el valor pero bandera default
    this.ladaSeleccionada = { codigo: lada || '+52', bandera: 'mx' };
  }

  getIniciales(nombre: string = ''): string {
    const partes = (nombre || '').trim().split(' ').filter(Boolean);
    return partes.slice(0, 2).map(p => p.charAt(0).toUpperCase()).join('') || 'A';
  }

  validar(): string | null {
    if (!this.form.nombre.trim()) return 'Pon el nombre.';
    if (!this.form.apellidos.trim()) return 'Pon los apellidos.';
    if (this.form.telefono && this.form.telefono.replace(/\D/g, '').length < 10) return 'El teléfono se ve incompleto.';
    return null;
  }

  async guardar() {
    const token = localStorage.getItem('token');
    if (!token || !this.asesorId) {
      this.toast('No hay sesión o asesor inválido.', 'danger');
      return;
    }

    const err = this.validar();
    if (err) {
      this.toast(err, 'warning');
      return;
    }

    this.guardando = true;
    const loading = await this.loadingCtrl.create({ message: 'Guardando cambios…' });
    await loading.present();

    const payload: any = {
      nombre: this.form.nombre.trim(),
      apellidos: this.form.apellidos.trim(),
      lada: this.form.lada,
      telefono: this.form.telefono?.trim() || '',
      foto: this.form.foto?.trim() || '',
    };

    this.asesoresService.updateAsesor(this.asesorId, payload, token).subscribe({
      next: (res) => {
        console.log('✅ updateAsesor:', res);
        this.toast('Perfil actualizado 🔥', 'success');
        this.guardando = false;
        loading.dismiss();

        this.router.navigateByUrl('/asesores'); // ajusta
      },
      error: (e) => {
        console.error('❌ updateAsesor error:', e);
        this.toast('No se pudo guardar.', 'danger');
        this.guardando = false;
        loading.dismiss();
      }
    });
  }

  cancelar() {
    this.router.navigateByUrl('/asesores'); // ajusta
  }

  async onFotoSelected(ev: Event) {
    const input = ev.target as HTMLInputElement;
    const file = input.files?.[0];
    if (!file) return;

    const allowed = ['image/jpeg', 'image/png', 'image/webp'];
    if (!allowed.includes(file.type)) {
      this.toast('Formato no válido. Usa JPG/PNG/WEBP.', 'warning');
      input.value = '';
      return;
    }

    const maxBytes = 2 * 1024 * 1024;
    if (file.size > maxBytes) {
      this.toast('La imagen pesa mucho. Máx 2MB recomendado.', 'warning');
      input.value = '';
      return;
    }

    try {
      const base64 = await this.fileToBase64(file);
      this.form.foto = base64;
    } catch (e) {
      console.error(e);
      this.toast('No se pudo leer la imagen.', 'danger');
    }
  }

  limpiarFoto() {
    this.form.foto = '';
  }

  private fileToBase64(file: File): Promise<string> {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.onload = () => resolve(String(reader.result));
      reader.onerror = reject;
      reader.readAsDataURL(file);
    });
  }
}
