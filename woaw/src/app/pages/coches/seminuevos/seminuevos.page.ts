import { Component, OnInit, ViewChild } from '@angular/core';
import { MenuController } from '@ionic/angular';
import { GeneralService } from '../../../services/general.service';
import { CarsService } from '../../../services/cars.service';
import { ListComponent } from '../../../components/filtos/list/list.component';
import { PopoverController } from '@ionic/angular';
import { ModalController } from '@ionic/angular';
import { Router } from '@angular/router';
import { IonContent } from '@ionic/angular';

@Component({
  selector: 'app-seminuevos',
  templateUrl: './seminuevos.page.html',
  styleUrls: ['./seminuevos.page.scss'],
  standalone: false,
})
export class SeminuevosPage implements OnInit {
  esDispositivoMovil: boolean = false;

  autosStorage: any[] = [];
  autosFiltrados: any[] = [];
  autosPaginados: any[] = [];

  public totalAutos: number = 0;

  // ✅ YA trae el filtro de VEHÍCULO
  filtros = [
    { label: 'Vehículo', tipo: 'tipoVehiculoGeneral' }, // coche / moto
    { label: 'Marca', tipo: 'marca' },
    { label: 'Precio', tipo: 'precio' },
    { label: 'Tipo', tipo: 'tipo' },
    { label: 'Año', tipo: 'anio' },
    // { label: 'Color', tipo: 'color' },
  ];

  // ✅ incluye tipoVehiculoGeneral y tipo
  filtrosAplicados: any = {
    tipoVehiculoGeneral: null, // coche/moto
    precio: null,
    anio: null,
    color: null,
    marca: null,
    tipo: null,
  };

  paginaActual = 1;
  itemsPorPagina!: number;
  totalPaginas = 1;
  paginas: number[] = [];

  public isLoggedIn: boolean = false;
  public MyRole: string | null = null;

  ordenActivo: string | null = null;

  autosFavoritosIds: Set<string> = new Set();
  public idsMisAutos: string[] = [];

  public mostrarPendientes: boolean = false;

  public mostrar_spinner: boolean = false;
  public tipo_spinner: number = 0;
  public texto_spinner: string = 'Cargando...';
  public textoSub_spinner: string = 'Espere un momento';

  @ViewChild('pageContent', { static: false }) content!: IonContent;

  constructor(
    private menu: MenuController,
    public generalService: GeneralService,
    private popoverCtrl: PopoverController,
    public carsService: CarsService,
    private modalCtrl: ModalController,
    private router: Router
  ) {}

  ngOnInit() {
    const storage = localStorage.getItem('user');
    if (storage) {
      const usuario = JSON.parse(storage);
      this.mostrarPendientes = usuario.email === 'glenditaa.003@gmail.com';
    }

    this.generalService.dispositivo$.subscribe((tipo) => {
      this.esDispositivoMovil = tipo === 'telefono' || tipo === 'tablet';
    });

    this.generalService.tokenExistente$.subscribe((estado) => {
      this.isLoggedIn = estado;
    });

    this.generalService.tipoRol$.subscribe((rol) => {
      this.MyRole = rol;
    });

    this.generalService.valorGlobal$.subscribe((valor) => {
      this.itemsPorPagina = valor;
      this.recalcularPaginacion();
      this.mostrarPagina(1);
    });

    this.getCarsSeminuevos();
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

  // ✅ “selección” del filtro Vehículo (puede venir {label,key} o string)
  private getVehiculoSeleccionado(): string {
    const fvg = this.filtrosAplicados?.tipoVehiculoGeneral;
    const raw = fvg && typeof fvg === 'object' ? (fvg.key ?? fvg.label) : fvg;

    const v = this.norm(raw);

    if (v === 'carro' || v === 'auto' || v === 'automovil') return 'coche';
    if (v === 'motocicleta' || v === 'motos') return 'moto';

    return v; // 'coche' | 'moto' | ''
  }

  // ✅ orden estable (si no hay filtro)
  private ordenarPorTipoVehiculo(arr: any[]): any[] {
    const rank = (t: any) => {
      const x = this.norm(t);
      if (x === 'coche') return 0;
      if (x === 'moto') return 1;
      return 9;
    };

    return arr
      .map((item, idx) => ({ item, idx }))
      .sort((a, b) => {
        const ra = rank(a.item?.tipoVehiculoGeneral);
        const rb = rank(b.item?.tipoVehiculoGeneral);
        if (ra !== rb) return ra - rb;
        return a.idx - b.idx;
      })
      .map((x) => x.item);
  }

  async misAutos() {
    if (!this.isLoggedIn) {
      this.idsMisAutos = [];
      return;
    }

    this.carsService.misAutosId().subscribe({
      next: (res: any) => {
        this.idsMisAutos = Array.isArray(res?.vehicleIds) ? res.vehicleIds : [];
      },
      error: (err) => {
        const mensaje = err?.error?.message || 'Error al obtener tus vehículos.';
        if (mensaje === 'No se encontraron vehículos para este usuario') this.idsMisAutos = [];
        else console.warn(mensaje);
      },
    });
  }

  getCarsSeminuevos() {
    this.mostrar_spinner = true;

    this.carsService.getCarsSeminuevos().subscribe({
      next: (res: any) => {
        const autos = res?.coches || [];

        const autosFiltradosBackend = this.mostrarPendientes
          ? autos
          : autos.filter((auto: any) => auto.estadoPublicacion !== 'pendiente');

        this.autosStorage = autosFiltradosBackend.map((auto: any) => {
          const precios =
            auto.version?.map((v: any) => v.Precio).filter((p: any) => typeof p === 'number') || [];

          const precioDesde = precios.length ? Math.min(...precios) : (auto.precio ?? auto.Precio ?? 0);
          const precioHasta = precios.length ? Math.max(...precios) : (auto.precio ?? auto.Precio ?? 0);

          return {
            ...auto,
            // ✅ CLAVE para el filtro coche/moto
            tipoVehiculoGeneral: 'coche',
            estadoVehiculo: auto.estadoVehiculo || 'disponible',
            imagen: auto.imagenPrincipal || '/assets/default-car.webp',
            precioDesde,
            precioHasta,
          };
        });

        this.totalAutos = this.autosStorage.length;

        this.getCarsFavoritos();
        this.misAutos();

        // ✅ aplica filtros actuales
        this.aplicarFiltros();

        this.mostrar_spinner = false;
      },
      error: (err) => {
        this.mostrar_spinner = false;
        const mensaje = err?.error?.message || 'Ocurrió un error inesperado';
        this.generalService.alert('Error al guardar los datos', mensaje);
      },
    });
  }

  doRefresh(event: any) {
    this.getCarsSeminuevos();
    this.resetearFiltros();

    setTimeout(() => {
      event.target.complete();
    }, 1500);
  }

  getCarsFavoritos() {
    this.carsService.getCarsFavoritos().subscribe({
      next: (res: any) => {
        const vehicleIds = (res?.vehicles || []).map((vehicle: any) => vehicle.vehicleId);
        this.autosFavoritosIds = new Set(vehicleIds);
      },
      error: (_err) => {},
    });
  }

  // ---------- FILTRO ----------
  async mostrarOpciones(ev: Event, tipo: string) {
    const popover = await this.popoverCtrl.create({
      component: ListComponent,
      event: ev,
      translucent: true,
      componentProps: {
        tipo,
        autos: this.autosStorage, // ✅ para construir opciones dinámicas (vehículo)
      },
    });

    await popover.present();
    const { data } = await popover.onDidDismiss();

    this.filtrosAplicados[tipo] = data === null ? null : data;

    this.aplicarFiltros();
  }

  aplicarFiltros() {
    const selectedVehiculo = this.getVehiculoSeleccionado(); // 'coche' | 'moto' | ''

    let base = [...this.autosStorage];

    const { precio, anio, color, marca, tipo } = this.filtrosAplicados;

    // ✅ 1) VEHÍCULO ESTRICTO
    if (selectedVehiculo) {
      base = base.filter((auto) => this.norm(auto?.tipoVehiculoGeneral) === selectedVehiculo);
    }

    // ✅ 2) Precio
    if (precio?.rango?.length === 2) {
      base = base.filter((auto) => {
        const p = typeof auto?.precioDesde === 'number' ? auto.precioDesde : 0;
        return p >= precio.rango[0] && p <= precio.rango[1];
      });
    }

    // ✅ 3) Año
    if (anio?.anio) {
      base = base.filter((auto) => Number(auto.anio) === Number(anio.anio));
    }

    // ✅ 4) Color (si lo activas en filtros)
    if (color?.label) {
      const c = this.norm(color.label);
      base = base.filter((auto) => this.norm(auto?.color) === c);
    }

    // ✅ 5) Marca
    if (marca?.label) {
      const m = this.norm(marca.label);
      base = base.filter((auto) => this.norm(auto?.marca) === m);
    }

    // ✅ 6) Tipo (carrocería/tipoVehiculo/tipo)
    if (tipo?.label) {
      const t = this.norm(tipo.label);
      base = base.filter((auto) => {
        const raw = auto?.tipoVehiculo ?? auto?.tipoCarroceria ?? auto?.tipo ?? '';
        return this.norm(raw) === t;
      });
    }

    // ✅ si NO hay filtro de vehículo, mantenemos coches arriba (por si mañana mezclas)
    if (!selectedVehiculo) {
      base = this.ordenarPorTipoVehiculo(base);
    }

    this.autosFiltrados = base;
    this.totalAutos = base.length;

    this.recalcularPaginacion();
    this.mostrarPagina(1);
  }

  resetearFiltros() {
    this.filtrosAplicados = {
      tipoVehiculoGeneral: null,
      precio: null,
      anio: null,
      color: null,
      marca: null,
      tipo: null,
    };
    this.aplicarFiltros();
  }

  // ---------- PAGINACIÓN ----------
  private recalcularPaginacion() {
    const list = this.autosFiltrados.length ? this.autosFiltrados : this.autosStorage;
    const per = this.itemsPorPagina || 10;

    this.totalPaginas = Math.max(1, Math.ceil(list.length / per));
    this.paginas = Array.from({ length: this.totalPaginas }, (_, i) => i + 1);

    if (this.paginaActual > this.totalPaginas) this.paginaActual = 1;
  }

  mostrarPagina(pagina: number) {
    this.paginaActual = pagina;

    const list = this.autosFiltrados.length ? this.autosFiltrados : this.autosStorage;

    const inicio = (pagina - 1) * this.itemsPorPagina;
    const fin = inicio + this.itemsPorPagina;

    this.autosPaginados = list.slice(inicio, fin);
  }

  cambiarPagina(pagina: number) {
    if (pagina < 1 || pagina > this.totalPaginas) return;

    this.mostrarPagina(pagina);

    setTimeout(() => {
      this.content?.scrollToTop(400);
    }, 100);
  }

  // ---------- ORDEN ----------
  ordenarAutos(criterio: string) {
    this.ordenActivo = criterio;

    const selectedVehiculo = this.getVehiculoSeleccionado();

    const base = this.autosFiltrados.length ? [...this.autosFiltrados] : [...this.autosStorage];

    switch (criterio) {
      case 'precioAsc':
        base.sort((a, b) => (a.precioDesde ?? 0) - (b.precioDesde ?? 0));
        break;
      case 'precioDesc':
        base.sort((a, b) => (b.precioDesde ?? 0) - (a.precioDesde ?? 0));
        break;
      default:
        base.sort((a, b) => (b.anio ?? 0) - (a.anio ?? 0));
        break;
    }

    // ✅ si NO hay filtro de vehículo, coches arriba
    if (!selectedVehiculo) {
      this.autosFiltrados = this.ordenarPorTipoVehiculo(base);
    } else {
      this.autosFiltrados = base;
    }

    this.recalcularPaginacion();
    this.mostrarPagina(1);
  }

  handleRefrescarAutos(ubicacion: string) {
    if (ubicacion === 'seminuevos') {
      this.getCarsSeminuevos();
    }
  }

  async ficha(auto: any) {
    localStorage.setItem('autoFicha', JSON.stringify(auto));
    this.router.navigate(['/ficha', auto._id]);
  }

  async agregarAFavoritos(autoId: string) {
    if (!this.isLoggedIn) {
      this.router.navigate(['/inicio']);
      this.generalService.alert(
        'Inicia sesión',
        'Debes iniciar sesión para poder agregar este vehículo a tus favoritos.',
        'info'
      );
      return;
    }

    await this.generalService.loading('Agregando a favoritos...');

    this.carsService.agregarFavorito(autoId).subscribe({
      next: async () => {
        this.getCarsSeminuevos();
        await this.generalService.loadingDismiss();
      },
      error: async (err) => {
        await this.generalService.loadingDismiss();
        const mensaje =
          err?.error?.message ||
          'No se pudo agregar el auto a favoritos. Intenta más tarde.';
        await this.generalService.alert('Error', mensaje, 'danger');
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
}