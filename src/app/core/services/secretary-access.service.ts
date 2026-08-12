import { Injectable, inject } from '@angular/core';
import { Router, NavigationEnd } from '@angular/router';
import { filter, switchMap, catchError, of, Observable, tap, EMPTY } from 'rxjs';
import { AuthService } from './auth.service';
import { SecretaryService } from './secretary.service';
import { SecretaryContextService } from './secretary-context.service';
import { NotificationService } from './notification.service';
import { LinkedPractitioner } from '../models/secretary.model';

/**
 * Rafraîchit la liste des praticiens accessibles à chaque navigation (ROLE_SECRETARY).
 */
@Injectable({ providedIn: 'root' })
export class SecretaryAccessService {
  private readonly authService = inject(AuthService);
  private readonly secretaryService = inject(SecretaryService);
  private readonly contextService = inject(SecretaryContextService);
  private readonly notificationService = inject(NotificationService);
  private readonly router = inject(Router);

  constructor() {
    this.router.events.pipe(
      filter((event): event is NavigationEnd => event instanceof NavigationEnd),
      switchMap(() => {
        if (!this.authService.isLoggedIn() || !this.authService.isSecretary()) {
          return EMPTY;
        }
        return this.refreshPractitioners();
      }),
    ).subscribe();

    this.notificationService.secretaryAccessChanged.subscribe(() => {
      if (this.authService.isSecretary()) {
        this.refreshPractitioners().subscribe();
      }
    });
  }

  refreshPractitioners(): Observable<LinkedPractitioner[]> {
    return this.secretaryService.getLinkedPractitioners().pipe(
      tap(list => this.contextService.applyPractitioners(list)),
      catchError(() => {
        this.contextService.applyPractitioners([]);
        return of([]);
      }),
    );
  }
}
