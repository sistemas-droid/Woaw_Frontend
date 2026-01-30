import { Component, OnInit, CUSTOM_ELEMENTS_SCHEMA } from "@angular/core";
import { CommonModule } from "@angular/common";
import { IonicModule, MenuController, AlertController, ModalController } from "@ionic/angular";
import { Router, RouterModule } from "@angular/router";
import { RegistroService } from "../../../services/registro.service";
import { GeneralService } from "../../../services/general.service";
import { AsesoresService } from 'src/app/services/asesores.service';
import {
  FormBuilder,
  FormGroup,
  Validators,
  ReactiveFormsModule,
} from "@angular/forms";

const WOAW_ASESOR_DATA_KEY = 'woaw_asesor_data';

@Component({
  selector: "app-perfil",
  templateUrl: "./perfil.component.html",
  styleUrls: ["./perfil.component.scss"],
  standalone: true,
  imports: [IonicModule, CommonModule, ReactiveFormsModule, RouterModule], // ⟵ agregado RouterModule
  schemas: [CUSTOM_ELEMENTS_SCHEMA],
})
export class PerfilComponent implements OnInit {
  usuario: any;
  fotoPerfil: string | null = null;
  formCambio: FormGroup;
  mostrarCambio: boolean = false;
  asesor: any = null;
  linkComision: string = '';

  public isLoggedIn: boolean = false;
  verActual: boolean = true;
  verNuevas: boolean = true;

  public MyRole: string | null = null;
  // public MyRole: 'admin' | 'lotero' | 'vendedor' | 'cliente' | 'asesor' | null = null;

  constructor(
    private modalCtrl: ModalController,
    private registroService: RegistroService,
    private generalService: GeneralService,
    private fb: FormBuilder,
    private alertCtrl: AlertController,
    private router: Router,
    private asesoresService: AsesoresService
  ) {
    this.formCambio = this.fb.group({
      password: ["", [Validators.required]],
      newPassword: ["", [Validators.required, this.validarPassword]],
      newPasswordconf: ["", [Validators.required]],
    });

    this.generalService.tokenExistente$.subscribe((estado) => {
      this.isLoggedIn = estado;
    });
  }

  ngOnInit() {
    const storage = localStorage.getItem("user");
    if (storage) {
      try {
        this.usuario = JSON.parse(storage);
        this.fotoPerfil = this.getFotoFromUser(this.usuario);

        // Si no hay imagen personalizada
        if (!this.fotoPerfil || this.fotoPerfil.trim() === "") {
          const nombre = this.usuario?.nombre?.trim().toLowerCase() || "";

          // Detecta automáticamente si es nombre femenino
          const esMujer =
            nombre.endsWith("a") ||
            nombre.endsWith("ia") ||
            nombre.endsWith("na") ||
            nombre.endsWith("ra") ||
            nombre.endsWith("ta") ||
            nombre.endsWith("sa") ||
            nombre.endsWith("la") ||
            nombre.endsWith("za");

          this.fotoPerfil = esMujer
            ? "assets/icon/woalf2.png"
            : "assets/icon/woalf1.png";
        }
      } catch {
        this.usuario = null;
        this.fotoPerfil = "assets/icon/woalf.png";
      }
    } else {
      this.fotoPerfil = "assets/icon/woalf1.png";
    }

    this.obtenerAsesor();

    this.generalService.tipoRol$.subscribe((rol) => {
      this.MyRole = rol;
    });
    this.cargarPerfil()
  }

  // ⟵ NUEVO: usar en (click) del ion-card de "Eliminar cuenta"
  // async goEliminarCuenta() {
  //   try {
  //     // Si el modal está abierto, lo cerramos con pequeña espera
  //     await this.modalCtrl.dismiss();
  //     setTimeout(() => {
  //       this.router.navigateByUrl("/eliminacion-cuenta");
  //     }, 150); // 🔹 pequeño delay para transición limpia
  //   } catch (err) {
  //     // Si no hay modal, igual navega
  //     this.router.navigateByUrl("/eliminacion-cuenta");
  //   }
  // }


  private getUserLocal(): any | null {
    const raw = localStorage.getItem('user');
    if (!raw) return null;
    try { return JSON.parse(raw); } catch { return null; }
  }


  cargarPerfil() {
    const user = this.getUserLocal();

    this.asesoresService.getAsesorById(user._id).subscribe({
      next: (res: any) => {
        this.asesor = res?.asesor;
        const code = this.asesor?.asesorUid;
        this.linkComision = code ? this.buildLinkComision(code) : '';
      },
      error: () => {
      }
    });
  }

  async copiar(valor: string) {
    try {
      await navigator.clipboard.writeText(valor);
      this.generalService.alert('Copiado', 'Link copiado correctamente', 'success');
    } catch {
      this.generalService.alert('error','No se pudo copiar', 'danger');
    }
  }

  private buildLinkComision(code: string): string {
    const base = this.buildBaseUrl();
    return `${base}/home?code=${encodeURIComponent(code)}`;
  }

  private buildBaseUrl(): string {
    const origin = window?.location?.origin || '';
    return origin.includes('http') ? origin : 'https://woaw.mx';
  }

  obtenerAsesor() {
    const data = localStorage.getItem(WOAW_ASESOR_DATA_KEY);
    if (data) {
      try {
        this.asesor = JSON.parse(data);
        // console.log(this.asesor)
      } catch {
        this.asesor = null;
      }
    }
  }

  private getFotoFromUser(u: any): string | null {
    const candidatos: any[] = [
      u?.foto, u?.picture, u?.photoURL, u?.photoUrl, u?.image, u?.imageUrl,
      u?.avatar, u?.avatarUrl, u?.profilePic, u?.profile_picture, u?.profilePhoto,
      u?._json?.picture, u?._json?.image,
      u?.providerData?.[0]?.photoURL, u?.datosGoogle?.picture
    ].filter(Boolean);

    if (!candidatos.length) return null;

    const urlHttp = candidatos.find((v: any) => /^https?:\/\//i.test(String(v)));
    const url = (urlHttp || String(candidatos[0])).toString().trim();
    return url || null;
  }

  cerrarModal() {
    this.modalCtrl.dismiss();
  }

  async cambiarPassword() {
    if (this.formCambio.invalid) return;

    await this.generalService.loading("Actualizando contraseña...");

    const { password, newPassword, newPasswordconf } = this.formCambio.value;

    if (newPassword !== newPasswordconf) {
      await this.generalService.loadingDismiss();
      return this.generalService.alert(
        "Error",
        "La nueva contraseña y su confirmación no coinciden.",
        "danger"
      );
    }

    const data = { password, newPassword };

    this.registroService.cambiarPassword(data).subscribe({
      next: async () => {
        this.formCambio.reset();
        this.mostrarCambio = false;
        await this.generalService.loadingDismiss();
        await this.generalService.alert(
          "Contraseña actualizada",
          "Tu contraseña ha sido cambiada exitosamente.",
          "success"
        );
      },
      error: async (err) => {
        await this.generalService.loadingDismiss();
        const mensaje =
          err?.error?.message ||
          "No se pudo cambiar la contraseña. Intenta más tarde.";
        await this.generalService.alert("Error", mensaje, "danger");
      },
      complete: () => {
        this.generalService.loadingDismiss();
      },
    });
  }

  validarPassword(control: any) {
    const valor = control.value;
    if (!valor) return null;

    const regex = /^(?=.*[A-Z])(?=.*\d)(?=.*[!@#$%^&*()\[\]{}\-_=+¿?¡.,;:<>|/~`°¨^\\@_])[\w\WñÑáéíóúÁÉÍÓÚ]{8,}$/;

    return regex.test(valor)
      ? null
      : {
        passwordInvalida: {
          mensaje:
            "Debe tener mínimo 6 caracteres, una mayúscula, un número y un carácter especial.",
        },
      };
  }
}
