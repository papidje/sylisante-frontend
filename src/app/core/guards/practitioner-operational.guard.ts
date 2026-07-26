import { inject } from '@angular/core';
import { CanActivateFn, Router } from '@angular/router';
import { AuthService } from '../services/auth.service';
import { isPendingAdminValidation } from '../models/user.model';

/** Bloque l'accès aux fonctions cliniques tant que le praticien n'est pas validé par l'admin. */
export const practitionerOperationalGuard: CanActivateFn = () => {
  const authService = inject(AuthService);
  const router = inject(Router);
  const user = authService.currentUser();

  if (user?.role === 'ROLE_PRATICIEN' && isPendingAdminValidation(user.status)) {
    return router.createUrlTree(['/dashboard/practitioner']);
  }

  return true;
};
