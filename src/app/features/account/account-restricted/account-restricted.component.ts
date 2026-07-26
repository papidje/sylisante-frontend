import { Component, signal } from '@angular/core';
import { RouterLink } from '@angular/router';
import { AuthService } from '../../../core/services/auth.service';
import { getAccountRestrictionMessage } from '../../../core/models/user.model';

@Component({
  selector: 'app-account-restricted',
  standalone: true,
  imports: [RouterLink],
  template: `
    <div class="min-h-[calc(100vh-4rem)] bg-gradient-to-br from-slate-50 to-sky-50 flex items-center justify-center p-4">
      <div class="w-full max-w-lg">
        <div class="card text-center">
          <div class="inline-flex items-center justify-center w-16 h-16 bg-red-100 rounded-2xl mb-6">
            <svg class="w-8 h-8 text-red-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2"
                    d="M12 9v2m0 4h.01M10.29 3.86L1.82 18a2 2 0 001.71 3h16.94a2 2 0 001.71-3L13.71 3.86a2 2 0 00-3.42 0z"/>
            </svg>
          </div>

          <h1 class="text-2xl font-bold text-gray-900 mb-3">Accès limité</h1>
          <p class="text-gray-600 text-sm leading-relaxed mb-8">
            {{ restrictionMessage() }}
          </p>

          <a routerLink="/contact-admin" class="btn-primary w-full py-3 inline-block">
            Contacter l'administrateur
          </a>

          <button type="button" (click)="authService.logout()"
                  class="mt-4 text-sm text-gray-500 hover:text-gray-700 underline">
            Se déconnecter
          </button>
        </div>
      </div>
    </div>
  `,
})
export class AccountRestrictedComponent {
  constructor(public authService: AuthService) {}

  restrictionMessage(): string {
    const user = this.authService.currentUser();
    return getAccountRestrictionMessage(user?.status, user?.role);
  }
}
