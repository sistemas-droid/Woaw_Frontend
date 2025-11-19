import { NgModule } from '@angular/core';
import { Routes, RouterModule } from '@angular/router';

import { WelcomeLotePage } from './welcome-lote.page';

const routes: Routes = [
  {
    path: '',
    component: WelcomeLotePage
  }
];

@NgModule({
  imports: [RouterModule.forChild(routes)],
  exports: [RouterModule],
})
export class WelcomeLotePageRoutingModule {}
