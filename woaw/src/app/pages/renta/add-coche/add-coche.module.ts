import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';

import { IonicModule } from '@ionic/angular';

import { AddCochePageRoutingModule } from './add-coche-routing.module';
import { AddCochePage } from './add-coche.page';

import { NavbarComponent } from '../../../components/navbar/navbar.component';
import { MenuComponent } from '../../../components/filtos/menu/menu.component';
import { CartasComponent } from '../../../components/cartas/cartas.component';
import { AddComponent } from '../../../components/lote/add/add.component';
import { AcomodoComponent } from '../../../components/filtos/acomodo/acomodo.component';
import { FooterComponent } from '../../../components/footer/footer.component';
import { ReactiveFormsModule } from '@angular/forms';

@NgModule({
  imports: [
    CommonModule,
    FormsModule,
    IonicModule,
    AddCochePageRoutingModule, 
    NavbarComponent, 
    MenuComponent, 
    CartasComponent, 
    AddComponent, 
    AcomodoComponent, 
    FooterComponent,
    ReactiveFormsModule
  ],
  declarations: [AddCochePage]
})
export class AddCochePageModule { }
