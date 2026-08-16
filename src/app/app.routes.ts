import { Routes } from '@angular/router';
import { authGuard, guestGuard } from './core/guards/auth.guard';
import { roleGuard, rolesGuard } from './core/guards/role.guard';
import { accountAccessGuard } from './core/guards/account-access.guard';
import { contactAdminGuard } from './core/guards/contact-admin.guard';
import { practitionerOperationalGuard } from './core/guards/practitioner-operational.guard';
import { secretaryAccessGuard } from './core/guards/secretary-access.guard';

export const routes: Routes = [
  { path: '', redirectTo: '/auth/login', pathMatch: 'full' },

  // ── LEGACY TEMPORAIRE : vitrine chiropraxie-guinee.fr ─────────────────────
  // Suppression : rm -rf features/chiropraxie-landing + retirer ce bloc.
  {
    path: 'chiropraxie',
    loadComponent: () =>
      import('./features/chiropraxie-landing/chiropraxie-landing.component').then(
        m => m.ChiropraxieLandingComponent
      ),
  },
  {
    path: 'cabinet-nabe',
    redirectTo: 'chiropraxie',
    pathMatch: 'full',
  },
  // ─────────────────────────────────────────────────────────────────────────

  // Auth (invités seulement)
  {
    path: 'auth',
    canActivate: [guestGuard],
    children: [
      {
        path: 'login',
        loadComponent: () =>
          import('./features/auth/login/login.component').then(m => m.LoginComponent),
      },
      {
        path: 'register',
        loadComponent: () =>
          import('./features/auth/register/register.component').then(m => m.RegisterComponent),
      },
      {
        path: 'validate',
        loadComponent: () =>
          import('./features/auth/validate-account/validate-account.component').then(
            m => m.ValidateAccountComponent
          ),
      },
      {
        path: 'secretary/activate',
        loadComponent: () =>
          import('./features/auth/secretary-activate/secretary-activate.component').then(
            m => m.SecretaryActivateComponent
          ),
      },
      { path: '', redirectTo: 'login', pathMatch: 'full' },
    ],
  },

  // Compte restreint (suspendu / abonnement expiré)
  {
    path: 'account-restricted',
    canActivate: [authGuard, accountAccessGuard],
    loadComponent: () =>
      import('./features/account/account-restricted/account-restricted.component').then(
        m => m.AccountRestrictedComponent
      ),
  },

  // Conversation avec l'administrateur
  {
    path: 'contact-admin',
    canActivate: [authGuard, contactAdminGuard],
    loadComponent: () =>
      import('./features/account/contact-admin/contact-admin.component').then(
        m => m.ContactAdminComponent
      ),
  },

  // Dashboard Patient
  {
    path: 'dashboard/patient',
    canActivate: [authGuard, accountAccessGuard, roleGuard('ROLE_PATIENT')],
    loadComponent: () =>
      import('./features/dashboard/patient-dashboard/patient-dashboard.component').then(
        m => m.PatientDashboardComponent
      ),
  },

  // Dashboard Secrétaire
  {
    path: 'dashboard/secretary',
    canActivate: [authGuard, accountAccessGuard, roleGuard('ROLE_SECRETARY'), secretaryAccessGuard],
    loadComponent: () =>
      import('./features/dashboard/secretary-dashboard/secretary-dashboard.component').then(
        m => m.SecretaryDashboardComponent
      ),
  },

  // Dashboard Praticien
  {
    path: 'dashboard/practitioner',
    canActivate: [authGuard, accountAccessGuard, roleGuard('ROLE_PRATICIEN')],
    loadComponent: () =>
      import('./features/dashboard/practitioner-dashboard/practitioner-dashboard.component').then(
        m => m.PractitionerDashboardComponent
      ),
  },

  // Rendez-vous
  {
    path: 'appointments',
    canActivate: [authGuard, accountAccessGuard],
    children: [
      {
        path: '',
        canActivate: [practitionerOperationalGuard, secretaryAccessGuard],
        loadComponent: () =>
          import('./features/appointments/appointment-list/appointment-list.component').then(
            m => m.AppointmentListComponent
          ),
      },
      {
        path: 'book',
        canActivate: [roleGuard('ROLE_PATIENT')],
        loadComponent: () =>
          import('./features/appointments/book-appointment/book-appointment.component').then(
            m => m.BookAppointmentComponent
          ),
      },
    ],
  },

  // Profil Praticien
  {
    path: 'profile',
    canActivate: [authGuard, accountAccessGuard, roleGuard('ROLE_PRATICIEN')],
    loadComponent: () =>
      import('./features/profile/practitioner-profile/practitioner-profile.component').then(
        m => m.PractitionerProfileComponent
      ),
  },

  // Profil Patient
  {
    path: 'patient-profile',
    canActivate: [authGuard, accountAccessGuard, roleGuard('ROLE_PATIENT')],
    loadComponent: () =>
      import('./features/profile/patient-profile/patient-profile.component').then(
        m => m.PatientProfileComponent
      ),
  },

  // Profil Secrétaire
  {
    path: 'secretary-profile',
    canActivate: [authGuard, accountAccessGuard, roleGuard('ROLE_SECRETARY')],
    loadComponent: () =>
      import('./features/profile/secretary-profile/secretary-profile.component').then(
        m => m.SecretaryProfileComponent
      ),
  },

  // Mes secrétaires (Praticien)
  {
    path: 'secretaries',
    canActivate: [authGuard, accountAccessGuard, roleGuard('ROLE_PRATICIEN')],
    loadComponent: () =>
      import('./features/practitioner/secretaries/practitioner-secretaries.component').then(
        m => m.PractitionerSecretariesComponent
      ),
  },

  // Calendrier Praticien / Secrétaire
  {
    path: 'calendar',
    canActivate: [
      authGuard,
      accountAccessGuard,
      rolesGuard(['ROLE_PRATICIEN', 'ROLE_SECRETARY']),
      practitionerOperationalGuard,
      secretaryAccessGuard,
    ],
    loadComponent: () =>
      import('./features/practitioner/calendar/practitioner-calendar.component').then(
        m => m.PractitionerCalendarComponent
      ),
  },

  // Disponibilités Praticien
  {
    path: 'availabilities',
    canActivate: [authGuard, accountAccessGuard, roleGuard('ROLE_PRATICIEN')],
    loadComponent: () =>
      import('./features/practitioner/availability-management/availability-management.component').then(
        m => m.AvailabilityManagementComponent
      ),
  },

  // Alertes Planning Praticien
  {
    path: 'planning-alerts',
    canActivate: [authGuard, accountAccessGuard, roleGuard('ROLE_PRATICIEN'), practitionerOperationalGuard],
    loadComponent: () =>
      import('./features/practitioner/planning-alerts/planning-alerts.component').then(
        m => m.PlanningAlertsComponent
      ),
  },

  // Dossier médical & Comptes rendus (Praticien)
  {
    path: 'consultation-reports',
    canActivate: [authGuard, accountAccessGuard, roleGuard('ROLE_PRATICIEN'), practitionerOperationalGuard],
    loadComponent: () =>
      import('./features/practitioner/consultation-reports/consultation-reports.component').then(
        m => m.ConsultationReportsComponent
      ),
  },

  // Transferts en attente d'approbation (Praticien source)
  {
    path: 'transfer-approvals',
    canActivate: [authGuard, accountAccessGuard, roleGuard('ROLE_PRATICIEN'), practitionerOperationalGuard],
    loadComponent: () =>
      import('./features/practitioner/transfer-approvals/transfer-approvals.component').then(
        m => m.TransferApprovalsComponent
      ),
  },

  // Dossiers partagés reçus (Praticien cible)
  {
    path: 'shared-records',
    canActivate: [authGuard, accountAccessGuard, roleGuard('ROLE_PRATICIEN'), practitionerOperationalGuard],
    loadComponent: () =>
      import('./features/practitioner/shared-records/shared-records.component').then(
        m => m.SharedRecordsComponent
      ),
  },

  // Transferts de dossier (Patient)
  {
    path: 'my-transfers',
    canActivate: [authGuard, accountAccessGuard, roleGuard('ROLE_PATIENT')],
    loadComponent: () =>
      import('./features/patient/patient-transfers/patient-transfers.component').then(
        m => m.PatientTransfersComponent
      ),
  },

  // Admin
  {
    path: 'admin',
    canActivate: [authGuard, roleGuard('ROLE_ADMIN')],
    children: [
      {
        path: 'dashboard',
        loadComponent: () =>
          import('./features/admin/admin-dashboard/admin-dashboard.component').then(
            m => m.AdminDashboardComponent
          ),
      },
      {
        path: 'users',
        loadComponent: () =>
          import('./features/admin/user-moderation/user-moderation.component').then(
            m => m.UserModerationComponent
          ),
      },
      {
        path: 'cities',
        loadComponent: () =>
          import('./features/admin/city-management/city-management.component').then(
            m => m.CityManagementComponent
          ),
      },
      {
        path: 'alerts',
        loadComponent: () =>
          import('./features/admin/admin-dashboard/admin-dashboard.component').then(
            m => m.AdminDashboardComponent
          ),
      },
      {
        path: 'audit-logs',
        loadComponent: () =>
          import('./features/admin/audit-logs/audit-logs.component').then(
            m => m.AuditLogsComponent
          ),
      },
      {
        path: 'support-requests',
        loadComponent: () =>
          import('./features/admin/support-requests/support-requests.component').then(
            m => m.SupportRequestsComponent
          ),
      },
      {
        path: 'support-requests/:userId',
        loadComponent: () =>
          import('./features/admin/support-requests/support-conversation.component').then(
            m => m.SupportConversationComponent
          ),
      },
      { path: '', redirectTo: 'dashboard', pathMatch: 'full' },
    ],
  },

  { path: '**', redirectTo: '/auth/login' },
];
