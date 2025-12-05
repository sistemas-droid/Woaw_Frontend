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
    });
  }

  // ============================
  // Devuelve un título bonito
  // ============================
  formatearTitulo(tipo: string): string {
    switch (tipo) {
      case 'constancia-fiscal': return 'Constancia de Situación Fiscal';
      case 'id-apoderado': return 'Identificación del Apoderado';
      case 'estado-cuenta-lote':
      case 'estado-cuenta': return 'Estado de Cuenta';
      case 'acta-constitutiva': return 'Acta Constitutiva';
      case 'fotos-lote': return 'Fotos del Lote';
      case 'formato-aut-pf': return 'Formato Autorización Persona Física';
      case 'formato-aut-pm': return 'Formato Autorización Persona Moral';
      default: return tipo;
    }
  }

  // ================================
  // Seleccionar archivo
  // ================================
  onFileSelected(event: any) {
    const file = event.target.files[0];
    this.archivoSeleccionado = file ?? null;
  }

  // =================================
  // Subir documento al backend
  // =================================
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

    // Seleccionar método correcto según el endpoint real
    switch (this.tipoDocumento) {
      case 'constancia-fiscal':
        request$ = this.loteService.subirConstanciaFiscal(this.idLote, this.archivoSeleccionado);
        break;

      case 'id-apoderado':
        request$ = this.loteService.subirIdentificacionApoderado(this.idLote, this.archivoSeleccionado);
        break;

      case 'estado-cuenta':
      case 'estado-cuenta-lote':
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
        loading.dismiss();
        return;
    }

    request$.subscribe({
      next: async (res) => {
        await loading.dismiss();
        this.mostrarToast('Documento subido con éxito ✔');

        // Regresamos a la página de documentos
        this.router.navigateByUrl(`/lote/documentos/${this.nombreLote}/${this.idLote}`);
      },
      error: async (err) => {
        console.error(err);
        await loading.dismiss();
        this.mostrarToast('Error al subir documento ❌');
      }
    });
  }

  // ======================
  // Toast bonito
  // ======================
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
