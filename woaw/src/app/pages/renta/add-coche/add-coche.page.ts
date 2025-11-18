import { Component, OnInit, ChangeDetectorRef } from '@angular/core';
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
import { MapaComponent } from '../../../components/modal/mapa/mapa.component';

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

  ubicacionesSeleccionadas: Array<{
    ciudad: string;
    estado: string;
    lat: number;
    lng: number;
    direccionCompleta: string;
  }> = [];

  formaddCarRenta!: FormGroup;

  public tipoDispocitivo: string = '';
  public isLoggedIn: boolean = false;
  public posicion: 0 | 1 | 2 | 3 | 4 = 0;

  // Campos del formulario
  marca: string = '';
  modelo: string = '';
  tipo: string = '';
  transmision: string = '';
  combustible: string = '';
  pasajeros: string = '';
  precioPorDia: string = '';
  edadMinima: string = '';

  select_tipo: string = '';

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


  // Variables para posición 3
  nivelCombustible: string = '';
  nuevoExtra: string = '';
  extrasSeleccionados: any[] = [];

  // Datos para los dropdowns de posición 3
  nivelesCombustible: any[] = [
    { nombre: 'Tanque lleno' },
    { nombre: '3/4 de tanque' },
    { nombre: '1/2 tanque' },
    { nombre: '1/4 de tanque' },
    { nombre: 'Reserva' },
    { nombre: 'Vacío' }
  ];

  extrasDisponibles: any[] = [
    { nombre: 'GPS' },
    { nombre: 'Silla para bebé' },
    { nombre: 'Internet/WiFi' },
    { nombre: 'Asientos de cuero' },
    { nombre: 'Techo solar' },
    { nombre: 'Sistema de sonido premium' },
    { nombre: 'Control de crucero' },
    { nombre: 'Cámara de reversa' },
    { nombre: 'Sensores de estacionamiento' },
    { nombre: 'Airbags laterales' },
    { nombre: 'Climatizador automático' },
    { nombre: 'Llantas de aleación' },
    { nombre: 'Faros LED' },
    { nombre: 'Computadora de viaje' },
    { nombre: 'Bluetooth' }
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
    edades: { mostrar: false, datosFiltrados: [] as any[] },
    nivelCombustible: { mostrar: false, datosFiltrados: [] as any[] },
    extras: { mostrar: false, datosFiltrados: [] as any[] }
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
    private cdr: ChangeDetectorRef,
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

  seleccionarTipoCuenta(tipo: string) {
    this.select_tipo = tipo;
    this.posicion = 1;
  }


  // FUNCIONES GENÉRICAS PARA DROPDOWNS

  toggleDropdown(dropdownName: keyof typeof this.dropdowns) {
    Object.keys(this.dropdowns).forEach(key => {
      if (key !== dropdownName) {
        this.dropdowns[key as keyof typeof this.dropdowns].mostrar = false;
      }
    });

    this.dropdowns[dropdownName].mostrar = !this.dropdowns[dropdownName].mostrar;
  }

  seleccionarOpcion(valor: string, dropdownName: keyof typeof this.dropdowns, campo: string) {
    (this as any)[campo] = valor;
    this.dropdowns[dropdownName].mostrar = false;

    if (dropdownName === 'marcas') {
      this.modelo = '';
      this.modelos = [];
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

  get extrasFiltrados() {
    return this.dropdowns.extras.datosFiltrados.length > 0 ?
      this.dropdowns.extras.datosFiltrados : this.extrasDisponibles;
  }

  get nivelesCombustibleFiltrados() {
    return this.dropdowns.nivelCombustible.datosFiltrados.length > 0 ?
      this.dropdowns.nivelCombustible.datosFiltrados : this.nivelesCombustible;
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

  onTransmisionInput(event: any) {
    this.onInput(event, 'transmisiones', this.transmisiones);
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

  seleccionarNivelCombustible(nivelItem: any) {
    this.seleccionarOpcion(nivelItem.nombre, 'nivelCombustible', 'nivelCombustible');
  }


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
        this.nivelCombustible = '';
        this.nuevoExtra = '';

        // Ocultar dropdowns de posición 2
        this.dropdowns.tipos.mostrar = false;
        this.dropdowns.transmisiones.mostrar = false;
        this.dropdowns.combustibles.mostrar = false;
        this.dropdowns.pasajeros.mostrar = false;
        this.dropdowns.precios.mostrar = false;
        this.dropdowns.edades.mostrar = false;
        this.dropdowns.nivelCombustible.mostrar = false;

        // Limpiar datos filtrados de posición 2
        this.dropdowns.tipos.datosFiltrados = [];
        this.dropdowns.transmisiones.datosFiltrados = [];
        this.dropdowns.combustibles.datosFiltrados = [];
        this.dropdowns.pasajeros.datosFiltrados = [];
        this.dropdowns.precios.datosFiltrados = [];
        this.dropdowns.edades.datosFiltrados = [];

        this.extrasSeleccionados = [];
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

  public irAInicio(): void {
    this.router.navigateByUrl('/inicio');
    this.posicion = 1;
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

  public regresarPocicion() {
    switch (this.posicion) {
      case 0:
        this.router.navigateByUrl('/new-car');
        break;
      case 1:
        this.posicion = 0;
        break;
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

  agregarExtra(extraItem: any) {
    // Verificar si el extra ya está seleccionado
    const yaExiste = this.extrasSeleccionados.some(extra =>
      extra.nombre.toLowerCase() === extraItem.nombre.toLowerCase()
    );

    if (!yaExiste) {
      this.extrasSeleccionados.push(extraItem);
      this.nuevoExtra = '';
      this.dropdowns.extras.mostrar = false;
    }
  }

  onExtraInput(event: any) {
    const value = event.detail?.value || '';

    if (value.trim()) {
      // Filtrar extras disponibles
      this.dropdowns.extras.datosFiltrados = this.extrasDisponibles.filter(extra =>
        extra.nombre.toLowerCase().includes(value.toLowerCase())
      );

      // Agregar la opción de crear nuevo extra si no existe
      const existeEnDisponibles = this.extrasDisponibles.some(extra =>
        extra.nombre.toLowerCase() === value.toLowerCase()
      );

      if (!existeEnDisponibles && value.length >= 2) {
        this.dropdowns.extras.datosFiltrados.push({ nombre: `Agregar: "${value}"` });
      }

      this.dropdowns.extras.mostrar = this.dropdowns.extras.datosFiltrados.length > 0;
    } else {
      this.dropdowns.extras.mostrar = false;
    }
  }

  eliminarExtra(index: number) {
    this.extrasSeleccionados.splice(index, 1);
  }

  public async sigiente() {
    switch (this.posicion) {
      case 1:
        const errorPosicion0 = this.validarPosicionActual(1);
        if (errorPosicion0) {
          this.mostrarAlertaError(errorPosicion0);
          return;
        }
        this.posicion = 2;
        break;
      case 1:
        const errorPosicion1 = this.validarPosicionActual(1);
        if (errorPosicion1) {
          this.mostrarAlertaError(errorPosicion1);
          return;
        }
        this.posicion = 2;
        break;
      case 2:
        const errorPosicion2 = this.validarPosicionActual(2);
        if (errorPosicion2) {
          this.mostrarAlertaError(errorPosicion2);
          return;
        }
        this.posicion = 3;
        break;
      case 3:
        const errorPosicion3 = this.validarPosicionActual(3);
        if (errorPosicion3) {
          await this.generalService.alert(
            'Seleccióna una Ubicación',
            errorPosicion3,
            'warning'
          );
          return;
        }
        this.posicion = 4;
        return;
      default:
        break;
    }
  }

  private validarPosicionActual(posicion: number): string {
    switch (posicion) {
      case 1:
        const errorMarca = this.validar_inputs('marca', this.marca, 25);
        const errorModelo = this.validar_inputs('modelo', this.modelo, 25);

        if (errorMarca) {
          return `Marca: ${errorMarca}`;
        }
        if (errorModelo) {
          return `Modelo: ${errorModelo}`;
        }
        if (!this.marca) {
          return 'La marca es obligatoria';
        }
        if (!this.modelo) {
          return 'El modelo es obligatorio';
        }
        return '';

      case 2:
        // Validar todos los campos de posición 2
        const errorTipo = this.validar_inputs('tipo', this.tipo, 25);
        const errorTransmision = this.validar_inputs('transmision', this.transmision, 25);
        const errorCombustible = this.validar_inputs('combustible', this.combustible, 25);
        const errorPasajeros = this.validar_inputs('pasajeros', this.pasajeros, 2);
        const errorPrecio = this.validar_inputs('precioPorDia', this.precioPorDia, 6);
        const errorEdad = this.validar_inputs('edadMinima', this.edadMinima, 2);
        const errorNivelCombustible = this.validar_inputs('nivelCombustible', this.nivelCombustible, 20);

        if (errorTipo) {
          return `Tipo: ${errorTipo}`;
        }
        if (errorTransmision) {
          return `Transmisión: ${errorTransmision}`;
        }
        if (errorCombustible) {
          return `Combustible: ${errorCombustible}`;
        }
        if (errorPasajeros) {
          return `Pasajeros: ${errorPasajeros}`;
        }
        if (errorPrecio) {
          return `Precio por Día: ${errorPrecio}`;
        }
        if (errorEdad) {
          return `Edad Mínima: ${errorEdad}`;
        }
        if (errorNivelCombustible) {
          return `Error en Nivel de Combustible: ${errorNivelCombustible}`;
        }

        // Validar que todos los campos estén llenos
        if (!this.tipo) return 'El tipo de vehículo es obligatorio';
        if (!this.transmision) return 'La transmisión es obligatoria';
        if (!this.combustible) return 'El tipo de combustible es obligatorio';
        if (!this.pasajeros) return 'El número de pasajeros es obligatorio';
        if (!this.precioPorDia) return 'El precio por día es obligatorio';
        if (!this.edadMinima) return 'La edad mínima es obligatoria';

        return '';
      case 3:

        if (!this.ubicacionesSeleccionadas || this.ubicacionesSeleccionadas.length === 0) {
          return 'Debes seleccionar una ubicación para el vehículo';
        }

        const ubicacion = this.ubicacionesSeleccionadas[0];
        if (!ubicacion.ciudad || !ubicacion.estado || !ubicacion.lat || !ubicacion.lng) {
          return 'La ubicación seleccionada no es válida';
        }
        return '';

      default:
        return '';
    }
  }

  // Función de validación mejorada con validaciones específicas
  validar_inputs(campo: string, valor: string, maxLength: number): string {
    if (!valor || !valor.trim()) {
      return 'Este campo es obligatorio';
    }

    if (valor.length > maxLength) {
      return `Máximo ${maxLength} caracteres`;
    }

    // Validaciones específicas por campo
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
        if (campo === 'pasajeros') {
          const numPasajeros = parseInt(valor);
          if (numPasajeros < 1 || numPasajeros > 20) {
            return 'Debe ser entre 1 y 20 pasajeros';
          }
        }
        if (campo === 'edadMinima') {
          const edad = parseInt(valor);
          if (edad < 18 || edad > 100) {
            return 'Debe ser entre 18 y 100 años';
          }
        }
        break;

      case 'precioPorDia':
        if (!/^\d+$/.test(valor)) {
          return 'Solo se permiten números';
        }
        const precio = parseInt(valor);
        if (precio < 50) {
          return 'El precio mínimo es $50';
        }
        if (precio > 100000) {
          return 'El precio máximo es $100,000';
        }
        break;

      case 'tipo':
      case 'transmision':
      case 'combustible':
        // Validar que sean valores válidos de las listas predefinidas
        if (valor.length < 2) {
          return 'Ingresa un valor válido';
        }
        break;
    }

    return ''; // Sin error
  }

  private async mostrarAlertaError(mensaje: string) {
    await this.generalService.alert(
      'Corrige Fomulario',
      mensaje,
      'warning'
    );
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



  public async seleccionarUbicacion() {
    const modal = await this.modalController.create({ component: MapaComponent });
    await modal.present();
    const { data } = await modal.onDidDismiss();
    if (data) {
      const ubicacion = data as [string, string, number, number];

      // Inicializar el array si no existe
      if (!this.ubicacionesSeleccionadas) {
        this.ubicacionesSeleccionadas = [];
      }

      try {
        const direccionCompleta = await this.generalService.obtenerDireccionDesdeCoordenadas(
          ubicacion[2],
          ubicacion[3]
        );

        // Agregar la nueva ubicación al array existente
        this.ubicacionesSeleccionadas.push({
          ciudad: ubicacion[0],
          estado: ubicacion[1],
          lat: ubicacion[2],
          lng: ubicacion[3],
          direccionCompleta: direccionCompleta
        });

      } catch {
        // Si falla la obtención de dirección, usar datos básicos
        this.ubicacionesSeleccionadas.push({
          ciudad: ubicacion[0],
          estado: ubicacion[1],
          lat: ubicacion[2],
          lng: ubicacion[3],
          direccionCompleta: `${ubicacion[0]}, ${ubicacion[1]}`
        });
      }

      this.cdr.markForCheck();
    }
  }

  // Función para eliminar una ubicación específica
  eliminarUbicacion(index: number) {
    if (this.ubicacionesSeleccionadas && this.ubicacionesSeleccionadas.length > index) {
      this.ubicacionesSeleccionadas.splice(index, 1);
      this.cdr.markForCheck();
    }
  }
}
