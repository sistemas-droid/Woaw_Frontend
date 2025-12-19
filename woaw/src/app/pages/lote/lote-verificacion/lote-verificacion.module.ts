import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { IonicModule } from '@ionic/angular';

import { LoteVerificacionPageRoutingModule } from './lote-verificacion-routing.module';

import { LoteVerificacionPage } from './lote-verificacion.page';

// 🔹 Navbar y Footer SÍ son standalone
import { NavbarComponent } from '../../../components/navbar/navbar.component';
import { FooterComponent } from '../../../components/footer/footer.component';

@NgModule({
  declarations: [
    LoteVerificacionPage  
  ],
  imports: [
    CommonModule,
    FormsModule,
    IonicModule,

    // 🔹 Rutas
    LoteVerificacionPageRoutingModule,

    // 🔹 Componentes standalone
    NavbarComponent,
    FooterComponent,
  ],
})
export class LoteVerificacionPageModule { }
