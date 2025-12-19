import { inject } from '@angular/core';
import { CanActivateFn, Router } from '@angular/router';
import { GeneralService } from '../services/general.service';

export const loteroGuard: CanActivateFn = (route, state) => {
  const generalService = inject(GeneralService);
  const router = inject(Router);

  // 1️⃣ Validar sesión (token)
  if (!generalService.tokenPresente()) {
    router.navigate(['inicio']);
    return false;
  }

  // 2️⃣ Obtener usuario
  const user = JSON.parse(localStorage.getItem('user') ?? '{}');

  // 3️⃣ Validar rol lotero
  const esLotero =
    user?.rol === 'lotero' ||
    user?.rol?.name === 'lotero' ||
    user?.role === 'lotero';

  if (!esLotero) {
    router.navigate(['inicio']);
    return false;
  }

  return true;
};