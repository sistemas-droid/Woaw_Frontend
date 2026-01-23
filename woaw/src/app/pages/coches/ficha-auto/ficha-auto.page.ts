import { CamionesService } from "./../../../services/camiones.service";
import { Component, OnInit, ViewChild, ElementRef } from "@angular/core";
import { ActivatedRoute, Router } from "@angular/router";
import { GeneralService } from "../../../services/general.service";
import { ModalController } from "@ionic/angular";
import { HttpClient } from "@angular/common/http";
import { CarsService } from "./../../../services/cars.service";
import { MotosService } from "./../../../services/motos.service";
import { ContactosService } from "./../../../services/contactos.service";
import { Title } from "@angular/platform-browser";
import { SeoService } from "../../../services/seo.service";
import { Location } from "@angular/common";
import { PoliticasComponent } from "../../../components/modal/politicas/politicas.component";
import { AvisoPrivasidadComponent } from "../../../components/modal/aviso-privasidad/aviso-privasidad.component";
import { PasosArrendamientoComponent } from "../../../components/modal/pasos-arrendamiento/pasos-arrendamiento.component";
import { ImagenesVehiculoComponent } from "./../../../components/modal/imagenes-vehiculo/imagenes-vehiculo.component";
import { ActionSheetController } from "@ionic/angular";
import { Browser } from "@capacitor/browser";
import { Capacitor } from "@capacitor/core";

@Component({
  selector: 'app-ficha-auto',
  templateUrl: './ficha-auto.page.html',
  styleUrls: ['./ficha-auto.page.scss'],
  standalone: false
})
export class FichaAutoPage implements OnInit {
  auto: any = null;
  spinner: boolean = false;
  imagenesCargadas: boolean[] = [];
  imagenPrincipalCargada = false;
  miniaturasCargadas: { [url: string]: boolean } = {};

  descripcionExpandida: boolean = false;
  imagenSeleccionada: string = "";
  versionSeleccionada: { nombre: string; precio: number } | null = null;
  versiones: { nombre: string; precio: number }[] = [];
  especificacionesAuto: any[] = [];
  tipo: string = "";

  @ViewChild("mapAutoContainer", { static: false })
  mapAutoContainer!: ElementRef;
  mapAuto!: google.maps.Map;
  autoMarker!: google.maps.Marker;
  direccionCompleta: string = "Obteniendo ubicación...";

  public esDispositivoMovil: boolean = false;
  public dispositivo: string = "";
  public isLoggedIn: boolean = false;
  public MyRole: string | null = null;

  public idsMisAutos: string[] = [];
  public esMio: boolean = false;

  zoomLeft = 0;
  zoomTop = 0;
  zoomTransform = "";
  showZoom = false;
  touchStartX: number = 0;

  mostrarCotizador = true;
  public idvehiculo: string | null = null;

  public tipoAlSubir: "particular" | "lote" | null = null;

  galeriaImagenes: string[] = [];

  marcasConFondoNuevo: string[] = [
    'honda',
    'chirey',
    'suzuki',
    'chevrolet',
    'hyundai',
    'fiat',
    'lexus',
    'bestune',
    'lincoln',
    'cupra',
    'audi',
    'volkswagen',
    'byd',
    'acura',
    'king long'
  ];


  constructor(
    private route: ActivatedRoute,
    private modalCtrl: ModalController,
    private generalService: GeneralService,
    private http: HttpClient,
    private router: Router,
    public carsService: CarsService,
    public contactosService: ContactosService,
    private title: Title,
    private seoService: SeoService,
    public motosService: MotosService,
    public CamionesService: CamionesService,
    private location: Location,
    private actionSheetCtrl: ActionSheetController
  ) { }

  async ngOnInit() {
    this.generalService.dispositivo$.subscribe((tipo) => {
      this.esDispositivoMovil = tipo === "telefono" || tipo === "tablet";
      this.dispositivo = tipo;
    });
    this.generalService.tokenExistente$.subscribe((estado) => {
      this.isLoggedIn = estado;
    });
    this.generalService.tipoRol$.subscribe((rol) => {
      this.MyRole = rol;
    });
    await this.obtenerAuto();
  }
  async obtenerAuto() {
    this.idvehiculo = this.route.snapshot.paramMap.get("id");

    this.autosURL(this.idvehiculo);
  }

  async seo() {
    if (this.auto?.marca && this.auto?.modelo && this.auto?.anio) {
      const titulo = `${this.auto.marca} ${this.auto.modelo} ${this.auto.anio} en venta | WOAW`;
      this.title.setTitle(titulo);
      this.seoService.updateDescription(
        `Descubre este ${this.auto.marca} ${this.auto.modelo} del año ${this.auto.anio}, disponible ahora en WOAW. Haz clic para más información.`
      );
    }
  }
  async mostrarauto() {
    this.tipo = (this.auto.tipoVenta || "").toLowerCase();

    // ✅ SIEMPRE construye la galería con imagenPrincipal + imagenes
    this.construirGaleriaImagenes();

    // el resto de tu lógica de versiones queda igual
    if (this.auto?.version && Array.isArray(this.auto.version)) {
      this.versiones = this.auto.version.map((v: any) => ({
        nombre: v.Name,
        precio: v.Precio,
      }));

      this.versiones.sort((a, b) => a.precio - b.precio);
      this.versionSeleccionada = this.versiones[0];
      this.auto.precioDesde = this.versiones[0]?.precio;
      this.auto.precioHasta = this.versiones[this.versiones.length - 1]?.precio;

      if (this.tipo === "nuevo" && this.versionSeleccionada?.nombre) {
        this.getEspecificacionesPorVersion(this.versionSeleccionada.nombre);
      }
    }

    this.mostrarmapa();
  }


  mostrarmapa() {
    const { lat, lng, ciudad, estado } = this.auto.ubicacion;
    const position = new google.maps.LatLng(lat, lng);

    setTimeout(() => {
      this.mapAuto = new google.maps.Map(this.mapAutoContainer.nativeElement, {
        center: position,
        zoom: this.tipoAlSubir === "particular" ? 12 : 12,
        styles: [
          {
            featureType: "poi",
            elementType: "all",
            stylers: [{ visibility: "off" }],
          },
        ],
        disableDefaultUI: this.esDispositivoMovil,
        zoomControl: !this.esDispositivoMovil,
        draggable: !this.esDispositivoMovil,
      });

      if (this.tipoAlSubir === "lote") {
        this.autoMarker = new google.maps.Marker({
          position,
          map: this.mapAuto,
          title: `${ciudad}, ${estado}`,
          icon: {
            url: "assets/icon/car_red.png",
            scaledSize: new google.maps.Size(30, 30),
            anchor: new google.maps.Point(15, 30),
          },
        });
      } else {
        new google.maps.Circle({
          strokeColor: "#FF0000",
          strokeOpacity: 0.9,
          strokeWeight: 2,
          fillColor: "#FF0000",
          fillOpacity: 0.2,
          map: this.mapAuto,
          center: position,
          radius: 250,
        });
      }
    }, 300);

    // Obtener dirección aproximada
    this.generalService
      .obtenerDireccionDesdeCoordenadas(lat, lng)
      .then((direccion) => {
        this.direccionCompleta = direccion;
      })
      .catch((error) => {
        this.direccionCompleta = "No se pudo obtener la dirección.";
        console.warn(error);
      });
  }
  async openDirection() {
    const { lat, lng, ciudad, estado } = this.auto?.ubicacion || {};
    const label = encodeURIComponent(
      `${ciudad ?? ""} ${estado ?? ""}`.trim() || "Ubicación"
    );

    // fallback si no hay coords
    const hasCoords = typeof lat === "number" && typeof lng === "number";
    const webUrl = hasCoords
      ? `https://www.google.com/maps/search/?api=1&query=${lat},${lng}`
      : `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(
        this.direccionCompleta || ""
      )}`;

    const platform = Capacitor.getPlatform();

    if (platform === "android" && hasCoords) {
      const url = `geo:${lat},${lng}?q=${lat},${lng}(${label})`;
      try {
        await Browser.open({ url });
      } catch {
        window.open(webUrl, "_blank");
      }
      return;
    }

    if (platform === "ios" && hasCoords) {
      const url = `http://maps.apple.com/?ll=${lat},${lng}&q=${label}`;
      try {
        await Browser.open({ url });
      } catch {
        window.open(webUrl, "_blank");
      }
      return;
    }
    window.open(webUrl, "_blank");
  }
  async regresar() {
    let origenLote = localStorage.getItem("origenLote");
    if (origenLote !== null) {
      await this.router.navigate([origenLote]);
      return;
    }
    const origen = localStorage.getItem("origenFicha");

    if (origen === "true") {
      localStorage.removeItem("origenFicha");
      this.location.back();
      return;
    }
    window.history.back();


    // if (this.tipo === "nuevo") {
    //   await this.router.navigate(["/nuevos"]);
    // } else if (this.tipo === "seminuevo") {
    //   await this.router.navigate(["/seminuevos"]);
    // } else if (this.tipo === "usado") {
    //   await this.router.navigate(["/usados"]);
    // }
  }
  volver() {
    // 1) Si Angular tiene navigationId > 1, hubo navegación previa en esta sesión.
    const navId = (history.state && (history.state as any).navigationId) || 0;
    if (navId > 1) {
      this.location.back();
      return;
    }

    // 2) Si el referrer es del mismo origen, intenta back del browser.
    if (document.referrer) {
      try {
        const ref = new URL(document.referrer);
        if (ref.origin === location.origin) {
          window.history.back();
          return;
        }
      } catch {
        /* ignore */
      }
    }

    // 3) Como último recurso, vete al home.
    this.router.navigate(["/home"]); // ajusta si tu ruta de inicio es distinta
  }
  getEspecificacionesPorVersion(version: string) {
    const anio = this.auto.anio;
    const marca = this.auto.marca;
    const modelo = this.auto.modelo;
    const vers = version;

    this.carsService
      .EspesificacionesVersionFicha(anio, marca, modelo, vers)
      .subscribe({
        next: (res: any[]) => {
          this.especificacionesAuto = res;
          // console.log('HEYY', this.especificacionesAuto);
        },
        error: (err) => {
          this.generalService.loadingDismiss();
          const mensaje =
            err?.error?.message ||
            "Ocurrió un error al traer las especificaciones";
          this.generalService.alert(
            "Error al obtener especificaciones",
            mensaje,
            "danger"
          );
        },
        complete: () => {
          // this.generalService.loadingDismiss();
        },
      });
  }
  onSeleccionarVersion(version: { nombre: string; precio: number }) {
    this.versionSeleccionada = version;
    this.getEspecificacionesPorVersion(version.nombre);
    this.mostrarCotizador = false;
    setTimeout(() => {
      this.mostrarCotizador = true;
    });
  }
  onImagenPrincipalCargada() {
    this.imagenPrincipalCargada = true;
  }
  onMiniaturaCargada(url: string) {
    this.miniaturasCargadas[url] = true;
  }
  onTouchStart(event: TouchEvent) {
    this.touchStartX = event.touches[0].clientX;
  }
  onTouchEnd(event: TouchEvent) {
    const touchEndX = event.changedTouches[0].clientX;
    const diff = touchEndX - this.touchStartX;
    if (Math.abs(diff) > 50) {
      if (diff < 0) {
        this.cambiarImagen("siguiente");
      } else {
        this.cambiarImagen("anterior");
      }
    }
  }
  cambiarImagen(direccion: "siguiente" | "anterior") {
    const imgs = this.galeriaImagenes || [];
    const index = imgs.indexOf(this.imagenSeleccionada);
    const total = imgs.length;

    if (direccion === "siguiente" && index < total - 1) {
      this.imagenSeleccionada = imgs[index + 1];
    } else if (direccion === "anterior" && index > 0) {
      this.imagenSeleccionada = imgs[index - 1];
    }
  }

  get descripcionCorta(): string {
    if (!this.auto?.descripcion) return "";
    const palabras = this.auto.descripcion.split(" ");
    if (palabras.length <= 20 || this.descripcionExpandida) {
      return this.auto.descripcion;
    }
    return palabras.slice(0, 20).join(" ") + "...";
  }
  autosURL(id: any) {
    this.carsService.getCar(id).subscribe({
      next: async (res: any) => {
        this.auto = res;
        // console.log('AUTO', this.auto);
        this.tipoAlSubir = this.auto.lote == null ? "particular" : "lote";
        const storage = localStorage.getItem("user");
        const usuario = storage ? JSON.parse(storage) : null;
        this.esMio = !!usuario && this.auto.usuarioId?.email === usuario.email;
        await this.mostrarauto();
        this.spinner = true;
        await this.seo();
      },
      error: (err) => {
        const mensaje = err?.error?.message || "Ocurrió un error inesperado";
        // this.generalService.alert("Error", mensaje, "danger");
      },
      complete: () => {
        // this.generalService.loadingDismiss();
      },
    });
  }

  async aviso(num: number) {
    if (num === 0) {
      let modal;
      if (this.dispositivo === "telefono") {
        modal = await this.modalCtrl.create({
          component: AvisoPrivasidadComponent,
          componentProps: {
            onAceptar: () => this.setAceptado("aviso", true),
            onCancelar: () => this.setAceptado("aviso", false),
          },
          breakpoints: [0, 0.7, 1],
          cssClass: "modal-perfil",
          initialBreakpoint: 0.7,
          handle: true,
          backdropDismiss: true,
          showBackdrop: true,
        });
      } else {
        modal = await this.modalCtrl.create({
          component: AvisoPrivasidadComponent,
          componentProps: {
            onAceptar: () => this.setAceptado("aviso", true),
            onCancelar: () => this.setAceptado("aviso", false),
          },
          backdropDismiss: true,
          showBackdrop: true,
          cssClass: "modal-consentimiento",
        });
      }
      await modal.present();
    } else {
      let modal;
      if (this.dispositivo === "telefono") {
        modal = await this.modalCtrl.create({
          component: PoliticasComponent,
          componentProps: {
            onAceptar: () => this.setAceptado("terminos", true),
            onCancelar: () => this.setAceptado("terminos", false),
          },
          breakpoints: [0, 0.7, 1],
          cssClass: "modal-perfil",
          initialBreakpoint: 0.7,
          handle: true,
          backdropDismiss: true,
          showBackdrop: true,
        });
      } else {
        modal = await this.modalCtrl.create({
          component: PoliticasComponent,
          componentProps: {
            onAceptar: () => this.setAceptado("terminos", true),
            onCancelar: () => this.setAceptado("terminos", false),
          },
          backdropDismiss: true,
          showBackdrop: true,
          cssClass: "modal-consentimiento",
        });
      }
      await modal.present();
    }
  }
  setAceptado(tipo: "aviso" | "terminos", valor: boolean) {
    if (valor === true) {
      localStorage.setItem(tipo, "true");
    } else {
      localStorage.setItem(tipo, "false");
      const titulos: Record<typeof tipo, string> = {
        aviso: "Aviso de Privacidad",
        terminos: "Términos y Condiciones",
      };
      const mensajes: Record<typeof tipo, string> = {
        aviso:
          "Por tu seguridad y protección de datos, es necesario aceptar el Aviso de Privacidad.",
        terminos:
          "Debes aceptar los Términos y Condiciones para usar este servicio de forma segura y responsable.",
      };
      this.generalService.alert(titulos[tipo], mensajes[tipo], "info");
      localStorage.removeItem(tipo);
    }
  }
  async abrirModalArrendamiento(aut: object) {
    let modal;
    if (this.dispositivo === "telefono") {
      modal = await this.modalCtrl.create({
        component: PasosArrendamientoComponent,
        breakpoints: [0, 0.7, 1],
        cssClass: "modal-perfil",
        initialBreakpoint: 0.7,
        handle: true,
        backdropDismiss: true,
        showBackdrop: true,
      });
    } else {
      modal = await this.modalCtrl.create({
        component: PasosArrendamientoComponent,
        backdropDismiss: true,
        showBackdrop: true,
        cssClass: "modal-consentimiento",
      });
    }
    await modal.present();
  }
  async abrirModalImagen(imagenes: string[], indice: number = 0) {
    if (this.tipo === 'nuevo') {
      return;
    }
    const modal = await this.modalCtrl.create({
      component: ImagenesVehiculoComponent,
      componentProps: { imagenes, indice },
      cssClass: "modal-imagen-personalizado",
      backdropDismiss: true,
      showBackdrop: true,
    });
    await modal.present();
  }
  mostrarAutos(lote: any) {
    const nombreURL = encodeURIComponent(lote.nombre || "");
    localStorage.setItem("origenLote", `/lote/${nombreURL}/${lote._id}`);
    this.router.navigate(["/lote", nombreURL, lote._id]);
  }
  private construirGaleriaImagenes() {
    const principal = (this.auto?.imagenPrincipal || "").trim();
    const extras = Array.isArray(this.auto?.imagenes) ? this.auto.imagenes : [];

    const all =
      this.tipo === "nuevo"
        ? [principal, ...extras].filter(Boolean)
        : [...extras].filter(Boolean);

    this.galeriaImagenes = Array.from(new Set(all));

    this.imagenSeleccionada = this.galeriaImagenes[0] || "";

    this.miniaturasCargadas = {};
    this.galeriaImagenes.forEach((img) => (this.miniaturasCargadas[img] = false));

    this.imagenPrincipalCargada = false;
  }

  tieneFondoNuevo(): boolean {
    if (!this.auto?.marca) return false;

    return this.marcasConFondoNuevo.includes(
      this.auto.marca.toLowerCase()
    );
  }


}
