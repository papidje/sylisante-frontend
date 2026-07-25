import { Component, OnInit, signal } from '@angular/core';
import { RouterLink } from '@angular/router';
import { CommonModule } from '@angular/common';
import { AdminService } from '../../../core/services/admin.service';
import { AuthService } from '../../../core/services/auth.service';
import { PlanningAlertDto } from '../../../core/models/planning-alert.model';
import { formatLocalDateTime } from '../../../core/utils/date-utils';

@Component({
  selector: 'app-admin-dashboard',
  standalone: true,
  imports: [RouterLink, CommonModule],
  template: `
    <div class="max-w-6xl mx-auto px-4 py-8">
      <div class="mb-8">
        <h1 class="text-2xl font-bold text-gray-900">
          Tableau de bord Administrateur
        </h1>
        <p class="text-gray-500 mt-1">Bienvenue, {{ authService.currentUser()?.firstName }}</p>
      </div>

      <!-- Cartes statistiques -->
      <div class="grid sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
        <div class="card text-center">
          <p class="text-3xl font-bold text-primary-600">{{ totalUsers() }}</p>
          <p class="text-sm text-gray-500 mt-1">Utilisateurs total</p>
        </div>
        <div class="card text-center">
          <p class="text-3xl font-bold text-primary-600">{{ activeUsers() }}</p>
          <p class="text-sm text-gray-500 mt-1">Comptes actifs</p>
        </div>
        <div class="card text-center">
          <p class="text-3xl font-bold text-red-500">{{ suspendedUsers() }}</p>
          <p class="text-sm text-gray-500 mt-1">Suspendus</p>
        </div>
        <div class="card text-center">
          <p class="text-3xl font-bold text-yellow-500">{{ unresolvedAlerts() }}</p>
          <p class="text-sm text-gray-500 mt-1">Alertes planning</p>
        </div>
      </div>

      <!-- Accès rapides Admin -->
      <div class="grid sm:grid-cols-2 lg:grid-cols-3 gap-4 mb-8">
        <a routerLink="/admin/users"
           class="card flex items-center gap-4 hover:shadow-md transition-shadow cursor-pointer">
          <div class="w-12 h-12 bg-primary-100 rounded-xl flex items-center justify-center flex-shrink-0">
            <svg class="w-6 h-6 text-primary-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2"
                    d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0z"/>
            </svg>
          </div>
          <div>
            <p class="font-semibold text-gray-900">Modération</p>
            <p class="text-sm text-gray-500">Gérer les comptes utilisateurs</p>
          </div>
        </a>

        <a routerLink="/admin/cities"
           class="card flex items-center gap-4 hover:shadow-md transition-shadow cursor-pointer">
          <div class="w-12 h-12 bg-blue-100 rounded-xl flex items-center justify-center flex-shrink-0">
            <svg class="w-6 h-6 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2"
                    d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z"/>
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M15 11a3 3 0 11-6 0 3 3 0 016 0z"/>
            </svg>
          </div>
          <div>
            <p class="font-semibold text-gray-900">Villes & Spécialités</p>
            <p class="text-sm text-gray-500">Référentiels médicaux</p>
          </div>
        </a>

        <a routerLink="/admin/alerts"
           class="card flex items-center gap-4 hover:shadow-md transition-shadow cursor-pointer relative">
          <div class="w-12 h-12 bg-yellow-100 rounded-xl flex items-center justify-center flex-shrink-0">
            <svg class="w-6 h-6 text-yellow-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2"
                    d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z"/>
            </svg>
          </div>
          <div>
            <p class="font-semibold text-gray-900">Alertes Planning</p>
            <p class="text-sm text-gray-500">Conflits de rendez-vous</p>
          </div>
          @if (unresolvedAlerts() > 0) {
            <span class="absolute top-3 right-3 inline-flex items-center justify-center w-5 h-5 bg-red-500 text-white text-xs rounded-full font-bold">
              {{ unresolvedAlerts() }}
            </span>
          }
        </a>
      </div>

      <!-- Alertes Planning récentes -->
      @if (recentAlerts().length > 0) {
        <div class="card border-l-4 border-yellow-400">
          <h2 class="font-semibold text-gray-900 mb-4 flex items-center gap-2">
            <svg class="w-5 h-5 text-yellow-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2"
                    d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z"/>
            </svg>
            Alertes de planning non résolues ({{ unresolvedAlerts() }})
          </h2>
          <div class="space-y-3">
            @for (alert of recentAlerts(); track alert.id) {
              <div class="flex items-start justify-between gap-4 bg-yellow-50 rounded-lg p-3">
                <div class="flex-1 min-w-0">
                  <p class="text-sm font-medium text-gray-900">{{ alert.practitionerName }}</p>
                  <p class="text-xs text-gray-600 mt-0.5">{{ alert.message }}</p>
                  <p class="text-xs text-gray-400 mt-1">{{ formatDate(alert.createdAt) }}</p>
                </div>
                <button (click)="resolveAlert(alert.id)"
                        class="btn-secondary text-xs px-3 py-1 flex-shrink-0">
                  Résoudre
                </button>
              </div>
            }
          </div>
          @if (unresolvedAlerts() > 3) {
            <div class="mt-4 pt-3 border-t border-gray-100">
              <a routerLink="/admin/alerts" class="text-sm text-primary-600 font-medium hover:underline">
                Voir toutes les alertes →
              </a>
            </div>
          }
        </div>
      }
    </div>
  `,
})
export class AdminDashboardComponent implements OnInit {
  totalUsers = signal(0);
  activeUsers = signal(0);
  suspendedUsers = signal(0);
  unresolvedAlerts = signal(0);
  recentAlerts = signal<PlanningAlertDto[]>([]);

  constructor(
    public authService: AuthService,
    private adminService: AdminService
  ) {}

  ngOnInit(): void {
    this.adminService.getAllUsers().subscribe(users => {
      this.totalUsers.set(users.length);
      this.activeUsers.set(users.filter(u => u.status === 'ACTIVE').length);
      this.suspendedUsers.set(users.filter(u => u.status === 'SUSPENDED').length);
    });

    this.adminService.getAllUnresolvedAlerts().subscribe(alerts => {
      this.unresolvedAlerts.set(alerts.length);
      this.recentAlerts.set(alerts.slice(0, 3));
    });
  }

  resolveAlert(alertId: number): void {
    this.adminService.resolveAlert(alertId).subscribe(() => {
      this.recentAlerts.update(alerts => alerts.filter(a => a.id !== alertId));
      this.unresolvedAlerts.update(c => Math.max(0, c - 1));
    });
  }

  formatDate(dateStr: string): string {
    return formatLocalDateTime(dateStr);
  }
}
