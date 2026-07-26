import { Component, OnInit, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { AdminService } from '../../../core/services/admin.service';
import {
  AdminSupportRequestDto,
  USER_STATUS_LABELS,
  ROLE_LABELS,
  Role,
} from '../../../core/models/user.model';
import { formatLocalDate } from '../../../core/utils/date-utils';
import { SyliSpinnerComponent } from '../../../shared/components/syli-spinner/syli-spinner.component';

@Component({
  selector: 'app-support-requests',
  standalone: true,
  imports: [CommonModule, FormsModule, SyliSpinnerComponent],
  template: `
    <div class="max-w-6xl mx-auto px-4 py-8">
      <div class="mb-8">
        <h1 class="text-2xl font-bold text-gray-900">Demandes de contact</h1>
        <p class="text-gray-500 mt-1">Messages transmis par les utilisateurs à l'administrateur</p>
      </div>

      @if (loading()) {
        <app-syli-spinner size="md" [showLabel]="true" [centered]="true" />
      } @else {
        <div class="space-y-4">
          @for (request of requests(); track request.id) {
            <div class="card" [class.border-l-4]="request.status === 'OPEN'"
                 [class.border-amber-400]="request.status === 'OPEN'">
              <div class="flex flex-wrap items-start justify-between gap-3 mb-3">
                <div>
                  <p class="font-semibold text-gray-900">
                    {{ request.userFirstName }} {{ request.userLastName }}
                    <span class="text-sm font-normal text-gray-500">({{ request.userEmail }})</span>
                  </p>
                  <p class="text-xs text-gray-500 mt-0.5">
                    {{ getRoleLabel(request.userRole) }} —
                    {{ getStatusLabel(request.userStatus) }} —
                    {{ formatDateTime(request.createdAt) }}
                  </p>
                </div>
                <span [class]="getRequestBadgeClass(request.status)">
                  {{ request.status === 'OPEN' ? 'En attente' : 'Traité' }}
                </span>
              </div>

              <p class="text-sm text-gray-700 whitespace-pre-wrap bg-gray-50 rounded-lg p-3 mb-4">
                {{ request.message }}
              </p>

              @if (request.status === 'OPEN') {
                <div class="flex flex-col sm:flex-row gap-3">
                  <input type="text" [(ngModel)]="responseTexts[request.id]"
                         placeholder="Réponse optionnelle à l'utilisateur…"
                         class="input-field text-sm flex-1"/>
                  <button (click)="resolve(request)"
                          [disabled]="actionLoading() === request.id"
                          class="btn-primary text-sm px-4 py-2 whitespace-nowrap">
                    Marquer comme traité
                  </button>
                </div>
              } @else if (request.adminResponse) {
                <div class="text-sm text-gray-600 border-t border-gray-100 pt-3">
                  <span class="font-medium">Réponse admin :</span> {{ request.adminResponse }}
                </div>
              }
            </div>
          }
          @if (requests().length === 0) {
            <div class="card text-center py-12 text-gray-400">
              Aucune demande de contact
            </div>
          }
        </div>
      }
    </div>
  `,
})
export class SupportRequestsComponent implements OnInit {
  requests = signal<AdminSupportRequestDto[]>([]);
  loading = signal(true);
  actionLoading = signal<number | null>(null);
  responseTexts: Record<number, string> = {};

  constructor(private adminService: AdminService) {}

  ngOnInit(): void {
    this.loadRequests();
  }

  loadRequests(): void {
    this.adminService.getSupportRequests().subscribe({
      next: (items) => {
        this.requests.set(items);
        this.loading.set(false);
      },
      error: () => this.loading.set(false),
    });
  }

  resolve(request: AdminSupportRequestDto): void {
    this.actionLoading.set(request.id);
    const adminResponse = this.responseTexts[request.id]?.trim() || undefined;
    this.adminService.resolveSupportRequest(request.id, adminResponse).subscribe({
      next: (updated) => {
        this.requests.update(list => list.map(r => r.id === updated.id ? updated : r));
        this.actionLoading.set(null);
      },
      error: () => this.actionLoading.set(null),
    });
  }

  getRoleLabel(role: Role): string {
    return ROLE_LABELS[role] || role;
  }

  getStatusLabel(status: string): string {
    return USER_STATUS_LABELS[status as keyof typeof USER_STATUS_LABELS] || status;
  }

  getRequestBadgeClass(status: string): string {
    const base = 'inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium';
    return status === 'OPEN'
      ? `${base} bg-amber-100 text-amber-800`
      : `${base} bg-gray-100 text-gray-700`;
  }

  formatDateTime(dateStr: string): string {
    return formatLocalDate(dateStr);
  }
}
