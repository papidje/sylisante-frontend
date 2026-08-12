import { Component, OnInit, signal } from '@angular/core';
import { RouterLink } from '@angular/router';
import { HttpErrorResponse } from '@angular/common/http';
import { AuthService } from '../../../core/services/auth.service';
import { SecretaryService } from '../../../core/services/secretary.service';
import { SecretaryContextService } from '../../../core/services/secretary-context.service';
import { SecretaryInvitation } from '../../../core/models/secretary.model';
import { SyliSpinnerComponent } from '../../../shared/components/syli-spinner/syli-spinner.component';

@Component({
  selector: 'app-secretary-dashboard',
  standalone: true,
  imports: [RouterLink, SyliSpinnerComponent],
  template: `
    <div class="max-w-5xl mx-auto px-4 py-8">
      <div class="mb-6">
        <h1 class="text-2xl font-bold text-gray-900">Espace secrétaire</h1>
        <p class="text-gray-500 mt-1">Gérez les agendas des praticiens associés</p>
      </div>

      @if (pendingInvitations().length > 0) {
        <div class="bg-amber-50 border border-amber-200 rounded-xl p-5 mb-6">
          <h2 class="text-base font-semibold text-amber-900 mb-3">Invitations en attente</h2>
          <div class="space-y-3">
            @for (inv of pendingInvitations(); track inv.id) {
              <div class="bg-white rounded-lg border border-amber-100 p-4 flex flex-wrap items-center justify-between gap-3">
                <div>
                  <p class="font-medium text-gray-900">
                    Dr. {{ inv.doctorFirstName }} {{ inv.doctorLastName }}
                  </p>
                  @if (inv.doctorSpeciality) {
                    <p class="text-sm text-gray-500">{{ inv.doctorSpeciality }}</p>
                  }
                  <p class="text-xs text-gray-400 mt-1">Invité le {{ formatDate(inv.invitedAt) }}</p>
                </div>
                <div class="flex gap-2">
                  <button type="button" (click)="accept(inv.id)" [disabled]="actionLoading() === inv.id"
                          class="btn-primary text-sm py-2 px-4">
                    @if (actionLoading() === inv.id) {
                      <app-syli-spinner size="xs" class="inline-block" />
                    } @else {
                      Accepter
                    }
                  </button>
                  <button type="button" (click)="reject(inv.id)" [disabled]="actionLoading() === inv.id"
                          class="btn-secondary text-sm py-2 px-4">
                    Refuser
                  </button>
                </div>
              </div>
            }
          </div>
        </div>
      }

      @if (errorMessage()) {
        <div class="bg-red-50 border border-red-200 rounded-lg p-4 mb-6">
          <p class="text-sm text-red-700">{{ errorMessage() }}</p>
        </div>
      }

      @if (loading()) {
        <div class="flex justify-center py-12">
          <app-syli-spinner size="md" />
        </div>
      } @else if (contextService.practitioners().length === 0) {
        <div class="card text-center py-12">
          <p class="text-gray-600">Aucun praticien associé pour le moment.</p>
          <p class="text-sm text-gray-400 mt-2">Acceptez une invitation pour accéder à un agenda.</p>
        </div>
      } @else {
        <div class="grid grid-cols-1 md:grid-cols-2 gap-4">
          @for (p of contextService.practitioners(); track p.practitionerId) {
            <div class="card hover:shadow-md transition-shadow">
              <h3 class="font-semibold text-gray-900">Dr. {{ p.firstName }} {{ p.lastName }}</h3>
              @if (p.speciality) {
                <p class="text-sm text-gray-500 mt-1">{{ p.speciality }}</p>
              }
              <p class="text-xs text-gray-400 mt-2">{{ p.email }}</p>
              <div class="flex gap-2 mt-4">
                <a routerLink="/appointments" (click)="selectPractitioner(p.practitionerId)"
                   class="btn-primary text-sm py-2 px-4">Planning</a>
                <a routerLink="/calendar" (click)="selectPractitioner(p.practitionerId)"
                   class="btn-secondary text-sm py-2 px-4">Calendrier</a>
              </div>
            </div>
          }
        </div>
      }
    </div>
  `,
})
export class SecretaryDashboardComponent implements OnInit {
  loading = signal(true);
  actionLoading = signal<number | null>(null);
  errorMessage = signal('');
  pendingInvitations = signal<SecretaryInvitation[]>([]);

  constructor(
    public authService: AuthService,
    public contextService: SecretaryContextService,
    private secretaryService: SecretaryService
  ) {}

  ngOnInit(): void {
    this.loadData();
  }

  loadData(): void {
    this.loading.set(true);
    this.secretaryService.getLinkedPractitioners().subscribe({
      next: (practitioners) => {
        this.contextService.setPractitioners(practitioners);
        this.loading.set(false);
      },
      error: () => this.loading.set(false),
    });
    this.secretaryService.getPendingInvitations().subscribe({
      next: (inv) => this.pendingInvitations.set(inv),
    });
  }

  accept(id: number): void {
    this.actionLoading.set(id);
    this.secretaryService.acceptInvitation(id).subscribe({
      next: () => {
        this.actionLoading.set(null);
        this.loadData();
      },
      error: (err: HttpErrorResponse) => {
        this.actionLoading.set(null);
        this.errorMessage.set(err.error?.detail || 'Impossible d\'accepter l\'invitation.');
      },
    });
  }

  reject(id: number): void {
    this.actionLoading.set(id);
    this.secretaryService.rejectInvitation(id).subscribe({
      next: () => {
        this.actionLoading.set(null);
        this.pendingInvitations.update(list => list.filter(i => i.id !== id));
      },
      error: (err: HttpErrorResponse) => {
        this.actionLoading.set(null);
        this.errorMessage.set(err.error?.detail || 'Impossible de refuser l\'invitation.');
      },
    });
  }

  selectPractitioner(id: number): void {
    this.contextService.setSelectedPractitionerId(id);
  }

  formatDate(iso: string): string {
    return new Date(iso).toLocaleDateString('fr-FR');
  }
}
