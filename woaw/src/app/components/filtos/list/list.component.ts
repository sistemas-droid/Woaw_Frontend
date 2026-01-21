// list.component.ts
import { Component, OnInit, Input } from '@angular/core';
import { CommonModule } from '@angular/common';
import { IonicModule, PopoverController } from '@ionic/angular';
import { CUSTOM_ELEMENTS_SCHEMA } from '@angular/core';
import { GeneralService } from '../../../services/general.service';
import { CarsService } from '../../../services/cars.service';
import { MotosService } from '../../../services/motos.service';

@Component({
  selector: 'app-list',
  templateUrl: './list.component.html',
  styleUrls: ['./list.component.scss'],
  standalone: true,
  imports: [IonicModule, CommonModule],
  schemas: [CUSTOM_ELEMENTS_SCHEMA],
})
export class ListComponent implements OnInit {
  @Input() tipo: string = '';
  @Input() extra?: string;

  // ✅ lista de autos/motos para construir opciones dinámicas (si se pasa desde el Page)
  @Input() autos?: any[];

  query: string = '';
  private opcionesBase: any[] = [];
  opcionesFiltradas: any[] = [];

  constructor(
    private popoverCtrl: PopoverController,
    private generalService: GeneralService,
    private carsService: CarsService,
    private motosService: MotosService
  ) {}

  ngOnInit() {
    // ---------- PRECIO ----------
    if (this.tipo === 'precio') {
      if (this.extra === 'renta') {
        this.opcionesBase = [
          { label: '$500 - $699', rango: [500, 699] },
          { label: '$700 - $899', rango: [700, 899] },
          { label: '$900 - $1,099', rango: [900, 1099] },
          { label: '$1,100 - $1,299', rango: [1100, 1299] },
          { label: '$1,300 - $1,499', rango: [1300, 1499] },
          { label: '$1,500 - $1,999', rango: [1500, 1999] },
          { label: '$2,000 - $2,499', rango: [2000, 2499] },
          { label: '$2,500 - $2,999', rango: [2500, 2999] },
          { label: '$3,000 - $3,999', rango: [3000, 3999] },
          { label: '$4,000 o más', rango: [4000, Infinity] },
        ];
      } else {
        this.opcionesBase = [
          { label: 'Menos de $100,000', rango: [0, 99999] },
          { label: '$100,000 - $149,999', rango: [100000, 149999] },
          { label: '$150,000 - $199,999', rango: [150000, 199999] },
          { label: '$200,000 - $249,999', rango: [200000, 249999] },
          { label: '$250,000 - $299,999', rango: [250000, 299999] },
          { label: '$300,000 - $399,999', rango: [300000, 399999] },
          { label: '$400,000 - $499,999', rango: [400000, 499999] },
          { label: '$500,000 - $699,999', rango: [500000, 699999] },
          { label: '$700,000 - $999,999', rango: [700000, 999999] },
          { label: 'Más de $1,000,000', rango: [1000000, Infinity] },
        ];
      }

      this.applyFilter();
      return;
    }

    // ---------- AÑO ----------
    if (this.tipo === 'anio') {
      const anioActual = new Date().getFullYear();
      const url = window.location.pathname;

      if (url.includes('/seminuevos')) {
        this.opcionesBase = this.generarRangoAnios(anioActual - 1, anioActual - 5);
      } else if (url.includes('/usados')) {
        this.opcionesBase = this.generarRangoAnios(anioActual - 6, 2008);
      } else {
        this.opcionesBase = this.generarRangoAnios(anioActual, 1950);
      }

      this.applyFilter();
      return;
    }

    // ---------- COLOR ----------
    if (this.tipo === 'color') {
      this.opcionesBase = [
        { label: 'Blanco' }, { label: 'Negro' }, { label: 'Gris' }, { label: 'Plateado' },
        { label: 'Rojo' }, { label: 'Azul' }, { label: 'Azul marino' }, { label: 'Verde' },
        { label: 'Verde oscuro' }, { label: 'Beige' }, { label: 'Café' }, { label: 'Amarillo' },
        { label: 'Naranja' }, { label: 'Morado' }, { label: 'Vino' }, { label: 'Oro' },
        { label: 'Bronce' }, { label: 'Turquesa' }, { label: 'Gris Oxford' }, { label: 'Arena' },
        { label: 'Azul cielo' }, { label: 'Grafito' }, { label: 'Champagne' }, { label: 'Titanio' },
        { label: 'Cobre' }, { label: 'Camaleón' }, { label: 'Otro' },
      ];

      this.applyFilter();
      return;
    }

    // ---------- TIPO VENTA (Nuevo / Seminuevo / Usado) ----------
    if (this.tipo === 'tipoVenta') {
      // Fijo y confiable. Si quieres dinámico, abajo te dejo el helper listo.
      this.opcionesBase = [
        { label: 'Nuevo', key: 'nuevo' },
        { label: 'Seminuevo', key: 'seminuevo' },
        { label: 'Usado', key: 'usado' },
      ];

      // Si prefieres dinámico (según lo que venga en autos), descomenta:
      // this.opcionesBase = this.buildTipoVentaOptionsFromAutos(this.autos);

      this.applyFilter();
      return;
    }

    // ---------- MARCA ----------
    if (this.tipo === 'marca') {
      if (this.extra === 'motos') {
        this.getMarcas_motos();
      } else if (this.extra === 'camiones') {
        this.opcionesBase = [];
        this.applyFilter();
      } else {
        this.getMarcas_coches();
      }
      return;
    }

    // ---------- TIPO (SUV, Sedán, etc.) ----------
    if (this.tipo === 'tipo') {
      if (this.extra === 'motos' || this.extra === 'camiones') {
        this.opcionesBase = [];
        this.applyFilter();
      } else {
        this.getTipos_coches();
      }
      return;
    }

    // ---------- VEHÍCULO GENERAL (coche/moto) ----------
    if (this.tipo === 'tipoVehiculoGeneral') {
      const dinamicas = this.buildVehiculoGeneralOptionsFromAutos(this.autos);
      const base = dinamicas.length ? dinamicas : this.buildVehiculoGeneralFallback();

      // coche primero
      this.opcionesBase = base
        .map((x) => ({ key: x.key, label: x.label ?? this.capitalizar(x.key) }))
        .sort((a, b) => {
          const ra = a.key === 'coche' ? 0 : 1;
          const rb = b.key === 'coche' ? 0 : 1;
          return ra - rb;
        });

      this.applyFilter();
      return;
    }

    // ---------- DEFAULT ----------
    this.opcionesBase = [];
    this.applyFilter();
  }

  // ✅ Icono para tipoVehiculoGeneral
  getVehiculoIcon(opcion: any): string {
    const k = this.normalize(opcion?.key ?? opcion?.label);
    if (k === 'coche') return 'car-sport-outline';
    if (k === 'moto') return 'bicycle-outline'; // si tienes 'motorcycle-outline' cámbialo
    return 'help-circle-outline';
  }

  getOpcionLabel(opcion: any): string {
    return opcion?.label ?? opcion?.key ?? '';
  }

  onSearchChange(ev: any) {
    this.query = (ev?.target?.value ?? '').toString();
    this.applyFilter();
  }

  onClear() {
    this.query = '';
    this.applyFilter();
  }

  private applyFilter() {
    const q = this.normalize(this.query);
    if (!q) {
      this.opcionesFiltradas = [...this.opcionesBase];
      return;
    }

    this.opcionesFiltradas = this.opcionesBase.filter((op) => {
      const label = this.normalize(op?.label);
      const key = this.normalize(op?.key);
      return label.includes(q) || key.includes(q);
    });
  }

  seleccionar(opcion: any) {
    if (opcion?.quitar) this.popoverCtrl.dismiss(null);
    else this.popoverCtrl.dismiss(opcion);
  }

  generarRangoAnios(desde: number, hasta: number): any[] {
    const lista: any[] = [];
    for (let anio = desde; anio >= hasta; anio--) {
      lista.push({ label: anio.toString(), anio, key: anio.toString() });
    }
    return lista;
  }

  ocultarImagen(event: any) {
    event.target.style.display = 'none';
  }

  obtenerColorHex(nombre: string): string {
    const colores: { [key: string]: string } = {
      Blanco: '#FFFFFF', Negro: '#000000', Gris: '#808080', 'Gris Oxford': '#4B4B4B', Plateado: '#C0C0C0',
      Rojo: '#FF0000', Azul: '#0000FF', 'Azul marino': '#000080', 'Azul cielo': '#87CEEB',
      Verde: '#008000', 'Verde oscuro': '#006400', Beige: '#F5F5DC', Café: '#8B4513',
      Amarillo: '#FFFF00', Naranja: '#FFA500', Morado: '#800080', Vino: '#800000',
      Oro: '#FFD700', Bronce: '#CD7F32', Turquesa: '#40E0D0', Arena: '#D6A77A',
      Grafito: '#3B3B3B', Champagne: '#F7E7CE', Titanio: '#8C8C8C', Cobre: '#B87333',
      Camaleón: '#7FFF00', Otro: '#999999',
    };
    return colores[nombre] || '#cccccc';
  }

  getMarcas_coches() {
    this.carsService.getMarcas_all().subscribe({
      next: (res: any[]) => {
        this.opcionesBase = (res || [])
          .map((marca) => ({
            label: marca.nombre,
            key: (marca.key ?? marca.nombre ?? '').toString().toLowerCase(),
            imageUrl: marca.imageUrl,
          }))
          .sort((a, b) => a.label.localeCompare(b.label));

        this.applyFilter();
      },
      error: (err) => {
        console.warn(err?.error?.message || 'Error al cargar marcas');
        this.opcionesBase = [];
        this.applyFilter();
      },
    });
  }

  getMarcas_motos() {
    this.motosService.getMarcas_all().subscribe({
      next: (res: any[]) => {
        this.opcionesBase = (res || [])
          .map((marca) => ({
            label: marca.nombre,
            key: (marca.key ?? marca.nombre ?? '').toString().toLowerCase(),
            imageUrl: marca.imageUrl,
          }))
          .sort((a, b) => a.label.localeCompare(b.label));

        this.applyFilter();
      },
      error: (err) => {
        console.warn(err?.error?.message || 'Error al cargar marcas');
        this.opcionesBase = [];
        this.applyFilter();
      },
    });
  }

  getTipos_coches() {
    this.carsService.gatTiposVeiculos().subscribe({
      next: (res: any[]) => {
        this.opcionesBase = (res || [])
          .map((tipo) => ({
            label: tipo,
            key: tipo.toLowerCase().replace(/\s+/g, '-'),
          }))
          .sort((a, b) => a.label.localeCompare(b.label));

        this.applyFilter();
      },
      error: (err) => {
        console.warn(err?.error?.message || 'Error al cargar tipos');
        this.opcionesBase = [];
        this.applyFilter();
      },
    });
  }

  trackByKey = (_: number, item: any) => item?.key ?? item?.label ?? item;

  private buildVehiculoGeneralOptionsFromAutos(autos?: any[]): any[] {
    if (!Array.isArray(autos) || autos.length === 0) return [];

    const set = new Set<string>();

    for (const a of autos) {
      const raw = a?.tipoVehiculoGeneral ?? a?.tipo ?? a?.categoria;
      let v = this.normalize(raw);
      if (!v) continue;

      if (v === 'carro' || v === 'auto' || v === 'automovil') v = 'coche';
      if (v === 'motocicleta' || v === 'motos') v = 'moto';

      if (v === 'coche' || v === 'moto') set.add(v);
    }

    return Array.from(set).map((v) => ({ key: v, label: this.capitalizar(v) }));
  }

  // (Opcional) dinámico para tipoVenta, si algún día te llega algo distinto
  private buildTipoVentaOptionsFromAutos(autos?: any[]): any[] {
    if (!Array.isArray(autos) || autos.length === 0) {
      return [
        { label: 'Nuevo', key: 'nuevo' },
        { label: 'Seminuevo', key: 'seminuevo' },
        { label: 'Usado', key: 'usado' },
      ];
    }

    const set = new Set<string>();
    for (const a of autos) {
      const tv = (a?.tipoVenta ?? '').toString().trim();
      if (tv) set.add(tv);
    }

    return Array.from(set)
      .map((v) => ({ label: v, key: this.normalize(v) }))
      .sort((a, b) => a.label.localeCompare(b.label));
  }

  private buildVehiculoGeneralFallback(): any[] {
    return [
      { key: 'coche', label: 'Coche' },
      { key: 'moto', label: 'Moto' },
    ];
  }

  private capitalizar(s: string): string {
    if (!s) return '';
    return s.charAt(0).toUpperCase() + s.slice(1);
  }

  private normalize(v: any): string {
    return (v ?? '')
      .toString()
      .trim()
      .toLowerCase()
      .normalize('NFD')
      .replace(/\p{Diacritic}/gu, '');
  }
}
