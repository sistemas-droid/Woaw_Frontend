import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';

import { IonicModule } from '@ionic/angular';

import { NavbarComponent } from '../../../components/navbar/navbar.component';
import { AsesoresPageRoutingModule } from './asesores-routing.module';

import { FooterComponent } from '../../../components/footer/footer.component';
import { AsesoresPage } from './asesores.page';

@NgModule({
  imports: [
    CommonModule,
    FormsModule,
    IonicModule,
    NavbarComponent,
    FooterComponent,
    AsesoresPageRoutingModule
  ],
  declarations: [AsesoresPage]
})
export class AsesoresPageModule { }
