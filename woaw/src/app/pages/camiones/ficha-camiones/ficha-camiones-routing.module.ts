import { NgModule } from '@angular/core';
import { Routes, RouterModule } from '@angular/router';

import { FichaCamionesPage } from './ficha-camiones.page';

const routes: Routes = [
  {
    path: '',
    component: FichaCamionesPage
  }
];

@NgModule({
  imports: [RouterModule.forChild(routes)],
  exports: [RouterModule],
})
export class FichaCamionesPageRoutingModule {}
