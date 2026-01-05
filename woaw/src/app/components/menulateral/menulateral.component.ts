import { Component, OnInit, OnDestroy, NgZone } from "@angular/core";
import { CommonModule } from "@angular/common";
import { IonicModule, MenuController, ModalController } from "@ionic/angular";
import { CUSTOM_ELEMENTS_SCHEMA } from "@angular/core";
import { Router } from "@angular/router";
import { Subscription } from "rxjs";
import { SpinnerComponent } from "../../components/spinner/spinner.component";
import { GeneralService } from "../../services/general.service";
import { PerfilComponent } from "../modal/perfil/perfil.component";
import { Capacitor } from "@capacitor/core";

// ✅ Keys para el menú WEB (expandedSections / toggleSection)
type SectionKey =
  | "configuracion"
  | "servicios"
  | "publicaciones"
  | "reservas"
  | "admin";

// ✅ Keys para el menú NATIVO (ion-accordion-group values)
type AccordionKey =
  | "admin"
  | "servicios"
  | "publicaciones"
  | "reservas"
  | "cuenta"
  | "configuracion";

@Component({
  selector: "app-menulateral",
  templateUrl: "./menulateral.component.html",
  styleUrls: ["./menulateral.component.scss"],
  standalone: true,
  imports: [IonicModule, CommonModule, SpinnerComponent],
  schemas: [CUSTOM_ELEMENTS_SCHEMA],
})
export class MenulateralComponent implements OnInit, OnDestroy {
  public isLoggedIn = false;
  public MyRole: string | null = null;
  mostrar_spinnet: boolean = false;

  private readonly MENU_CLOSE_DELAY_MS = 250;
  private subs: Subscription[] = [];

  public isNative = Capacitor.isNativePlatform();

  private readonly ALLOWED_ROLES = new Set(["admin", "vendedor", "lotero"]);

  // =========================
  // ✅ WEB (tu template web lo usa)
  // =========================
  public expandedSections: Record<SectionKey, boolean> = {
    configuracion: false,
    servicios: true, // default abierto en web
    publicaciones: false,
    reservas: false,
    admin: false,
  };

  // =========================
  // ✅ NATIVO (tu template nativo lo usa)
  // =========================
  public accordionValue: AccordionKey[] = []; // default lo seteo en applyDefaults

  // ✔️ Publisher
  get isPublisher(): boolean {
    return this.isLoggedIn && this.ALLOWED_ROLES.has(this.MyRole || "");
  }

  // ✔️ Admin
  get isAdmin(): boolean {
    return this.MyRole === "admin";
  }

  constructor(
    private router: Router,
    private menuCtrl: MenuController,
    public generalService: GeneralService,
    private modalCtrl: ModalController,
    private zone: NgZone
  ) {}

  ngOnInit() {
    // ✅ Defaults al arrancar
    this.applyDefaults();

    // Sub al estado de sesión
    this.subs.push(
      this.generalService.tokenExistente$.subscribe((estado) => {
        const before = this.isLoggedIn;
        this.isLoggedIn = estado;

        // Ojo: aquí NO reseteamos el accordion mientras el usuario lo está usando,
        // solo aseguramos defaults si hace falta.
        this.applyDefaults();

        // Si se desloguea o loguea, en web dejamos servicios abierto (como querías)
        if (estado === false) {
          this.setSectionsWeb({
            configuracion: false,
            servicios: true,
            publicaciones: false,
            reservas: false,
            admin: false,
          });
          return;
        }

        if (before === false && estado === true) {
          this.setSectionsWeb({
            configuracion: false,
            servicios: true,
            publicaciones: false,
            reservas: false,
            admin: false,
          });
          return;
        }
      })
    );

    // Sub al rol
    this.subs.push(
      this.generalService.tipoRol$.subscribe((rol) => {
        this.MyRole = rol;

        // WEB: si no es publisher, cierra publicaciones
        if (!this.isPublisher) {
          this.setSectionsWeb({ publicaciones: false });
        }

        // WEB: si no es admin, cierra admin
        if (!this.isAdmin) {
          this.setSectionsWeb({ admin: false });
        }

        // NATIVO: si no es publisher/admin, limpia acordeones inválidos
        if (!this.isPublisher) this.removeAccordionNative("publicaciones");
        if (!this.isAdmin) this.removeAccordionNative("admin");
      })
    );
  }

  ngOnDestroy(): void {
    this.subs.forEach((s) => s?.unsubscribe());
  }

  // =========================
  // ✅ DEFAULTS
  // =========================
  private applyDefaults() {
    // WEB default: servicios abierto
    this.setSectionsWeb({
      configuracion: false,
      servicios: true,
      publicaciones: false,
      reservas: false,
      admin: false,
    });

    // NATIVO default: al inicio (o si está vacío), abre servicios
    this.ensureServiciosDefaultNative();
  }

  private ensureServiciosDefaultNative() {
    if (!this.isNative) return;

    // ✅ SOLO si está vacío (o si aún no tiene servicios) lo ponemos como default.
    // Esto permite que el usuario lo cierre y lo vuelva a abrir SIN romperse.
    if (!this.accordionValue || this.accordionValue.length === 0) {
      this.accordionValue = ["servicios"];
      return;
    }

    // Si por alguna razón no trae servicios y quieres que el default lo incluya, lo agregamos
    // (pero NO lo forzamos cada ionChange, solo aquí).
    if (!this.accordionValue.includes("servicios")) {
      this.accordionValue = ["servicios", ...this.accordionValue];
    }
  }

  // =========================
  // ✅ WEB helpers
  // =========================
  private setSectionsWeb(state: Partial<Record<SectionKey, boolean>>) {
    this.expandedSections = { ...this.expandedSections, ...state };
  }

  private closeAllWeb() {
    (Object.keys(this.expandedSections) as SectionKey[]).forEach((k) => {
      this.expandedSections[k] = false;
    });
  }

  // ✅ Lo llama tu HTML WEB
  public toggleSection(section: SectionKey) {
    const willOpen = !this.expandedSections[section];
    this.closeAllWeb();
    this.expandedSections[section] = willOpen;
  }

  // =========================
  // ✅ NATIVO helpers
  // =========================
  private removeAccordionNative(key: AccordionKey) {
    this.accordionValue = (this.accordionValue || []).filter((k) => k !== key);
    // no forzamos nada aquí; si se queda vacío y quieres que regrese servicios, applyDefaults lo hará.
  }

  // ✅ Lo llama tu HTML NATIVO (ionChange)
  // IMPORTANTÍSIMO: aquí YA NO forzamos "servicios" porque eso es lo que lo rompe.
  public onAccordionChange(ev: any) {
    const raw = ev?.detail?.value;

    let next: AccordionKey[] = [];
    if (Array.isArray(raw)) next = raw as AccordionKey[];
    else if (typeof raw === "string" && raw) next = [raw as AccordionKey];

    // siempre nuevo array
    this.accordionValue = [...next];
  }

  // =========================
  // ✅ Acciones
  // =========================
  async redirecion(url: string) {
    try {
      const target = "/" + url.replace(/^\/+/, "");

      if (this.router.url === target) {
        await this.menuCtrl.close("menuLateral");
        return;
      }

      await this.menuCtrl.close("menuLateral");
      await this.sleep(this.MENU_CLOSE_DELAY_MS);

      this.zone.run(() => this.router.navigateByUrl(target));
    } catch (err) {
      console.error("❌ Redirección fallida:", err);
    }
  }

  cerrarMenu() {
    this.menuCtrl.close("menuLateral");

    // ✅ Cuando cierres el menú, dejamos listo el default para la próxima vez:
    // al volver a abrir, servicios estará abierto.
    if (this.isNative) {
      Promise.resolve().then(() => {
        this.accordionValue = ["servicios"];
      });
    }
  }

  isActive(url: string): boolean {
    const target = "/" + url.replace(/^\/+/, "");
    return this.router.url === target;
  }

  async logout() {
    this.generalService.confirmarAccion(
      "¿Deseas salir?",
      "¿Estás seguro de que deseas salir de la aplicación?",
      async () => {
        this.generalService.eliminarToken();
        await this.menuCtrl.close("menuLateral");
      }
    );
  }

  async abrirModalPerfil() {
    const modal = await this.modalCtrl.create({
      component: PerfilComponent,
      breakpoints: [0, 0.5, 0.8, 1],
      cssClass: "modal-perfil",
      initialBreakpoint: 0.8,
      handle: true,
      showBackdrop: true,
    });

    await modal.present();
    await this.menuCtrl.close("menuLateral");
  }

  abrirmodal() {
    this.generalService.alert(
      "Error de conexión",
      "Ups, algo salió mal vuelve a intentarlo",
      "info"
    );
  }

  private sleep(ms: number) {
    return new Promise((resolve) => setTimeout(resolve, ms));
  }
}