import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';

import { IonicModule } from '@ionic/angular';

import { WelcomeLotePageRoutingModule } from './welcome-lote-routing.module';

import { WelcomeLotePage } from './welcome-lote.page';
import { FooterComponent } from 'src/app/components/footer/footer.component';
import { NavbarComponent } from 'src/app/components/navbar/navbar.component';

@NgModule({
  imports: [
    CommonModule,
    FormsModule,
    IonicModule,
    WelcomeLotePageRoutingModule,
    FooterComponent,
    NavbarComponent,
  ],
  declarations: [WelcomeLotePage]
})
export class WelcomeLotePageModule { }
