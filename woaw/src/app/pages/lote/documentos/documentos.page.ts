import { Component, OnInit } from '@angular/core';
import { NavController } from '@ionic/angular';
import { Router, ActivatedRoute } from '@angular/router';
import { LoteService } from 'src/app/services/lote.service';

interface LoteDocument {
  tipo: string;
  name: string;
  subtitle: string;
  icon: string;
  uploaded: boolean;
}

@Component({
  selector: 'app-documentos',
  templateUrl: './documentos.page.html',
  styleUrls: ['./documentos.page.scss'],
  standalone: false
})
export class DocumentosPage implements OnInit {

  nombreLote: string = '';
  idLote: string = '';

  rfc: string = '';
  rfcError: string = '';
  rfcValido: boolean = false;
  yaIngresoRFC: boolean = false;

  tipoPersona: 'fisica' | 'moral' | null = null;

  // 🔥 MAPEO MongoDB → Front-end
  private mapaDocumentos: any = {
    constanciaSituacionFiscal: 'constancia-fiscal',
    identificacionApoderado: 'id-apoderado',
    estadoCuentaLote: 'estado-cuenta-lote',
    actaConstitutiva: 'acta-constitutiva',
    fotosLote: 'fotos-lote',
    formatoAutPF: 'formatos-autorizacion',
    formatoAutPM: 'formatos-autorizacion'
  };

  documents: LoteDocument[] = [
    { tipo: 'constancia-fiscal', name: 'Constancia de Situación Fiscal', subtitle: 'Constancia', icon: 'document', uploaded: false },
    { tipo: 'id-apoderado', name: 'Identificación del Apoderado', subtitle: 'INE o Pasaporte Vigente', icon: 'card', uploaded: false },
    { tipo: 'estado-cuenta-lote', name: 'Estado de Cuenta Lote', subtitle: 'Con CLABE interbancaria', icon: 'wallet', uploaded: false },
    { tipo: 'acta-constitutiva', name: 'Acta Constitutiva / Asamblea', subtitle: 'Solo para persona Moral', icon: 'document', uploaded: false },
    { tipo: 'fotos-lote', name: 'Fotos del Lote', subtitle: 'Interior y exterior…', icon: 'camera', uploaded: false },
    { tipo: 'formatos-autorizacion', name: 'Formatos de Autorización', subtitle: 'Personas Físicas / Morales', icon: 'hammer', uploaded: false },
  ];

  constructor(
    private navCtrl: NavController,
    private router: Router,
    private route: ActivatedRoute,
    private loteService: LoteService
  ) { }

  ngOnInit() {
    this.route.paramMap.subscribe(params => {
      this.nombreLote = params.get('nombre') ?? '';
      this.idLote = params.get('id') ?? '';

      if (this.idLote) {
        this.cargarRFCDesdeBackend();
        this.cargarDocumentosSubidos();
      }
    });
  }

  // =============================
  //   CARGAR RFC DEL BACKEND
  // =============================
  private cargarRFCDesdeBackend() {
    this.loteService.getLoteById(this.idLote).subscribe({
      next: (lote: any) => {
        const rfcBackend = lote?.rfc || '';

        if (rfcBackend) {
          this.rfc = rfcBackend;
          this.validarRFC();
          this.yaIngresoRFC = true;
        }
      },
      error: (err) => console.error('Error cargando RFC:', err)
    });
  }

  // =============================
  //   CARGAR DOCUMENTOS SUBIDOS
  // =============================
  private cargarDocumentosSubidos() {
    this.loteService.getLoteById(this.idLote).subscribe({
      next: (lote: any) => {
        const docs = lote?.documentosVerificacion || {};

        Object.keys(docs).forEach(key => {
          const slug = this.mapaDocumentos[key];
          if (!slug) return;

          const docFront = this.documents.find(d => d.tipo === slug);
          if (docFront) {
            docFront.uploaded = true;
          }
        });
      },
      error: (err) => console.error('Error cargando documentos:', err)
    });
  }

  // =============================
  //   RFC
  // =============================
  validarRFC() {
    const len = this.rfc.trim().length;

    if (len === 13) {
      this.tipoPersona = 'fisica';
      this.rfcValido = true;
      this.rfcError = '';
    } else if (len === 12) {
      this.tipoPersona = 'moral';
      this.rfcValido = true;
      this.rfcError = '';
    } else {
      this.tipoPersona = null;
      this.rfcValido = false;
      this.rfcError = 'Debe tener 12 (Moral) o 13 (Física) caracteres.';
    }
  }

  enviarRFC() {
    if (!this.rfcValido) return;

    this.loteService.detectarRFC(this.idLote, this.rfc).subscribe({
      next: () => this.yaIngresoRFC = true,
      error: () => this.rfcError = 'Error al enviar RFC.'
    });
  }

  // =============================
  //   NAVEGAR A SUBIR DOCUMENTO
  // =============================
  uploadDocument(doc: LoteDocument) {

    let tipoReal = doc.tipo;

    if (doc.tipo === 'formatos-autorizacion') {
      tipoReal = this.tipoPersona === 'fisica'
        ? 'formato-aut-pf'
        : 'formato-aut-pm';
    }

    this.router.navigateByUrl(
      `/lote/upload-document/${this.nombreLote}/${this.idLote}/${tipoReal}`
    );
  }

  // =============================
  //   PROGRESO REAL PF VS PM
  // =============================

  getTotalDocsRequeridos(): number {
    if (this.tipoPersona === 'fisica') {
      return this.documents.filter(d => d.tipo !== 'acta-constitutiva').length;
    }
    return this.documents.length;
  }

  getUploadedCount(): number {
    const requeridos = this.tipoPersona === 'fisica'
      ? this.documents.filter(d => d.tipo !== 'acta-constitutiva')
      : this.documents;

    return requeridos.filter(d => d.uploaded).length;
  }

  getProgressPercentage(): number {
    const total = this.getTotalDocsRequeridos();
    if (total === 0) return 0;

    return Math.round((this.getUploadedCount() / total) * 100);
  }

  irAlLote() {
    if (!this.nombreLote || !this.idLote) return;
    this.router.navigateByUrl(`/lote/${this.nombreLote}/${this.idLote}`);
  }

}
