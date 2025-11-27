import { NgModule } from '@angular/core';
import { Routes, RouterModule } from '@angular/router';

import { AsesoresPage } from './asesores.page';

const routes: Routes = [
  {
    path: '',
    component: AsesoresPage
  }
];

@NgModule({
  imports: [RouterModule.forChild(routes)],
  exports: [RouterModule],
})
export class AsesoresPageRoutingModule {}
