import { inject } from '@angular/core';
import { CanActivateFn, Router } from '@angular/router';
import { GeneralService } from '../services/general.service';

export const asesoresGuard: CanActivateFn = (route, state) => {

  const generalService = inject(GeneralService);
  const router = inject(Router);

  if (generalService.tokenPresente()) {
    return true;
  } else {
    router.navigate(['asesores']);
    return false;
  }

};