import { NgModule } from '@angular/core';
import { Routes, RouterModule } from '@angular/router';

import { AddLotePage } from './add-lote.page';

const routes: Routes = [
  {
    path: '',
    component: AddLotePage
  }
];

@NgModule({
  imports: [RouterModule.forChild(routes)],
  exports: [RouterModule],
})
export class AddLotePageRoutingModule {}
