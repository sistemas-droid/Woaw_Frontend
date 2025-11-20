import { Component, OnInit } from '@angular/core';

@Component({
  selector: 'app-subir-documents',
  templateUrl: './subir-documents.page.html',
  styleUrls: ['./subir-documents.page.scss'],
  standalone: false
})
export class SubirDocumentsPage implements OnInit {

  documents = [
    { name: 'Constancia de Situación Fiscal', uploaded: false },
    { name: 'Identificación del Apoderado', uploaded: false },
    { name: 'Estado de Cuenta Lote', uploaded: false },
    { name: 'Acta Constitutiva / Asamblea', uploaded: false },
    { name: 'Fotos del Lote', uploaded: false },
    { name: 'Formatos de Autorización', uploaded: false }
  ];

  constructor() { }

  ngOnInit() {
  }

  uploadDocument(index: number) {
    // Simular subida de documento
    console.log('Subiendo documento:', this.documents[index].name);
    
    // En una implementación real, aquí iría la lógica para seleccionar y subir archivos
    // Por ahora simulamos que se subió correctamente
    this.documents[index].uploaded = true;
    
    // Mostrar mensaje de éxito
    this.showUploadSuccess(this.documents[index].name);
  }

  viewDocument(index: number) {
    console.log('Viendo documento:', this.documents[index].name);
    // Lógica para visualizar el documento subido
  }

  getUploadedCount(): number {
    return this.documents.filter(doc => doc.uploaded).length;
  }

  getProgressPercentage(): number {
    const uploadedCount = this.getUploadedCount();
    return Math.round((uploadedCount / this.documents.length) * 100);
  }

  showUploadSuccess(documentName: string) {
    // En una implementación real, mostrarías un toast o alerta
    console.log(`¡${documentName} subido exitosamente!`);
    // Podrías implementar: this.presentToast(`¡${documentName} subido exitosamente!`);
  }

}