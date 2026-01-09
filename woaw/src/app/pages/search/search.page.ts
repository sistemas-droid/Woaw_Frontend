import { Component, OnInit, ViewChild } from '@angular/core';
import { ActivatedRoute, Router } from '@angular/router';
import { CarsService } from '../../services/cars.service';
import { MotosService } from '../../services/motos.service';
import { GeneralService } from '../../services/general.service';
import { IonContent, PopoverController } from '@ionic/angular';
import { ListComponent } from '../../components/filtos/list/list.component';
import { SearchService, SearchResult } from '../../services/search.service';
import { forkJoin, of } from 'rxjs';
import { catchError } from 'rxjs/operators';

@Component({
  selector: 'app-search',
  templateUrl: './search.page.html',
  styleUrls: ['./search.page.scss'],
  standalone: false,
})
export class SearchPage implements OnInit {
  public resultados: any[] = [];
  public resultadosFiltrados: any[] = [];
  public totalVehiculos: number = 0;
  public terminoBusqueda: string = '';
  public tipoBusqueda: string = '';

  @ViewChild('pageContent') content!: IonContent;
  @ViewChild('pageContent', { static: false }) pageContent!: IonContent;

  resultadosPaginados: any[] = [];
  serviciosSugeridos: any[] = [];

  tieneResultadosPaginados: boolean = false;

  paginaActual = 1;
  paginas: number[] = [];
  totalPaginas = 0;

  autosFavoritosIds: Set<string> = new Set();
  itemsPorPagina!: number;
  idsMisVehiculos: string[] = [];

  serviciosEncontrados: SearchResult[] = [];
  mostrarServicios: boolean = false;

  filtros = [
    { label: 'Vehículo', tipo: 'tipoVehiculoGeneral' }, // coche / moto
    { label: 'Precio', tipo: 'precio' },
    { label: 'Color', tipo: 'color' },
  ];

  filtrosAplicados: any = {
    tipoVehiculoGeneral: null,
    precio: null,
    anio: null,
    color: null,
    marca: null,
    tipo: null,
  };

  constructor(
    private route: ActivatedRoute,
    private generalService: GeneralService,
    public carsService: CarsService,
    public motosService: MotosService,
    private popoverCtrl: PopoverController,
    private searchService: SearchService,
    private router: Router
  ) {}

  ngOnInit() {
    this.cargarServiciosSugeridos();

    this.generalService.valorGlobal$.subscribe((valor) => {
      this.itemsPorPagina = valor;
    });

    this.generalService.terminoBusqueda$.subscribe((termino) => {
      if (termino) this.tipoBusqueda = termino;
    });

    this.route.paramMap.subscribe((params) => {
      const termino = params.get('termino');
      if (termino) {
        this.terminoBusqueda = termino;
        this.buscarVehiculos(termino);
        this.buscarServicios(termino);
      }
    });
  }

  buscarServicios(termino: string) {
    this.serviciosEncontrados = this.searchService.buscarServicios(termino);
    this.mostrarServicios = !!(this.serviciosEncontrados?.length);
  }

  navegarAServicio(ruta: string) {
    this.router.navigateByUrl(ruta);
  }

  // ---------------- HELPERS ----------------
  private norm(s: any): string {
    return (s ?? '')
      .toString()
      .toLowerCase()
      .trim()
      .normalize('NFD')
      .replace(/[\u0300-\u036f]/g, '');
  }

  private calcularPrecioDesdeHasta(item: any): { precioDesde: number; precioHasta: number } {
    if (Array.isArray(item?.version) && item.version.length > 0) {
      const precios = item.version
        .map((v: any) => v?.Precio)
        .filter((p: any) => typeof p === 'number');

      if (precios.length) {
        return { precioDesde: Math.min(...precios), precioHasta: Math.max(...precios) };
      }
    }

    const p =
      typeof item?.precio === 'number'
        ? item.precio
        : typeof item?.Precio === 'number'
        ? item.Precio
        : 0;

    return { precioDesde: p, precioHasta: p };
  }

  private extraerArrayDeRespuesta(res: any): any[] {
    const candidatos = [res?.coches, res?.vehiculos, res?.resultados, res?.data, res?.motos];
    for (const c of candidatos) if (Array.isArray(c)) return c;
    if (Array.isArray(res)) return res;
    return [];
  }

  private buildTextVehiculo(v: any): string {
    const parts: string[] = [];
    if (v?.marca) parts.push(v.marca);
    if (v?.modelo) parts.push(v.modelo);
    if (v?.anio) parts.push(String(v.anio));
    if (v?.tipoVehiculo) parts.push(v.tipoVehiculo);
    if (v?.categoria) parts.push(v.categoria);
    if (v?.tipo) parts.push(v.tipo);
    if (v?.cilindraje) parts.push(String(v.cilindraje));
    if (v?.cc) parts.push(String(v.cc));
    return this.norm(parts.join(' '));
  }

  // ✅ LA CLAVE: inferir si un item es moto o coche
  private inferirTipoGeneral(item: any): 'coche' | 'moto' {
    const posibles = [
      item?.tipoVehiculoGeneral,
      item?.categoria,
      item?.tipo,
      item?.tipoVehiculo,
    ]
      .map((x: any) => this.norm(x))
      .join(' ');

    // si dice "moto" en algún lado
    if (posibles.includes('moto') || posibles.includes('motocic')) return 'moto';

    // campos típicos de motos (ajusta si tus modelos tienen otros)
    if (item?.cilindraje || item?.cc || item?.categoriaMoto || item?.tipoMoto) return 'moto';

    return 'coche';
  }

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

  private getVehiculoSeleccionado(): string {
    const fvg = this.filtrosAplicados?.tipoVehiculoGeneral;

    const raw =
      fvg && typeof fvg === 'object'
        ? (fvg.key ?? fvg.label)
        : fvg;

    const v = this.norm(raw);

    if (v === 'carro' || v === 'auto' || v === 'automovil' || v === 'coches' || v === 'carros') return 'coche';
    if (v === 'motocicleta' || v === 'motos') return 'moto';

    return v; // 'coche' | 'moto' | ''
  }

  // ✅ ubícacion para tu componente de cartas
  getUbicacionCard(item: any): string {
    const t = this.norm(item?.tipoVehiculoGeneral);
    return t === 'moto' ? 'm-nuevos' : 'nuevos';
  }

  // ---------------- BUSQUEDA ----------------
  buscarVehiculos(termino: string) {
    const q = this.norm(termino);

    forkJoin({
      carsRes: this.carsService.search(termino, this.tipoBusqueda).pipe(
        catchError((err) => {
          console.warn('carsService.search falló:', err);
          return of(null);
        })
      ),
      motosRes: this.motosService.getMotos().pipe(
        catchError((err) => {
          console.warn('motosService.getMotos falló:', err);
          return of(null);
        })
      ),
    }).subscribe({
      next: ({ carsRes, motosRes }: any) => {
        const carsRaw = carsRes ? this.extraerArrayDeRespuesta(carsRes) : [];
        const contadorCars = typeof carsRes?.contador === 'number' ? carsRes.contador : carsRaw.length;

        // ✅ normalizamos lo que venga del carsService (puede traer motos)
        const normalizadosCars = (carsRaw || []).map((item: any) => {
          const { precioDesde, precioHasta } = this.calcularPrecioDesdeHasta(item);
          const tipo = this.inferirTipoGeneral(item);

          return {
            ...item,
            tipoVehiculoGeneral: tipo,
            imagen: item.imagenPrincipal || item.imagen || '/assets/default-car.webp',
            precioDesde,
            precioHasta,
          };
        });

        // ---- MOTOS SERVICE ----
        const motosRaw = motosRes ? this.extraerArrayDeRespuesta(motosRes) : [];
        const motosFiltradasPorTermino = (motosRaw || []).filter((m: any) => {
          const txt = this.buildTextVehiculo(m);
          return !q || txt.includes(q);
        });

        const normalizadosMotos = motosFiltradasPorTermino.map((item: any) => {
          const { precioDesde, precioHasta } = this.calcularPrecioDesdeHasta(item);
          return {
            ...item,
            tipoVehiculoGeneral: 'moto',
            imagen: item.imagenPrincipal || item.imagen || '/assets/default-car.webp',
            precioDesde,
            precioHasta,
          };
        });

        // ✅ unir + deduplicar por _id (para que no salgan repetidas si vienen en ambos)
        const map = new Map<string, any>();
        const push = (it: any) => {
          const id = it?._id ? String(it._id) : null;
          if (!id) return;
          if (!map.has(id)) map.set(id, it);
        };

        [...normalizadosCars, ...normalizadosMotos].forEach(push);

        const unidos = Array.from(map.values());

        // ✅ si no hay filtro vehículo, coches primero
        this.resultados = this.ordenarPorTipoVehiculo(unidos);

        // contador “visible”: no confíes en contador del back si mezcla, usa length real
        this.totalVehiculos = this.resultados.length;

        // ✅ aplica filtros (estricto coche/moto)
        this.aplicarFiltros();

        this.getCarsFavoritos();
        this.misAutosid();
      },
      error: (err) => {
        console.warn('Error en búsqueda:', err);
        this.generalService.alert('Error', 'No se pudo realizar la búsqueda');
      },
    });
  }

  // ---------------- FAVORITOS ----------------
  getCarsFavoritos() {
    this.carsService.getCarsFavoritos().subscribe({
      next: (res: any) => {
        const vehicleIds = (res?.vehicles || []).map((vehicle: any) => vehicle.vehicleId);
        this.autosFavoritosIds = new Set(vehicleIds);
      },
      error: (_err) => {},
    });
  }

  // ---------------- MIS VEHICULOS ----------------
  misAutosid() {
    this.carsService.misAutosId().subscribe({
      next: (res: any) => {
        this.idsMisVehiculos = Array.isArray(res?.vehicleIds) ? res.vehicleIds : [];
      },
      error: (err) => {
        const mensaje = err?.error?.message || 'Error al obtener tus vehículos.';
        if (mensaje === 'No se encontraron vehículos para este usuario') this.idsMisVehiculos = [];
        else console.warn(mensaje);
      },
    });
  }

  // ---------------- FILTROS + PAGINACION ----------------
  aplicarFiltros() {
    const fp = this.filtrosAplicados.precio;
    const fc = this.filtrosAplicados.color;
    const selectedVehiculo = this.getVehiculoSeleccionado(); // 'coche' | 'moto' | ''

    this.resultadosFiltrados = this.resultados.filter((vehiculo) => {
      const tipo = this.norm(vehiculo?.tipoVehiculoGeneral);

      // ✅ filtro estricto
      const coincideVehiculo =
        !selectedVehiculo ||
        (selectedVehiculo === 'coche' && tipo === 'coche') ||
        (selectedVehiculo === 'moto' && tipo === 'moto');

      const coincidePrecio =
        !fp ||
        (Array.isArray(fp.rango) &&
          fp.rango.length === 2 &&
          typeof vehiculo.precioDesde === 'number' &&
          vehiculo.precioDesde >= fp.rango[0] &&
          vehiculo.precioDesde <= fp.rango[1]);

      const coincideColor =
        !fc ||
        (Array.isArray(vehiculo.color) &&
          vehiculo.color.some((c: string) => this.norm(c) === this.norm(fc.label))) ||
        (typeof vehiculo.color === 'string' && this.norm(vehiculo.color) === this.norm(fc.label));

      return coincideVehiculo && coincidePrecio && coincideColor;
    });

    // si NO hay filtro vehículo, coches arriba
    if (!selectedVehiculo) {
      this.resultadosFiltrados = this.ordenarPorTipoVehiculo(this.resultadosFiltrados);
    }

    this.paginaActual = 1;
    this.calcularPaginacion();
  }

  calcularPaginacion() {
    const total = this.resultadosFiltrados.length;
    this.totalPaginas = Math.ceil(total / this.itemsPorPagina);
    this.paginas = Array.from({ length: this.totalPaginas }, (_, i) => i + 1);
    this.paginaActual = 1;
    this.actualizarVihiculosPaginadas();
  }

  actualizarVihiculosPaginadas() {
    const inicio = (this.paginaActual - 1) * this.itemsPorPagina;
    const fin = inicio + this.itemsPorPagina;
    this.resultadosPaginados = this.resultadosFiltrados.slice(inicio, fin);
    this.tieneResultadosPaginados = this.resultadosPaginados.length > 0;
  }

  cambiarPagina(pagina: number) {
    this.paginaActual = pagina;
    this.actualizarVihiculosPaginadas();
    setTimeout(() => this.pageContent?.scrollToTop(400), 100);
  }

  ordenarAutos(criterio: string) {
    if (!this.resultadosFiltrados?.length) return;

    if (criterio === 'precioAsc') {
      this.resultadosFiltrados.sort((a, b) => (a.precioDesde ?? 0) - (b.precioDesde ?? 0));
    } else if (criterio === 'precioDesc') {
      this.resultadosFiltrados.sort((a, b) => (b.precioDesde ?? 0) - (a.precioDesde ?? 0));
    }

    this.paginaActual = 1;
    this.calcularPaginacion();
    setTimeout(() => this.pageContent?.scrollToTop(400), 100);
  }

  handleRefrescarAutos(_ubicacion: string) {
    this.buscarVehiculos(this.terminoBusqueda);
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

  async mostrarOpciones(ev: Event, tipo: string) {
    const popover = await this.popoverCtrl.create({
      component: ListComponent,
      event: ev,
      translucent: true,
      componentProps: { tipo, autos: this.resultados },
    });

    await popover.present();
    const { data } = await popover.onDidDismiss();

    this.filtrosAplicados[tipo] = data === null ? null : data;
    this.aplicarFiltros();
  }

  // paginación compacta
  get paginasReducidas(): (number | string)[] {
    const total = this.totalPaginas;
    const actual = this.paginaActual;
    const rango = 1;

    if (total <= 2) return this.paginas;

    const out: (number | string)[] = [];
    out.push(1);

    if (actual - rango > 2) out.push('...');
    for (let i = Math.max(2, actual - rango); i <= Math.min(total - 1, actual + rango); i++) {
      out.push(i);
    }
    if (actual + rango < total - 1) out.push('...');
    out.push(total);

    return out;
  }

  esNumero(valor: any): valor is number {
    return typeof valor === 'number';
  }

  cargarServiciosSugeridos() {
    this.serviciosSugeridos = [
      { titulo: 'Publicar Vehículo', descripcion: 'Vende o renta tu vehículo de forma rápida y segura', tipo: 'servicio', icono: 'add-circle', ruta: '/new-car' },
      { titulo: 'Seguros', descripcion: 'Encuentra el seguro ideal para tu vehículo', tipo: 'servicio', icono: 'shield-checkmark', ruta: '/seguros' },
      { titulo: 'Arrendar', descripcion: 'Arrendamiento de vehículos a tu medida', tipo: 'servicio', icono: 'business', ruta: '/arrendamiento' },
      { titulo: 'Autos Nuevos', descripcion: 'Descubre las últimas novedades del mercado', tipo: 'categoria', icono: 'car-sport', ruta: '/nuevos' },
      { titulo: 'Autos Seminuevos', descripcion: 'Calidad y confianza en vehículos seminuevos', tipo: 'categoria', icono: 'car', ruta: '/seminuevos' },
      { titulo: 'Autos Usados', descripcion: 'Las mejores opciones en vehículos usados', tipo: 'categoria', icono: 'time', ruta: '/usados' },
      { titulo: 'Motos', descripcion: 'Amplia variedad de motocicletas', tipo: 'categoria', icono: 'bicycle', ruta: '/m-nuevos' },
      { titulo: 'Camiones', descripcion: 'Vehículos comerciales y de carga', tipo: 'categoria', icono: 'bus', ruta: '/camiones/todos' },
    ];
  }
}