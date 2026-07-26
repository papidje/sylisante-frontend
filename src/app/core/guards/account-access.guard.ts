import { inject } from '@angular/core';
import { CanActivateFn, Router } from '@angular/router';
import { AuthService } from '../services/auth.service';
import { isAccountRestricted, needsAccountDisclaimer } from '../models/user.model';

/** Redirige les comptes suspendus ou expirés vers la page de restriction. */
export const accountAccessGuard: CanActivateFn = (_route, state) => {
  const authService = inject(AuthService);
  const router = inject(Router);
  const user = authService.currentUser();
  const status = user?.status;

  if (state.url.startsWith('/contact-admin')) {
    if (needsAccountDisclaimer(status, user?.role)) {
      return true;
    }
    return router.createUrlTree([authService.getDefaultRoute()]);
  }

  if (isAccountRestricted(status)) {
    if (state.url.startsWith('/account-restricted')) {
      return true;
    }
    return router.createUrlTree(['/account-restricted']);
  }

  if (state.url.startsWith('/account-restricted')) {
    return router.createUrlTree([authService.getDefaultRoute()]);
  }

  return true;
};
