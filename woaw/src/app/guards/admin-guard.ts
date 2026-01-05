import { inject } from '@angular/core';
import { CanActivateFn, Router } from '@angular/router';
import { GeneralService } from '../services/general.service';

export const adminGuard: CanActivateFn = () => {
  const generalService = inject(GeneralService);
  const router = inject(Router);

  // 1) Debe existir sesión
  if (!generalService.tokenPresente()) {
    router.navigate(['inicio']);
    return false;
  }

  // 2) Obtener usuario
  const user = JSON.parse(localStorage.getItem('user') ?? '{}');

  // 3) Validar rol admin
  const esAdmin =
    user?.rol === 'admin' ||
    user?.rol?.name === 'admin' ||
    user?.role === 'admin';

  if (!esAdmin) {
    router.navigate(['inicio']);
    return false;
  }

  return true;
};