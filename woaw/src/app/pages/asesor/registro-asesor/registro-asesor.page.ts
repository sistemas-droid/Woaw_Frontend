import { Component, OnInit } from '@angular/core';
import { AsesoresService } from 'src/app/services/asesores.service';
import { ToastController } from '@ionic/angular';
import { Router, ActivatedRoute } from '@angular/router';
import { HttpClient } from '@angular/common/http';
import { GeneralService } from '../../../services/general.service';
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
  paises: any[] = [];
  paisesFiltrados: any[] = [];
  mostrarModal = false;
  filtroPais = '';
  ladaSeleccionada = {
    codigo: '+52',
    bandera: 'mx',
  };
  inviteToken: string | null = null;
  invitePayload: any | null = null;
  bloqueado = true;
  motivoBloqueo = 'Validando invitación...';
  serverNowMs: number | null = null;
  openedAtMs: number | null = null;
  registerDeadlineMs: number | null = null;
  usedKey: string | null = null;
  verPassword = false;
  verConfirmPassword = false;

  constructor(
    private asesoresService: AsesoresService,
    private toastCtrl: ToastController,
    private router: Router,
    private http: HttpClient,
    private route: ActivatedRoute,
    private generalService: GeneralService,
  ) { }

  ngOnInit(): void {
    this.apiBanderas();
    this.initInviteFlow();
  }

  async toast(msg: string) {
    const t = await this.toastCtrl.create({
      message: msg,
      duration: 2200,
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

  private extraerMs(res: any): number | null {
    const cands = [
      res?.fechaHoraServidor,      // ✅ tu backend real
      res?.data?.fechaHoraServidor,
      res?.now, res?.timestamp, res?.ms,
      res?.data?.now, res?.data?.timestamp, res?.data?.ms,
      res?.horaServidor, res?.fecha, res?.date,
      res?.data?.horaServidor, res?.data?.fecha, res?.data?.date,
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

  private fetchServerNow(): Promise<number> {
    return new Promise((resolve, reject) => {
      this.asesoresService.getHoraServidor().subscribe({
        next: (res: any) => {
          const ms = this.extraerMs(res);
          if (!ms) return reject(new Error('No pude leer hora servidor'));
          this.serverNowMs = ms;
          resolve(ms);
        },
        error: () => reject(new Error('No pude obtener hora servidor'))
      });
    });
  }

  private b64urlDecode(invite: string): any | null {
    try {
      const b64 = invite.replace(/-/g, '+').replace(/_/g, '/');
      const pad = '='.repeat((4 - (b64.length % 4)) % 4);
      const json = decodeURIComponent(escape(atob(b64 + pad)));
      return JSON.parse(json);
    } catch {
      return null;
    }
  }

  private getSessionKey(nonce: string) {
    return `woaw_invite_opened_${nonce}`;
  }
  private getUsedKey(nonce: string) {
    return `woaw_invite_used_${nonce}`;
  }

  private async initInviteFlow() {
    this.inviteToken = this.route.snapshot.queryParamMap.get('invite');

    if (!this.inviteToken) {
      this.bloqueado = true;
      this.motivoBloqueo = 'Este registro requiere un link de invitación.';
      this.generalService.alert(
        'Invitación requerida',
        this.motivoBloqueo,
        'warning'
      );
      return;
    }

    const payload = this.b64urlDecode(this.inviteToken);

    if (!payload || payload?.purpose !== 'asesor_register' || !payload?.nonce) {
      this.bloqueado = true;
      this.motivoBloqueo = 'Link inválido.';
      this.generalService.alert(
        'Link inválido',
        this.motivoBloqueo,
        'danger'
      );
      return;
    }


    this.invitePayload = payload;
    this.usedKey = this.getUsedKey(payload.nonce);

    if (localStorage.getItem(this.usedKey) === '1') {
      this.bloqueado = true;
      this.motivoBloqueo = 'Este link ya fue usado.';
      this.generalService.alert(
        'Link usado',
        this.motivoBloqueo,
        'warning'
      );
      return;
    }

    try {
      const now = await this.fetchServerNow();

      // if (now > Number(payload.expOpen)) {
      //   this.bloqueado = true;
      //   this.motivoBloqueo = 'Link expirado. Pídele al admin uno nuevo.';
      //   this.toast(this.motivoBloqueo);
      //   return;
      // }

      const openedKey = this.getSessionKey(payload.nonce);
      const storedOpened = sessionStorage.getItem(openedKey);

      if (storedOpened) {
        this.openedAtMs = Number(storedOpened);
      } else {
        this.openedAtMs = now;
        sessionStorage.setItem(openedKey, String(now));
      }

      const windowMin = Number(payload.windowMin || 30);
      const deadline = this.openedAtMs + windowMin * 60_000;
      // this.registerDeadlineMs = Math.min(deadline, Number(payload.expMax));
      this.registerDeadlineMs = null;

      // if (now > this.registerDeadlineMs) {
      //   this.bloqueado = true;
      //   this.motivoBloqueo = 'Se acabó tu ventana de registro (30 min). Pide un link nuevo.';
      //   this.toast(this.motivoBloqueo);
      //   return;
      // }

      this.bloqueado = false;
      this.motivoBloqueo = '';
    } catch (e: any) {
      this.bloqueado = true;
      this.motivoBloqueo = 'No pude validar el link (hora del servidor).';
      this.generalService.alert(
        'Error de validación',
        this.motivoBloqueo,
        'danger'
      );
    }
  }

  private async asegurarNoExpirado(): Promise<boolean> {
    if (!this.invitePayload || !this.invitePayload.nonce) {
      this.bloqueado = true;
      this.motivoBloqueo = 'Link inválido.';
      return false;
    }

    const usedKey = this.getUsedKey(this.invitePayload.nonce);
    if (localStorage.getItem(usedKey) === '1') {
      this.bloqueado = true;
      this.motivoBloqueo = 'Este link ya fue usado.';
      this.generalService.alert(
        'Link usado',
        this.motivoBloqueo,
        'warning'
      );
      return false;
    }

    try {
      const now = await this.fetchServerNow();

      if (!this.registerDeadlineMs) {
        const openedKey = this.getSessionKey(this.invitePayload.nonce);
        const storedOpened = sessionStorage.getItem(openedKey);
        const openedAt = storedOpened ? Number(storedOpened) : now;
        const deadline = openedAt + 30 * 60_000;
        // this.registerDeadlineMs = Math.min(deadline, Number(this.invitePayload.expMax));
        this.registerDeadlineMs = null;
      }

      // if (now > this.registerDeadlineMs) {
      //   this.bloqueado = true;
      //   this.motivoBloqueo = 'Se acabó tu ventana de registro. Pide un link nuevo.';
      //   this.toast(this.motivoBloqueo);
      //   return false;
      // }

      this.bloqueado = false;
      this.motivoBloqueo = '';
      return true;

    } catch {
      this.bloqueado = true;
      this.motivoBloqueo = 'No pude validar el tiempo del link.';
      this.generalService.alert(
        'Error de validación',
        this.motivoBloqueo,
        'danger'
      );
      return false;
    }
  }

  private marcarUsadoLocal() {
    if (!this.invitePayload?.nonce) return;
    const usedKey = this.getUsedKey(this.invitePayload.nonce);
    localStorage.setItem(usedKey, '1');
  }

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
          this.form.lada = this.ladaSeleccionada.codigo;
        },
        error: () => {
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
    if (this.bloqueado) return;
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

    this.form.lada = this.ladaSeleccionada.codigo;
    this.mostrarModal = false;
  }

  async enviarCodigo() {
    if (this.cargando) return;
    if (!(await this.asegurarNoExpirado())) return;

    const nombre = (this.form.nombre || '').trim();
    const apellidos = (this.form.apellidos || '').trim();
    const email = (this.form.email || '').trim();
    const telefono = (this.form.telefono || '').trim();

    if (!nombre || !apellidos || !email || !telefono) {
      this.generalService.alert(
        'Datos incompletos',
        'Completa nombre, apellidos, correo y teléfono.',
        'warning'
      );
      return;
    }
    if (!this.emailValido(email)) {
      this.generalService.alert(
        'Correo inválido',
        'Ingresa un correo con formato válido.',
        'warning'
      );
      return;
    }
    if (!this.telefonoValido(telefono)) {
      this.generalService.alert(
        'Teléfono inválido',
        'El teléfono debe tener mínimo 10 dígitos.',
        'warning'
      );
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
        this.generalService.alert(
          'Código enviado',
          'Te enviamos un código a tu correo.',
          'success'
        );
      },
      error: (err) => {
        this.cargando = false;
        this.generalService.alert(
          'Error',
          err.error?.message || 'Error al enviar código.',
          'danger'
        );
      }
    });
  }

  async validarCodigo() {
    if (this.cargando) return;
    if (!(await this.asegurarNoExpirado())) return;

    const email = (this.form.email || '').trim();
    const code = (this.form.code || '').trim();

    if (!code) {
      this.generalService.alert(
        'Código requerido',
        'Ingresa el código de verificación.',
        'warning'
      );
      return;
    }

    this.cargando = true;
    this.asesoresService.verifyCode({ email, code }).subscribe({
      next: () => {
        this.cargando = false;
        this.paso = 3;
        this.generalService.alert(
          'Código validado',
          'Código validado. Crea tu contraseña.',
          'success'
        );
      },
      error: (err) => {
        this.cargando = false;
        this.generalService.alert(
          'Código inválido',
          err.error?.message || 'Código inválido.',
          'danger'
        );
      }
    });
  }

  async crearCuenta() {
    if (this.cargando) return;
    if (!(await this.asegurarNoExpirado())) return;

    const password = (this.form.password || '').trim();
    if (!this.passwordValida(password)) {
      this.generalService.alert(
        'Contraseña inválida',
        'La contraseña debe tener mínimo 6 caracteres.',
        'warning'
      );
      return;
    }

    const confirm = (this.form.confirmPassword || '').trim();
    if (password !== confirm) {
      this.generalService.alert(
        'Contraseñas no coinciden',
        'Asegúrate de que ambas contraseñas sean iguales.',
        'warning'
      );
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
        this.generalService.guardarCredenciales(res.token, res.user);
        this.marcarUsadoLocal();
      },
      error: (err) => {
        this.cargando = false;
        this.generalService.alert(
          'Registro fallido',
          err.error?.message || 'Error al registrar.',
          'danger'
        );
      }
    });
  }

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

  togglePassword() {
    this.verPassword = !this.verPassword;
  }

  toggleConfirmPassword() {
    this.verConfirmPassword = !this.verConfirmPassword;
  }

  get mostrarAyudaPassword(): boolean {
    return (this.form.password || '').length > 0;
  }

}
