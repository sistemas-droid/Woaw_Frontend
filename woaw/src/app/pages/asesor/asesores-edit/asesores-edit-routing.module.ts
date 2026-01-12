import { NgModule } from '@angular/core';
import { Routes, RouterModule } from '@angular/router';

import { AsesoresEditPage } from './asesores-edit.page';
const routes: Routes = [
  {
    path: '',
    component: AsesoresEditPage
  }
];

@NgModule({
  imports: [RouterModule.forChild(routes)],
  exports: [RouterModule],
})
export class AsesoresEditPageRoutingModule {}
