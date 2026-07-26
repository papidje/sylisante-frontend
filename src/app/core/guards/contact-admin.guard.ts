import { inject } from '@angular/core';
import { CanActivateFn, Router } from '@angular/router';
import { map, catchError, of } from 'rxjs';
import { AuthService } from '../services/auth.service';
import { SupportService } from '../services/support.service';
import { canSendSupportMessage } from '../models/user.model';

/** Autorise l'accès à /contact-admin si l'utilisateur peut lire ou envoyer des messages support. */
export const contactAdminGuard: CanActivateFn = () => {
  const authService = inject(AuthService);
  const supportService = inject(SupportService);
  const router = inject(Router);
  const user = authService.currentUser();

  if (user?.role === 'ROLE_ADMIN') {
    return router.createUrlTree(['/admin/support-requests']);
  }

  if (canSendSupportMessage(user?.role, user?.status)) {
    return true;
  }

  return supportService.getAccess().pipe(
    map(access => (access.canRead ? true : router.createUrlTree([authService.getDefaultRoute()]))),
    catchError(() => of(router.createUrlTree([authService.getDefaultRoute()])))
  );
};
