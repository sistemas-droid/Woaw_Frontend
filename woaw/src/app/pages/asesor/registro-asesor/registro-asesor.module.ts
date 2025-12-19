import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';

import { IonicModule } from '@ionic/angular';

import { RegistroAsesorPageRoutingModule } from './registro-asesor-routing.module';

import { RegistroAsesorPage } from './registro-asesor.page';

@NgModule({
  imports: [
    CommonModule,
    FormsModule,
    IonicModule,
    RegistroAsesorPageRoutingModule
  ],
  declarations: [RegistroAsesorPage]
})
export class RegistroAsesorPageModule {}
