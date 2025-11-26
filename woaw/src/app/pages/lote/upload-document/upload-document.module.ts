import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';

import { IonicModule } from '@ionic/angular';

import { UploadDocumentPageRoutingModule } from './upload-document-routing.module';

import { UploadDocumentPage } from './upload-document.page';
import { NavbarComponent } from '../../../components/navbar/navbar.component';
import { MenuComponent } from '../../../components/filtos/menu/menu.component';
import { CartasComponent } from '../../../components/cartas/cartas.component';
import { AddComponent } from '../../../components/lote/add/add.component';
import { AcomodoComponent } from '../../../components/filtos/acomodo/acomodo.component';
import { FooterComponent } from '../../../components/footer/footer.component';

@NgModule({
  imports: [
    CommonModule,
    FormsModule,
    IonicModule,
    UploadDocumentPageRoutingModule,
    NavbarComponent,
    MenuComponent,
    CartasComponent,
    AcomodoComponent,
    FooterComponent,
    AddComponent,
  ],
  declarations: [UploadDocumentPage]
})
export class UploadDocumentPageModule {}
