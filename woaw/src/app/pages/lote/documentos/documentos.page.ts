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
  status?: 'aprobado' | 'rechazado' | 'pendiente' | null;
  comentarios?: string | null;
  url?: string | null;
}

@Component({
  selector: 'app-documentos',
  templateUrl: './documentos.page.html',
  styleUrls: ['./documentos.page.scss'],
  standalone: false
})
export class DocumentosPage implements OnInit {

  nombreLote = '';
  idLote = '';

  rfc = '';
  rfcError = '';
  rfcValido = false;
  yaIngresoRFC = false;

  tipoPersona: 'fisica' | 'moral' | null = null;

  // 🔥 MAPEO MongoDB → Front-end (CORREGIDO)
  private mapaDocumentos: any = {
    constanciaSituacionFiscal: 'constancia-fiscal',
    identificacionApoderado: 'id-apoderado',
    estadoCuentaLote: 'estado-cuenta-lote',
    actaConstitutiva: 'acta-constitutiva',
    fotosLote: 'fotos-lote',
    formatoAutPF: 'formato-aut-pf',
    formatoAutPM: 'formato-aut-pm'
  };

  documents: LoteDocument[] = [
    { tipo: 'constancia-fiscal', name: 'Constancia de Situación Fiscal', subtitle: 'Constancia', icon: 'document', uploaded: false },
    { tipo: 'id-apoderado', name: 'Identificación del Apoderado', subtitle: 'INE o Pasaporte Vigente', icon: 'card', uploaded: false },
    { tipo: 'estado-cuenta-lote', name: 'Estado de Cuenta Lote', subtitle: 'Con CLABE interbancaria', icon: 'wallet', uploaded: false },
    { tipo: 'acta-constitutiva', name: 'Acta Constitutiva / Asamblea', subtitle: 'Solo persona Moral', icon: 'document', uploaded: false },
    { tipo: 'fotos-lote', name: 'Fotos del Lote', subtitle: 'Interior y exterior', icon: 'camera', uploaded: false },
    { tipo: 'formato-aut-pf', name: 'Formato de Autorización PF', subtitle: 'Persona Física', icon: 'hammer', uploaded: false },
    { tipo: 'formato-aut-pm', name: 'Formato de Autorización PM', subtitle: 'Persona Moral', icon: 'hammer', uploaded: false },
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

  private cargarRFCDesdeBackend() {
    this.loteService.getLoteById(this.idLote).subscribe({
      next: (lote: any) => {
        if (lote?.rfc) {
          this.rfc = lote.rfc;
          this.validarRFC();
          this.yaIngresoRFC = true;
        }
      }
    });
  }

  private cargarDocumentosSubidos() {
    this.loteService.getLoteById(this.idLote).subscribe({
      next: (lote: any) => {
        const docs = lote?.documentosVerificacion || {};

        Object.keys(docs).forEach(key => {
          const slug = this.mapaDocumentos[key];
          if (!slug) return;

          const docFront = this.documents.find(d => d.tipo === slug);
          if (!docFront) return;

          docFront.uploaded = true;
          docFront.status = docs[key].estado || 'pendiente';
          docFront.comentarios = docs[key].comentarios || null;
          docFront.url = docs[key].url || null;
        });
      }
    });
  }

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

  uploadDocument(doc: LoteDocument) {
    if (doc.status === 'aprobado') return;

    this.router.navigateByUrl(
      `/lote/upload-document/${this.nombreLote}/${this.idLote}/${doc.tipo}`
    );
  }

  getTotalDocsRequeridos(): number {
    if (this.tipoPersona === 'fisica') {
      return this.documents.filter(d =>
        d.tipo !== 'acta-constitutiva' && d.tipo !== 'formato-aut-pm'
      ).length;
    }
    return this.documents.length;
  }

  getUploadedCount(): number {
    const requeridos = this.tipoPersona === 'fisica'
      ? this.documents.filter(d =>
        d.tipo !== 'acta-constitutiva' && d.tipo !== 'formato-aut-pm'
      )
      : this.documents;

    return requeridos.filter(d => d.uploaded).length;
  }

  getProgressPercentage(): number {
    const total = this.getTotalDocsRequeridos();
    return total ? Math.round((this.getUploadedCount() / total) * 100) : 0;
  }

  getCardClass(doc: LoteDocument) {
    if (doc.status === 'aprobado') return 'doc-aprobado';
    if (doc.status === 'rechazado') return 'doc-rechazado';
    return 'doc-pendiente';
  }

  getStatusIcon(doc: LoteDocument) {
    if (doc.status === 'aprobado') return 'checkmark-circle';
    if (doc.status === 'rechazado') return 'close-circle';
    return 'hourglass-outline';
  }

  irAlLote() {
    if (!this.nombreLote || !this.idLote) return;
    this.router.navigateByUrl(`/lote/${this.nombreLote}/${this.idLote}`);
  }
}
