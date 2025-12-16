import { Component, OnInit } from '@angular/core';
import { LoteService } from 'src/app/services/lote.service';

@Component({
  selector: 'app-lote-verificacion',
  templateUrl: './lote-verificacion.page.html',
  styleUrls: ['./lote-verificacion.page.scss'],
  standalone: false
})
export class LoteVerificacionPage implements OnInit {

  // 🔹 Lotes en pantalla
  lotesVerificacion: Array<{
    id: string;
    nombre: string;
    tipoPersona: 'fisica' | 'moral' | null;
    documentos: any[];
  }> = [];

  // 🔹 Modal rechazo
  modalRechazoOpen = false;
  comentarioRechazo = '';
  loteSeleccionadoId: string | null = null;
  docSeleccionado: any = null;

  // 🔹 Estado expandido
  expandedState: { [key: string]: boolean } = {};

  // 🔥 Mapa FRONT → BACK
  slugMap: Record<string, string | null> = {
    'constancia-fiscal': 'constanciaSituacionFiscal',
    'identificacion-apoderado': 'identificacionApoderado',
    'estado-cuenta': 'estadoCuentaLote',
    'acta-constitutiva': 'actaConstitutiva',
    'fotos-lote': 'fotosLote',
    'formato-aut-pf': 'formatoAutPF',
    'formato-aut-pm': 'formatoAutPM',
  };

  // 🔹 Catálogo base (LOS 7 DOCUMENTOS)
  documentosBase = [
    { slug: 'constancia-fiscal', nombre: 'Constancia de Situación Fiscal' },
    { slug: 'identificacion-apoderado', nombre: 'Identificación del Apoderado' },
    { slug: 'estado-cuenta', nombre: 'Estado de Cuenta' },
    { slug: 'acta-constitutiva', nombre: 'Acta Constitutiva' },
    { slug: 'fotos-lote', nombre: 'Fotos del Lote' },
    { slug: 'formato-aut-pf', nombre: 'Formato Autorización PF' },
    { slug: 'formato-aut-pm', nombre: 'Formato Autorización PM' },
  ];

  constructor(private loteService: LoteService) { }

  ngOnInit() {
    this.cargarLotesConDocumentos();
  }

  cargarLotesConDocumentos() {
    this.loteService.getlotes('all').subscribe({
      next: (res: any) => {
        const lotes = res?.lotes || [];

        const lotesConDocs = lotes.filter((l: any) =>
          l.documentosVerificacion &&
          Object.keys(l.documentosVerificacion).length > 0
        );

        this.lotesVerificacion = lotesConDocs.map((l: any) => {
          const docsBackend = l.documentosVerificacion || {};
          const tipoPersona = l.tipoPersona ?? null;

          let docsFrontend = [...this.documentosBase];

          // ✅ SOLO PERSONA FÍSICA FILTRA
          if (tipoPersona === 'fisica') {
            docsFrontend = docsFrontend.filter(d =>
              d.slug !== 'acta-constitutiva' &&
              d.slug !== 'formato-aut-pm'
            );
          }

          // 🚫 PERSONA MORAL NO FILTRA NADA (VE LOS 7)

          docsFrontend = docsFrontend.map(base => {
            const backendKey = this.slugMap[base.slug];
            const real = backendKey ? docsBackend[backendKey] : null;

            return {
              ...base,
              estado: real?.estado ?? 'pendiente',
              url: real?.url ?? null,
              comentarios: real?.comentarios ?? null,
              nombreOriginal: real?.nombreOriginal ?? null,
            };
          });

          return {
            id: l._id,
            nombre: l.nombre,
            tipoPersona,
            documentos: docsFrontend
          };
        });
      },
      error: (err) => console.error('❌ Error cargando lotes:', err),
    });
  }

  colorEstado(estado: string) {
    switch (estado) {
      case 'aprobado': return 'success';
      case 'rechazado': return 'danger';
      default: return 'warning';
    }
  }

  abrir(doc: any) {
    if (doc.url) window.open(doc.url, '_blank');
  }

  aprobar(idLote: string, doc: any) {
    this.loteService.revisarDocumentoLote(idLote, doc.slug, {
      accion: 'aprobar'
    }).subscribe({
      next: () => {
        doc.estado = 'aprobado';
      },
      error: (err) => console.error(err),
    });
  }

  rechazar(idLote: string, doc: any) {
    this.loteSeleccionadoId = idLote;
    this.docSeleccionado = doc;
    this.modalRechazoOpen = true;
  }

  cerrarModalRechazo() {
    this.modalRechazoOpen = false;
    this.comentarioRechazo = '';
    this.docSeleccionado = null;
    this.loteSeleccionadoId = null;
  }

  confirmarRechazo() {
    if (!this.docSeleccionado || !this.loteSeleccionadoId) return;

    this.loteService.revisarDocumentoLote(
      this.loteSeleccionadoId,
      this.docSeleccionado.slug,
      {
        accion: 'rechazar',
        comentarios: this.comentarioRechazo
      }
    ).subscribe({
      next: () => {
        this.docSeleccionado.estado = 'rechazado';
        this.cerrarModalRechazo();
      },
      error: (err) => console.error(err),
    });
  }

  toggleLote(id: string) {
    this.expandedState[id] = !this.expandedState[id];
  }
}
