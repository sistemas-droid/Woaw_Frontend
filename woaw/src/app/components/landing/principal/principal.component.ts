import { Component, OnInit, Input, ViewChild, ElementRef, Output, EventEmitter, HostListener } from '@angular/core';
import { CommonModule } from '@angular/common';
import { IonicModule } from '@ionic/angular';
import { CUSTOM_ELEMENTS_SCHEMA } from '@angular/core';
import { ReactiveFormsModule } from '@angular/forms';
import { Router } from '@angular/router';
import { GeneralService } from '../../../services/general.service';
import { CarsService } from '../../../services/cars.service';
import { MotosService } from '../../../services/motos.service';
import { Capacitor } from '@capacitor/core';
import { IonContent } from '@ionic/angular';


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



  autosNuevos: any[] = [];
  autosSeminuevos: any[] = [];
  autosUsados: any[] = [];
  MotosAll: any[] = [];
  Dispositivo: 'telefono' | 'tablet' | 'computadora' = 'computadora';
  esDispositivoMovil: boolean = false;
  public conUsados: number = 0;
  public conSeminuevos: number = 0;
  public conNuevos: number = 0;
  public conMotos: number = 0;
  public img1: string = '';
  public img2: string = '';
  public img3: string = '';

  private self: number = 0;
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
    motos: true
  };

  carsLoaded: Record<string, boolean> = {};
  imagenesCargadas = new Set<string>();


  constructor(
    public carsService: CarsService,
    public generalService: GeneralService,
    public motosService: MotosService,
    private router: Router
  ) { }

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
    this.getMotos();
    this.cargaimagen();

    if (this.isNative) {
      this.self = 7;
    } else {
      this.self = 5;
    }

  }

  markCarLoaded(id: string) {
    this.carsLoaded[id] = true;
  }
  onImgLoad(id: string) {
    this.imagenesCargadas.add(id);
  }


  // getCarsNews() {
  //   this.carsService.getCarsNews().subscribe({
  //     next: (res: any) => {
  //       this.conNuevos = res.contador;
  //       const autos = res?.coches || [];


  //       const autosAleatorios = [...autos].sort(() => Math.random() - 0.5);
  //       this.autosNuevos = autosAleatorios.slice(0, 5);

  //     },
  //     error: (err) => {
  //       const mensaje = err?.error?.message || 'Ocurrió un error inesperado';
  //       this.generalService.alert('Error de Conexión', mensaje);
  //     },
  //   });
  // }

  // getCarsSeminuevos() {
  //   this.carsService.getCarsSeminuevos().subscribe({
  //     next: (res: any) => {
  //       this.conSeminuevos = res.contador;
  //       const autos = res?.coches || [];
  //       const autosAleatorios = [...autos].sort(() => Math.random() - 0.5);
  //       this.autosSeminuevos = autosAleatorios.slice(0, 5);
  //     },
  //     error: (err) => {
  //       const mensaje = err?.error?.message || 'Ocurrió un error inesperado';
  //       this.generalService.alert('Error de Conexión', mensaje);
  //     },
  //   });
  // }
  // getCarsUsados() {
  //   this.carsService.getCarsUsados().subscribe({
  //     next: (res: any) => {
  //       this.conUsados = res.contador;
  //       const autos = res?.coches || [];
  //       const autosAleatorios = [...autos].sort(() => Math.random() - 0.5);
  //       this.autosUsados = autosAleatorios.slice(0, 5);
  //     },
  //     error: (err) => {
  //       const mensaje = err?.error?.message || 'Ocurrió un error inesperado';
  //       this.generalService.alert('Error de Conexión', mensaje);
  //     },
  //   });
  // }

  verMas(url: string) {
    this.router.navigate([url]);
  }
  onCardClick(auto: any, event: Event): void {
    this.router.navigate(['/ficha', 'autos', auto._id]);
  }
  onCardClickM(moto: any, event: Event): void {
    this.router.navigate(['/ficha', 'motos', moto._id]);
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
      // this.overlayLoaded = true;
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

  public irAFichaAuto(id?: string, tipo?: string) {
    if (!id) return;

    if (tipo === "moto") {
      this.router.navigate(['/ficha/motos', id]);
    } else {
      this.router.navigate(['/fichas/autos', id]);
    }

    // this.router.navigate(["/ficha", "autos", id]);
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


  getCarsUsados() {
    this.carsService.getCarsUsados(this.self).subscribe({
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
    this.carsService.getCarsSeminuevos(this.self).subscribe({
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
  getCarsNews() {
    this.carsService.getCarsNews(this.self).subscribe({
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
    if (this.tipo !== 'all') {
      return;
    }
    this.motosService.getMotos().subscribe({
      next: (res: any) => {
        console.log(res)
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







}
