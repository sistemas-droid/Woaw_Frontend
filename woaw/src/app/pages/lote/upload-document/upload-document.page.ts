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

  nombreLote = '';
  idLote = '';
  tipoDocumento = '';

  archivoSeleccionado: File | null = null;
  nombreDocumentoMostrar = '';

  documentoActualUrl: string | null = null;
  documentoActualNombre: string | null = null;
  documentoActualEstado: 'aprobado' | 'rechazado' | 'pendiente' | null = null;

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
      this.cargarDocumentoActual();
    });
  }

  private cargarDocumentoActual() {
    this.loteService.getLoteById(this.idLote).subscribe(lote => {
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

      Object.keys(docs).forEach(key => {
        if (mapa[key] === this.tipoDocumento) {
          const doc = docs[key];
          this.documentoActualUrl = doc.url ?? null;
          this.documentoActualNombre = doc.nombreOriginal ?? null;
          this.documentoActualEstado = doc.estado ?? null;
        }
      });
    });
  }

  abrirDocumento() {
    if (this.documentoActualUrl) {
      window.open(this.documentoActualUrl, '_blank');
    }
  }

  onFileSelected(event: any) {
    if (this.documentoActualEstado === 'aprobado') return;
    this.archivoSeleccionado = event.target.files[0] ?? null;
  }

  async subirArchivo() {
    if (!this.archivoSeleccionado || this.documentoActualEstado === 'aprobado') return;

    const loading = await this.loadingCtrl.create({
      message: 'Subiendo archivo...',
      spinner: 'crescent'
    });
    await loading.present();

    let request$;
    switch (this.tipoDocumento) {
      case 'constancia-fiscal':
        request$ = this.loteService.subirConstanciaFiscal(this.idLote, this.archivoSeleccionado); break;
      case 'id-apoderado':
        request$ = this.loteService.subirIdentificacionApoderado(this.idLote, this.archivoSeleccionado); break;
      case 'estado-cuenta-lote':
        request$ = this.loteService.subirEstadoCuenta(this.idLote, this.archivoSeleccionado); break;
      case 'acta-constitutiva':
        request$ = this.loteService.subirActaConstitutiva(this.idLote, this.archivoSeleccionado); break;
      case 'fotos-lote':
        request$ = this.loteService.subirFotosLote(this.idLote, this.archivoSeleccionado); break;
      case 'formato-aut-pf':
        request$ = this.loteService.subirFormatoAutPF(this.idLote, this.archivoSeleccionado); break;
      case 'formato-aut-pm':
        request$ = this.loteService.subirFormatoAutPM(this.idLote, this.archivoSeleccionado); break;
      default:
        await loading.dismiss();
        return;
    }

    request$.subscribe(async () => {
      await loading.dismiss();
      this.mostrarToast('Documento subido con éxito ✔');
      this.router.navigateByUrl(`/lote/documentos/${this.nombreLote}/${this.idLote}`);
    });
  }

  async eliminarDocumento(event?: Event) {
    event?.stopPropagation();
    if (this.documentoActualEstado === 'aprobado') return;

    const seguro = confirm('¿Seguro que deseas eliminar este documento?');
    if (!seguro) return;

    let request$;
    switch (this.tipoDocumento) {
      case 'constancia-fiscal': request$ = this.loteService.eliminarConstanciaFiscal(this.idLote); break;
      case 'id-apoderado': request$ = this.loteService.eliminarIdentificacionApoderado(this.idLote); break;
      case 'estado-cuenta-lote': request$ = this.loteService.eliminarEstadoCuenta(this.idLote); break;
      case 'acta-constitutiva': request$ = this.loteService.eliminarActaConstitutiva(this.idLote); break;
      case 'fotos-lote': request$ = this.loteService.eliminarFotosLote(this.idLote); break;
      case 'formato-aut-pf': request$ = this.loteService.eliminarFormatoAutPF(this.idLote); break;
      case 'formato-aut-pm': request$ = this.loteService.eliminarFormatoAutPM(this.idLote); break;
      default: return;
    }

    request$.subscribe(() => {
      this.documentoActualUrl = null;
      this.documentoActualNombre = null;
      this.documentoActualEstado = null;
      this.mostrarToast('Documento eliminado ✔');
    });
  }

  formatearTitulo(tipo: string): string {
    const map: any = {
      'constancia-fiscal': 'Constancia de Situación Fiscal',
      'id-apoderado': 'Identificación del Apoderado',
      'estado-cuenta-lote': 'Estado de Cuenta del Lote',
      'acta-constitutiva': 'Acta Constitutiva',
      'fotos-lote': 'Fotos del Lote',
      'formato-aut-pf': 'Formato Autorización Persona Física',
      'formato-aut-pm': 'Formato Autorización Persona Moral'
    };
    return map[tipo] || tipo;
  }

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
