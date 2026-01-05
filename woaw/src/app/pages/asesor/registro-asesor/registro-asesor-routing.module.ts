import { NgModule } from '@angular/core';
import { Routes, RouterModule } from '@angular/router';

import { RegistroAsesorPage } from './registro-asesor.page';

const routes: Routes = [
  {
    path: '',
    component: RegistroAsesorPage
  }
];

@NgModule({
  imports: [RouterModule.forChild(routes)],
  exports: [RouterModule],
})
export class RegistroAsesorPageRoutingModule {}
