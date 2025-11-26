import { Component, OnInit } from '@angular/core';
import { NavController } from '@ionic/angular';
import { Router } from '@angular/router';

@Component({
  selector: 'app-documentos',
  templateUrl: './documentos.page.html',
  styleUrls: ['./documentos.page.scss'],
  standalone: false
})
export class DocumentosPage implements OnInit {

  nombreLote: string = 'NOSE';
  idLote: number = 2345;

  documents = [
    { name: 'Constancia de Situación Fiscal', uploaded: false },
    { name: 'Identificación del Apoderado', uploaded: false },
    { name: 'Estado de Cuenta Lote', uploaded: false },
    { name: 'Acta Constitutiva / Asamblea', uploaded: false },
    { name: 'Fotos del Lote', uploaded: false },
    { name: 'Formatos de Autorización', uploaded: false }
  ];

  constructor(private navCtrl: NavController, private router: Router) { }

  ngOnInit() {
  }

  uploadDocument() {
    this.router.navigate(['/lote/upload-document/',this.nombreLote,'/'+this.idLote]);
  }

  viewDocument(index: number) {
    console.log('Viendo documento:', this.documents[index].name);
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
