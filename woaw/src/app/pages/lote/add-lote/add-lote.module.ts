import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';

import { IonicModule } from '@ionic/angular';

import { AddLotePageRoutingModule } from './add-lote-routing.module';

import { AddLotePage } from './add-lote.page';

@NgModule({
  imports: [
    CommonModule,
    FormsModule,
    IonicModule,
    AddLotePageRoutingModule
  ],
  declarations: [AddLotePage]
})
export class AddLotePageModule {}
