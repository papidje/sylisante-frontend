import { Component, signal } from '@angular/core';
import { Router, RouterLink } from '@angular/router';
import { AuthService } from '../../../core/services/auth.service';
import { getAccountRestrictionMessage } from '../../../core/models/user.model';

@Component({
  selector: 'app-account-status-banner',
  standalone: true,
  imports: [RouterLink],
  template: `
    @if (authService.needsAccountDisclaimer()) {
      <div class="border-b"
           [class.bg-amber-50]="authService.isPendingValidation()"
           [class.border-amber-200]="authService.isPendingValidation()"
           [class.bg-red-50]="!authService.isPendingValidation()"
           [class.border-red-200]="!authService.isPendingValidation()">
        <div class="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-3 flex flex-col sm:flex-row sm:items-center gap-3">
          <div class="flex items-start gap-2 flex-1">
            <svg class="w-5 h-5 flex-shrink-0 mt-0.5"
                 [class.text-amber-600]="authService.isPendingValidation()"
                 [class.text-red-600]="!authService.isPendingValidation()"
                 fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2"
                    d="M12 9v2m0 4h.01M10.29 3.86L1.82 18a2 2 0 001.71 3h16.94a2 2 0 001.71-3L13.71 3.86a2 2 0 00-3.42 0z"/>
            </svg>
            <p class="text-sm"
               [class.text-amber-800]="authService.isPendingValidation()"
               [class.text-red-800]="!authService.isPendingValidation()">
              {{ message() }}
            </p>
          </div>
          <a routerLink="/contact-admin"
             class="text-sm font-medium px-4 py-1.5 rounded-lg border whitespace-nowrap transition-colors text-center"
             [class.border-amber-300]="authService.isPendingValidation()"
             [class.text-amber-800]="authService.isPendingValidation()"
             [class.hover:bg-amber-100]="authService.isPendingValidation()"
             [class.border-red-300]="!authService.isPendingValidation()"
             [class.text-red-800]="!authService.isPendingValidation()"
             [class.hover:bg-red-100]="!authService.isPendingValidation()">
            Contacter l'administrateur
          </a>
        </div>
      </div>
    }
  `,
})
export class AccountStatusBannerComponent {
  constructor(public authService: AuthService) {}

  message(): string {
    const user = this.authService.currentUser();
    return getAccountRestrictionMessage(user?.status, user?.role);
  }
}
