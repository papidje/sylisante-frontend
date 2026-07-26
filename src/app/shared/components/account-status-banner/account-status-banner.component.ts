import { Component, signal } from '@angular/core';
import { AuthService } from '../../../core/services/auth.service';
import {
  getAccountRestrictionMessage,
  isPendingAdminValidation,
} from '../../../core/models/user.model';
import { ContactAdminModalComponent } from '../../../shared/components/contact-admin-modal/contact-admin-modal.component';

@Component({
  selector: 'app-account-status-banner',
  standalone: true,
  imports: [ContactAdminModalComponent],
  template: `
    @if (showBanner()) {
      <div class="border-b"
           [class.bg-amber-50]="isPending()"
           [class.border-amber-200]="isPending()"
           [class.bg-red-50]="!isPending()"
           [class.border-red-200]="!isPending()">
        <div class="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-3 flex flex-col sm:flex-row sm:items-center gap-3">
          <div class="flex items-start gap-2 flex-1">
            <svg class="w-5 h-5 flex-shrink-0 mt-0.5"
                 [class.text-amber-600]="isPending()"
                 [class.text-red-600]="!isPending()"
                 fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2"
                    d="M12 9v2m0 4h.01M10.29 3.86L1.82 18a2 2 0 001.71 3h16.94a2 2 0 001.71-3L13.71 3.86a2 2 0 00-3.42 0z"/>
            </svg>
            <p class="text-sm"
               [class.text-amber-800]="isPending()"
               [class.text-red-800]="!isPending()">
              {{ message() }}
            </p>
          </div>
          <button type="button" (click)="openContact()"
                  class="text-sm font-medium px-4 py-1.5 rounded-lg border whitespace-nowrap transition-colors"
                  [class.border-amber-300]="isPending()"
                  [class.text-amber-800]="isPending()"
                  [class.hover:bg-amber-100]="isPending()"
                  [class.border-red-300]="!isPending()"
                  [class.text-red-800]="!isPending()"
                  [class.hover:bg-red-100]="!isPending()">
            Contacter l'administrateur
          </button>
        </div>
      </div>
    }

    <app-contact-admin-modal
      [visible]="contactVisible()"
      (closed)="contactVisible.set(false)" />
  `,
})
export class AccountStatusBannerComponent {
  contactVisible = signal(false);

  constructor(public authService: AuthService) {}

  showBanner(): boolean {
    const user = this.authService.currentUser();
    if (!user || user.role === 'ROLE_ADMIN') return false;
    return isPendingAdminValidation(user.status);
  }

  isPending(): boolean {
    return true;
  }

  message(): string {
    const user = this.authService.currentUser();
    return getAccountRestrictionMessage(user?.status, user?.role);
  }

  openContact(): void {
    this.contactVisible.set(true);
  }
}
