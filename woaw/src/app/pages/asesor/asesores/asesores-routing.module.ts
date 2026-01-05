import { NgModule } from '@angular/core';
import { Routes, RouterModule } from '@angular/router';

import { AsesoresPage } from './asesores.page';

const routes: Routes = [
  {
    path: '',
    component: AsesoresPage
  },
  {
    path: 'registro-asesor',
    loadChildren: () => import('../registro-asesor/registro-asesor.module').then( m => m.RegistroAsesorPageModule)
  }

];

@NgModule({
  imports: [RouterModule.forChild(routes)],
  exports: [RouterModule],
})
export class AsesoresPageRoutingModule {}
