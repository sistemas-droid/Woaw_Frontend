import { Component, OnInit } from '@angular/core';
import { ActivatedRoute } from '@angular/router';
import { NavController } from '@ionic/angular';

@Component({
  selector: 'app-upload-document',
  templateUrl: './upload-document.page.html',
  styleUrls: ['./upload-document.page.scss'],
  standalone: false
})
export class UploadDocumentPage implements OnInit {

  documentIndex: number = 0;
  documentName: string = '';

  constructor(private navCtrl: NavController, private route: ActivatedRoute) { }

  ngOnInit() {
    this.route.queryParams.subscribe(params => {
      this.documentIndex = params['documentIndex'] || 0;
      this.documentName = params['documentName'] || '';
    });
    console.log('Cargando página de subida para:', this.documentName, 'Índice:', this.documentIndex);
  }

}
