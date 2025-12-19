import { NgModule } from '@angular/core';
import { Routes, RouterModule } from '@angular/router';

import { FichaMotosPage } from './ficha-motos.page';

const routes: Routes = [
  {
    path: '',
    component: FichaMotosPage
  }
];

@NgModule({
  imports: [RouterModule.forChild(routes)],
  exports: [RouterModule],
})
export class FichaMotosPageRoutingModule {}
