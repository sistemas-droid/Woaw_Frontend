import { Component, OnInit } from '@angular/core';
import { FormBuilder, FormGroup, Validators, ReactiveFormsModule } from '@angular/forms';
import { CommonModule } from '@angular/common';
import { IonicModule, ToastController } from '@ionic/angular';
import { CUSTOM_ELEMENTS_SCHEMA } from '@angular/core';
import { RegistroService } from '../../../services/registro.service';
import { ModalController } from '@ionic/angular';
import imageCompression from 'browser-image-compression';
import { GeneralService } from '../../../services/general.service';
import { Router } from '@angular/router';
import { CarsService } from "../../../services/cars.service";
import { MotosService } from "../../../services/motos.service";

interface Marca {
  key: string;
  nombre: string;
  imageUrl: string;
}

interface DropdownConfig {
  campo: string;
  mostrarDropdown: boolean;
  datosFiltrados: any[];
  datosCompletos: any[];
  placeholder: string;
  maxLength: number;
  inputMode?: string;
  claseInput?: string;
}

@Component({
  selector: 'app-add-coche',
  templateUrl: './add-coche.page.html',
  styleUrls: ['./add-coche.page.scss'],
  standalone: false
})

export class AddCochePage implements OnInit {

  ubicacionesSeleccionadas: [string, string, number, number][] = [];
  formaddCarRenta!: FormGroup;

  public tipoDispocitivo: string = '';
  public isLoggedIn: boolean = false;
  public posicion: 1 | 2 | 3 | 4= 1;

  // Campos del formulario
  marca: string = '';
  modelo: string = '';
  tipo: string = '';
  transmision: string = '';
  combustible: string = '';
  pasajeros: string = '';
  precioPorDia: string = '';
  edadMinima: string = '';

  // Datos completos para los dropdowns
  marcas: any[] = [];
  modelos: any[] = [];
  tipos: any[] = [
    { nombre: 'Sedán' },
    { nombre: 'SUV' },
    { nombre: 'Camioneta' },
    { nombre: 'Hatchback' },
    { nombre: 'Coupe' },
    { nombre: 'Convertible' },
    { nombre: 'Minivan' },
    { nombre: 'Pickup' }
  ];

  transmisiones: any[] = [
    { nombre: 'Automática' },
    { nombre: 'Manual' }
  ];

  combustibles: any[] = [
    { nombre: 'Gasolina' },
    { nombre: 'Diésel' },
    { nombre: 'Eléctrico' },
    { nombre: 'Híbrido' }
  ];

  pasajerosLista: any[] = [
    { nombre: '2' }, { nombre: '4' }, { nombre: '5' },
    { nombre: '6' }, { nombre: '7' }, { nombre: '8' }
  ];

  preciosSugeridos: any[] = [
    { nombre: '300' }, { nombre: '400' }, { nombre: '500' },
    { nombre: '600' }, { nombre: '700' }, { nombre: '800' },
    { nombre: '900' }, { nombre: '1000' }, { nombre: '1200' },
    { nombre: '1500' }, { nombre: '2000' }
  ];

  edadesMinimas: any[] = [
    { nombre: '18' }, { nombre: '21' }, { nombre: '25' },
    { nombre: '30' }, { nombre: '35' }
  ];

  // Configuración de dropdowns
  dropdowns = {
    marcas: { mostrar: false, datosFiltrados: [] as any[] },
    modelos: { mostrar: false, datosFiltrados: [] as any[] },
    tipos: { mostrar: false, datosFiltrados: [] as any[] },
    transmisiones: { mostrar: false, datosFiltrados: [] as any[] },
    combustibles: { mostrar: false, datosFiltrados: [] as any[] },
    pasajeros: { mostrar: false, datosFiltrados: [] as any[] },
    precios: { mostrar: false, datosFiltrados: [] as any[] },
    edades: { mostrar: false, datosFiltrados: [] as any[] }
  };

  modeloEsPersonalizado: boolean = false;

  constructor(
    private fb: FormBuilder,
    private registroService: RegistroService,
    private toastCtrl: ToastController,
    private modalController: ModalController,
    private generalService: GeneralService,
    private router: Router,
    private carsService: CarsService,
  ) {
    this.formaddCarRenta = this.fb.group({
      nombre: ['', Validators.required],
      telefono: ['', [Validators.required, Validators.pattern('[0-9]{10}'), Validators.maxLength(25)]],
      email: ['', Validators.email],
      imagenPrincipal: [null, Validators.required],
      constancia: [null],
    });
  }

  ngOnInit() {
    this.generalService.dispositivo$.subscribe((tipo) => {
      this.tipoDispocitivo = tipo;
    });

    this.generalService.tokenExistente$.subscribe((estado) => {
      this.isLoggedIn = estado;
    });
    this.Renta_get_marcas();
  }

  // FUNCIONES GENÉRICAS PARA DROPDOWNS

  toggleDropdown(dropdownName: keyof typeof this.dropdowns) {
    // Cerrar todos los demás dropdowns
    Object.keys(this.dropdowns).forEach(key => {
      if (key !== dropdownName) {
        this.dropdowns[key as keyof typeof this.dropdowns].mostrar = false;
      }
    });

    // Alternar el dropdown actual
    this.dropdowns[dropdownName].mostrar = !this.dropdowns[dropdownName].mostrar;
  }

  seleccionarOpcion(valor: string, dropdownName: keyof typeof this.dropdowns, campo: string) {
    (this as any)[campo] = valor;
    this.dropdowns[dropdownName].mostrar = false;

    // Lógica especial para marca (cargar modelos)
    if (dropdownName === 'marcas') {
      this.modelo = ''; // Resetear modelo cuando cambia la marca
      this.modelos = []; // Limpiar modelos anteriores
      const marcaSeleccionada = this.marcas.find(m => m.nombre === valor);
      if (marcaSeleccionada?.key) {
        this.Renta_get_modelos(marcaSeleccionada.key);
      }
    }
  }

  onInput(event: any, dropdownName: keyof typeof this.dropdowns, datosCompletos: any[]) {
    const value = event.detail?.value || '';

    // Filtrar datos
    this.dropdowns[dropdownName].datosFiltrados = datosCompletos.filter(item =>
      item.nombre.toLowerCase().includes(value.toLowerCase())
    );

    // Mostrar dropdown si hay resultados
    if (value && this.dropdowns[dropdownName].datosFiltrados.length > 0) {
      this.toggleDropdown(dropdownName);
    }
  }

  onBlur(dropdownName: keyof typeof this.dropdowns) {
    setTimeout(() => {
      this.dropdowns[dropdownName].mostrar = false;
    }, 200);
  }

  // GETTERS PARA DATOS FILTRADOS
  get marcasFiltradas() {
    if (!this.marca) return this.marcas;
    return this.marcas.filter(marca =>
      marca.nombre.toLowerCase().includes(this.marca.toLowerCase())
    );
  }

  get modelosFiltrados() {
    if (!this.modelo) return this.modelos;
    return this.modelos.filter(modeloItem =>
      (modeloItem.modelo || modeloItem.nombre || '').toLowerCase().includes(this.modelo.toLowerCase())
    );
  }

  get tiposFiltrados() {
    return this.dropdowns.tipos.datosFiltrados.length > 0 ?
      this.dropdowns.tipos.datosFiltrados : this.tipos;
  }

  get transmisionesFiltradas() {
    return this.dropdowns.transmisiones.datosFiltrados.length > 0 ?
      this.dropdowns.transmisiones.datosFiltrados : this.transmisiones;
  }

  get combustiblesFiltrados() {
    return this.dropdowns.combustibles.datosFiltrados.length > 0 ?
      this.dropdowns.combustibles.datosFiltrados : this.combustibles;
  }

  get pasajerosFiltrados() {
    return this.dropdowns.pasajeros.datosFiltrados.length > 0 ?
      this.dropdowns.pasajeros.datosFiltrados : this.pasajerosLista;
  }

  get preciosFiltrados() {
    return this.dropdowns.precios.datosFiltrados.length > 0 ?
      this.dropdowns.precios.datosFiltrados : this.preciosSugeridos;
  }

  get edadesFiltradas() {
    return this.dropdowns.edades.datosFiltrados.length > 0 ?
      this.dropdowns.edades.datosFiltrados : this.edadesMinimas;
  }

  // MÉTODOS ESPECÍFICOS PARA MARCA Y MODELO (mantienen la lógica original)

  seleccionarMarca(marcaSeleccionada: any) {
    this.seleccionarOpcion(marcaSeleccionada.nombre, 'marcas', 'marca');
  }

  seleccionarModelo(modeloSeleccionado: any) {
    const valor = modeloSeleccionado.modelo || modeloSeleccionado.nombre || modeloSeleccionado;
    this.seleccionarOpcion(valor, 'modelos', 'modelo');
  }

  onMarcaInput(event: any) {
    this.onInput(event, 'marcas', this.marcas);
  }

  onModeloInput(event: any) {
    if (this.marca && this.modelos.length > 0) {
      this.onInput(event, 'modelos', this.modelos);
    }
  }

  // MÉTODOS PARA LOS NUEVOS CAMPOS
  seleccionarTipo(tipoItem: any) {
    this.seleccionarOpcion(tipoItem.nombre, 'tipos', 'tipo');
  }

  seleccionarTransmision(transmisionItem: any) {
    this.seleccionarOpcion(transmisionItem.nombre, 'transmisiones', 'transmision');
  }

  seleccionarCombustible(combustibleItem: any) {
    this.seleccionarOpcion(combustibleItem.nombre, 'combustibles', 'combustible');
  }

  seleccionarPasajeros(pasajeroItem: any) {
    this.seleccionarOpcion(pasajeroItem.nombre, 'pasajeros', 'pasajeros');
  }

  seleccionarPrecio(precioItem: any) {
    this.seleccionarOpcion(precioItem.nombre, 'precios', 'precioPorDia');
  }

  seleccionarEdad(edadItem: any) {
    this.seleccionarOpcion(edadItem.nombre, 'edades', 'edadMinima');
  }

  onTipoInput(event: any) {
    this.onInput(event, 'tipos', this.tipos);
  }

  onTransmisionInput(event: any) {
    this.onInput(event, 'transmisiones', this.transmisiones);
  }

  onCombustibleInput(event: any) {
    this.onInput(event, 'combustibles', this.combustibles);
  }

  onPasajerosInput(event: any) {
    this.onInput(event, 'pasajeros', this.pasajerosLista);
  }

  onPrecioInput(event: any) {
    this.onInput(event, 'precios', this.preciosSugeridos);
  }

  onEdadInput(event: any) {
    this.onInput(event, 'edades', this.edadesMinimas);
  }

  // MÉTODOS EXISTENTES (sin cambios)

  private registrarLote() {
    // Tu lógica para registrar
  }

  public limpiarPorPosicion() {
    switch (this.posicion) {
      case 1:
        this.marca = '';
        this.modelo = '';
        this.modelos = [];
        this.dropdowns.marcas.mostrar = false;
        this.dropdowns.modelos.mostrar = false;
        this.dropdowns.marcas.datosFiltrados = [];
        this.dropdowns.modelos.datosFiltrados = [];
        break;

      case 2:
        this.tipo = '';
        this.transmision = '';
        this.combustible = '';
        this.pasajeros = '';
        this.precioPorDia = '';
        this.edadMinima = '';

        // Ocultar dropdowns de posición 2
        this.dropdowns.tipos.mostrar = false;
        this.dropdowns.transmisiones.mostrar = false;
        this.dropdowns.combustibles.mostrar = false;
        this.dropdowns.pasajeros.mostrar = false;
        this.dropdowns.precios.mostrar = false;
        this.dropdowns.edades.mostrar = false;

        // Limpiar datos filtrados de posición 2
        this.dropdowns.tipos.datosFiltrados = [];
        this.dropdowns.transmisiones.datosFiltrados = [];
        this.dropdowns.combustibles.datosFiltrados = [];
        this.dropdowns.pasajeros.datosFiltrados = [];
        this.dropdowns.precios.datosFiltrados = [];
        this.dropdowns.edades.datosFiltrados = [];
        break;
      case 3:
        break;
      case 4:
        break;
      default:
        break;
    }
  }

  onNombreInput(ev: any) {
    const value: string = (ev?.detail?.value ?? '').toString();
    const normalizado = value.toLocaleUpperCase('es-MX').slice(0, 25);
    if (normalizado !== value) {
      this.formaddCarRenta.get('nombre')?.setValue(normalizado, { emitEvent: false });
    }
  }

  public async seleccionarUbicacion() {
    // Tu lógica existente
  }

  public irAInicio(): void {
    this.router.navigateByUrl('/inicio');
    this.posicion = 1;
  }

  public async sigiente() {
    switch (this.posicion) {
      case 1:
        this.posicion = 2;
        break;
      case 2:
        this.posicion = 3;
        break;
      case 3:
      // this.registrarLote();
      default:
        break;
    }
  }

  regresar() {
    this.router.navigateByUrl('/new-car');
  }

  public regresarPocicion() {
    switch (this.posicion) {
      case 2:
        this.posicion = 1;
        break;
      case 3:
        this.posicion = 2;
        break;
      case 4:
        this.posicion = 3;
        break;
      default:
        break;
    }
  }

  // Función para validar y retornar mensaje de error
  validarCampo_inputs(campo: string, valor: string, maxLength: number): string {
    if (!valor.trim()) {
      return 'Este campo es obligatorio';
    }

    if (valor.length > maxLength) {
      return `Máximo ${maxLength} caracteres`;
    }

    switch (campo) {
      case 'modelo':
        if (!this.marca) {
          return 'Selecciona primero una marca';
        }
        break;
      case 'pasajeros':
      case 'edadMinima':
        if (!/^\d+$/.test(valor)) {
          return 'Solo se permiten números';
        }
        break;
      case 'precioPorDia':
        if (!/^\d+$/.test(valor)) {
          return 'Solo se permiten números';
        }
        if (parseInt(valor) < 50) {
          return 'El precio mínimo es $50';
        }
        break;
    }

    return ''; 
  }

  private validarPosicionActual(pocicion: number){

  }

  // -----
  // ----- PETICIONES ----
  // -----

  private Renta_get_marcas() {
    this.carsService.getMarcas_all().subscribe({
      next: (data: Marca[]) => {
        this.marcas = (data || []).sort((a: Marca, b: Marca) =>
          (a.nombre || "")
            .toLowerCase()
            .localeCompare((b.nombre || "").toLowerCase())
        );
        console.log("Marcas cargadas (renta):", this.marcas);
      },
      error: (err) => {
        const mensaje =
          err?.error?.message || "Error al cargar marcas - Renta";
        console.warn(mensaje);
      },
      complete: () => {
        this.generalService.loadingDismiss();
      },
    });
  }

  private Renta_get_modelos(marca: string) {
    if (!marca) {
      this.modelos = [];
      return;
    }

    const dummyYear = new Date().getFullYear();

    this.carsService.GetModelos(marca as any, dummyYear as any).subscribe({
      next: (data: any) => {
        const raw: any[] = Array.isArray(data)
          ? data
          : Array.isArray(data?.modelos)
            ? data.modelos
            : Array.isArray(data?.data)
              ? data.data
              : [];

        const list = raw
          .map((m: any) => {
            if (m?.modelo) return { ...m, modelo: String(m.modelo).trim() };
            if (m?.nombre) return { ...m, modelo: String(m.nombre).trim() };
            if (typeof m === "string") return { modelo: m.trim() };
            return null;
          })
          .filter(Boolean) as { modelo: string }[];

        const seen = new Set<string>();
        const unicos: any[] = [];
        for (const it of list) {
          const key = it.modelo.toLowerCase();
          if (!seen.has(key)) {
            seen.add(key);
            unicos.push(it);
          }
        }

        unicos.sort((a, b) => (a.modelo || "").localeCompare(b.modelo || ""));

        this.modelos = unicos;
        this.modeloEsPersonalizado = false;
        this.dropdowns.modelos.mostrar = true;
      },
      error: (error) => {
        console.error("Error al obtener modelos (renta):", error);
        this.modelos = [];
      },
      complete: () => {
        this.generalService.loadingDismiss();
      },
    });
  }
}