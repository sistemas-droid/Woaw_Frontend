import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';

import { IonicModule } from '@ionic/angular';
import { SoportePageRoutingModule } from './soporte-routing.module';

// importamos la navbar
import { NavbarComponent } from '../../components/navbar/navbar.component';
import { PrincipalComponent } from '../../components/landing/principal/principal.component';
import { HistorealSearchComponent } from '../../components/historeal-search/historeal-search.component';
import { PrecentacionComponent } from '../../components/landing/precentacion/precentacion.component';
import { FooterComponent } from '../../components/footer/footer.component';
import { ReactiveFormsModule } from '@angular/forms';


import { SoportePage } from './soporte.page';

@NgModule({
  imports: [
    CommonModule,
    FormsModule,
    IonicModule,
    SoportePageRoutingModule, 
    NavbarComponent,
    ReactiveFormsModule,
    FooterComponent,
    PrincipalComponent,
    HistorealSearchComponent,
    PrecentacionComponent,
  ],
  declarations: [SoportePage]
})
export class SoportePageModule {}
