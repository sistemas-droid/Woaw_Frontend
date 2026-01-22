import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';

import { IonicModule } from '@ionic/angular';

import { RegistroAsesorPageRoutingModule } from './registro-asesor-routing.module';

import { RegistroAsesorPage } from './registro-asesor.page';
import { HttpClientModule } from '@angular/common/http';

@NgModule({
  imports: [
    CommonModule,
    FormsModule,
    IonicModule,
    RegistroAsesorPageRoutingModule, 
    HttpClientModule
  ],
  declarations: [RegistroAsesorPage]
})
export class RegistroAsesorPageModule {}
