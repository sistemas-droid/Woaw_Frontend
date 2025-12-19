import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';

import { IonicModule } from '@ionic/angular';

import { FichaMotosPageRoutingModule } from './ficha-motos-routing.module';

import { FooterComponent } from '../../../components/footer/footer.component';
import { SugerenciasComponent } from '../../../components/modal/sugerencias/sugerencias.component';
import { CollageFichaComponent } from '../../../components/collage-ficha/collage-ficha.component';
import { CotizadorComponent } from './../../../components/cotizador/cotizador.component';
import { NavbarComponent } from '../../../components/navbar/navbar.component';

import { FichaMotosPage } from './ficha-motos.page';

@NgModule({
  imports: [
    CommonModule,
    FormsModule,
    IonicModule,
    FichaMotosPageRoutingModule,
    FooterComponent,
    CollageFichaComponent,
    SugerenciasComponent,
    CotizadorComponent,
    NavbarComponent
  ],
  declarations: [FichaMotosPage]
})
export class FichaMotosPageModule {}
