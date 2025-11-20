import { NgModule } from '@angular/core';
import { Routes, RouterModule } from '@angular/router';

import { SubirDocumentsPage } from './subir-documents.page';

const routes: Routes = [
  {
    path: '',
    component: SubirDocumentsPage
  }
];

@NgModule({
  imports: [RouterModule.forChild(routes)],
  exports: [RouterModule],
})
export class SubirDocumentsPageRoutingModule {}
