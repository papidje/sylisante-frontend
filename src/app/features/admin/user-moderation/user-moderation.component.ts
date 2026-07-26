import { Component, OnInit, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { AdminService } from '../../../core/services/admin.service';
import {
  AdminUserDto,
  Role,
  UserStatus,
  USER_STATUS_LABELS,
  ROLE_LABELS,
} from '../../../core/models/user.model';
import { formatLocalDate } from '../../../core/utils/date-utils';
import { SyliSpinnerComponent } from '../../../shared/components/syli-spinner/syli-spinner.component';
import { UserProfileModalComponent } from '../../../shared/components/user-profile-modal/user-profile-modal.component';

@Component({
  selector: 'app-user-moderation',
  standalone: true,
  imports: [CommonModule, FormsModule, SyliSpinnerComponent, UserProfileModalComponent],
  template: `
    <div class="max-w-6xl mx-auto px-4 py-8">
      <div class="mb-8">
        <h1 class="text-2xl font-bold text-gray-900">Modération des comptes</h1>
        <p class="text-gray-500 mt-1">Gérez les statuts, validations praticiens et abonnements</p>
      </div>

      <!-- Filtres -->
      <div class="card mb-6">
        <div class="flex flex-wrap gap-3">
          <button (click)="setFilter('ALL')"
                  class="px-4 py-2 rounded-lg text-sm font-medium transition-colors"
                  [class.bg-primary-600]="filterRole() === 'ALL'"
                  [class.text-white]="filterRole() === 'ALL'"
                  [class.bg-gray-100]="filterRole() !== 'ALL'"
                  [class.text-gray-700]="filterRole() !== 'ALL'">
            Tous ({{ allUsers().length }})
          </button>
          <button (click)="setFilter('ROLE_PRATICIEN')"
                  class="px-4 py-2 rounded-lg text-sm font-medium transition-colors"
                  [class.bg-primary-600]="filterRole() === 'ROLE_PRATICIEN'"
                  [class.text-white]="filterRole() === 'ROLE_PRATICIEN'"
                  [class.bg-gray-100]="filterRole() !== 'ROLE_PRATICIEN'"
                  [class.text-gray-700]="filterRole() !== 'ROLE_PRATICIEN'">
            Praticiens ({{ countByRole('ROLE_PRATICIEN') }})
          </button>
          <button (click)="setFilter('ROLE_PATIENT')"
                  class="px-4 py-2 rounded-lg text-sm font-medium transition-colors"
                  [class.bg-primary-600]="filterRole() === 'ROLE_PATIENT'"
                  [class.text-white]="filterRole() === 'ROLE_PATIENT'"
                  [class.bg-gray-100]="filterRole() !== 'ROLE_PATIENT'"
                  [class.text-gray-700]="filterRole() !== 'ROLE_PATIENT'">
            Patients ({{ countByRole('ROLE_PATIENT') }})
          </button>
          <button (click)="setStatusFilter('PENDING_ADMIN_VALIDATION')"
                  class="px-4 py-2 rounded-lg text-sm font-medium transition-colors"
                  [class.bg-amber-500]="statusFilter() === 'PENDING_ADMIN_VALIDATION'"
                  [class.text-white]="statusFilter() === 'PENDING_ADMIN_VALIDATION'"
                  [class.bg-amber-50]="statusFilter() !== 'PENDING_ADMIN_VALIDATION'"
                  [class.text-amber-800]="statusFilter() !== 'PENDING_ADMIN_VALIDATION'">
            En attente ({{ countByStatus('PENDING_ADMIN_VALIDATION') }})
          </button>
          <div class="ml-auto">
            <input type="text" [(ngModel)]="searchTerm" placeholder="Rechercher par email..."
                   class="input-field text-sm w-64"/>
          </div>
        </div>
      </div>

      @if (loading()) {
        <app-syli-spinner size="md" [showLabel]="true" [centered]="true" />
      } @else {
        <div class="card overflow-hidden p-0">
          <div class="overflow-x-auto">
            <table class="min-w-full divide-y divide-gray-200">
              <thead class="bg-gray-50">
                <tr>
                  <th class="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Utilisateur</th>
                  <th class="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Rôle</th>
                  <th class="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Statut</th>
                  <th class="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Abonnement</th>
                  <th class="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Inscription</th>
                  <th class="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase">Actions</th>
                </tr>
              </thead>
              <tbody class="bg-white divide-y divide-gray-200">
                @for (user of filteredUsers(); track user.id) {
                  <tr class="hover:bg-gray-50">
                    <td class="px-6 py-4">
                      <button type="button" (click)="openUserProfile(user.id)"
                              class="text-left hover:text-primary-700 group">
                        <p class="text-sm font-medium text-gray-900 group-hover:underline">
                          {{ user.firstName }} {{ user.lastName }}
                        </p>
                        <p class="text-xs text-gray-500">{{ user.email }}</p>
                      </button>
                    </td>
                    <td class="px-6 py-4">
                      <span class="text-sm text-gray-700">{{ getRoleLabel(user.role) }}</span>
                    </td>
                    <td class="px-6 py-4">
                      <span [class]="getStatusBadgeClass(user.status)">
                        {{ getStatusLabel(user.status) }}
                      </span>
                    </td>
                    <td class="px-6 py-4">
                      <span class="text-xs text-gray-500">
                        @if (user.subscriptionExpiresAt) {
                          Jusqu'au {{ formatDate(user.subscriptionExpiresAt) }}
                        } @else {
                          —
                        }
                      </span>
                    </td>
                    <td class="px-6 py-4">
                      <span class="text-xs text-gray-500">{{ formatDate(user.createdAt) }}</span>
                    </td>
                    <td class="px-6 py-4 text-right">
                      <div class="flex justify-end gap-2 flex-wrap">
                        <button type="button" (click)="openUserProfile(user.id)"
                                class="text-xs px-3 py-1 border border-gray-200 rounded-lg text-gray-700 hover:bg-gray-50">
                          Profil
                        </button>
                        @if (needsPractitionerApproval(user)) {
                          <button (click)="openApproveModal(user)"
                                  [disabled]="actionLoading() === user.id"
                                  class="btn-success text-xs px-3 py-1">
                            {{ user.status === 'PENDING_ADMIN_VALIDATION' ? 'Valider' : 'Renouveler' }}
                          </button>
                        }
                        @if (user.status === 'ACTIVE') {
                          <button (click)="openSuspendModal(user)"
                                  [disabled]="actionLoading() === user.id"
                                  class="btn-danger text-xs px-3 py-1">
                            Suspendre
                          </button>
                        }
                        @if (user.status === 'SUSPENDED' && user.role === 'ROLE_PATIENT') {
                          <button (click)="updateStatus(user, 'ACTIVE')"
                                  [disabled]="actionLoading() === user.id"
                                  class="btn-success text-xs px-3 py-1">
                            Réactiver
                          </button>
                        }
                        @if (user.status === 'INACTIVE') {
                          <span class="text-xs text-gray-400 italic py-1">Attente e-mail</span>
                        }
                      </div>
                    </td>
                  </tr>
                }
                @if (filteredUsers().length === 0) {
                  <tr>
                    <td colspan="6" class="px-6 py-12 text-center text-gray-400">
                      Aucun utilisateur trouvé
                    </td>
                  </tr>
                }
              </tbody>
            </table>
          </div>
        </div>
      }
    </div>

    <!-- Modal validation praticien -->
    @if (approveModalVisible()) {
      <div class="fixed inset-0 z-50 flex items-center justify-center p-4">
        <div class="absolute inset-0 bg-slate-900/40 backdrop-blur-sm" (click)="closeApproveModal()"></div>
        <div class="relative bg-white rounded-2xl shadow-2xl w-full max-w-md border border-slate-100 p-6">
          <h2 class="text-lg font-bold text-gray-900 mb-1">{{ getApproveModalTitle() }}</h2>
          <p class="text-sm text-gray-500 mb-5">
            Dr. {{ approveTarget()?.firstName }} {{ approveTarget()?.lastName }}
          </p>
          <label class="block text-sm font-medium text-gray-700 mb-1">
            Date d'expiration de l'abonnement
          </label>
          <input type="date" [(ngModel)]="approveExpiryDate"
                 [min]="minExpiryDate"
                 class="input-field mb-5"/>
          <div class="flex gap-3">
            <button type="button" (click)="closeApproveModal()" class="btn-secondary flex-1">Annuler</button>
            <button type="button" (click)="confirmApprove()"
                    [disabled]="!approveExpiryDate || actionLoading() !== null"
                    class="btn-primary flex-1">
              Confirmer
            </button>
          </div>
        </div>
      </div>
    }

    <!-- Modal suspension avec motif -->
    @if (suspendModalVisible()) {
      <div class="fixed inset-0 z-50 flex items-center justify-center p-4">
        <div class="absolute inset-0 bg-slate-900/40 backdrop-blur-sm" (click)="closeSuspendModal()"></div>
        <div class="relative bg-white rounded-2xl shadow-2xl w-full max-w-md border border-slate-100 p-6">
          <h2 class="text-lg font-bold text-gray-900 mb-1">Suspendre le compte</h2>
          <p class="text-sm text-gray-500 mb-5">
            {{ suspendTarget()?.firstName }} {{ suspendTarget()?.lastName }}
            — le motif sera transmis à l'utilisateur par notification.
          </p>
          <label class="block text-sm font-medium text-gray-700 mb-1">
            Motif de suspension <span class="text-red-500">*</span>
          </label>
          <textarea [(ngModel)]="suspendReason" rows="4"
                    class="input-field resize-none mb-5"
                    placeholder="Ex. : défaut de paiement, signalement…"></textarea>
          @if (suspendError()) {
            <p class="text-sm text-red-600 mb-3">{{ suspendError() }}</p>
          }
          <div class="flex gap-3">
            <button type="button" (click)="closeSuspendModal()" class="btn-secondary flex-1">Annuler</button>
            <button type="button" (click)="confirmSuspend()"
                    [disabled]="!suspendReason.trim() || suspendReason.trim().length < 3 || actionLoading() !== null"
                    class="btn-danger flex-1">
              Confirmer la suspension
            </button>
          </div>
        </div>
      </div>
    }

    <app-user-profile-modal
      [visible]="profileModalVisible()"
      mode="admin"
      [userId]="profileModalUserId()"
      (closed)="closeProfileModal()" />
  `,
})
export class UserModerationComponent implements OnInit {
  allUsers = signal<AdminUserDto[]>([]);
  loading = signal(true);
  actionLoading = signal<number | null>(null);
  filterRole = signal<'ALL' | Role>('ALL');
  statusFilter = signal<UserStatus | null>(null);
  searchTerm = '';
  profileModalVisible = signal(false);
  profileModalUserId = signal<number | null>(null);
  approveModalVisible = signal(false);
  approveTarget = signal<AdminUserDto | null>(null);
  approveExpiryDate = '';
  minExpiryDate = new Date().toISOString().split('T')[0];
  suspendModalVisible = signal(false);
  suspendTarget = signal<AdminUserDto | null>(null);
  suspendReason = '';
  suspendError = signal('');

  constructor(private adminService: AdminService) {}

  ngOnInit(): void {
    this.adminService.getAllUsers().subscribe({
      next: (users) => {
        this.allUsers.set(users);
        this.loading.set(false);
      },
      error: () => this.loading.set(false),
    });
  }

  setFilter(role: 'ALL' | Role): void {
    this.filterRole.set(role);
    this.statusFilter.set(null);
  }

  setStatusFilter(status: UserStatus): void {
    this.statusFilter.set(status);
    this.filterRole.set('ALL');
  }

  filteredUsers(): AdminUserDto[] {
    let users = this.allUsers();
    if (this.filterRole() !== 'ALL') {
      users = users.filter(u => u.role === this.filterRole());
    }
    if (this.statusFilter()) {
      users = users.filter(u => u.status === this.statusFilter());
    }
    if (this.searchTerm.trim()) {
      const term = this.searchTerm.toLowerCase();
      users = users.filter(u =>
        u.email.toLowerCase().includes(term) ||
        u.firstName.toLowerCase().includes(term) ||
        u.lastName.toLowerCase().includes(term)
      );
    }
    return users;
  }

  countByRole(role: Role): number {
    return this.allUsers().filter(u => u.role === role).length;
  }

  countByStatus(status: UserStatus): number {
    return this.allUsers().filter(u => u.status === status).length;
  }

  needsPractitionerApproval(user: AdminUserDto): boolean {
    return user.role === 'ROLE_PRATICIEN' && (
      user.status === 'PENDING_ADMIN_VALIDATION' ||
      user.status === 'SUBSCRIPTION_EXPIRED' ||
      user.status === 'SUSPENDED'
    );
  }

  openApproveModal(user: AdminUserDto): void {
    this.approveTarget.set(user);
    this.approveExpiryDate = '';
    this.approveModalVisible.set(true);
  }

  closeApproveModal(): void {
    this.approveModalVisible.set(false);
    this.approveTarget.set(null);
  }

  confirmApprove(): void {
    const user = this.approveTarget();
    if (!user || !this.approveExpiryDate) return;

    this.actionLoading.set(user.id);
    this.adminService.approvePractitioner(user.id, this.approveExpiryDate).subscribe({
      next: (updated) => {
        this.allUsers.update(users => users.map(u => u.id === updated.id ? updated : u));
        this.actionLoading.set(null);
        this.closeApproveModal();
      },
      error: () => this.actionLoading.set(null),
    });
  }

  getApproveModalTitle(): string {
    return this.approveTarget()?.status === 'PENDING_ADMIN_VALIDATION'
      ? 'Valider le praticien'
      : 'Renouveler l\'abonnement';
  }

  updateStatus(user: AdminUserDto, status: UserStatus, reason?: string, onSuccess?: () => void): void {
    this.actionLoading.set(user.id);
    this.adminService.updateUserStatus(user.id, status, reason).subscribe({
      next: (updated) => {
        this.allUsers.update(users => users.map(u => u.id === updated.id ? updated : u));
        this.actionLoading.set(null);
        onSuccess?.();
      },
      error: (err) => {
        this.actionLoading.set(null);
        if (this.suspendModalVisible()) {
          this.suspendError.set(err.error?.detail || 'Erreur lors de la suspension.');
        }
      },
    });
  }

  openSuspendModal(user: AdminUserDto): void {
    this.suspendTarget.set(user);
    this.suspendReason = '';
    this.suspendError.set('');
    this.suspendModalVisible.set(true);
  }

  closeSuspendModal(): void {
    this.suspendModalVisible.set(false);
    this.suspendTarget.set(null);
    this.suspendReason = '';
    this.suspendError.set('');
  }

  confirmSuspend(): void {
    const user = this.suspendTarget();
    const reason = this.suspendReason.trim();
    if (!user || reason.length < 3) return;

    this.suspendError.set('');
    this.updateStatus(user, 'SUSPENDED', reason, () => this.closeSuspendModal());
  }

  getRoleLabel(role: Role): string {
    return ROLE_LABELS[role] || role;
  }

  getStatusLabel(status: UserStatus): string {
    return USER_STATUS_LABELS[status] || status;
  }

  getStatusBadgeClass(status: UserStatus): string {
    const base = 'inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium';
    const map: Record<UserStatus, string> = {
      ACTIVE: `${base} bg-primary-100 text-sky-800`,
      INACTIVE: `${base} bg-gray-100 text-gray-700`,
      SUSPENDED: `${base} bg-red-100 text-red-800`,
      PENDING_ADMIN_VALIDATION: `${base} bg-amber-100 text-amber-800`,
      SUBSCRIPTION_EXPIRED: `${base} bg-orange-100 text-orange-800`,
    };
    return map[status] || base;
  }

  formatDate(dateStr: string): string {
    return formatLocalDate(dateStr);
  }

  openUserProfile(userId: number): void {
    this.profileModalUserId.set(userId);
    this.profileModalVisible.set(true);
  }

  closeProfileModal(): void {
    this.profileModalVisible.set(false);
    this.profileModalUserId.set(null);
  }
}
