import { Component, OnInit } from "@angular/core";
import { ActivatedRoute } from "@angular/router";
import { AlertController } from "@ionic/angular";
import { Router } from "@angular/router";
import { CarsService } from "../../services/cars.service";
import { GeneralService } from "../../services/general.service";
import { MotosService } from '../../services/motos.service';
import { Capacitor } from '@capacitor/core';
import { DomSanitizer } from "@angular/platform-browser";

interface Ubicacion {
  ciudad?: string;
  estado?: string;
  lat?: number;
  lng?: number;
}
interface Version {
  Precio?: number | string;
  precio?: number | string;
  [k: string]: any;
}
interface AutoCard {
  _id: string;
  marca: string;
  modelo: string;
  anio: number;
  tipoVenta: "nuevo" | "seminuevo" | "usado";
  imagenPrincipal?: string;
  imagenes?: string[];
  ubicacion?: Ubicacion;
  version?: Version[];
  precio?: number | string | null;
  transmision?: string;
  combustible?: string;
  kilometraje?: number | null;
  [k: string]: any;
}

@Component({
  selector: "app-menu-vehiculos",
  templateUrl: "./menu-vehiculos.page.html",
  styleUrls: ["./menu-vehiculos.page.scss"],
  standalone: false,
})
export class MenuVehiculosPage implements OnInit {
  tipoVehiculo!: string;
  esDispositivoMovil: boolean = false;

  autosNuevos: AutoCard[] = [];
  autosSeminuevos: AutoCard[] = [];
  autosUsados: AutoCard[] = [];

  public conUsados: number = 0;
  public conSeminuevos: number = 0;
  public conNuevos: number = 0;


  public conMotos: number = 0;
  MotosAll: any[] = [];
  public isNative = Capacitor.isNativePlatform();

  catsLoaded = {
    usados: false,
    seminuevos: false,
    nuevos: false,
    seguros: false,
    motos: false,
    camiones: false,
    arr: false,
  };

  carsLoading = {
    usados: true,
    seminuevos: true,
    nuevos: true,
    motos: true,
  };

  carsLoaded: Record<string, boolean> = {};
  imagenesCargadas = new Set<string>();


  constructor(
    private route: ActivatedRoute,
    private alertCtrl: AlertController,
    private router: Router,
    private generalService: GeneralService,
    public carsService: CarsService,
    private sanitizer: DomSanitizer,
    public motosService: MotosService,
  ) { }

  ngOnInit() {
    this.generalService.dispositivo$.subscribe((tipo) => {
      this.esDispositivoMovil = tipo === "telefono" || tipo === "tablet";
    });

    this.tipoVehiculo = this.route.snapshot.paramMap.get("tipo") || "";

    this.getCarsNews();
    this.getCarsSeminuevos();
    this.getCarsUsados();
    this.getMotos();
  }


  markCarLoaded(id: string) {
    this.carsLoaded[id] = true;
  }
  onImgLoad(id: string) {
    this.imagenesCargadas.add(id);
  }

  private toNumberSafe(v: any): number | null {
    if (v === null || v === undefined) return null;
    const n =
      typeof v === "string"
        ? Number(v.toString().replace(/[, ]+/g, ""))
        : Number(v);
    return Number.isFinite(n) ? n : null;
  }

  private minPrecioDeVersion(a: AutoCard): number | null {
    const vs = Array.isArray(a?.version) ? a.version : [];
    const nums = vs
      .map((v) => this.toNumberSafe((v as any)?.Precio ?? (v as any)?.precio))
      .filter((n): n is number => n !== null);
    return nums.length ? Math.min(...nums) : null;
  }

  public getPrecio(a: AutoCard): number | null {
    if (!a) return null;
    if (a.tipoVenta === "nuevo") {
      return this.minPrecioDeVersion(a);
    }
    const p = this.toNumberSafe(a?.precio);
    return p ?? this.minPrecioDeVersion(a);
  }

  public getCiudad(a: AutoCard): string {
    return a?.ubicacion?.ciudad ?? "";
  }
  public getEstado(a: AutoCard): string {
    return a?.ubicacion?.estado ?? "";
  }

  public mostrarKilometraje(a: AutoCard): boolean {
    const km = this.toNumberSafe(a?.kilometraje);
    return km !== null && km >= 0;
  }

  public trackById(_: number, a: AutoCard): string {
    return a?._id;
  }

  getCarsUsados() {
    this.carsService.getCarsUsados(10).subscribe({
      next: (res: any) => {
        //  console.log('📦 Objeto recibido del backend (usados):', res);
        this.conUsados = Number(res?.contador ?? 0);
        const autos: AutoCard[] = res?.coches || [];
        const autosAleatorios = [...autos].sort(() => Math.random() - 0.5);
        this.autosUsados = autosAleatorios;
        this.carsLoading.usados = false;
      },
      error: (err) => {
        const mensaje = err?.error?.message || "Ocurrió un error inesperado";
        this.generalService.alert("Error de Conexión", mensaje);
      },
    });
  }

  getCarsSeminuevos() {
    this.carsService.getCarsSeminuevos(10).subscribe({
      next: (res: any) => {
        // console.log('📦 Objeto recibido del backend (seminuevos):', res);
        this.conSeminuevos = Number(res?.contador ?? 0);
        const autos: AutoCard[] = res?.coches || [];
        const autosAleatorios = [...autos].sort(() => Math.random() - 0.5);
        this.autosSeminuevos = autosAleatorios;
        this.carsLoading.seminuevos = false;
      },
      error: (err) => {
        const mensaje = err?.error?.message || "Ocurrió un error inesperado";
        this.generalService.alert("Error de Conexión", mensaje);
      },
    });
  }

  public getImagen(a: AutoCard): string {
    if (a?.imagenPrincipal) {
      return a.imagenPrincipal;
    }
    if (a?.imagenes && a.imagenes.length > 0) {
      return a.imagenes[0];
    }
    return '/assets/home/no-image.jpeg';
  }


  public onImgError(event: Event, auto: AutoCard) {
    const img = event.target as HTMLImageElement;

    if (img.dataset['fallbackTried'] === '1') {
      img.src = '/assets/home/no-image.jpeg';
      return;
    }
    img.dataset['fallbackTried'] = '1';

    if (auto.imagenes && auto.imagenes.length > 0) {
      img.src = auto.imagenes[0];
    } else {
      img.src = '/assets/home/no-image.jpeg';
    }
  }


  getCarsNews() {
    this.carsService.getCarsNews(10).subscribe({
      next: (res: any) => {
        //  console.log('📦 Objeto recibido del backend (nuevos):', res);
        this.conNuevos = Number(res?.contador ?? 0);
        const autos: AutoCard[] = res?.coches || [];
        // Si quieres orden aleatorio en la vista:
        const autosAleatorios = [...autos].sort(() => Math.random() - 0.5);
        this.autosNuevos = autosAleatorios;
        this.carsLoading.nuevos = false;
      },
      error: (err) => {
        const mensaje = err?.error?.message || "Ocurrió un error inesperado";
        this.generalService.alert("Error de Conexión", mensaje);
      },
    });
  }


  getMotos() {
    this.motosService.getMotos().subscribe({
      next: (res: any) => {
        // console.log(res)
        this.conMotos = res.contador;
        const moto = res?.motos || []
        this.MotosAll = moto.slice(0, 5);
        this.carsLoading.motos = false;
      },
      error: (err) => {
        const mensaje = err?.error?.message || 'Ocurrió un error inesperado';
        this.generalService.alert('Error de Conexión', mensaje);
      },
    });
  }

  public redirecion(url: string) {
    this.router.navigate([url]);
  }



  public irAFichaAuto(id?: string, tipo?: string) {
    if (!id) return;

    if (tipo === "moto") {
      this.router.navigate(['/ficha/motos', id]);
    } else {
      this.router.navigate(['/fichas/autos', id]);
    }

    // this.router.navigate(["/ficha", "autos", id]);
  }
}
