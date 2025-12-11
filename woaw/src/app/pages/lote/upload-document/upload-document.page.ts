import { Component, OnInit } from '@angular/core';
import { ActivatedRoute, Router } from '@angular/router';
import { NavController, LoadingController, ToastController } from '@ionic/angular';
import { LoteService } from 'src/app/services/lote.service';

@Component({
  selector: 'app-upload-document',
  templateUrl: './upload-document.page.html',
  styleUrls: ['./upload-document.page.scss'],
  standalone: false
})
export class UploadDocumentPage implements OnInit {

  nombreLote: string = '';
  idLote: string = '';
  tipoDocumento: string = '';

  archivoSeleccionado: File | null = null;
  nombreDocumentoMostrar: string = '';

  // Doc actual (para el enlace)
  documentoActualUrl: string | null = null;
  documentoActualNombre: string | null = null;
  documentoActualEstado: string | null = null;

  constructor(
    private navCtrl: NavController,
    private route: ActivatedRoute,
    public router: Router,
    private loteService: LoteService,
    private loadingCtrl: LoadingController,
    private toastCtrl: ToastController
  ) { }

  ngOnInit() {
    this.route.paramMap.subscribe(params => {
      this.nombreLote = params.get('nombre') ?? '';
      this.idLote = params.get('id') ?? '';
      this.tipoDocumento = params.get('tipoDoc') ?? '';

      this.nombreDocumentoMostrar = this.formatearTitulo(this.tipoDocumento);

      // cargar info del documento actual (si existe)
      this.cargarDocumentoActual();
    });
  }

  // Cargar documento actual desde el backend
  private cargarDocumentoActual() {
    this.loteService.getLoteById(this.idLote).subscribe({
      next: (lote: any) => {
        const docs = lote?.documentosVerificacion || {};

        const mapa: any = {
          constanciaSituacionFiscal: 'constancia-fiscal',
          identificacionApoderado: 'id-apoderado',
          estadoCuentaLote: 'estado-cuenta-lote',
          actaConstitutiva: 'acta-constitutiva',
          fotosLote: 'fotos-lote',
          formatoAutPF: 'formato-aut-pf',
          formatoAutPM: 'formato-aut-pm'
        };

        for (let key of Object.keys(docs)) {
          if (mapa[key] === this.tipoDocumento) {
            const doc = docs[key];
            this.documentoActualUrl = doc.url || null;
            this.documentoActualNombre = doc.nombreOriginal || null;
            this.documentoActualEstado = doc.estado || null;
            break;
          }
        }
      },
      error: (err) => console.error('Error cargando documento actual:', err)
    });
  }

  // Abrir documento actual
  abrirDocumento() {
    if (!this.documentoActualUrl) return;
    window.open(this.documentoActualUrl, '_blank');
  }

  // ❌ Eliminar documento actual
  async eliminarDocumento(event?: Event) {
    event?.stopPropagation();

    if (!this.idLote || !this.tipoDocumento || !this.documentoActualUrl) {
      return;
    }

    const seguro = confirm('¿Seguro que quieres eliminar este documento?');
    if (!seguro) return;

    let request$;

    switch (this.tipoDocumento) {
      case 'constancia-fiscal':
        request$ = this.loteService.eliminarConstanciaFiscal(this.idLote);
        break;
      case 'id-apoderado':
        request$ = this.loteService.eliminarIdentificacionApoderado(this.idLote);
        break;
      case 'estado-cuenta':
      case 'estado-cuenta-lote':
        request$ = this.loteService.eliminarEstadoCuenta(this.idLote);
        break;
      case 'acta-constitutiva':
        request$ = this.loteService.eliminarActaConstitutiva(this.idLote);
        break;
      case 'fotos-lote':
        request$ = this.loteService.eliminarFotosLote(this.idLote);
        break;
      case 'formato-aut-pf':
        request$ = this.loteService.eliminarFormatoAutPF(this.idLote);
        break;
      case 'formato-aut-pm':
        request$ = this.loteService.eliminarFormatoAutPM(this.idLote);
        break;
      default:
        this.mostrarToast('Tipo de documento no reconocido.');
        return;
    }

    const loading = await this.loadingCtrl.create({
      message: 'Eliminando documento...',
      spinner: 'crescent'
    });
    await loading.present();

    request$.subscribe({
      next: async () => {
        await loading.dismiss();
        this.mostrarToast('Documento eliminado ✔');

        // Limpiamos info del documento actual
        this.documentoActualUrl = null;
        this.documentoActualNombre = null;
        this.documentoActualEstado = null;
      },
      error: async (err) => {
        console.error(err);
        await loading.dismiss();
        this.mostrarToast('Error al eliminar documento ❌');
      }
    });
  }

  // Seleccionar archivo
  onFileSelected(event: any) {
    const file = event.target.files[0];
    this.archivoSeleccionado = file ?? null;
  }

  // Subir documento
  async subirArchivo() {
    if (!this.archivoSeleccionado) {
      this.mostrarToast('Selecciona un archivo antes de continuar.');
      return;
    }

    const loading = await this.loadingCtrl.create({
      message: 'Subiendo archivo...',
      spinner: 'crescent'
    });
    await loading.present();

    let request$;

    switch (this.tipoDocumento) {
      case 'constancia-fiscal':
        request$ = this.loteService.subirConstanciaFiscal(this.idLote, this.archivoSeleccionado);
        break;
      case 'id-apoderado':
        request$ = this.loteService.subirIdentificacionApoderado(this.idLote, this.archivoSeleccionado);
        break;
      case 'estado-cuenta-lote':
      case 'estado-cuenta':
        request$ = this.loteService.subirEstadoCuenta(this.idLote, this.archivoSeleccionado);
        break;
      case 'acta-constitutiva':
        request$ = this.loteService.subirActaConstitutiva(this.idLote, this.archivoSeleccionado);
        break;
      case 'fotos-lote':
        request$ = this.loteService.subirFotosLote(this.idLote, this.archivoSeleccionado);
        break;
      case 'formato-aut-pf':
        request$ = this.loteService.subirFormatoAutPF(this.idLote, this.archivoSeleccionado);
        break;
      case 'formato-aut-pm':
        request$ = this.loteService.subirFormatoAutPM(this.idLote, this.archivoSeleccionado);
        break;
      default:
        this.mostrarToast('Tipo de documento no reconocido.');
        await loading.dismiss();
        return;
    }

    request$.subscribe({
      next: async () => {
        await loading.dismiss();
        this.mostrarToast('Documento subido con éxito ✔');
        this.router.navigateByUrl(`/lote/documentos/${this.nombreLote}/${this.idLote}`);
      },
      error: async () => {
        await loading.dismiss();
        this.mostrarToast('Error al subir documento ❌');
      }
    });
  }

  // Título bonito
  formatearTitulo(tipo: string): string {
    switch (tipo) {
      case 'constancia-fiscal': return 'Constancia de Situación Fiscal';
      case 'id-apoderado': return 'Identificación del Apoderado';
      case 'estado-cuenta-lote':
      case 'estado-cuenta': return 'Estado de Cuenta del Lote';
      case 'acta-constitutiva': return 'Acta Constitutiva';
      case 'fotos-lote': return 'Fotos del Lote';
      case 'formato-aut-pf': return 'Formato Autorización Persona Física';
      case 'formato-aut-pm': return 'Formato Autorización Persona Moral';
      default: return tipo;
    }
  }

  // Toast
  async mostrarToast(msg: string) {
    const toast = await this.toastCtrl.create({
      message: msg,
      duration: 2500,
      color: 'dark',
      position: 'bottom'
    });
    toast.present();
  }
}
