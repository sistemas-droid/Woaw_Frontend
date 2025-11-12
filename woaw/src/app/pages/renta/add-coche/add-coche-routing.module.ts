import { NgModule } from '@angular/core';
import { Routes, RouterModule } from '@angular/router';

import { AddCochePage } from './add-coche.page';

const routes: Routes = [
  {
    path: '',
    component: AddCochePage
  }
];

@NgModule({
  imports: [RouterModule.forChild(routes)],
  exports: [RouterModule],
})
export class AddCochePageRoutingModule {}
