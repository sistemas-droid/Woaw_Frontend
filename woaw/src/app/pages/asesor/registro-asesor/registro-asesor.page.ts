import { Component } from '@angular/core';
import { AsesoresService } from 'src/app/services/asesores.service';
import { ToastController } from '@ionic/angular';
import { Router } from '@angular/router';

type Paso = 1 | 2 | 3;

@Component({
  selector: 'app-registro-asesor',
  templateUrl: './registro-asesor.page.html',
  styleUrls: ['./registro-asesor.page.scss'],
  standalone: false,
})
export class RegistroAsesorPage {
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

  constructor(
    private asesoresService: AsesoresService,
    private toastCtrl: ToastController,
    private router: Router
  ) { }

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
    // 1 -> 0.33, 2 -> 0.66, 3 -> 1
    return this.paso / 3;
  }

  // --- PASO 1: enviar código ---
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

  // --- PASO 2: validar código ---
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

  // --- PASO 3: crear cuenta ---
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
        // 🔐 guardar sesión
        localStorage.setItem('token', res.token);
        localStorage.setItem('user', JSON.stringify(res.user));

        this.toast('Registro exitoso');

        // 🔥 resetear app y entrar a home
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

  // opcional: botón “atrás”
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
