import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';

import { IonicModule } from '@ionic/angular';

import { FichaCamionesPageRoutingModule } from './ficha-camiones-routing.module';

import { FooterComponent } from '../../../components/footer/footer.component';
import { SugerenciasComponent } from '../../../components/modal/sugerencias/sugerencias.component';
import { CollageFichaComponent } from '../../../components/collage-ficha/collage-ficha.component';
import { CotizadorComponent } from './../../../components/cotizador/cotizador.component';
import { NavbarComponent } from '../../../components/navbar/navbar.component';

import { FichaCamionesPage } from './ficha-camiones.page';

@NgModule({
  imports: [
    CommonModule,
    FormsModule,
    IonicModule,
    FichaCamionesPageRoutingModule,
    FooterComponent,
    CollageFichaComponent,
    SugerenciasComponent,
    CotizadorComponent, 
    NavbarComponent
  ],
  declarations: [FichaCamionesPage]
})
export class FichaCamionesPageModule { }
