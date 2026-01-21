import { Component, OnInit, ViewChild } from '@angular/core';
import { MenuController, IonContent, PopoverController, ModalController } from '@ionic/angular';
import { GeneralService } from '../../../services/general.service';
import { CarsService } from '../../../services/cars.service';
import { ListComponent } from '../../../components/filtos/list/list.component';
import { PasosArrendamientoComponent } from '../../../components/modal/pasos-arrendamiento/pasos-arrendamiento.component';
import { ActivatedRoute, Router } from '@angular/router';
import { of } from 'rxjs';
import { catchError } from 'rxjs/operators';

@Component({
  selector: 'app-nuevos',
  templateUrl: './nuevos.page.html',
  styleUrls: ['./nuevos.page.scss'],
  standalone: false,
})
export class NuevosPage implements OnInit {
  esDispositivoMovil: boolean = false;

  autosStorage: any[] = [];          // ✅ ahora aquí guardamos SOLO coches
  public totalAutos: number = 0;
  public autosFiltrados: any[] = [];
  autosPaginados: any[] = [];

  filtros = [
    { label: 'Precio', tipo: 'precio' },
    { label: 'Marca', tipo: 'marca' },
  ];

  filtrosAplicados: any = {
    precio: null,
    anio: null,
    color: null,
    marca: null,
  };

  public isLoggedIn: boolean = false;
  public MyRole: string | null = null;
  autosFavoritosIds: Set<string> = new Set();
  ordenActivo: string | null = null;
  public idsMisAutos: string[] = [];

  // paginación
  paginaActual = 1;
  itemsPorPagina!: number;
  totalPaginas = 1;
  paginas: number[] = [];
  public dispositivo: string = '';

  showSplash: boolean = true;

  public mostrar_spinner: boolean = false;
  public tipo_spinner: number = 0;
  public texto_spinner: string = 'Cargando...';
  public textoSub_spinner: string = 'Espere un momento';

  @ViewChild('pageContent') content!: IonContent;

  constructor(
    private menu: MenuController,
    public generalService: GeneralService,
    private popoverCtrl: PopoverController,
    public carsService: CarsService,
    private modalCtrl: ModalController,
    private router: Router,
    private route: ActivatedRoute
  ) {}

  ngOnInit() {
    this.generalService.dispositivo$.subscribe((tipo) => {
      this.esDispositivoMovil = tipo === 'telefono' || tipo === 'tablet';
      this.dispositivo = tipo;
    });

    this.generalService.tokenExistente$.subscribe((estado) => {
      this.isLoggedIn = estado;
    });

    this.generalService.tipoRol$.subscribe((rol) => {
      this.MyRole = rol;
    });

    this.generalService.valorGlobal$.subscribe((valor) => {
      this.itemsPorPagina = valor;
      // ✅ ya que tenemos itemsPorPagina, cargamos catálogo
      this.getCatalogoNuevos();
    });

    this.misAutos();
  }

  // ---------- helpers ----------
  private norm(s: any): string {
    return (s ?? '')
      .toString()
      .toLowerCase()
      .trim()
      .normalize('NFD')
      .replace(/\p{Diacritic}/gu, '');
  }

  private calcularPrecioDesdeHasta(item: any): { precioDesde: number; precioHasta: number } {
    // coches con version[]
    if (Array.isArray(item?.version) && item.version.length > 0) {
      const precios = item.version
        .map((v: any) => v?.Precio)
        .filter((p: any) => typeof p === 'number');
      if (precios.length) {
        return { precioDesde: Math.min(...precios), precioHasta: Math.max(...precios) };
      }
    }

    // fallback
    const p =
      typeof item?.precio === 'number'
        ? item.precio
        : typeof item?.Precio === 'number'
        ? item.Precio
        : 0;

    return { precioDesde: p, precioHasta: p };
  }

  // ---------- CARGA SOLO COCHES ----------
  getCatalogoNuevos() {
    this.mostrar_spinner = true;

    this.carsService.getCarsNews().pipe(
      catchError((err) => {
        console.warn('getCarsNews falló:', err);
        return of(null);
      })
    ).subscribe({
      next: (carsRes: any) => {
        // ---- COCHES ----
        const cochesRaw = carsRes?.coches || [];
        const coches = (cochesRaw || []).map((auto: any) => {
          const { precioDesde, precioHasta } = this.calcularPrecioDesdeHasta(auto);
          return {
            ...auto,
            tipoVehiculoGeneral: 'coche',
            estadoVehiculo: auto.estadoVehiculo || 'disponible',
            imagen: auto.imagenPrincipal || '/assets/default-car.webp',
            precioDesde,
            precioHasta,
          };
        });

        this.autosStorage = coches;

        // favoritos + filtros + paginación
        this.totalAutos = this.autosStorage.length;
        this.getCarsFavoritos();

        // aplica filtros actuales
        this.aplicarFiltros();

        this.mostrar_spinner = false;
      },
      error: (err) => {
        this.mostrar_spinner = false;
        console.warn(err);
        this.autosStorage = [];
        this.autosFiltrados = [];
        this.autosPaginados = [];
        this.totalAutos = 0;
        this.calcularPaginacion();
      },
    });
  }

  getCarsFavoritos() {
    this.carsService.getCarsFavoritos().subscribe({
      next: (res: any) => {
        const vehicleIds = res.vehicles.map((vehicle: any) => vehicle.vehicleId);
        this.autosFavoritosIds = new Set(vehicleIds);
        // 👇 no llamo aplicarFiltros aquí para no duplicar; ya se llama al cargar
      },
      error: (_err) => {},
    });
  }

  // ---------- UI ----------
  async ficha(auto: any) {
    this.router.navigate(['/ficha', auto._id]);
  }

  doRefresh(event: any) {
    this.getCatalogoNuevos();

    // ✅ reseteo limpio
    this.filtrosAplicados = {
      precio: null,
      anio: null,
      color: null,
      marca: null,
    };

    setTimeout(() => event.target.complete(), 1500);
  }

  // ---------- Filtros ----------
  async mostrarOpciones(ev: Event, tipo: string) {
    const popover = await this.popoverCtrl.create({
      component: ListComponent,
      event: ev,
      translucent: true,
      componentProps: { tipo, autos: this.autosStorage },
    });

    await popover.present();
    const { data } = await popover.onDidDismiss();

    this.filtrosAplicados[tipo] = data === null ? null : data;
    this.aplicarFiltros();
  }

  aplicarFiltros() {
    let base = [...this.autosStorage];

    const { precio, anio, color, marca } = this.filtrosAplicados;

    // ✅ 1) PRECIO
    if (precio?.rango && Array.isArray(precio.rango) && precio.rango.length === 2) {
      base = base.filter((a) => {
        const p = typeof a?.precioDesde === 'number' ? a.precioDesde : (a?.precio ?? 0);
        return p >= precio.rango[0] && p <= precio.rango[1];
      });
    }

    // ✅ 2) AÑO (si lo usas después)
    if (anio?.anio) {
      base = base.filter((a) => a.anio === anio.anio);
    }

    // ✅ 3) COLOR (si existe en tu data)
    if (color?.label) {
      base = base.filter((a) => this.norm(a.color) === this.norm(color.label));
    }

    // ✅ 4) MARCA
    if (marca?.label) {
      base = base.filter((a) => this.norm(a.marca) === this.norm(marca.label));
    }

    this.autosFiltrados = base;
    this.totalAutos = base.length;

    // ✅ paginación bien
    this.calcularPaginacion();
    this.mostrarPagina(1);
  }

  resetearFiltros() {
    this.filtrosAplicados = {
      precio: null,
      anio: null,
      color: null,
      marca: null,
    };
    this.aplicarFiltros();
  }

  // ---------- Paginación ----------
  calcularPaginacion() {
    const base = this.autosFiltrados.length ? this.autosFiltrados : [...this.autosStorage];
    this.totalPaginas = Math.ceil(base.length / this.itemsPorPagina) || 1;
    this.paginas = Array.from({ length: this.totalPaginas }, (_, i) => i + 1);
  }

  mostrarPagina(pagina: number) {
    this.paginaActual = pagina;

    const base = this.autosFiltrados.length ? this.autosFiltrados : [...this.autosStorage];
    const inicio = (pagina - 1) * this.itemsPorPagina;
    const fin = inicio + this.itemsPorPagina;

    this.autosPaginados = base.slice(inicio, fin);
  }

  cambiarPagina(pagina: number) {
    this.mostrarPagina(pagina);
    setTimeout(() => this.content?.scrollToTop(400), 100);
  }

  // ---------- Orden ----------
  ordenarAutos(criterio: string) {
    this.ordenActivo = criterio;

    const base = [...(this.autosFiltrados.length ? this.autosFiltrados : this.autosStorage)];

    switch (criterio) {
      case 'precioAsc':
        base.sort((a, b) => (a.precioDesde ?? a.precio ?? 0) - (b.precioDesde ?? b.precio ?? 0));
        break;
      case 'precioDesc':
        base.sort((a, b) => (b.precioDesde ?? b.precio ?? 0) - (a.precioDesde ?? a.precio ?? 0));
        break;
      default:
        base.sort((a, b) => (b.anio ?? 0) - (a.anio ?? 0));
        break;
    }

    this.autosFiltrados = base;

    this.totalAutos = this.autosFiltrados.length;
    this.calcularPaginacion();
    this.mostrarPagina(1);

    setTimeout(() => this.content?.scrollToTop(400), 100);
  }

  // ---------- otros ----------
  handleRefrescarAutos(ubicacion: string) {
    if (ubicacion === 'nuevos') {
      this.getCatalogoNuevos();
    }
  }

  async misAutos() {
    if (!this.isLoggedIn) {
      this.idsMisAutos = [];
      return;
    }
    this.carsService.misAutosId().subscribe({
      next: (res: any) => {
        this.idsMisAutos = (res && Array.isArray(res.vehicleIds)) ? res.vehicleIds : [];
      },
      error: (err) => {
        const mensaje = err?.error?.message || 'Error al obtener tus vehículos.';
        if (mensaje === 'No se encontraron vehículos para este usuario') this.idsMisAutos = [];
        else console.warn(mensaje);
      },
    });
  }

  esNumero(valor: any): valor is number {
    return typeof valor === 'number';
  }

  get paginasReducidas(): (number | string)[] {
    const total = this.totalPaginas;
    const actual = this.paginaActual;
    const rango = 1;

    if (total <= 2) return this.paginas;

    const paginas: (number | string)[] = [];
    paginas.push(1);

    if (actual - rango > 2) paginas.push('...');
    for (let i = Math.max(2, actual - rango); i <= Math.min(total - 1, actual + rango); i++) {
      paginas.push(i);
    }
    if (actual + rango < total - 1) paginas.push('...');
    paginas.push(total);

    return paginas;
  }

  async abrirModalArrendamiento() {
    let modal;
    if (this.dispositivo === 'telefono') {
      modal = await this.modalCtrl.create({
        component: PasosArrendamientoComponent,
        breakpoints: [0, 0.7, 1],
        cssClass: 'modal-perfil',
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
        cssClass: 'modal-consentimiento',
      });
    }

    await modal.present();
  }
}
