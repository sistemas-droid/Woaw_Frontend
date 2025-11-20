import { CanActivateFn } from '@angular/router';
import { GeneralService } from '../services/general.service';

export const asesoresGuard: CanActivateFn = (route, state) => {
  return true;
};
