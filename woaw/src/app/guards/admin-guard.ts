
import { CanActivateFn , Router } from '@angular/router';
import { GeneralService } from '../services/general.service';
import { inject } from '@angular/core';

export const adminGuard: CanActivateFn = (route, state) => {
  return true;

  const generalService = inject(GeneralService);
  const router = inject(Router);

};
