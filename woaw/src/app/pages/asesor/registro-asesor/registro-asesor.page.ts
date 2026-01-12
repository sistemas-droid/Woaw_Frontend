import { Component, OnInit } from '@angular/core';
import { AsesoresService } from 'src/app/services/asesores.service';
import { ToastController } from '@ionic/angular';
import { Router } from '@angular/router';
import { HttpClient } from '@angular/common/http';

type Paso = 1 | 2 | 3;

@Component({
  selector: 'app-registro-asesor',
  templateUrl: './registro-asesor.page.html',
  styleUrls: ['./registro-asesor.page.scss'],
  standalone: false,
})
export class RegistroAsesorPage implements OnInit {

  form: any = {
    nombre: '',
    apellidos: '',
    email: '',
    lada: '+52',
    telefono: '',
    code: '',
    password: '',
    confirmPassword: '',
  };

  paso: Paso = 1;
  cargando = false;

  // ✅ LADAS
  paises: any[] = [];
  paisesFiltrados: any[] = [];
  mostrarModal = false;
  filtroPais = '';

  ladaSeleccionada = {
    codigo: '+52',
    bandera: 'mx',
  };

  constructor(
    private asesoresService: AsesoresService,
    private toastCtrl: ToastController,
    private router: Router,
    private http: HttpClient
  ) { }

  ngOnInit(): void {
    this.apiBanderas();
  }

  async toast(msg: string) {
    const t = await this.toastCtrl.create({
      message: msg,
      duration: 2000,
      position: 'top',
    });
    t.present();
  }

  private emailValido(email: string): boolean {
    return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test((email || '').trim());
  }

  private telefonoValido(tel: string): boolean {
    return String(tel || '').replace(/\D/g, '').length >= 10;
  }

  private passwordValida(pass: string): boolean {
    return (pass || '').trim().length >= 6;
  }

  get progress(): number {
    return this.paso / 3;
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
                bandera: this.getEmojiFlag(p.cca2),
                banderaUrl: `https://flagcdn.com/w40/${code}.png`,
              };
            })
            .sort((a, b) => a.nombre.localeCompare(b.nombre));

          this.paisesFiltrados = [...this.paises];

          // ✅ Asegurar que el form tenga la lada del selector
          this.form.lada = this.ladaSeleccionada.codigo;
        },
        error: () => {
          // fallback: no truena el flujo si falla API
          this.paises = [];
          this.paisesFiltrados = [];
        }
      });
  }

  getEmojiFlag(countryCode: string): string {
    return String(countryCode || '')
      .toUpperCase()
      .replace(/./g, (char) =>
        String.fromCodePoint(127397 + char.charCodeAt(0))
      );
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

    // ✅ sincroniza con tu form (lo que mandas al backend)
    this.form.lada = this.ladaSeleccionada.codigo;

    this.mostrarModal = false;
  }

  // =========================
  // --- PASO 1: enviar código ---
  // =========================
  enviarCodigo() {
    if (this.cargando) return;

    const nombre = (this.form.nombre || '').trim();
    const apellidos = (this.form.apellidos || '').trim();
    const email = (this.form.email || '').trim();
    const telefono = (this.form.telefono || '').trim();

    if (!nombre || !apellidos || !email || !telefono) {
      this.toast('Completa nombre, apellidos, correo y teléfono');
      return;
    }
    if (!this.emailValido(email)) {
      this.toast('Correo inválido');
      return;
    }
    if (!this.telefonoValido(telefono)) {
      this.toast('Teléfono inválido (mínimo 10 dígitos)');
      return;
    }

    this.cargando = true;

    this.asesoresService.preRegister({
      nombre,
      apellidos,
      email,
      lada: this.form.lada,
      telefono: this.form.telefono,
    }).subscribe({
      next: () => {
        this.cargando = false;
        this.paso = 2;
        this.toast('Te enviamos un código a tu correo');
      },
      error: (err) => {
        this.cargando = false;
        this.toast(err.error?.message || 'Error al enviar código');
      }
    });
  }

  // =========================
  // --- PASO 2: validar código ---
  // =========================
  validarCodigo() {
    if (this.cargando) return;

    const email = (this.form.email || '').trim();
    const code = (this.form.code || '').trim();

    if (!code) {
      this.toast('Ingresa el código');
      return;
    }

    this.cargando = true;

    this.asesoresService.verifyCode({ email, code }).subscribe({
      next: () => {
        this.cargando = false;
        this.paso = 3;
        this.toast('Código validado. Crea tu contraseña');
      },
      error: (err) => {
        this.cargando = false;
        this.toast(err.error?.message || 'Código inválido');
      }
    });
  }

  // =========================
  // --- PASO 3: crear cuenta ---
  // =========================
  crearCuenta() {
    if (this.cargando) return;

    const password = (this.form.password || '').trim();
    if (!this.passwordValida(password)) {
      this.toast('La contraseña debe tener mínimo 6 caracteres');
      return;
    }

    const confirm = (this.form.confirmPassword || '').trim();
    if (password !== confirm) {
      this.toast('Las contraseñas no coinciden');
      return;
    }

    this.cargando = true;

    this.asesoresService.register({
      nombre: (this.form.nombre || '').trim(),
      apellidos: (this.form.apellidos || '').trim(),
      email: (this.form.email || '').trim(),
      telefono: this.form.telefono,
      lada: this.form.lada,
      password,
    }).subscribe({
      next: (res) => {
        localStorage.setItem('token', res.token);
        localStorage.setItem('user', JSON.stringify(res.user));

        this.toast('Registro exitoso');

        setTimeout(() => {
          window.location.href = '/home';
        }, 300);
      },
      error: (err) => {
        this.cargando = false;
        this.toast(err.error?.message || 'Error al registrar');
      }
    });
  }

  // =========================
  // opcional: botón “atrás”
  // =========================
  volverPasoAnterior() {
    if (this.cargando) return;
    if (this.paso === 2) {
      this.paso = 1;
      this.form.code = '';
    } else if (this.paso === 3) {
      this.paso = 2;
      this.form.password = '';
    }
  }
}
