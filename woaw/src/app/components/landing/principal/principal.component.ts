import { Component, OnInit, Input, ViewChild, ElementRef, CUSTOM_ELEMENTS_SCHEMA } from '@angular/core';
import { CommonModule } from '@angular/common';
import { IonicModule } from '@ionic/angular';
import { ReactiveFormsModule } from '@angular/forms';
import { Router } from '@angular/router';
import { GeneralService } from '../../../services/general.service';
import { CarsService } from '../../../services/cars.service';
import { MotosService } from '../../../services/motos.service';
import { Capacitor } from '@capacitor/core';

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
  selector: 'app-principal',
  templateUrl: './principal.component.html',
  styleUrls: ['./principal.component.scss'],
  standalone: true,
  imports: [IonicModule, CommonModule, ReactiveFormsModule],
  schemas: [CUSTOM_ELEMENTS_SCHEMA],
})
export class PrincipalComponent implements OnInit {
  @Input() tipo: string = 'all';
  @Input() status: boolean = true;

  @ViewChild('catsNative', { read: ElementRef }) catsNative?: ElementRef<HTMLElement>;

  autosNuevos: any[] = [];
  autosSeminuevos: any[] = [];
  autosUsados: any[] = [];
  misMotos: any[] = [];

  Dispositivo: 'telefono' | 'tablet' | 'computadora' = 'computadora';
  esDispositivoMovil: boolean = false;

  public conUsados: number = 0;
  public conSeminuevos: number = 0;
  public conNuevos: number = 0;
  public conMotos: number = 0;

  public img1: string = '';
  public img2: string = '';
  public img3: string = '';

  vehTab: 'usados' | 'seminuevos' | 'nuevos' = 'usados';

  private self: number = 0;
  public isNative = Capacitor.isNativePlatform();

  // =========================
  // ✅ Indicador de categorías (Nativo)
  // =========================
  public nativeCatIndex: number = 0;
  public nativeCatLabel: string = 'Usados';
  public nativeCatsTotal: number = 7;
  public nativeCatsDots: any[] = Array.from({ length: 7 });

  private nativeCatsLabels: string[] = [
    'Usados',
    'Seminuevos',
    'Nuevos',
    'Seguros',
    'Motos',
    'Camiones',
    'Arrendamiento',
  ];

  private rafLock: number | null = null;

  constructor(
    public carsService: CarsService,
    public generalService: GeneralService,
    public motosService: MotosService,
    private router: Router
  ) {}

  ngOnInit() {
    this.generalService.dispositivo$.subscribe((tipo: 'telefono' | 'tablet' | 'computadora') => {
      this.Dispositivo = tipo;
    });

    this.generalService.dispositivo$.subscribe((tipo) => {
      this.esDispositivoMovil = tipo === 'telefono' || tipo === 'tablet';
    });

    this.getCarsNews();
    this.getCarsSeminuevos();
    this.getCarsUsados();
    this.cargaimagen();

    this.self = this.isNative ? 7 : 5;

    // Valores iniciales del indicador
    this.nativeCatsTotal = this.nativeCatsLabels.length;
    this.nativeCatsDots = Array.from({ length: this.nativeCatsTotal });
    this.nativeCatIndex = 0;
    this.nativeCatLabel = this.nativeCatsLabels[0] ?? 'Categorías';
  }

  // ✅ Se llama desde (scroll)="onNativeCatsScroll()"
  public onNativeCatsScroll(): void {
    if (!this.catsNative?.nativeElement) return;

    // Throttle con rAF para que no se vuelva loco el render
    if (this.rafLock) return;
    this.rafLock = requestAnimationFrame(() => {
      this.rafLock && cancelAnimationFrame(this.rafLock);
      this.rafLock = null;

      const el = this.catsNative!.nativeElement;
      const scrollLeft = el.scrollLeft;

      // Intento de calcular el “ancho” de una tarjeta (incluyendo gap)
      const firstCard = el.querySelector('ion-card') as HTMLElement | null;
      if (!firstCard) return;

      const cardRect = firstCard.getBoundingClientRect();
      const cardWidth = cardRect.width || 170;

      // gap aproximado: si hay 10px en CSS, lo sumamos
      const gap = 10;
      const step = cardWidth + gap;

      const idx = Math.max(0, Math.min(this.nativeCatsTotal - 1, Math.round(scrollLeft / step)));

      if (idx !== this.nativeCatIndex) {
        this.nativeCatIndex = idx;
        this.nativeCatLabel = this.nativeCatsLabels[idx] ?? 'Categorías';
      }
    });
  }

  getMotos() {
    if (this.tipo !== 'all') return;

    this.motosService.getMotos().subscribe({
      next: (res: any) => {
        this.conMotos = res.contador;
        const moto = res?.motos || [];
        this.misMotos = moto.slice(0, 5);
      },
      error: (err) => {
        const mensaje = err?.error?.message || 'Ocurrió un error inesperado';
        this.generalService.alert('Error de Conexión', mensaje);
      },
    });
  }

  verMas(url: string) {
    this.router.navigate([url]);
  }

  async cargaimagen() {
    this.img1 = '/assets/home/A1.webp';
    this.img2 = '/assets/home/A5.webp';
    this.img3 = '/assets/home/A3.webp';

    this.generalService.addPreload(this.img1, 'image');
    this.generalService.addPreload(this.img2, 'image');
    this.generalService.addPreload(this.img3, 'image');

    try {
      await Promise.all([
        this.generalService.preloadHero(this.img1, 500),
        this.generalService.preloadHero(this.img2, 500),
        this.generalService.preloadHero(this.img3, 500),
      ]);
    } finally {
      // listo
    }
  }

  public redirecion(url: string) {
    this.router.navigate([url]);
  }

  private toNumberSafe(v: any): number | null {
    if (v === null || v === undefined) return null;
    const n =
      typeof v === "string"
        ? Number(v.toString().replace(/[, ]+/g, ""))
        : Number(v);
    return Number.isFinite(n) ? n : null;
  }

  public irAFichaAuto(id?: string) {
    if (!id) return;
    this.router.navigate(['/fichas/autos', id]);
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

  public getPrecio(a: AutoCard): number | null {
    if (!a) return null;
    if (a.tipoVenta === "nuevo") {
      return this.minPrecioDeVersion(a);
    }
    const p = this.toNumberSafe(a?.precio);
    return p ?? this.minPrecioDeVersion(a);
  }

  private minPrecioDeVersion(a: AutoCard): number | null {
    const vs = Array.isArray(a?.version) ? a.version : [];
    const nums = vs
      .map((v) => this.toNumberSafe((v as any)?.Precio ?? (v as any)?.precio))
      .filter((n): n is number => n !== null);
    return nums.length ? Math.min(...nums) : null;
  }

  public getImagen(a: AutoCard): string {
    if (a?.imagenPrincipal) return a.imagenPrincipal;
    if (a?.imagenes && a.imagenes.length > 0) return a.imagenes[0];
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

  getCarsUsados() {
    this.carsService.getCarsUsados(this.self).subscribe({
      next: (res: any) => {
        this.conUsados = Number(res?.contador ?? 0);
        const autos: AutoCard[] = res?.coches || [];
        const autosAleatorios = [...autos].sort(() => Math.random() - 0.5);
        this.autosUsados = autosAleatorios;
      },
      error: (err) => {
        const mensaje = err?.error?.message || "Ocurrió un error inesperado";
        this.generalService.alert("Error de Conexión", mensaje);
      },
    });
  }

  getCarsSeminuevos() {
    this.carsService.getCarsSeminuevos(this.self).subscribe({
      next: (res: any) => {
        this.conSeminuevos = Number(res?.contador ?? 0);
        const autos: AutoCard[] = res?.coches || [];
        const autosAleatorios = [...autos].sort(() => Math.random() - 0.5);
        this.autosSeminuevos = autosAleatorios;
      },
      error: (err) => {
        const mensaje = err?.error?.message || "Ocurrió un error inesperado";
        this.generalService.alert("Error de Conexión", mensaje);
      },
    });
  }

  getCarsNews() {
    this.carsService.getCarsNews(this.self).subscribe({
      next: (res: any) => {
        this.conNuevos = Number(res?.contador ?? 0);
        const autos: AutoCard[] = res?.coches || [];
        const autosAleatorios = [...autos].sort(() => Math.random() - 0.5);
        this.autosNuevos = autosAleatorios;
      },
      error: (err) => {
        const mensaje = err?.error?.message || "Ocurrió un error inesperado";
        this.generalService.alert("Error de Conexión", mensaje);
      },
    });
  }
}