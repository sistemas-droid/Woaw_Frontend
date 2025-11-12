import { Component, OnInit, ViewChild, ElementRef } from '@angular/core';
import { ActivatedRoute, Router } from '@angular/router';
import { ModalController } from '@ionic/angular';
import { RentaService } from '../../services/renta.service';
import { GeneralService } from '../../services/general.service';
import imageCompression from 'browser-image-compression';
import { MapaComponent } from '../../components/modal/mapa/mapa.component';
import { RegistroService } from '../../services/registro.service';

@Component({
  selector: 'app-edit-renta',
  templateUrl: './edit-renta.page.html',
  styleUrls: ['./edit-renta.page.scss'],
  standalone: false,
})
export class EditRentaPage implements OnInit {
  @ViewChild('inputArchivo', { static: false }) inputArchivo!: ElementRef<HTMLInputElement>;

  id!: string;
  renta: any = {
    marca: '',
    modelo: '',
    anio: null,
    tipoVehiculo: '',
    transmision: '',
    combustible: '',
    pasajeros: null as number | null,
    precioPorDia: 0,
    moneda: 'MXN',
    politicaCombustible: 'lleno-lleno',
    politicaLimpieza: 'normal',
    requisitosConductor: {
      edadMinima: 21,
      antiguedadLicenciaMeses: 12,
      permiteConductorAdicional: false,
      costoConductorAdicional: 0,
    },
    entrega: {
      gratuitoHastaKm: 0,
      tarifasPorDistancia: [] as any[],
    },
    polizaPlataforma: {
      numero: '',
      aseguradora: '',
      aseguradoraOtra: '',
      cobertura: '',
      vigenciaDesde: '',
      vigenciaHasta: '',
      urlPoliza: '',
    },
    ubicaciones: [] as any[],
    imagenPrincipal: '',
    imagenes: [] as string[],
  };

  ubicacionesSeleccionadas: {
    ciudad: string;
    estado: string;
    lat: number;
    lng: number;
    direccionCompleta: string;
  }[] = [];

  imagenPrincipalMostrada = '';
  imagenPrincipalFile: File | string | null = null;
  urlsImagenes: string[] = [];
  urlsImagenesExistentes: string[] = [];
  imagenesNuevas: File[] = [];
  MyRole: 'admin' | 'lotero' | 'vendedor' | 'cliente' | null = null;
  tipoSeleccionado: 'particular' | 'lote' = 'particular';
  lotes: any[] = [];
  totalLotes = 0;
  loteSeleccionado: string | null = null;
  ubicacionesLoteSeleccionado: Array<{ lat: number; lng: number; ciudad?: string; estado?: string }> = [];
  ubicacionesLoteLegibles: string[] = [];
  dirty = false;
  private snapshot: string | null = null;

  constructor(
    private route: ActivatedRoute,
    private router: Router,
    private rentaService: RentaService,
    private general: GeneralService,
    private modalCtrl: ModalController,
    private registroService: RegistroService,
  ) { }

  ngOnInit(): void {
    this.general.tipoRol$.subscribe((rol) => {
      if (rol === 'admin' || rol === 'lotero' || rol === 'vendedor' || rol === 'cliente') {
        this.MyRole = rol;

        if (this.MyRole === 'admin') {
          this.tipoSeleccionado = 'particular'; // el admin puede cambiar luego; por defecto particular
          this.getLotes('all');
        } else if (this.MyRole === 'lotero') {
          this.tipoSeleccionado = 'lote';
          this.getLotes('mios');
        } else {
          this.tipoSeleccionado = 'particular';
        }
      } else {
        this.general.eliminarToken();
        this.general.alert('¡Saliste de tu sesión Error - 707!', '¡Hasta pronto!', 'info');
      }
    });

    this.id = this.route.snapshot.paramMap.get('id')!;
    this.cargarRenta();
  }


  private toYMD(value: any): string {
    if (!value) return '';
    const d = new Date(value);
    if (isNaN(d.getTime())) return '';
    const yyyy = d.getFullYear();
    const mm = String(d.getMonth() + 1).padStart(2, '0');
    const dd = String(d.getDate()).padStart(2, '0');
    return `${yyyy}-${mm}-${dd}`;
  }

  private snapshotState() {
    return JSON.stringify({
      renta: this.renta,
      ubic: this.ubicacionesSeleccionadas,
      imgP: this.imagenPrincipalMostrada,
      imgs: [...this.urlsImagenes].sort(),
      tipo: this.tipoSeleccionado,
      loteSel: this.loteSeleccionado,
      ubicLote: this.ubicacionesLoteSeleccionado,
    });
  }

  private refreshDirty() {
    this.dirty = this.snapshot !== this.snapshotState();
  }

  markDirty() {
    this.refreshDirty();
  }

  async cargarRenta() {
    await this.general.loading('Cargando...');
    this.rentaService.cochePorId(this.id).subscribe({
      next: async (res: any) => {
        const price = res?.precio ?? {};
        const req = res?.requisitosConductor ?? {};
        const ent = res?.entrega ?? {};
        const pol = res?.polizaPlataforma ?? {};
        const normalizada = {
          marca: res?.marca ?? this.renta.marca,
          modelo: res?.modelo ?? this.renta.modelo,
          anio: res?.anio ?? this.renta.anio,
          tipoVehiculo: res?.tipoVehiculo ?? this.renta.tipoVehiculo,
          transmision: res?.transmision ?? this.renta.transmision,
          combustible: res?.combustible ?? this.renta.combustible,
          pasajeros: res?.pasajeros ?? this.renta.pasajeros,
          precioPorDia: Number(price?.porDia ?? res?.precioPorDia ?? res?.precio ?? this.renta.precioPorDia),
          moneda: price?.moneda ?? res?.moneda ?? this.renta.moneda,
          politicaCombustible: res?.politicaCombustible ?? this.renta.politicaCombustible,
          politicaLimpieza: res?.politicaLimpieza ?? this.renta.politicaLimpieza,
          requisitosConductor: {
            edadMinima: Number(req?.edadMinima ?? this.renta.requisitosConductor.edadMinima),
            antiguedadLicenciaMeses: Number(
              req?.antiguedadLicenciaMeses ?? this.renta.requisitosConductor.antiguedadLicenciaMeses
            ),
            permiteConductorAdicional: !!(
              req?.permiteConductorAdicional ?? this.renta.requisitosConductor.permiteConductorAdicional
            ),
            costoConductorAdicional: Number(
              req?.costoConductorAdicional ?? this.renta.requisitosConductor.costoConductorAdicional
            ),
          },
          entrega: {
            gratuitoHastaKm: Number(ent?.gratuitoHastaKm ?? this.renta.entrega.gratuitoHastaKm),
            tarifasPorDistancia: Array.isArray(ent?.tarifasPorDistancia)
              ? ent.tarifasPorDistancia
              : [...this.renta.entrega.tarifasPorDistancia],
          },
          polizaPlataforma: {
            numero: pol?.numero ?? this.renta.polizaPlataforma.numero,
            aseguradora: pol?.aseguradora ?? this.renta.polizaPlataforma.aseguradora,
            aseguradoraOtra: pol?.aseguradoraOtra ?? this.renta.polizaPlataforma.aseguradoraOtra,
            cobertura: pol?.cobertura ?? this.renta.polizaPlataforma.cobertura,
            vigenciaDesde: this.toYMD(pol?.vigenciaDesde ?? this.renta.polizaPlataforma.vigenciaDesde),
            vigenciaHasta: this.toYMD(pol?.vigenciaHasta ?? this.renta.polizaPlataforma.vigenciaHasta),
            urlPoliza: pol?.urlPoliza ?? this.renta.polizaPlataforma.urlPoliza,
          },
          ubicaciones: Array.isArray(res?.ubicaciones)
            ? res.ubicaciones
            : Array.isArray(res?.ubicacion)
              ? res.ubicacion
              : res?.ubicacion
                ? [res.ubicacion]
                : [],
          tipoPublicacion: res?.tipoPublicacion ?? 'particular',
          lote: res?.lote ?? null,
          imagenPrincipal: res?.imagenPrincipal ?? this.renta.imagenPrincipal,
          imagenes: Array.isArray(res?.imagenes) ? res.imagenes : [...this.renta.imagenes],
        };

        normalizada.ubicaciones = normalizada.ubicaciones.filter(
          (u: any) => u && Number(u.lat) !== 0 && Number(u.lng) !== 0
        );

        this.renta = { ...this.renta, ...normalizada };

        // 🔹 Ajustar tipo automáticamente si tiene lote
        if (normalizada.lote) {
          this.tipoSeleccionado = 'lote';
          this.loteSeleccionado = normalizada.lote?._id || normalizada.lote;
        } else {
          this.tipoSeleccionado = 'particular';
          this.loteSeleccionado = null;
        }

        this.ubicacionesSeleccionadas = [];

        if (this.tipoSeleccionado === 'lote' && this.loteSeleccionado) {
          if (!this.lotes.length) {
            await this.getLotes(this.MyRole === 'admin' ? 'all' : 'mios');
          }
          const loteObj = this.lotes.find((l) => l._id === this.loteSeleccionado);
          if (loteObj && Array.isArray(loteObj.direccion)) {
            this.ubicacionesSeleccionadas = loteObj.direccion.map((u: any) => ({
              ciudad: u.ciudad || '',
              estado: u.estado || '',
              lat: Number(u.lat) || 0,
              lng: Number(u.lng) || 0,
              direccionCompleta: `${u.ciudad || ''}, ${u.estado || ''}`,
            }));
          }
        } else {
          for (const u of normalizada.ubicaciones) {
            try {
              const direccion = await this.general.obtenerDireccionDesdeCoordenadas(
                Number(u.lat),
                Number(u.lng)
              );
              this.ubicacionesSeleccionadas.push({
                ciudad: u.ciudad || '',
                estado: u.estado || '',
                lat: Number(u.lat) || 0,
                lng: Number(u.lng) || 0,
                direccionCompleta: direccion,
              });
            } catch {
              this.ubicacionesSeleccionadas.push({
                ciudad: u.ciudad || '',
                estado: u.estado || '',
                lat: Number(u.lat) || 0,
                lng: Number(u.lng) || 0,
                direccionCompleta: 'No se pudo obtener la dirección',
              });
            }
          }
        }

        this.imagenPrincipalMostrada = this.renta.imagenPrincipal || '';
        this.imagenPrincipalFile = this.renta.imagenPrincipal || null;
        this.urlsImagenes = [...this.renta.imagenes];
        this.urlsImagenesExistentes = [...this.renta.imagenes];
        this.snapshot = this.snapshotState();
        this.dirty = false;
        await this.general.loadingDismiss();

        console.log('✅ Tipo:', this.tipoSeleccionado, 'Lote:', this.loteSeleccionado);
      },
      error: async (err: any) => {
        await this.general.loadingDismiss();
        this.general.alert('Error', err?.error?.message || 'No se pudo cargar la renta', 'danger');
      },
    });
  }

  async seleccionarUbicacion() {
    const modal = await this.modalCtrl.create({ component: MapaComponent });
    await modal.present();
    const { data } = await modal.onDidDismiss();
    if (data) {
      const [ciudad, estado, lat, lng] = data as [string, string, number, number];
      try {
        const direccion = await this.general.obtenerDireccionDesdeCoordenadas(lat, lng);
        this.ubicacionesSeleccionadas.push({ ciudad, estado, lat, lng, direccionCompleta: direccion });
        this.markDirty();
      } catch {
        this.ubicacionesSeleccionadas.push({
          ciudad,
          estado,
          lat,
          lng,
          direccionCompleta: 'No se pudo obtener la dirección',
        });
        this.markDirty();
      }
    }
  }

  eliminarUbicacion(i: number) {
    this.ubicacionesSeleccionadas.splice(i, 1);
    this.markDirty();
  }

  async toggleTipoPublicacion() {
    if ((this.MyRole === 'vendedor' || this.MyRole === 'cliente') && this.tipoSeleccionado === 'lote') {
      this.general.alert('No permitido', 'Tu rol no tiene lotes asignados.', 'warning');
      this.tipoSeleccionado = 'particular';
      return;
    }

    this.ubicacionesSeleccionadas = [];

    if (this.tipoSeleccionado === 'lote') {
      if (!this.lotes.length) {
        await this.general.loading('Cargando lotes...');
        this.getLotes(this.MyRole === 'admin' ? 'all' : 'mios', true);
      }
      if (this.loteSeleccionado) this.onLoteSeleccionado();
    }

    this.markDirty();
  }


  getLotes(tipo: 'all' | 'mios', dismissAfter = false) {
    this.registroService.allLotes(tipo).subscribe({
      next: async (res) => {
        this.lotes = res?.lotes || [];
        this.totalLotes = this.lotes.length;

        if (this.lotes.length === 1) {
          const loteUnico = this.lotes[0];
          this.loteSeleccionado = loteUnico._id;
          this.ubicacionesLoteSeleccionado = loteUnico.direccion || [];
          await this.leerLatLng();
        }
        if (dismissAfter) await this.general.loadingDismiss();
      },
      error: async () => {
        if (dismissAfter) await this.general.loadingDismiss();
        await this.general.alert('Verifica tu red', 'Error de red. Intenta más tarde.', 'danger');
      },
    });
  }

  async leerLatLng() {

    this.ubicacionesLoteLegibles = [];
    const promesas = (this.ubicacionesLoteSeleccionado || []).map((dir) =>
      this.general.obtenerDireccionDesdeCoordenadas(Number(dir.lat), Number(dir.lng))
    );

    try {
      const direcciones = await Promise.all(promesas);
      this.ubicacionesLoteLegibles = direcciones;
    } catch (e) {
      console.warn('❌ Error obteniendo direcciones:', e);
      this.ubicacionesLoteLegibles = (this.ubicacionesLoteSeleccionado || []).map(() => 'No disponible');
    }
  }

  onLoteSeleccionado() {
    console.log('📦 Lote seleccionado:', this.loteSeleccionado);

    const lote = this.lotes.find((l) => l._id === this.loteSeleccionado);
    if (!lote) {
      this.ubicacionesSeleccionadas = [];
      this.ubicacionesLoteSeleccionado = [];
      this.markDirty();
      return;
    }

    this.ubicacionesLoteSeleccionado = lote.direccion || [];
    this.ubicacionesSeleccionadas = [];

    if (Array.isArray(lote.direccion)) {
      this.ubicacionesSeleccionadas = lote.direccion.map((u: any) => ({
        ciudad: u.ciudad || '',
        estado: u.estado || '',
        lat: Number(u.lat) || 0,
        lng: Number(u.lng) || 0,
        direccionCompleta: `${u.ciudad || ''}, ${u.estado || ''}`,
      }));
    }

    this.markDirty();
  }

  isUbicacionSeleccionada(dir: { lat: number; lng: number }): boolean {
    return this.ubicacionesSeleccionadas.some((u) => u.lat === dir.lat && u.lng === dir.lng);
  }

  toggleUbicacionLote(
    dir: { lat: number; lng: number; ciudad?: string; estado?: string },
    event: CustomEvent | any
  ) {
    const checked = event?.detail?.checked ?? event?.target?.checked ?? false;

    if (checked) {

      const idx = this.ubicacionesLoteSeleccionado.findIndex((d) => d.lat === dir.lat && d.lng === dir.lng);
      const legible = idx >= 0 ? this.ubicacionesLoteLegibles[idx] || 'Dirección no disponible' : 'Dirección no disponible';
      this.ubicacionesSeleccionadas.push({
        ciudad: dir.ciudad || '',
        estado: dir.estado || '',
        lat: Number(dir.lat),
        lng: Number(dir.lng),
        direccionCompleta: legible,
      });
    } else {
      const i = this.ubicacionesSeleccionadas.findIndex((u) => u.lat === dir.lat && u.lng === dir.lng);
      if (i !== -1) this.ubicacionesSeleccionadas.splice(i, 1);
    }
    this.markDirty();
  }

  private reencadenarTarifas() {
    const arr = this.renta.entrega?.tarifasPorDistancia || [];
    if (!arr.length) return;
    arr[0].desdeKm = Number(this.renta.entrega.gratuitoHastaKm) || 0;
    for (let i = 1; i < arr.length; i++) {
      const prevHasta = Number(arr[i - 1].hastaKm) || 0;
      arr[i].desdeKm = prevHasta;
    }
  }

  addTarifa() {
    if (!Array.isArray(this.renta.entrega.tarifasPorDistancia)) {
      this.renta.entrega.tarifasPorDistancia = [];
    }
    const anterior = this.renta.entrega.tarifasPorDistancia.at(-1);
    const desde = anterior ? Number(anterior.hastaKm) || 0 : Number(this.renta.entrega.gratuitoHastaKm) || 0;
    this.renta.entrega.tarifasPorDistancia.push({
      desdeKm: Math.max(0, desde),
      hastaKm: Math.max(0, desde + 10),
      costoFijo: 0,
      nota: '',
    });
    this.markDirty();
  }

  removeTarifa(i: number) {
    this.renta.entrega.tarifasPorDistancia.splice(i, 1);
    this.reencadenarTarifas();
    this.markDirty();
  }

  onGratisHastaChange() {
    this.reencadenarTarifas();
    this.markDirty();
  }

  onTarifaHastaChange(i: number) {
    const arr = this.renta.entrega.tarifasPorDistancia;
    const val = Number(arr[i].hastaKm);
    arr[i].hastaKm = Number.isFinite(val) && val >= 0 ? val : 0;
    if (i < arr.length - 1) arr[i + 1].desdeKm = arr[i].hastaKm || 0;
    this.markDirty();
  }

  seleccionarImagen() {
    this.inputArchivo.nativeElement.click();
  }

  async cargarNuevaImagen(event: Event) {
    const file = (event.target as HTMLInputElement).files?.[0] || null;
    if (!file) return;
    if (file.size > 10 * 1024 * 1024) {
      this.general.alert('Imagen demasiado grande', 'Máximo 10MB.', 'warning');
      return;
    }

    try {
      const comprimido = await imageCompression(file, {
        maxSizeMB: 2,
        maxWidthOrHeight: 1600,
        useWebWorker: true,
      });
      const previewUrl = URL.createObjectURL(comprimido);
      this.imagenPrincipalMostrada = previewUrl;
      this.imagenPrincipalFile = comprimido;
      this.markDirty();
      this.general.alert('Listo', 'Imagen principal actualizada.', 'success');
    } catch {
      this.general.alert('Error', 'No se pudo procesar la imagen.', 'danger');
    }
  }

  actualizarImagenPrincipal(img: string) {
    this.general.confirmarAccion('¿Usar esta imagen como principal?', 'Establecer', () => {
      this.imagenPrincipalMostrada = img;
      this.imagenPrincipalFile = img;
      this.markDirty();
    });
  }

  async agregarImagen(event: Event) {
    const file = (event.target as HTMLInputElement).files?.[0] || null;
    if (!file) return;
    if (this.urlsImagenes.length >= 10) {
      this.general.alert('Límite alcanzado', 'Máximo 10 imágenes.', 'warning');
      return;
    }
    if (file.size > 10 * 1024 * 1024) {
      this.general.alert('Imagen demasiado grande', 'Máximo 10MB.', 'warning');
      return;
    }
    try {
      const comprimido = await imageCompression(file, {
        maxSizeMB: 2,
        maxWidthOrHeight: 1600,
        useWebWorker: true,
      });
      const previewUrl = URL.createObjectURL(comprimido);
      this.urlsImagenes.push(previewUrl);
      this.imagenesNuevas.push(comprimido);
      this.markDirty();
    } catch {
      this.general.alert('Error', 'No se pudo procesar la imagen.', 'danger');
    }
  }

  eliminarImagen_visual(imgUrl: string) {
    const iNueva = this.urlsImagenes.indexOf(imgUrl);
    if (iNueva !== -1) this.urlsImagenes.splice(iNueva, 1);
    const iExist = this.urlsImagenesExistentes.indexOf(imgUrl);
    if (iExist !== -1) this.urlsImagenesExistentes.splice(iExist, 1);
    this.markDirty();
  }

  async onGuardarClick() {
    if (!this.dirty) {
      this.general.alert('Sin cambios', 'No hay cambios por guardar.', 'info');
      return;
    }

    if (!this.renta.precioPorDia || this.renta.precioPorDia < 500) {
      this.general.alert('Precio inválido', 'El precio por día debe ser de al menos $500.', 'warning');
      return;
    }

    if (!this.ubicacionesSeleccionadas.length) {
      this.general.alert('Ubicación', 'Selecciona al menos una ubicación.', 'warning');
      return;
    }

    await this.general.loading('Guardando...');

    try {
      const data: any = {
        tipoVehiculo: this.renta.tipoVehiculo || undefined,
        transmision: this.renta.transmision || undefined,
        combustible: this.renta.combustible || undefined,
        pasajeros: this.renta.pasajeros != null ? Number(this.renta.pasajeros) : undefined,
        precio: Number(this.renta.precioPorDia ?? 0),
        politicaCombustible: this.renta.politicaCombustible,
        politicaLimpieza: this.renta.politicaLimpieza,
        requisitosConductor: {
          edadMinima: Number(this.renta.requisitosConductor.edadMinima ?? 21),
          antiguedadLicenciaMeses: Number(this.renta.requisitosConductor.antiguedadLicenciaMeses ?? 12),
          permiteConductorAdicional: !!this.renta.requisitosConductor.permiteConductorAdicional,
          costoConductorAdicional:
            this.renta.requisitosConductor.costoConductorAdicional != null
              ? Number(this.renta.requisitosConductor.costoConductorAdicional)
              : undefined,
        },
        entrega: {
          gratuitoHastaKm: Number(this.renta.entrega.gratuitoHastaKm) || 0,
          tarifasPorDistancia: (this.renta.entrega.tarifasPorDistancia || []).map((t: any) => ({
            desdeKm: Number(t.desdeKm),
            hastaKm: Number(t.hastaKm),
            costoFijo: t.costoFijo != null ? Number(t.costoFijo) : undefined,
            nota: t.nota || undefined,
          })),
        },
        tipoPublicacion: this.tipoSeleccionado,
        lote: this.tipoSeleccionado === 'lote' ? this.loteSeleccionado : null,  // ✅ 🔥 AGREGADO AQUÍ
        ubicaciones: this.ubicacionesSeleccionadas.map((u) => ({
          ciudad: u.ciudad,
          estado: u.estado,
          lat: u.lat,
          lng: u.lng,
        })),
        imagenesExistentes: this.urlsImagenesExistentes,
      };

      if (typeof this.imagenPrincipalFile === 'string' && this.imagenPrincipalFile.trim()) {
        data.imagenPrincipal = this.imagenPrincipalFile;
      }

      const files: any = {};
      if (this.imagenPrincipalFile instanceof File) files.imagenPrincipal = this.imagenPrincipalFile;
      if (this.imagenesNuevas.length) files.imagenes = this.imagenesNuevas;

      this.rentaService.updateRentalCar(this.id, data, files).subscribe({
        next: async () => {
          await this.general.loadingDismiss();
          this.general.alert('Éxito', 'Renta actualizada correctamente.', 'success');
          this.regresar();
        },
        error: async (err: any) => {
          await this.general.loadingDismiss();
          this.general.alert('Error', err?.error?.message || 'No se pudo actualizar', 'danger');
        },
      });
    } catch (_e) {
      await this.general.loadingDismiss();
      this.general.alert('Error', 'Ocurrió un error al preparar los datos.', 'danger');
    }
  }

  onRestablecerClick() {
    if (!this.snapshot) return;
    this.cargarRenta();
  }

  regresar() {
    this.router.navigate(['/mis-autos']);
  }
}
