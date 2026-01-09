import { Component, OnInit } from '@angular/core';
import { MenuController } from '@ionic/angular';
import { GeneralService } from '../../../services/general.service';
import { CarsService } from '../../../services/cars.service';
import { ListComponent } from '../../../components/filtos/list/list.component';
import { PopoverController } from '@ionic/angular';
import { ModalController } from '@ionic/angular';
import { Router } from '@angular/router';

import { IonContent } from '@ionic/angular';
import { ViewChild } from '@angular/core';

interface Auto {
  marca: string;
  modelo: string;
  anio: number;
  tipo: string;
  precio: number;
  imagen: string;
}

@Component({
  selector: 'app-usados',
  templateUrl: './usados.page.html',
  styleUrls: ['./usados.page.scss'],
  standalone: false,
})
export class UsadosPage implements OnInit {
  esDispositivoMovil: boolean = false;
  autosStorage: any[] = [];

  filtros = [
    { label: 'Vehículo', tipo: 'tipoVehiculoGeneral' }, // 👈 NUEVO (coche / moto)
    { label: 'Marca', tipo: 'marca' },
    { label: 'Precio', tipo: 'precio' },
    { label: 'Tipo', tipo: 'tipo' }, // SUV, Sedán, etc.
    { label: 'Año', tipo: 'anio' },
    // { label: 'Color', tipo: 'color' },
  ];

  @ViewChild('pageContent') content!: IonContent;

  // ## ----- ☢️☢️☢️☢️
  filtrosAplicados: any = {
    tipoVehiculoGeneral: null, // 👈 NUEVO (coche / moto)
    precio: null,
    anio: null,
    color: null,
    marca: null,
    tipo: null, // 👈 (SUV, Sedán, etc.)
  };

  public autosFiltrados: any[] = [];

  usuario: any;
  mostrarPendientes: boolean = false;

  paginaActual = 1;
  itemsPorPagina!: number;
  totalPaginas = 1;
  paginas: number[] = [];

  autosPaginados: any[] = [];
  showSplash: boolean = true;

  autosFavoritosIds: Set<string> = new Set();
  public idsMisAutos: string[] = [];

  public isLoggedIn: boolean = false;
  public MyRole: string | null = null;
  public totalAutos: number = 0;

  ordenActivo: string | null = null;

  public mostrar_spinner: boolean = false;
  public tipo_spinner: number = 0;
  public texto_spinner: string = 'Cargando...';
  public textoSub_spinner: string = 'Espere un momento';

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

    this.getCarsUsados();

    this.generalService.tokenExistente$.subscribe((estado) => {
      this.isLoggedIn = estado;
    });
    this.generalService.tipoRol$.subscribe((rol) => {
      this.MyRole = rol;
    });

    this.generalService.valorGlobal$.subscribe((valor) => {
      this.itemsPorPagina = valor;
    });

    this.misAutos();
  }

  async misAutos() {
    if (!this.isLoggedIn) {
      this.idsMisAutos = [];
      return;
    }

    this.mostrar_spinner = true;

    this.carsService.misAutosId().subscribe({
      next: (res: any) => {
        if (res && Array.isArray(res.vehicleIds) && res.vehicleIds.length > 0) {
          this.idsMisAutos = res.vehicleIds;
        } else {
          this.idsMisAutos = [];
        }

        this.mostrar_spinner = false;
      },
      error: (err) => {
        this.mostrar_spinner = false;
        const mensaje = err?.error?.message || 'Error al obtener tus vehículos.';
        if (mensaje === 'No se encontraron vehículos para este usuario') {
          this.idsMisAutos = [];
        } else {
          console.warn(mensaje);
        }
      },
    });
  }

  getCarsUsados() {
    this.mostrar_spinner = true;

    this.carsService.getCarsUsados().subscribe({
      next: (res: any) => {
        const autos = res?.coches || [];

        const autosFiltrados = this.mostrarPendientes
          ? autos
          : autos.filter((auto: any) => auto.estadoPublicacion !== 'pendiente');

        this.autosStorage = autosFiltrados.map((auto: any) => {
          const precios = auto.version?.map((v: any) => v.Precio) || [];
          const precioDesde = precios.length ? Math.min(...precios) : 0;
          const precioHasta = precios.length ? Math.max(...precios) : 0;

          return {
            ...auto,
            estadoVehiculo: auto.estadoVehiculo || 'disponible',
            imagen: auto.imagenPrincipal || '/assets/default-car.webp',
            precioDesde,
            precioHasta,
          };
        });

        this.totalAutos = this.autosStorage.length;

        this.getCarsFavoritos();
        this.calcularPaginacion();

        this.mostrar_spinner = false;
      },
      error: (err) => {
        this.mostrar_spinner = false;
        const mensaje = err?.error?.message || 'Ocurrió un error inesperado';
        this.generalService.alert('Error al guardar los datos', mensaje);
      },
    });
  }

  // ## ----- Ver descripción de aúto
  async ficha(auto: any) {
    localStorage.setItem('autoFicha', JSON.stringify(auto));
    this.router.navigate(['/ficha', auto._id]);
  }

  // ## ----- Calculación de paginación
  calcularPaginacion() {
    this.totalPaginas = Math.ceil(this.autosStorage.length / this.itemsPorPagina);
    this.paginas = Array.from({ length: this.totalPaginas }, (_, i) => i + 1);
    this.mostrarPagina(this.paginaActual);
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

    setTimeout(() => {
      this.content.scrollToTop(400);
    }, 100);
  }

  doRefresh(event: any) {
    this.getCarsUsados();
    this.resetearFiltros();

    setTimeout(() => {
      event.target.complete();
    }, 1500);
  }

  // ## ----- Filtro ☢️☢️☢️☢️
  async mostrarOpciones(ev: Event, tipo: string) {
    const popover = await this.popoverCtrl.create({
      component: ListComponent,
      event: ev,
      translucent: true,
      // 👇 le paso tipo y autos por si ListComponent quiere armar categorías dinámicas
      componentProps: { tipo, autos: this.autosStorage },
    });

    await popover.present();
    const { data } = await popover.onDidDismiss();

    if (data === null) {
      this.filtrosAplicados[tipo] = null;
    } else {
      this.filtrosAplicados[tipo] = data;
    }

    this.aplicarFiltros();
  }

  // Helpers para normalizar strings
  private norm(s: any): string {
    return String(s || '').trim().toLowerCase();
  }

  // ## ----- ☢️☢️☢️☢️
  aplicarFiltros() {
    let autosFiltrados = [...this.autosStorage];

    const { precio, anio, color, marca, tipo, tipoVehiculoGeneral } = this.filtrosAplicados;

    // 🚗🏍️ FILTRO COCHE / MOTO (nuevo)
    // Soporta diferentes nombres de campo por si tu backend usa otro:
    // auto.tipo (ideal) || auto.categoria || auto.tipoVehiculoGeneral
    if (tipoVehiculoGeneral?.label) {
      const wanted = this.norm(tipoVehiculoGeneral.label);

      autosFiltrados = autosFiltrados.filter((auto) => {
        const candidato =
          this.norm(auto?.tipo) ||
          this.norm(auto?.categoria) ||
          this.norm(auto?.tipoVehiculoGeneral);

        return candidato === wanted;
      });
    }

    if (precio) {
      autosFiltrados = autosFiltrados.filter(
        (auto) =>
          auto.precioDesde >= precio.rango[0] &&
          auto.precioDesde <= precio.rango[1]
      );
    }

    if (anio?.anio) {
      autosFiltrados = autosFiltrados.filter((auto) => auto.anio === anio.anio);
    }

    if (color?.label) {
      autosFiltrados = autosFiltrados.filter(
        (auto) => this.norm(auto.color) === this.norm(color.label)
      );
    }

    if (marca?.label) {
      autosFiltrados = autosFiltrados.filter(
        (auto) => this.norm(auto.marca) === this.norm(marca.label)
      );
    }

    // "Tipo" (SUV, Sedán, etc.) — tu filtro original, lo dejo igual nomás con norm por seguridad
    if (tipo?.label) {
      autosFiltrados = autosFiltrados.filter(
        (auto) => this.norm(auto.tipoVehiculo) === this.norm(tipo.label)
      );
    }

    this.autosFiltrados = autosFiltrados;
    this.totalPaginas = Math.ceil(autosFiltrados.length / this.itemsPorPagina);
    this.paginas = Array.from({ length: this.totalPaginas }, (_, i) => i + 1);
    this.autosPaginados = autosFiltrados.slice(0, this.itemsPorPagina);
    this.paginaActual = 1; // para que no te quedes en página muerta
  }

  getCarsFavoritos() {
    this.carsService.getCarsFavoritos().subscribe({
      next: (res: any) => {
        const vehicleIds = res.vehicles.map((vehicle: any) => vehicle.vehicleId);
        this.autosFavoritosIds = new Set(vehicleIds);
        this.mostrarPagina(this.paginaActual);
      },
      error: (err) => {
        const mensaje = err?.error?.message || 'Ocurrió un error inesperado';
      },
    });
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

    // Mostrar spinner
    await this.generalService.loading('Agregando a favoritos...');

    this.carsService.agregarFavorito(autoId).subscribe({
      next: async () => {
        this.getCarsUsados();
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

  handleRefrescarAutos(ubicacion: string) {
    if (ubicacion === 'usados') {
      this.getCarsUsados();
    }
  }

  ordenarAutos(criterio: string) {
    this.ordenActivo = criterio;

    const base = this.autosFiltrados.length ? this.autosFiltrados : [...this.autosStorage];

    switch (criterio) {
      case 'precioAsc':
        base.sort((a, b) => a.precioDesde - b.precioDesde);
        break;
      case 'precioDesc':
        base.sort((a, b) => b.precioDesde - a.precioDesde);
        break;
      default:
        base.sort((a, b) => b.anio - a.anio);
        break;
    }

    this.autosFiltrados = base;
    this.totalPaginas = Math.ceil(base.length / this.itemsPorPagina);
    this.paginas = Array.from({ length: this.totalPaginas }, (_, i) => i + 1);
    this.autosPaginados = base.slice(0, this.itemsPorPagina);
    this.paginaActual = 1;
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
    this.autosFiltrados = [];
    this.calcularPaginacion();
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
    for (
      let i = Math.max(2, actual - rango);
      i <= Math.min(total - 1, actual + rango);
      i++
    ) {
      paginas.push(i);
    }
    if (actual + rango < total - 1) paginas.push('...');
    paginas.push(total);

    return paginas;
  }
}