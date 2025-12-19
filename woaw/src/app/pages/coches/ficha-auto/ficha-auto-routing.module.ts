import { NgModule } from '@angular/core';
import { Routes, RouterModule } from '@angular/router';

import { FichaAutoPage } from './ficha-auto.page';

const routes: Routes = [
  {
    path: '',
    component: FichaAutoPage
  }
];

@NgModule({
  imports: [RouterModule.forChild(routes)],
  exports: [RouterModule],
})
export class FichaAutoPageRoutingModule {}
