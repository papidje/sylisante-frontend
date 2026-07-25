import { HttpInterceptorFn, HttpErrorResponse, HttpRequest, HttpHandlerFn } from '@angular/common/http';
import { inject } from '@angular/core';
import { catchError, switchMap, throwError, BehaviorSubject, filter, take } from 'rxjs';
import { AuthService } from '../services/auth.service';

/**
 * Intercepteur HTTP qui :
 * 1. Attache le Bearer token sur chaque requête authentifiée.
 * 2. Sur erreur 401, tente un refresh silencieux du token.
 * 3. Réessaie la requête originale avec le nouvel access token.
 * 4. Si le refresh échoue, déconnecte l'utilisateur.
 */

let isRefreshing = false;
const refreshDone$ = new BehaviorSubject<string | null>(null);

export const authInterceptor: HttpInterceptorFn = (req, next) => {
  const authService = inject(AuthService);
  const token = authService.getToken();

  const authReq = addToken(req, token);

  return next(authReq).pipe(
    catchError((error: HttpErrorResponse) => {
      if (error.status !== 401 || req.url.includes('/api/auth/')) {
        return throwError(() => error);
      }
      return handle401(req, next, authService);
    })
  );
};

function addToken(req: HttpRequest<unknown>, token: string | null): HttpRequest<unknown> {
  if (!token) return req;
  return req.clone({ headers: req.headers.set('Authorization', `Bearer ${token}`) });
}

function handle401(
  req: HttpRequest<unknown>,
  next: HttpHandlerFn,
  authService: AuthService
) {
  if (isRefreshing) {
    // Attendre que le refresh en cours se termine, puis réessayer
    return refreshDone$.pipe(
      filter(t => t !== null),
      take(1),
      switchMap(newToken => next(addToken(req, newToken)))
    );
  }

  isRefreshing = true;
  refreshDone$.next(null);

  return authService.refreshAccessToken().pipe(
    switchMap(response => {
      isRefreshing = false;
      const newToken = response.token ?? null;
      refreshDone$.next(newToken);
      return next(addToken(req, newToken));
    }),
    catchError(err => {
      isRefreshing = false;
      authService.clearSession();
      return throwError(() => err);
    })
  );
}
