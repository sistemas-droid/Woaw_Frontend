import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';

import { IonicModule } from '@ionic/angular';

import { WelcomeLotePageRoutingModule } from './welcome-lote-routing.module';

import { WelcomeLotePage } from './welcome-lote.page';

@NgModule({
  imports: [
    CommonModule,
    FormsModule,
    IonicModule,
    WelcomeLotePageRoutingModule
  ],
  declarations: [WelcomeLotePage]
})
export class WelcomeLotePageModule {}
