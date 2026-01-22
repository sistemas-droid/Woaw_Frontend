import {
  Component,
  OnInit,
  Input,
  Output,
  EventEmitter,
  CUSTOM_ELEMENTS_SCHEMA,
  OnChanges,
  SimpleChanges,
} from '@angular/core';
import { CommonModule } from '@angular/common';
import { IonicModule } from '@ionic/angular';
import { ReactiveFormsModule } from '@angular/forms';
import { Router, ActivatedRoute } from '@angular/router';
import { ModalController } from '@ionic/angular';
import { Capacitor } from '@capacitor/core';

import { GeneralService } from '../../services/general.service';
import { CarsService } from '../../services/cars.service';
import { ContactosService } from './../../services/contactos.service';
import { MotosService } from '../../services/motos.service';
import { CamionesService } from '../../services/camiones.service';
import { ImagenesVehiculoComponent } from './../../components/modal/imagenes-vehiculo/imagenes-vehiculo.component';

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
  tipoVenta: 'nuevo' | 'seminuevo' | 'usado';
  imagenPrincipal?: string;
  imagenes?: string[];
  ubicacion?: Ubicacion;
  version?: Version[];
  precio?: any;
  transmision?: string;
  combustible?: string;
  kilometraje?: number | null;
  estadoVehiculo?: 'disponible' | 'vendido';
  vehiculo?: 'auto' | 'moto' | 'renta' | 'camion';
  [k: string]: any;
}

@Component({
  selector: 'app-cartas',
  templateUrl: './cartas.component.html',
  styleUrls: ['./cartas.component.scss'],
  standalone: true,
  imports: [IonicModule, CommonModule, ReactiveFormsModule],
  schemas: [CUSTOM_ELEMENTS_SCHEMA],
})
export class CartasComponent implements OnInit, OnChanges {
  @Input() auto: AutoCard | any;
  @Input() autosFavoritosIds: Set<string> = new Set();
  @Input() ubicacion: string = '';
  @Input() esMio: boolean = false;

  @Output() refrescarAutos = new EventEmitter<string>();

  FormatoPrecios: boolean = false;

  public mostrarPendientes: boolean = false;
  public MyRole: string | null = null;
  public isLoggedIn: boolean = false;

  carsLoaded: Record<string, boolean> = {};

  public isNative = Capacitor.isNativePlatform();

  constructor(
    public generalService: GeneralService,
    private router: Router,
    public carsService: CarsService,
    public contactosService: ContactosService,
    private modalCtrl: ModalController,
    private route: ActivatedRoute,
    public motosService: MotosService,
    public camionesService: CamionesService
  ) {}

  ngOnInit() {
    this.generalService.tokenExistente$.subscribe((estado) => {
      this.isLoggedIn = estado;
    });

    this.generalService.tipoRol$.subscribe((rol) => {
      this.MyRole = rol;
    });

    const storage = localStorage.getItem('user');
    if (storage) {
      const usuario = JSON.parse(storage);
      this.mostrarPendientes = usuario.email === 'glenditaa.003@gmail.com';
    }

    this.FormatoPrecios = this.ubicacion === 'mis_autos_renta';
  }

  ngOnChanges(changes: SimpleChanges): void {
    if (changes['auto'] && this.auto?._id) {
      if (typeof this.carsLoaded[this.auto._id] === 'undefined') {
        this.carsLoaded[this.auto._id] = false;
      }
    }
  }

  // ✅ helper: detectar MIS vehículos
  get esMisVehiculos(): boolean {
    return (
      this.ubicacion === 'mis_autos' ||
      this.ubicacion === 'mis_motos' ||
      this.ubicacion === 'mis_camiones'
    );
  }

  public getImagen(a: AutoCard): string {
    const principal = (a?.imagenPrincipal || '').trim();
    if (principal) return principal;

    const first = (a?.imagenes?.[0] || '').trim();
    if (first) return first;

    return '/assets/home/no-image.jpeg';
  }

  markCarLoaded(id: string) {
    this.carsLoaded[id] = true;
  }

  public onImgError(event: Event, auto: AutoCard) {
    const img = event.target as HTMLImageElement;

    if (img?.dataset?.['fallbackTried'] === '1') {
      img.src = '/assets/home/no-image.jpeg';
      return;
    }
    if (img?.dataset) img.dataset['fallbackTried'] = '1';

    if (auto?.imagenes && auto.imagenes.length > 0) {
      img.src = auto.imagenes[0];
    } else {
      img.src = '/assets/home/no-image.jpeg';
    }
  }

  async agregarAFavoritos(vehicleId: string) {
    if (!this.isLoggedIn) {
      this.router.navigate(['/inicio']);
      this.generalService.alert(
        'Inicia sesión',
        'Debes iniciar sesión para poder agregar este vehículo a tus favoritos.',
        'info'
      );
      return;
    }

    await this.generalService.loading('Cargando...');

    this.carsService.agregarFavorito(vehicleId).subscribe({
      next: async () => {
        this.refrescarAutos.emit(this.ubicacion);
        await this.generalService.loadingDismiss();
      },
      error: async (err) => {
        await this.generalService.loadingDismiss();
        const mensaje =
          err.error?.message ||
          'No se pudo agregar el auto a favoritos. Intenta más tarde.';
        await this.generalService.alert('Error', mensaje, 'danger');
      },
    });
  }

  eliminarDeFavoritos(autoId: string) {
    this.carsService.eliminarFavorito(autoId).subscribe({
      next: () => {
        this.refrescarAutos.emit(this.ubicacion);
      },
      error: (_err) => {},
      complete: () => {
        this.generalService.loadingDismiss();
      },
    });
  }

  // ✅ TU FUNCIÓN TAL CUAL (respetada)
  toggleEstado(auto: any, event: Event) {
    event.stopPropagation();

    const esMoto = this.ubicacion === 'mis_motos';
    const esCamion = this.ubicacion === 'mis_camiones';

    const svc = esMoto
      ? this.motosService
      : esCamion
        ? this.camionesService
        : this.carsService;

    svc.toggleEstadoVehiculo(auto._id).subscribe({
      next: () => {
        auto.estadoVehiculo =
          auto.estadoVehiculo === 'disponible' ? 'vendido' : 'disponible';
        this.generalService.alert(
          'Estado actualizado',
          `Estado cambiado a "${auto.estadoVehiculo.toUpperCase()}".`,
          'success'
        );
      },
      error: (err) => {
        const mensaje = err?.error?.message || 'Error al cambiar el estado.';
        this.generalService.alert('Error', mensaje, 'danger');
      },
    });
  }

  // Navegación ficha pública
  ficha(auto: any) {
    const urlActual = this.router.url;
    const esDesdeBusqueda = /^\/search\/vehiculos\/[^\/]+$/.test(urlActual);
    localStorage.setItem('origenFicha', String(esDesdeBusqueda));

    if (auto.vehiculo === 'auto') {
      this.router.navigate(['/fichas/autos', auto._id]);
    } else if (auto.vehiculo === 'moto') {
      this.router.navigate(['/ficha/motos', auto._id]);
    } else if (auto.vehiculo === 'renta') {
      this.router.navigate(['/renta-ficha', auto._id]);
    } else if (auto.vehiculo === 'camion') {
      this.router.navigate(['/ficha/camiones', auto._id]);
    } else {
      this.router.navigate(['/ficha', auto._id]);
    }
  }

  update_car(auto: any, tipo: string) {
    if (this.ubicacion === 'mis_motos') {
      this.router.navigate(['/update-car', 'motos', auto._id]);
    } else if (this.ubicacion === 'mis_camiones') {
      this.router.navigate(['/update-car', 'camiones', auto._id]);
    } else if (this.ubicacion === 'mis_autos') {
      this.router.navigate(['/update-car', 'autos', auto._id]);
    } else if (this.ubicacion === 'mis_autos_renta') {
      this.router.navigate(['/edit-renta', auto._id]);
    } else {
      this.router.navigate(['/update-car', 'renta', auto._id]);
    }
  }

  onCardClick(auto: any, event: Event): void {
    event.stopPropagation();

    if (this.esMisVehiculos) {
      this.update_car(auto, this.ubicacion);
      return;
    }

    if (this.ubicacion === 'mis_autos_renta') {
      this.update_car(auto, this.ubicacion);
      return;
    }

    this.ficha(auto);
  }

  async abrirModalImagen(imagenes: string[], indice: number = 0) {
    const modal = await this.modalCtrl.create({
      component: ImagenesVehiculoComponent,
      componentProps: { imagenes, indice },
      cssClass: 'modal-imagen-personalizado',
      backdropDismiss: true,
      showBackdrop: true,
    });

    await modal.present();
  }

  obtenerPrecioMinimo(versiones: { Precio: number }[]): number {
    return Math.min(...versiones.map((v) => v.Precio));
  }
}