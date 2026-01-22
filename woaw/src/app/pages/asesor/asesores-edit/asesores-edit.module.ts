import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { IonicModule } from '@ionic/angular';
import { AsesoresEditPageRoutingModule } from './asesores-edit-routing.module';
import { AsesoresEditPage } from './asesores-edit.page';
import { NavbarComponent } from '../../../components/navbar/navbar.component';
import { FooterComponent } from '../../../components/footer/footer.component';
import { HttpClientModule } from '@angular/common/http';

@NgModule({
  imports: [
    CommonModule,
    FormsModule,
    IonicModule,
    NavbarComponent,
    FooterComponent,
    AsesoresEditPageRoutingModule,
    HttpClientModule
  ],
  declarations: [AsesoresEditPage]
})
export class AsesoresEditPageModule { }
