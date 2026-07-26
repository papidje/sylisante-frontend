import { Component, OnInit, signal } from '@angular/core';
import { RouterLink, RouterLinkActive } from '@angular/router';
import { AuthService } from '../../../core/services/auth.service';
import { PlanningAlertService } from '../../../core/services/planning-alert.service';
import { ReportTransferService } from '../../../core/services/report-transfer.service';
import { SupportService } from '../../../core/services/support.service';
import { NotificationBellComponent } from '../notification-bell/notification-bell.component';
import { canSendSupportMessage } from '../../../core/models/user.model';

@Component({
  selector: 'app-navbar',
  standalone: true,
  imports: [RouterLink, RouterLinkActive, NotificationBellComponent],
  template: `
    <nav class="bg-white border-b border-slate-100 shadow-sm">
      <div class="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div class="flex justify-between items-center h-16">

          <!-- Gauche : logo + navigation -->
          <div class="flex items-center gap-2">

            <!-- Logo SyliSanté -->
            <a [routerLink]="authService.getDefaultRoute()"
               class="flex items-center gap-2.5 flex-shrink-0 pr-4 border-r border-slate-100">
              <img src="assets/syliSante.png" alt="SyliSanté" class="h-8 w-auto flex-shrink-0"/>
              <span class="font-extrabold text-2xl leading-none tracking-tight
                           bg-gradient-to-r from-[#10B981] to-[#0EA5E9]
                           bg-clip-text text-transparent select-none">
                SyliSanté
              </span>
              @if (authService.isAdmin()) {
                <span class="text-xs bg-red-50 text-red-600 border border-red-200 px-2 py-0.5 rounded-full font-medium">
                  Admin
                </span>
              }
            </a>

            <!-- Navigation liens -->
            <div class="hidden sm:flex items-end h-16 gap-0.5">

              @if (!authService.isAccountRestricted()) {
              @if (authService.isPatient()) {
                <a routerLink="/dashboard/patient" routerLinkActive="nav-active"
                   class="nav-link">Tableau de bord</a>
                <a routerLink="/appointments" routerLinkActive="nav-active"
                   class="nav-link">Mes RDV</a>
                <a routerLink="/appointments/book" routerLinkActive="nav-active"
                   class="nav-link">+ Nouveau RDV</a>
                <a routerLink="/my-transfers" routerLinkActive="nav-active"
                   class="nav-link">Transferts</a>
                <a routerLink="/patient-profile" routerLinkActive="nav-active"
                   class="nav-link">Mon profil</a>
                @if (showSupportLink()) {
                  <a routerLink="/contact-admin" routerLinkActive="nav-active"
                     class="nav-link">Mes demandes</a>
                }
              }

              @if (authService.isPractitioner()) {
                <a routerLink="/dashboard/practitioner" routerLinkActive="nav-active"
                   class="nav-link">Tableau de bord</a>
                @if (!authService.isPendingValidation()) {
                <a routerLink="/appointments" routerLinkActive="nav-active"
                   class="nav-link">Planning</a>
                <a routerLink="/calendar" routerLinkActive="nav-active"
                   class="nav-link">Calendrier</a>
                }
                <a routerLink="/availabilities" routerLinkActive="nav-active"
                   class="nav-link">Disponibilités</a>
                @if (!authService.isPendingValidation()) {
                <a routerLink="/planning-alerts" routerLinkActive="nav-active"
                   class="nav-link relative">
                  Alertes
                  @if (alertCount() > 0) {
                    <span class="absolute -top-0.5 -right-1 inline-flex items-center justify-center w-4 h-4
                                 bg-red-500 text-white text-[10px] rounded-full font-bold">
                      {{ alertCount() > 9 ? '9+' : alertCount() }}
                    </span>
                  }
                </a>
                <a routerLink="/consultation-reports" routerLinkActive="nav-active"
                   class="nav-link">Dossiers</a>
                <a routerLink="/transfer-approvals" routerLinkActive="nav-active"
                   class="nav-link relative">
                  Approbations
                  @if (transferPendingCount() > 0) {
                    <span class="absolute -top-0.5 -right-1 inline-flex items-center justify-center w-4 h-4
                                 bg-amber-400 text-slate-900 text-[10px] rounded-full font-bold">
                      {{ transferPendingCount() > 9 ? '9+' : transferPendingCount() }}
                    </span>
                  }
                </a>
                <a routerLink="/shared-records" routerLinkActive="nav-active"
                   class="nav-link">Partagés</a>
                }
                <a routerLink="/profile" routerLinkActive="nav-active"
                   class="nav-link">Mon profil</a>
                <a routerLink="/contact-admin" routerLinkActive="nav-active"
                   class="nav-link">Mes demandes</a>
              }

              @if (authService.isAdmin()) {
                <a routerLink="/admin/dashboard" routerLinkActive="nav-active"
                   class="nav-link">Tableau de bord</a>
                <a routerLink="/admin/users" routerLinkActive="nav-active"
                   class="nav-link">Utilisateurs</a>
                <a routerLink="/admin/support-requests" routerLinkActive="nav-active"
                   class="nav-link">Demandes</a>
                <a routerLink="/admin/cities" routerLinkActive="nav-active"
                   class="nav-link">Référentiels</a>
                <a routerLink="/admin/alerts" routerLinkActive="nav-active"
                   class="nav-link">Alertes Planning</a>
                <a routerLink="/admin/audit-logs" routerLinkActive="nav-active"
                   class="nav-link">Journal d'audit</a>
              }
              } @else if (!authService.isAdmin()) {
                <a routerLink="/account-restricted" routerLinkActive="nav-active"
                   class="nav-link">Mon compte</a>
                <a routerLink="/contact-admin" routerLinkActive="nav-active"
                   class="nav-link">Mes demandes</a>
              }

            </div>
          </div>

          <!-- Droite : cloche + user + déconnexion -->
          <div class="flex items-center gap-3">
            <app-notification-bell />

            <!-- Infos utilisateur -->
            <div class="text-right hidden sm:block">
              <p class="text-sm font-semibold text-slate-800 leading-tight">
                {{ authService.isAdmin() ? '' : (authService.isPractitioner() ? 'Dr. ' : '') }}
                {{ authService.currentUser()?.firstName }} {{ authService.currentUser()?.lastName }}
              </p>
              <p class="text-xs text-slate-400 leading-tight">
                {{ authService.isAdmin() ? 'Administrateur' : authService.isPractitioner() ? 'Praticien' : 'Patient' }}
              </p>
            </div>

            <!-- Bouton déconnexion (icône seule) -->
            <button (click)="authService.logout()"
                    title="Se déconnecter"
                    class="p-2 rounded-lg border border-slate-200 text-slate-500
                           hover:bg-slate-50 hover:text-red-500 hover:border-red-200
                           transition-colors duration-200">
              <svg class="w-4 h-4" fill="none" stroke="currentColor" stroke-width="2"
                   viewBox="0 0 24 24">
                <path stroke-linecap="round" stroke-linejoin="round"
                      d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a2 2 0 01-2 2H5a2 2 0 01-2-2V7a2 2 0 012-2h6a2 2 0 012 2v1"/>
              </svg>
            </button>
          </div>

        </div>
      </div>
    </nav>
  `,
  styles: [`
    /* Lien de navigation par défaut */
    .nav-link {
      display: inline-flex;
      align-items: center;
      height: 4rem;           /* h-16 — couvre toute la hauteur de la navbar */
      padding: 0 0.75rem;
      font-size: 0.8125rem;
      font-weight: 500;
      color: #475569;         /* slate-600 */
      position: relative;
      white-space: nowrap;
      transition: color 0.15s;
      border-bottom: 2px solid transparent;
    }

    .nav-link:hover {
      color: #0284c7;         /* sky-600 */
    }

    /* Onglet actif : texte sky + barre bleue en bas */
    .nav-active {
      color: #0284c7 !important;    /* sky-600 */
      font-weight: 600 !important;
      border-bottom: 2px solid #0ea5e9 !important;  /* syli-blue-500 */
    }
  `]
})
export class NavbarComponent implements OnInit {
  alertCount = signal(0);
  transferPendingCount = signal(0);
  showSupportLink = signal(false);

  constructor(
    public authService: AuthService,
    private planningAlertService: PlanningAlertService,
    private reportTransferService: ReportTransferService,
    private supportService: SupportService,
  ) {}

  ngOnInit(): void {
    this.loadSupportNavVisibility();

    if (this.authService.isPractitioner()) {
      this.planningAlertService.getUnresolvedCount().subscribe(res => {
        this.alertCount.set(res.unresolvedCount);
      });
      this.reportTransferService.getPendingCount().subscribe(res => {
        this.transferPendingCount.set(res.pendingCount);
      });
    }
  }

  private loadSupportNavVisibility(): void {
    const user = this.authService.currentUser();
    if (!user || user.role === 'ROLE_ADMIN') return;

    if (canSendSupportMessage(user.role, user.status)) {
      this.showSupportLink.set(true);
      return;
    }

    if (user.role === 'ROLE_PATIENT') {
      this.supportService.getAccess().subscribe({
        next: (access) => this.showSupportLink.set(access.canSend || access.hasConversation),
        error: () => this.showSupportLink.set(false),
      });
    }
  }
}
