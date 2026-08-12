import { Component, OnInit, signal } from '@angular/core';
import { FormBuilder, FormGroup, ReactiveFormsModule, Validators } from '@angular/forms';
import { RouterLink } from '@angular/router';
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
  imports: [ReactiveFormsModule, RouterLink, SyliSpinnerComponent],
  template: `
    <div class="max-w-4xl mx-auto px-4 py-8">
      <div class="mb-6 flex items-center justify-between flex-wrap gap-3">
        <div>
          <h1 class="text-2xl font-bold text-gray-900">Mes secrétaires</h1>
          <p class="text-gray-500 mt-1">Invitez et gérez les secrétaires de votre cabinet</p>
        </div>
        <a routerLink="/profile" class="btn-secondary text-sm">← Retour au profil</a>
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

      <div class="card mb-6">
        <h2 class="text-base font-semibold text-gray-900 mb-4">Inviter une secrétaire</h2>
        <form [formGroup]="inviteForm" (ngSubmit)="onInvite()" class="flex flex-wrap gap-3 items-end">
          <div class="flex-1 min-w-[220px]">
            <label class="block text-sm font-medium text-gray-700 mb-1">Adresse email</label>
            <input type="email" formControlName="email" class="input-field" placeholder="secretaire@email.com"/>
          </div>
          <button type="submit" [disabled]="inviting() || inviteForm.invalid" class="btn-primary">
            @if (inviting()) {
              <app-syli-spinner size="xs" class="mr-2 inline-block align-middle" />
            }
            Envoyer l'invitation
          </button>
        </form>
      </div>

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
  `,
})
export class PractitionerSecretariesComponent implements OnInit {
  inviteForm: FormGroup;
  secretaries = signal<SecretaryRelation[]>([]);
  loading = signal(true);
  inviting = signal(false);
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
    this.errorMessage.set('');
    this.successMessage.set('');
    this.secretaryService.inviteSecretary({ email: this.inviteForm.value.email.trim() }).subscribe({
      next: () => {
        this.inviting.set(false);
        this.successMessage.set('Invitation envoyée avec succès.');
        this.inviteForm.reset();
        this.loadSecretaries();
      },
      error: (err: HttpErrorResponse) => {
        this.inviting.set(false);
        this.errorMessage.set(err.error?.detail || 'Impossible d\'envoyer l\'invitation.');
      },
    });
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
