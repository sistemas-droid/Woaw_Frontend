import {
  ChangeDetectionStrategy,
  ChangeDetectorRef,
  Component,
  EventEmitter,
  Input,
  OnChanges,
  OnInit,
  Output,
  SimpleChanges,
} from '@angular/core';
import { CommonModule } from '@angular/common';
import { IonicModule, ModalController } from '@ionic/angular';
import { FormsModule, ReactiveFormsModule } from '@angular/forms';
import { Router } from '@angular/router';
import { GeneralService } from '../../../services/general.service';
import { RentaService } from '../../../services/renta.service';
import { MapaComponent } from '../../modal/mapa/mapa.component';
import { FotosVeiculoComponent } from '../../modal/fotos-veiculo/fotos-veiculo.component';
import { RegistroService } from '../../../services/registro.service';

export interface RentaSubmitPayload {
  payload: any;
  files?: {
    imagenPrincipal: File;
    imagenes?: File[];
    tarjetaCirculacion?: File;
  };
}

@Component({
  selector: 'app-renta',
  standalone: true,
  imports: [CommonModule, IonicModule, FormsModule, ReactiveFormsModule],
  templateUrl: './renta.component.html',
  styleUrls: ['./renta.component.scss'],
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class RentaComponent implements OnInit, OnChanges {
  @Input() anio!: number;
  @Input() marca!: string;
  @Input() modelo!: string;
  @Input() tipo!: 'renta' | 'auto' | 'moto' | 'camion' | 'lote';
  @Output() rentaSubmit = new EventEmitter<RentaSubmitPayload>();
  private readonly BASE_DISPO = '/disponibilidad-car';
  direccionCompleta: string = 'Selecciona la ubicación...';
  ubicacionSeleccionada: [string, string, number, number] | null = null;
  imagenPrincipal: File | null = null;
  imagenesSecundarias: File[] = [];
  tarjetaCirculacion: File | null = null;
  imagenesIntentadas = false;
  imagenesValidas = false;
  tipoVehiculoLocal: string = '';
  transmision: string = '';
  combustible: string = '';
  pasajeros: number | null = null;
  extrasPredefinidos: string[] = [
    'Silla de bebé',
    'Elevador infantil',
    'GPS',
    'Wi-Fi portátil',
    'Portaequipaje',
    'Cadenas para nieve',
  ];
  extras: string[] = [];
  extraSeleccionado: string = '';
  extraOtroTexto: string = '';
  precioPorDia: number | null = null;
  politicaCombustible: 'lleno-lleno' | 'como-esta' = 'lleno-lleno';
  politicaLimpieza: 'normal' | 'estricta' = 'normal';
  requisitosConductor = {
    edadMinima: 21,
    antiguedadLicenciaMeses: 12,
    permiteConductorAdicional: false as boolean,
    costoConductorAdicional: null as number | null,
  };
  entrega = {
    gratuitoHastaKm: 0,
    tarifasPorDistancia: [] as Array<{
      desdeKm: number;
      hastaKm: number;
      costoFijo?: number | null;
      nota?: string | null;
    }>,
  };
  enviando = false;

  public Pregunta: 'no' | 'si' | null = null;
  public tipoSeleccionado: 'particular' | 'lote' = 'particular';
  seccionFormulario: 1 | 2 | 3 = 1;
  lotes: any[] = [];
  totalLotes = 0;
  loteSeleccionado: string | null = null;
  ubicacionesLoteSeleccionado: any[] = [];
  public MyRole: 'admin' | 'lotero' | 'vendedor' | 'cliente' | null = null;
  direccionSeleccionada: any = null;
  ubicacionesLoteLegibles: string[] = [];

  ubicacionesSeleccionadas: Array<{
    ciudad: string;
    estado: string;
    lat: number;
    lng: number;
    direccionCompleta: string;
  }> = [];

  todasLasUbicacionesSeleccionadas: boolean = false;

  constructor(
    private modalController: ModalController,
    private generalService: GeneralService,
    private rentaService: RentaService,
    private cdr: ChangeDetectorRef,
    private router: Router,
    private registroService: RegistroService,
  ) { }

  ngOnInit() {
    this.generalService.tipoRol$.subscribe((rol) => {
      if (rol === 'admin' || rol === 'lotero' || rol === 'vendedor' || rol === 'cliente') {
        this.MyRole = rol;
      } else {
        this.generalService.eliminarToken();
        this.generalService.alert(
          '¡Saliste de tu sesión Error - 707!',
          '¡Hasta pronto!',
          'info'
        );
      }
    });
    if (this.MyRole === 'admin') {
      this.Pregunta = 'si';
      this.seccionFormulario = 2;
      this.getLotes('all');
    } else if (this.MyRole === 'lotero') {
      this.Pregunta = 'si';
      this.seccionFormulario = 2;
      this.tipoSeleccionado = 'lote';
      this.getLotes('mios');
    } else {
      this.Pregunta = 'no';
      this.seccionFormulario = 2;
      this.tipoSeleccionado = 'particular';
    }
  }
  ngOnChanges(_changes: SimpleChanges): void { }

  private hasText(v: any): boolean {
    return ('' + (v ?? '')).trim().length > 0;
  }

  private numOrUndef = (v: any) => {
    const n = Number(v);
    return Number.isFinite(n) ? n : undefined;
  };

  onExtraChange(val: string) {
    if (val !== '__OTRO__') this.extraOtroTexto = '';
  }

  agregarExtra() {
    let valor = '';
    if (this.extraSeleccionado === '__OTRO__') {
      valor = (this.extraOtroTexto || '').trim();
    } else {
      valor = (this.extraSeleccionado || '').trim();
    }
    if (!valor) return;

    const ya = this.extras.some((e) => e.toLowerCase() === valor.toLowerCase());
    if (!ya) this.extras.push(valor);

    this.extraSeleccionado = '';
    this.extraOtroTexto = '';
    this.cdr.markForCheck();
  }

  quitarExtra(i: number) {
    this.extras.splice(i, 1);
    this.cdr.markForCheck();
  }

  limpiarExtras() {
    this.extras = [];
    this.extraSeleccionado = '';
    this.extraOtroTexto = '';
    this.cdr.markForCheck();
  }

  private validarImagenes(): boolean {
    const MAX_MB = 8;
    const tipos = ['image/jpeg', 'image/png', 'image/webp'];
    const archivos = [this.imagenPrincipal, ...(this.imagenesSecundarias || [])].filter(Boolean) as File[];
    if (!archivos.length) return false;
    for (const f of archivos) {
      if (f.type && !tipos.includes(f.type)) return false;
      if (f.size > MAX_MB * 1024 * 1024) return false;
    }
    return true;
  }

  private async goToDisponibilidad(id?: string | null) {
    if (!id) {
      await this.generalService.alert(
        'No encontré el ID',
        'No recibí el identificador del vehículo creado. No puedo abrir la disponibilidad.',
        'warning'
      );
      return;
    }
    const url = `${this.BASE_DISPO}/${id}`;
    await this.router.navigateByUrl(url, { replaceUrl: true });
  }

  private reencadenarDesde() {
    const arr = this.entrega.tarifasPorDistancia;
    if (!arr?.length) return;
    const gratis = Number(this.entrega.gratuitoHastaKm) || 0;
    arr[0].desdeKm = gratis >= 0 ? gratis : 0;
    for (let i = 1; i < arr.length; i++) {
      const prevHasta = Number(arr[i - 1].hastaKm);
      arr[i].desdeKm = Number.isFinite(prevHasta) && prevHasta >= 0 ? prevHasta : 0;
    }
    this.cdr.markForCheck();
  }

  addTarifa() {
    const arr = this.entrega.tarifasPorDistancia;
    const desde =
      arr.length === 0
        ? Number(this.entrega.gratuitoHastaKm) || 0
        : Number(arr[arr.length - 1].hastaKm) || 0;
    arr.push({ desdeKm: Math.max(0, desde), hastaKm: Math.max(0, desde + 10), costoFijo: null, nota: null });
    this.cdr.markForCheck();
  }

  removeTarifa(i: number) {
    this.entrega.tarifasPorDistancia.splice(i, 1);
    this.reencadenarDesde();
  }

  onGratisHastaChange() {
    this.reencadenarDesde();
  }

  onTarifaHastaChange(i: number) {
    const arr = this.entrega.tarifasPorDistancia;
    const val = Number(arr[i].hastaKm);
    arr[i].hastaKm = Number.isFinite(val) && val >= 0 ? val : 0;
    if (i < arr.length - 1) arr[i + 1].desdeKm = arr[i].hastaKm || 0;
    this.cdr.markForCheck();
  }

  async seleccionarUbicacion() {
    const modal = await this.modalController.create({ component: MapaComponent });
    await modal.present();
    const { data } = await modal.onDidDismiss();
    if (data) {
      const ubicacion = data as [string, string, number, number];

      try {
        const direccionCompleta = await this.generalService.obtenerDireccionDesdeCoordenadas(
          ubicacion[2],
          ubicacion[3]
        );

        // Agregar la nueva ubicación al array
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


  eliminarUbicacion(index: number) {
    this.ubicacionesSeleccionadas.splice(index, 1);
    this.cdr.markForCheck();
  }



  isUbicacionSeleccionada(dir: any): boolean {
    return this.ubicacionesSeleccionadas.some(ubicacion =>
      ubicacion.lat === dir.lat && ubicacion.lng === dir.lng
    );
  }

  toggleUbicacionLote(dir: any, event: any) {
    const checked = event.target.checked;
    const index = this.ubicacionesLoteSeleccionado.findIndex(d =>
      d.lat === dir.lat && d.lng === dir.lng
    );

    if (checked) {
      // Agregar ubicación
      if (index !== -1) {
        this.ubicacionesSeleccionadas.push({
          ciudad: dir.ciudad || '',
          estado: dir.estado || '',
          lat: dir.lat,
          lng: dir.lng,
          direccionCompleta: this.ubicacionesLoteLegibles[index] || 'Dirección no disponible'
        });
      }
    } else {
      // Remover ubicación
      const ubicacionIndex = this.ubicacionesSeleccionadas.findIndex(ubicacion =>
        ubicacion.lat === dir.lat && ubicacion.lng === dir.lng
      );
      if (ubicacionIndex !== -1) {
        this.ubicacionesSeleccionadas.splice(ubicacionIndex, 1);
      }
      this.todasLasUbicacionesSeleccionadas = false;
    }
    this.cdr.markForCheck();
  }


  async seleccionarImagenes() {
    const modal = await this.modalController.create({
      component: FotosVeiculoComponent,
      backdropDismiss: false,
      componentProps: { estadoVehiculo: 'Renta' },
    });
    await modal.present();
    const { data } = await modal.onDidDismiss();
    if (!data) {
      this.imagenesValidas = false;
      this.imagenesIntentadas = false;
      this.cdr.markForCheck();
      return;
    }

    this.imagenesIntentadas = true;
    this.imagenPrincipal = (data.imagenPrincipal as File) || null;
    this.imagenesSecundarias = (data.imagenesSecundarias as File[]) || [];

    if (!this.imagenPrincipal) {
      await this.generalService.alert('Falta imagen principal', 'Selecciona una imagen principal para continuar.', 'warning');
      this.imagenesValidas = false;
      this.cdr.markForCheck();
      return;
    }
    this.imagenesValidas = this.validarImagenes();
    this.cdr.markForCheck();
  }

  onFileTC(ev: Event) {
    const input = ev.target as HTMLInputElement;
    if (!input.files?.length) return;
    this.tarjetaCirculacion = input.files[0];
    this.cdr.markForCheck();
  }

  limpiarImagenes() {
    this.generalService.confirmarAccion('¿Deseas eliminar las imágenes seleccionadas?', 'Eliminar imágenes', () => {
      this.imagenPrincipal = null;
      this.imagenesSecundarias = [];
      this.imagenesIntentadas = false;
      this.imagenesValidas = false;
      this.cdr.markForCheck();
    });
  }


  validarBasico(): boolean {
    if (!this.hasText(this.marca) || !this.hasText(this.modelo)) {
      this.generalService.alert('Datos incompletos', 'Faltan marca o modelo.', 'warning');
      return false;
    }

    // 🚗 Transmisión obligatoria
    if (!this.transmision) {
      this.generalService.alert('Transmisión', 'Selecciona la transmisión del vehículo.', 'warning');
      return false;
    }

    // ⛽ Combustible obligatorio
    if (!this.combustible) {
      this.generalService.alert('Combustible', 'Selecciona el tipo de combustible.', 'warning');
      return false;
    }

    // 📍 Ubicación - ahora validamos que haya al menos una ubicación seleccionada
    if (!this.ubicacionesSeleccionadas || this.ubicacionesSeleccionadas.length === 0) {
      this.generalService.alert('Ubicación', 'Selecciona al menos una ubicación para el vehículo.', 'warning');
      return false;
    }

    // 💰 Precio por día
    const okPrecioDia = this.precioPorDia !== null && Number(this.precioPorDia) >= 500;
    if (!okPrecioDia) {
      this.generalService.alert('Precio por día', 'El precio por día debe ser de al menos $500.', 'warning');
      return false;
    }

    // 👥 Pasajeros
    if (this.pasajeros === null || Number(this.pasajeros) < 1) {
      this.generalService.alert('Pasajeros', 'Debes indicar al menos 1 pasajero.', 'warning');
      return false;
    }

    // 🧍‍♂️ Edad mínima
    if (Number(this.requisitosConductor.edadMinima) < 18) {
      this.generalService.alert('Edad mínima', 'La edad mínima permitida es 18 años.', 'warning');
      return false;
    }

    // 🚚 Tarifas o entrega gratuita
    const hayTarifas = (this.entrega.tarifasPorDistancia || []).length > 0;
    const hayGratisHasta = Number(this.entrega.gratuitoHastaKm) > 0;
    if (!hayTarifas && !hayGratisHasta) {
      this.generalService.alert('Tarifas por distancia', 'Agrega al menos una tarifa o "Entrega gratis hasta (km)".', 'warning');
      return false;
    }

    // 🔢 Validar cada tarifa
    for (let i = 0; i < (this.entrega.tarifasPorDistancia || []).length; i++) {
      const t = this.entrega.tarifasPorDistancia[i];
      const desde = Number(t.desdeKm),
        hasta = Number(t.hastaKm);
      const costoFijo = t.costoFijo != null ? Number(t.costoFijo) : null;

      if (!Number.isFinite(desde) || desde < 0 || !Number.isFinite(hasta) || hasta <= 0) {
        this.generalService.alert('Tarifas por distancia', `Tarifa #${i + 1}: "Desde" ≥ 0 y "Hasta" > 0.`, 'warning');
        return false;
      }
      if (desde >= hasta) {
        this.generalService.alert('Tarifas por distancia', `Tarifa #${i + 1}: "Desde" debe ser menor que "Hasta".`, 'warning');
        return false;
      }
      if (costoFijo == null || !Number.isFinite(costoFijo) || costoFijo < 0) {
        this.generalService.alert('Tarifas por distancia', `Tarifa #${i + 1}: define "Costo fijo".`, 'warning');
        return false;
      }
      if (i > 0) {
        const prevHasta = Number(this.entrega.tarifasPorDistancia[i - 1].hastaKm) || 0;
        if (desde !== prevHasta) {
          this.generalService.alert('Tarifas por distancia', `Tarifa #${i + 1} debe iniciar en ${prevHasta} km.`, 'warning');
          return false;
        }
      }
    }

    // 🖼️ Validación de imágenes
    if (!this.imagenPrincipal || !this.validarImagenes()) {
      this.generalService.alert('Imágenes', 'Falta imagen principal o formato/tamaño inválido.', 'warning');
      return false;
    }

    return true;
  }

  get canPublicar(): boolean {
    const okBasicos = this.hasText(this.marca) && this.hasText(this.modelo);
    const okUbi = this.ubicacionesSeleccionadas && this.ubicacionesSeleccionadas.length > 0;
    const okPrecio = this.precioPorDia !== null && Number(this.precioPorDia) >= 500;
    const okPasajeros = this.pasajeros == null || Number(this.pasajeros) >= 1;
    const okEdad = Number(this.requisitosConductor.edadMinima) >= 18;
    const okImagen = !!this.imagenPrincipal && this.imagenesValidas;
    const hayTarifas = (this.entrega.tarifasPorDistancia || []).length > 0;
    const hayGratisHasta = Number(this.entrega.gratuitoHastaKm) > 0;
    const okTarifas = hayTarifas || hayGratisHasta;

    return (
      okBasicos &&
      okUbi &&
      okPrecio &&
      okPasajeros &&
      okEdad &&
      okTarifas &&
      okImagen &&
      !this.enviando
    );
  }

  private construirPayloadParaBackend() {
    
    // Obtener las ubicaciones seleccionadas (ya sea de modo particular o lote)
    const ubicaciones = this.ubicacionesSeleccionadas.map(ubicacion => ({
      ciudad: ubicacion.ciudad,
      estado: ubicacion.estado,
      lat: Number(ubicacion.lat),
      lng: Number(ubicacion.lng),
    }));

    const reqCond = {
      edadMinima: Number(this.requisitosConductor.edadMinima) || 21,
      antiguedadLicenciaMeses: Number(this.requisitosConductor.antiguedadLicenciaMeses) || 12,
      permiteConductorAdicional: !!this.requisitosConductor.permiteConductorAdicional,
      costoConductorAdicional:
        this.requisitosConductor.costoConductorAdicional != null
          ? Number(this.requisitosConductor.costoConductorAdicional)
          : undefined,
    };

    const entrega = {
      gratuitoHastaKm: Number(this.entrega.gratuitoHastaKm) || 0,
      tarifasPorDistancia: (this.entrega.tarifasPorDistancia || []).map((t) => ({
        desdeKm: Number(t.desdeKm),
        hastaKm: Number(t.hastaKm),
        costoFijo: t.costoFijo != null ? Number(t.costoFijo) : undefined,
        nota: t.nota || undefined,
      })),
    };

    return {
      marca: (this.marca || '').trim(),
      modelo: (this.modelo || '').trim(),
      tipoVehiculo: this.tipoVehiculoLocal || undefined,
      pasajeros: this.numOrUndef(this.pasajeros),
      transmision: this.transmision || undefined,
      combustible: this.combustible || undefined,
      precio: Number(this.precioPorDia ?? 0),
      politicaCombustible: this.politicaCombustible,
      politicaLimpieza: this.politicaLimpieza,
      requisitosConductor: reqCond,
      ubicaciones: ubicaciones.length > 0 ? ubicaciones : undefined, 
      entrega,
      extras: this.extras?.length ? [...this.extras] : undefined,
    };
  }


  async publicar() {
    if (!this.validarBasico()) return;

    const payload = this.construirPayloadParaBackend();
    const files = {
      imagenPrincipal: this.imagenPrincipal!, // validado arriba
      imagenes: this.imagenesSecundarias || [],
      tarjetaCirculacion: this.tarjetaCirculacion || null,
    };

    this.enviando = true;
    this.cdr.markForCheck();
    await this.generalService.loading('Publicando vehículo de renta…');
    this.rentaService.addRentalCar({ ...payload, ...files } as any).subscribe({
      next: async (res) => {
        await this.generalService.loadingDismiss();
        this.enviando = false;

        if (res?.token) localStorage.setItem('token', res.token);
        if (res?.rol) {
          const userActual = JSON.parse(localStorage.getItem('user') || '{}');
          userActual.rol = res.rol;
          localStorage.setItem('user', JSON.stringify(userActual));
        }

        const idCreado = res?.rental?._id || res?.rental?.id;
        if (!idCreado) {
          await this.generalService.alert(
            'No encontré el ID',
            'No recibí el identificador del vehículo creado. No puedo abrir la disponibilidad.',
            'warning'
          );
          this.cdr.markForCheck();
          return;
        }

        this.generalService.alert(
          '¡Listo!',
          'Vehículo de renta publicado. Vamos a configurar la disponibilidad.',
          'success'
        );

        await this.goToDisponibilidad(idCreado);
        this.cdr.markForCheck();
      },
      error: async (err) => {
        await this.generalService.loadingDismiss();
        this.enviando = false;
        const msg = err?.error?.message || 'Error al publicar el vehículo de renta';
        this.generalService.alert('Error', msg, 'danger');
        console.error('[RentaComponent] Error addRentalCar:', err);
        this.cdr.markForCheck();
      },
    });
  }

  resetForm() {
    this.tipoVehiculoLocal = '';
    this.transmision = '';
    this.combustible = '';
    this.pasajeros = null;
    this.precioPorDia = null;
    this.extras = [];
    this.extraSeleccionado = '';
    this.extraOtroTexto = '';
    this.politicaCombustible = 'lleno-lleno';
    this.politicaLimpieza = 'normal';
    this.requisitosConductor = {
      edadMinima: 21,
      antiguedadLicenciaMeses: 12,
      permiteConductorAdicional: false,
      costoConductorAdicional: null,
    };

    this.entrega = { gratuitoHastaKm: 0, tarifasPorDistancia: [] };
    this.imagenPrincipal = null;
    this.imagenesSecundarias = [];
    this.tarjetaCirculacion = null;
    this.imagenesIntentadas = false;
    this.imagenesValidas = false;
    this.ubicacionSeleccionada = null;
    this.direccionCompleta = 'Selecciona la ubicación...';
    this.cdr.markForCheck();
  }







  seleccionarTipo(tipo: 'particular' | 'lote') { this.tipoSeleccionado = tipo; }
  continuar() {
    if (!this.tipoSeleccionado) return;
    if (this.tipoSeleccionado == 'lote') this.getLotes('mios');
    this.Pregunta = 'no';
  }
  getLotes(tipo: 'all' | 'mios') {
    this.registroService.allLotes(tipo).subscribe({
      next: async (res) => {
        this.lotes = res.lotes;
        this.totalLotes = this.lotes.length;

        if (this.lotes.length === 1) {
          const loteUnico = this.lotes[0];
          this.loteSeleccionado = loteUnico._id;
          this.ubicacionesLoteSeleccionado = loteUnico.direccion;
          this.leerLatLng();
        }
      },
      error: async () => {
        await this.generalService.loadingDismiss();
        await this.generalService.alert('Verifica tu red', 'Error de red. Intenta más tarde.', 'danger');
      },
    });
  }

  leerLatLng() {
    this.direccionSeleccionada = null; // Esperamos a que el usuario elija

    // ✅ Paso 2: Obtener direcciones legibles para todas las ubicaciones
    this.ubicacionesLoteLegibles = [];

    const promesas = this.ubicacionesLoteSeleccionado.map((dir) =>
      this.generalService.obtenerDireccionDesdeCoordenadas(dir.lat, dir.lng)
    );

    Promise.all(promesas)
      .then((direcciones) => {
        this.ubicacionesLoteLegibles = direcciones;
      })
      .catch((error) => {
        console.warn('❌ Error obteniendo direcciones:', error);
        this.ubicacionesLoteLegibles = this.ubicacionesLoteSeleccionado.map(() => 'No disponible');
      });

  }
  onLoteSeleccionado() {
    const lote = this.lotes.find(l => l._id === this.loteSeleccionado);
    this.ubicacionesLoteSeleccionado = lote?.direccion || [];
    this.leerLatLng();
  }
}
