import { NgModule } from '@angular/core';
import { Routes, RouterModule } from '@angular/router';

import { LoteVerificacionPage } from './lote-verificacion.page';

const routes: Routes = [
  {
    path: '',
    component: LoteVerificacionPage
  }
];

@NgModule({
  imports: [RouterModule.forChild(routes)],
  exports: [RouterModule],
})
export class LoteVerificacionPageRoutingModule {}
