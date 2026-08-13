import { Component, OnInit, signal } from '@angular/core';
import { FormBuilder, FormGroup, ReactiveFormsModule, Validators } from '@angular/forms';
import { HttpErrorResponse } from '@angular/common/http';
import { SecretaryService } from '../../../core/services/secretary.service';
import {
  INVITATION_STATUS_LABELS,
  SecretaryRelation,
} from '../../../core/models/secretary.model';
import { SyliSpinnerComponent } from '../../../shared/components/syli-spinner/syli-spinner.component';

@Component({
  selector: 'app-practitioner-secretaries',
  standalone: true,
  imports: [ReactiveFormsModule, SyliSpinnerComponent],
  template: `
    <div class="max-w-4xl mx-auto px-4 py-8">
      <div class="mb-6 flex items-center justify-between flex-wrap gap-3">
        <div>
          <h1 class="text-2xl font-bold text-gray-900">Mes secrétaires</h1>
          <p class="text-gray-500 mt-1">Invitez et gérez les secrétaires de votre cabinet</p>
        </div>
        <button type="button" (click)="openInviteModal()" class="btn-primary text-sm">
          + Inviter
        </button>
      </div>

      @if (successMessage()) {
        <div class="bg-sky-50 border border-sky-200 rounded-lg p-4 mb-5">
          <p class="text-sm text-sky-700">{{ successMessage() }}</p>
        </div>
      }
      @if (errorMessage()) {
        <div class="bg-red-50 border border-red-200 rounded-lg p-4 mb-5">
          <p class="text-sm text-red-700">{{ errorMessage() }}</p>
        </div>
      }

      @if (loading()) {
        <div class="flex justify-center py-12">
          <app-syli-spinner size="md" />
        </div>
      } @else if (secretaries().length === 0) {
        <div class="card text-center py-10 text-gray-500">
          Aucune secrétaire associée pour le moment.
        </div>
      } @else {
        <div class="card overflow-hidden p-0">
          <table class="min-w-full divide-y divide-gray-200">
            <thead class="bg-gray-50">
              <tr>
                <th class="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Secrétaire</th>
                <th class="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Statut</th>
                <th class="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Invitée le</th>
                <th class="px-4 py-3 text-right text-xs font-medium text-gray-500 uppercase">Actions</th>
              </tr>
            </thead>
            <tbody class="divide-y divide-gray-100">
              @for (s of secretaries(); track s.id) {
                <tr>
                  <td class="px-4 py-3">
                    <p class="font-medium text-gray-900">{{ s.secretaryFirstName }} {{ s.secretaryLastName }}</p>
                    <p class="text-sm text-gray-500">{{ s.secretaryEmail }}</p>
                  </td>
                  <td class="px-4 py-3">
                    <span [class]="statusBadgeClass(s.status)">
                      {{ statusLabels[s.status] }}
                    </span>
                  </td>
                  <td class="px-4 py-3 text-sm text-gray-600">
                    {{ formatDate(s.invitedAt) }}
                  </td>
                  <td class="px-4 py-3 text-right">
                    @if (s.status === 'ACCEPTED') {
                      <button type="button" (click)="suspend(s.id)" [disabled]="actionLoading() === s.id"
                              class="btn-danger text-xs py-1.5 px-3">
                        @if (actionLoading() === s.id) {
                          <app-syli-spinner size="xs" class="inline-block" />
                        } @else {
                          Suspendre
                        }
                      </button>
                    } @else if (s.status === 'SUSPENDED') {
                      <button type="button" (click)="reactivate(s.id)" [disabled]="actionLoading() === s.id"
                              class="btn-primary text-xs py-1.5 px-3">
                        @if (actionLoading() === s.id) {
                          <app-syli-spinner size="xs" class="inline-block" />
                        } @else {
                          Réactiver
                        }
                      </button>
                    } @else {
                      <span class="text-xs text-gray-400">—</span>
                    }
                  </td>
                </tr>
              }
            </tbody>
          </table>
        </div>
      }
    </div>

    @if (inviteModalOpen()) {
      <div class="fixed inset-0 z-50 flex items-center justify-center p-4"
           (click)="closeInviteModal()">
        <div class="absolute inset-0 bg-slate-900/40 backdrop-blur-sm"></div>

        <div class="relative bg-white rounded-2xl shadow-2xl w-full max-w-md border border-slate-100"
             (click)="$event.stopPropagation()"
             role="dialog"
             aria-labelledby="invite-secretary-title"
             aria-modal="true">

          <div class="px-6 pt-6 pb-4 border-b border-slate-100">
            <div class="flex items-start justify-between gap-4">
              <div>
                <h2 id="invite-secretary-title" class="text-lg font-bold text-slate-900">
                  Inviter une secrétaire
                </h2>
                <p class="text-sm text-slate-500 mt-1">
                  Saisissez l'adresse email de la personne à inviter.
                </p>
              </div>
              <button type="button" (click)="closeInviteModal()"
                      class="p-1.5 rounded-lg text-slate-400 hover:text-slate-600 hover:bg-slate-100 transition-colors"
                      aria-label="Fermer">
                <svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M6 18L18 6M6 6l12 12"/>
                </svg>
              </button>
            </div>
          </div>

          <form [formGroup]="inviteForm" (ngSubmit)="onInvite()" class="px-6 py-5 space-y-4">
            @if (inviteErrorMessage()) {
              <div class="rounded-lg bg-red-50 border border-red-200 px-4 py-3 text-sm text-red-700">
                {{ inviteErrorMessage() }}
              </div>
            }

            <div>
              <label for="invite-email" class="block text-sm font-medium text-slate-700 mb-1">
                Adresse email
              </label>
              <input id="invite-email" type="email" formControlName="email"
                     class="input-field" placeholder="secretaire@email.com"
                     autocomplete="email"/>
              @if (inviteForm.get('email')?.invalid && inviteForm.get('email')?.touched) {
                <p class="text-xs text-red-500 mt-1">Adresse email invalide</p>
              }
            </div>

            <div class="flex gap-3 justify-end pt-2">
              <button type="button" (click)="closeInviteModal()" class="btn-secondary">
                Annuler
              </button>
              <button type="submit" [disabled]="inviting() || inviteForm.invalid" class="btn-primary">
                @if (inviting()) {
                  <app-syli-spinner size="xs" class="mr-2 inline-block align-middle" />
                }
                Envoyer l'invitation
              </button>
            </div>
          </form>
        </div>
      </div>
    }
  `,
})
export class PractitionerSecretariesComponent implements OnInit {
  inviteForm: FormGroup;
  secretaries = signal<SecretaryRelation[]>([]);
  loading = signal(true);
  inviting = signal(false);
  inviteModalOpen = signal(false);
  inviteErrorMessage = signal('');
  actionLoading = signal<number | null>(null);
  successMessage = signal('');
  errorMessage = signal('');
  readonly statusLabels = INVITATION_STATUS_LABELS;

  constructor(
    private fb: FormBuilder,
    private secretaryService: SecretaryService
  ) {
    this.inviteForm = this.fb.group({
      email: ['', [Validators.required, Validators.email]],
    });
  }

  ngOnInit(): void {
    this.loadSecretaries();
  }

  loadSecretaries(): void {
    this.loading.set(true);
    this.secretaryService.listSecretaries().subscribe({
      next: (list) => {
        this.secretaries.set(list);
        this.loading.set(false);
      },
      error: () => this.loading.set(false),
    });
  }

  onInvite(): void {
    if (this.inviteForm.invalid) return;
    this.inviting.set(true);
    this.inviteErrorMessage.set('');
    this.errorMessage.set('');
    this.successMessage.set('');
    this.secretaryService.inviteSecretary({ email: this.inviteForm.value.email.trim() }).subscribe({
      next: () => {
        this.inviting.set(false);
        this.successMessage.set('Invitation envoyée avec succès.');
        this.inviteForm.reset();
        this.closeInviteModal();
        this.loadSecretaries();
      },
      error: (err: HttpErrorResponse) => {
        this.inviting.set(false);
        this.inviteErrorMessage.set(err.error?.detail || 'Impossible d\'envoyer l\'invitation.');
      },
    });
  }

  openInviteModal(): void {
    this.inviteErrorMessage.set('');
    this.inviteForm.reset();
    this.inviteModalOpen.set(true);
  }

  closeInviteModal(): void {
    if (this.inviting()) return;
    this.inviteModalOpen.set(false);
    this.inviteErrorMessage.set('');
    this.inviteForm.reset();
  }

  suspend(relationId: number): void {
    this.actionLoading.set(relationId);
    this.errorMessage.set('');
    this.successMessage.set('');
    this.secretaryService.suspendSecretary(relationId).subscribe({
      next: () => {
        this.actionLoading.set(null);
        this.successMessage.set('Accès secrétaire suspendu.');
        this.loadSecretaries();
      },
      error: (err: HttpErrorResponse) => {
        this.actionLoading.set(null);
        this.errorMessage.set(err.error?.detail || 'Impossible de suspendre cette secrétaire.');
      },
    });
  }

  reactivate(relationId: number): void {
    this.actionLoading.set(relationId);
    this.errorMessage.set('');
    this.successMessage.set('');
    this.secretaryService.reactivateSecretary(relationId).subscribe({
      next: () => {
        this.actionLoading.set(null);
        this.successMessage.set('Accès secrétaire réactivé.');
        this.loadSecretaries();
      },
      error: (err: HttpErrorResponse) => {
        this.actionLoading.set(null);
        this.errorMessage.set(err.error?.detail || 'Impossible de réactiver cette secrétaire.');
      },
    });
  }

  statusBadgeClass(status: SecretaryRelation['status']): string {
    const base = 'inline-flex px-2 py-0.5 rounded-full text-xs font-medium';
    if (status === 'ACCEPTED') return `${base} bg-green-100 text-green-800`;
    if (status === 'PENDING') return `${base} bg-amber-100 text-amber-800`;
    if (status === 'SUSPENDED') return `${base} bg-red-100 text-red-800`;
    return `${base} bg-gray-100 text-gray-600`;
  }

  formatDate(iso: string): string {
    return new Date(iso).toLocaleDateString('fr-FR');
  }
}
