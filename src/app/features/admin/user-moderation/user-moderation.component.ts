import { Component, OnInit, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { AdminService } from '../../../core/services/admin.service';
import { AdminUserDto, Role, UserStatus, USER_STATUS_LABELS, ROLE_LABELS } from '../../../core/models/user.model';
import { formatLocalDate } from '../../../core/utils/date-utils';
import { SyliSpinnerComponent } from '../../../shared/components/syli-spinner/syli-spinner.component';
import { UserProfileModalComponent } from '../../../shared/components/user-profile-modal/user-profile-modal.component';

@Component({
  selector: 'app-user-moderation',
  standalone: true,
  imports: [  CommonModule, FormsModule, SyliSpinnerComponent, UserProfileModalComponent],
  template: `
    <div class="max-w-6xl mx-auto px-4 py-8">
      <div class="mb-8">
        <h1 class="text-2xl font-bold text-gray-900">Modération des comptes</h1>
        <p class="text-gray-500 mt-1">Gérez les statuts des praticiens et des patients</p>
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
                      <span class="text-xs text-gray-500">{{ formatDate(user.createdAt) }}</span>
                    </td>
                    <td class="px-6 py-4 text-right">
                      <div class="flex justify-end gap-2">
                        <button type="button" (click)="openUserProfile(user.id)"
                                class="text-xs px-3 py-1 border border-gray-200 rounded-lg text-gray-700 hover:bg-gray-50">
                          Profil
                        </button>
                        @if (user.status === 'ACTIVE') {
                          <button (click)="updateStatus(user, 'SUSPENDED')"
                                  [disabled]="actionLoading() === user.id"
                                  class="btn-danger text-xs px-3 py-1">
                            Suspendre
                          </button>
                        }
                        @if (user.status === 'SUSPENDED') {
                          <button (click)="updateStatus(user, 'ACTIVE')"
                                  [disabled]="actionLoading() === user.id"
                                  class="btn-success text-xs px-3 py-1">
                            Réactiver
                          </button>
                        }
                        @if (user.status === 'INACTIVE') {
                          <span class="text-xs text-gray-400 italic py-1">Attente activation</span>
                        }
                      </div>
                    </td>
                  </tr>
                }
                @if (filteredUsers().length === 0) {
                  <tr>
                    <td colspan="5" class="px-6 py-12 text-center text-gray-400">
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
  searchTerm = '';
  profileModalVisible = signal(false);
  profileModalUserId = signal<number | null>(null);

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
  }

  filteredUsers(): AdminUserDto[] {
    let users = this.allUsers();
    if (this.filterRole() !== 'ALL') {
      users = users.filter(u => u.role === this.filterRole());
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

  updateStatus(user: AdminUserDto, status: UserStatus): void {
    this.actionLoading.set(user.id);
    this.adminService.updateUserStatus(user.id, status).subscribe({
      next: (updated) => {
        this.allUsers.update(users => users.map(u => u.id === updated.id ? updated : u));
        this.actionLoading.set(null);
      },
      error: () => this.actionLoading.set(null),
    });
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
