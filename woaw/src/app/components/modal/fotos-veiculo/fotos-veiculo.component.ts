import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { IonicModule, ModalController } from '@ionic/angular';
import { CUSTOM_ELEMENTS_SCHEMA } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { GeneralService } from '../../../services/general.service';
import imageCompression from 'browser-image-compression';

import { ImageCropperComponent, ImageCroppedEvent } from 'ngx-image-cropper';

@Component({
  selector: 'app-fotos-veiculo',
  templateUrl: './fotos-veiculo.component.html',
  styleUrls: ['./fotos-veiculo.component.scss'],
  standalone: true,
  imports: [IonicModule, CommonModule, ImageCropperComponent],
  schemas: [CUSTOM_ELEMENTS_SCHEMA],
})
export class FotosVeiculoComponent implements OnInit {
  estadoVehiculo: string = '';

  imagenPrincipal_sinFondo: File | null = null;
  imagenPrincipalMostrada: string | null = null;

  imagenesSecundarias_sinFondo: File[] = [];
  imagenesSecundariasMostradas: string[] = [];

  // ✅ Cropper
  imagenParaRecortar: File | null = null;
  modoRecorte: 'principal' | 'secundaria' | null = null;

  cropperReady = false;

  cropFormat: 'png' | 'jpeg' | 'webp' = 'jpeg';
  private originalExt: 'png' | 'jpeg' | 'webp' = 'jpeg';

  private croppedBlob: Blob | null = null;

  // ✅ cola secundarias
  private colaSecundarias: File[] = [];

  // ✅ salida final fija (lo que quieres)
  FINAL_WIDTH = 600;
  FINAL_HEIGHT = 500;

  // ✅ proporción fija 600/500 = 1.2
  aspectRatio = this.FINAL_WIDTH / this.FINAL_HEIGHT;

  // ✅ tamaño VISUAL del recorte (para que quepa en el modal)
  CROPPER_UI_WIDTH = 320;
  CROPPER_UI_HEIGHT = Math.round(this.CROPPER_UI_WIDTH / this.aspectRatio); // ~267

  // ✅✅ ZOOM SOLO PARA ALEJAR (NO ACERCAR)
readonly ZOOM_MIN = 0.7;
readonly ZOOM_MAX = 1.6;

zoom = 1.0;
transform: any = { scale: 1.0, rotate: 0 };

  constructor(
    private modalController: ModalController,
    private http: HttpClient,
    private generalService: GeneralService
  ) {}

  ngOnInit() {}

  cancelar() {
    this.modalController.dismiss();
  }

  private setFormatoOriginalDesdeArchivo(file: File) {
    const ext = file.name.split('.').pop()?.toLowerCase();
    this.originalExt =
      ext === 'png' ? 'png' :
      ext === 'webp' ? 'webp' :
      'jpeg';

    this.cropFormat = this.originalExt;
  }

  private resetCropperUI() {
    this.cropperReady = false;
    this.croppedBlob = null;

    // ✅ reset zoom (por defecto "normal", sin acercar)
    this.zoom = (this.ZOOM_MIN + this.ZOOM_MAX) / 2;
    this.transform = { scale: this.zoom, rotate: 0 };
  }

  // ✅ zoom SOLO alejar: clamp entre ZOOM_MIN y ZOOM_MAX
  onZoomChange(ev: any) {
    const raw = Number(ev?.detail?.value ?? ev?.target?.value ?? this.ZOOM_MAX);
    const safe = isNaN(raw) ? this.ZOOM_MAX : raw;

    const clamped = Math.min(this.ZOOM_MAX, Math.max(this.ZOOM_MIN, safe));
    this.zoom = clamped;
    this.transform = { ...this.transform, scale: this.zoom };
  }

  // =========================
  // ✅ PRINCIPAL
  // =========================
  async seleccionarImagenPrincipal(event: Event) {
    const input = event.target as HTMLInputElement;
    const file: File | null = input.files?.[0] || null;
    if (!file) return;

    const maxSize = 10 * 1024 * 1024;
    const extension = file.name.split('.').pop()?.toLowerCase();
    const heicExtensions = ['heic', 'heif'];

    if (file.size > maxSize) {
      this.generalService.alert('Imagen demasiado grande', 'Máx. 10 MB', 'warning');
      input.value = '';
      return;
    }

    if (extension && heicExtensions.includes(extension)) {
      this.generalService.alert('Formato no compatible', 'Usa JPG, PNG o JPEG', 'warning');
      input.value = '';
      return;
    }

    if (!file.type.startsWith('image/')) {
      this.generalService.alert('Archivo inválido', 'Selecciona una imagen', 'info');
      input.value = '';
      return;
    }

    this.setFormatoOriginalDesdeArchivo(file);

    this.imagenParaRecortar = file;
    this.modoRecorte = 'principal';
    this.resetCropperUI();

    input.value = '';
  }

  // =========================
  // ✅ SECUNDARIAS (cola)
  // =========================
  async seleccionarImagenesSecundarias(event: Event) {
    const input = event.target as HTMLInputElement;
    const files: FileList | null = input.files;
    if (!files || files.length === 0) return;

    if (files.length + this.imagenesSecundarias_sinFondo.length > 10) {
      this.generalService.alert('Límite excedido', 'Máximo 10 imágenes secundarias', 'warning');
      input.value = '';
      return;
    }

    const heicExtensions = ['heic', 'heif'];

    for (let i = 0; i < files.length; i++) {
      const file = files[i];
      const extension = file.name.split('.').pop()?.toLowerCase();

      if (file.size > 10 * 1024 * 1024 || (extension && heicExtensions.includes(extension))) {
        this.generalService.alert('Imagen no válida', 'Debe pesar menos de 10 MB y no ser HEIC', 'warning');
        continue;
      }

      if (!file.type.startsWith('image/')) {
        this.generalService.alert('Archivo inválido', 'Selecciona una imagen', 'info');
        continue;
      }

      this.colaSecundarias.push(file);
    }

    input.value = '';

    if (!this.imagenParaRecortar && this.colaSecundarias.length > 0) {
      this.abrirSiguienteRecorteSecundaria();
    }
  }

  private abrirSiguienteRecorteSecundaria() {
    if (this.colaSecundarias.length === 0) return;

    const file = this.colaSecundarias.shift()!;
    this.setFormatoOriginalDesdeArchivo(file);

    this.imagenParaRecortar = file;
    this.modoRecorte = 'secundaria';
    this.resetCropperUI();
  }

  // =========================
  // ✅ CROP EVENTS
  // =========================
  onImageCropped(event: ImageCroppedEvent) {
    this.croppedBlob = event.blob ?? null;
  }

  onCropperReady() {
    this.cropperReady = true;
  }

  onLoadImageFailed() {
    this.generalService.alert('Error', 'No se pudo cargar la imagen en el recortador', 'danger');
    this.cancelarRecorte();
  }

  cancelarRecorte() {
    this.imagenParaRecortar = null;
    this.modoRecorte = null;
    this.croppedBlob = null;
    this.cropperReady = false;

    if (this.colaSecundarias.length > 0) {
      this.abrirSiguienteRecorteSecundaria();
    }
  }

  async aplicarRecorte() {
    if (!this.croppedBlob || !this.imagenParaRecortar || !this.modoRecorte) {
      this.generalService.alert('Falta recorte', 'Ajusta la imagen antes de guardar', 'warning');
      return;
    }

    const originalName = this.imagenParaRecortar.name.replace(/\.(png|jpg|jpeg|webp)$/i, '');

    const mime =
      this.cropFormat === 'png'
        ? 'image/png'
        : this.cropFormat === 'webp'
        ? 'image/webp'
        : 'image/jpeg';

    const croppedFile = new File(
      [this.croppedBlob],
      `${originalName}-cropped.${this.cropFormat}`,
      { type: mime }
    );

    try {
      const comprimido = await imageCompression(croppedFile, {
        maxSizeMB: 2,
        maxWidthOrHeight: Math.max(this.FINAL_WIDTH, this.FINAL_HEIGHT),
        useWebWorker: true,
      });

      if (this.modoRecorte === 'principal') {
        this.imagenPrincipal_sinFondo = comprimido;
        this.imagenPrincipalMostrada = URL.createObjectURL(comprimido);
        this.cancelarRecorte();
        return;
      }

      if (this.imagenesSecundarias_sinFondo.length >= 10) {
        this.generalService.alert('Límite excedido', 'Máximo 10 imágenes secundarias', 'warning');
        this.cancelarRecorte();
        return;
      }

      this.imagenesSecundarias_sinFondo.push(comprimido);
      this.imagenesSecundariasMostradas.push(URL.createObjectURL(comprimido));
      this.cancelarRecorte();
    } catch (error) {
      this.generalService.alert('Error', 'No se pudo procesar la imagen recortada', 'danger');
    }
  }

  confirmar() {
    if (!this.imagenPrincipal_sinFondo) {
      this.generalService.alert('Falta imagen principal', 'Selecciona una imagen principal', 'warning');
      return;
    }

    if (this.estadoVehiculo !== 'Nuevo' && this.imagenesSecundarias_sinFondo.length < 2) {
      this.generalService.alert('Imágenes insuficientes', 'Debes agregar al menos 2 imágenes secundarias', 'warning');
      return;
    }

    this.modalController.dismiss({
      imagenPrincipal: this.imagenPrincipal_sinFondo,
      imagenesSecundarias: this.imagenesSecundarias_sinFondo,
    });
  }

  eliminarImagenSecundaria(index: number) {
    this.imagenesSecundariasMostradas.splice(index, 1);
    this.imagenesSecundarias_sinFondo.splice(index, 1);
  }

  eliminarImagenPrincipal() {
    this.imagenPrincipalMostrada = null;
    this.imagenPrincipal_sinFondo = null;
  }
}