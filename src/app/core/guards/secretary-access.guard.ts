import { inject } from '@angular/core';
import { CanActivateFn } from '@angular/router';
import { map, catchError, of } from 'rxjs';
import { AuthService } from '../services/auth.service';
import { SecretaryAccessService } from '../services/secretary-access.service';

/** Recharge les praticiens liés avant d'afficher une page secrétaire. */
export const secretaryAccessGuard: CanActivateFn = () => {
  const authService = inject(AuthService);
  if (!authService.isSecretary()) {
    return true;
  }
  return inject(SecretaryAccessService).refreshPractitioners().pipe(
    map(() => true),
    catchError(() => of(true)),
  );
};
