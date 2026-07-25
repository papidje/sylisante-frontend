import { Component, OnInit, signal } from '@angular/core';
import { RouterLink } from '@angular/router';
import { CommonModule } from '@angular/common';
import { AuthService } from '../../../core/services/auth.service';
import { AppointmentService } from '../../../core/services/appointment.service';
import { AppointmentResponse, APPOINTMENT_STATUS_LABELS, AppointmentStatus } from '../../../core/models/appointment.model';
import { formatLocalDateTime, parseLocalDateTime } from '../../../core/utils/date-utils';
import { SyliSpinnerComponent } from '../../../shared/components/syli-spinner/syli-spinner.component';

@Component({
  selector: 'app-patient-dashboard',
  standalone: true,
  imports: [  RouterLink, CommonModule, SyliSpinnerComponent],
  template: `
    <div class="max-w-5xl mx-auto px-4 py-8">
      <!-- Entête de bienvenue -->
      <div class="mb-8">
        <h1 class="text-2xl font-bold text-gray-900">
          Bonjour, {{ authService.currentUser()?.firstName }} 👋
        </h1>
        <p class="text-gray-500 mt-1">Voici un aperçu de votre espace santé</p>
      </div>

      <!-- Statistiques -->
      <div class="grid grid-cols-2 sm:grid-cols-4 gap-4 mb-8">
        <div class="card text-center">
          <p class="text-3xl font-bold text-primary-600">{{ totalAppointments() }}</p>
          <p class="text-sm text-gray-500 mt-1">Total RDV</p>
        </div>
        <div class="card text-center">
          <p class="text-3xl font-bold text-yellow-500">{{ pendingCount() }}</p>
          <p class="text-sm text-gray-500 mt-1">En attente</p>
        </div>
        <div class="card text-center">
          <p class="text-3xl font-bold text-primary-500">{{ confirmedCount() }}</p>
          <p class="text-sm text-gray-500 mt-1">Confirmés</p>
        </div>
        <div class="card text-center">
          <p class="text-3xl font-bold text-blue-500">{{ completedCount() }}</p>
          <p class="text-sm text-gray-500 mt-1">Terminés</p>
        </div>
      </div>

      <!-- Action rapide -->
      <div class="grid sm:grid-cols-2 gap-4 mb-8">
        <a routerLink="/appointments/book"
           class="card flex items-center gap-4 hover:shadow-md transition-shadow cursor-pointer border-2 border-dashed border-primary-200 hover:border-primary-400 bg-primary-50">
          <div class="w-12 h-12 bg-primary-100 rounded-xl flex items-center justify-center flex-shrink-0">
            <svg class="w-6 h-6 text-primary-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 4v16m8-8H4"/>
            </svg>
          </div>
          <div>
            <p class="font-semibold text-primary-700">Prendre un rendez-vous</p>
            <p class="text-sm text-gray-500">Consultez un praticien</p>
          </div>
        </a>
        <a routerLink="/appointments"
           class="card flex items-center gap-4 hover:shadow-md transition-shadow cursor-pointer">
          <div class="w-12 h-12 bg-gray-100 rounded-xl flex items-center justify-center flex-shrink-0">
            <svg class="w-6 h-6 text-gray-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2"
                    d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z"/>
            </svg>
          </div>
          <div>
            <p class="font-semibold text-gray-900">Voir tous mes RDV</p>
            <p class="text-sm text-gray-500">Historique et suivi</p>
          </div>
        </a>
      </div>

      <!-- Prochains rendez-vous -->
      <div class="card">
        <h2 class="text-lg font-semibold text-gray-900 mb-4">Prochains rendez-vous</h2>
        @if (loading()) {
          <app-syli-spinner size="sm" [showLabel]="true" [centered]="true" />
        } @else if (upcomingAppointments().length === 0) {
          <div class="text-center py-8">
            <p class="text-gray-400">Aucun rendez-vous à venir</p>
            <a routerLink="/appointments/book" class="btn-primary mt-3 inline-block text-sm">
              Prendre rendez-vous
            </a>
          </div>
        } @else {
          <div class="space-y-3">
            @for (appt of upcomingAppointments(); track appt.id) {
              <div class="flex items-center gap-4 p-3 bg-gray-50 rounded-lg">
                <div class="w-10 h-10 bg-primary-100 rounded-lg flex items-center justify-center flex-shrink-0">
                  <svg class="w-5 h-5 text-primary-700" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2"
                          d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z"/>
                  </svg>
                </div>
                <div class="flex-1 min-w-0">
                  <p class="font-medium text-gray-900 text-sm">
                    Dr. {{ appt.practitionerFirstName }} {{ appt.practitionerLastName }}
                  </p>
                  <div class="flex items-center gap-1.5 flex-wrap mt-0.5">
                    @if (appt.consultationType) {
                      <span class="text-xs font-semibold bg-primary-100 text-primary-800 px-2 py-0.5 rounded-full">
                        {{ appt.consultationType }}
                      </span>
                    }
                    <span class="text-xs text-gray-500">{{ formatDate(appt.appointmentDateTime) }}</span>
                    @if (appt.reason) {
                      <span class="relative group cursor-help">
                        <svg class="w-3.5 h-3.5 text-gray-400 hover:text-gray-600" fill="none"
                             stroke="currentColor" viewBox="0 0 24 24">
                          <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2"
                                d="M8.228 9c.549-1.165 2.03-2 3.772-2 2.21 0 4 1.343 4 3 0 1.4-1.278 2.575-3.006 2.907-.542.104-.994.54-.994 1.093m0 3h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"/>
                        </svg>
                        <span class="absolute left-5 -top-1 z-20 hidden group-hover:block bg-gray-900 text-white
                                     text-xs rounded-lg px-3 py-2 w-52 shadow-xl pointer-events-none">
                          <span class="font-semibold block mb-1 text-gray-300">Ma note</span>
                          {{ appt.reason }}
                        </span>
                      </span>
                    }
                  </div>
                </div>
                <span [class]="getStatusBadgeClass(appt.status)" class="flex-shrink-0">
                  {{ getStatusLabel(appt.status) }}
                </span>
              </div>
            }
          </div>
        }
      </div>
    </div>
  `,
})
export class PatientDashboardComponent implements OnInit {
  appointments = signal<AppointmentResponse[]>([]);
  loading = signal(true);

  totalAppointments = signal(0);
  pendingCount = signal(0);
  confirmedCount = signal(0);
  completedCount = signal(0);
  upcomingAppointments = signal<AppointmentResponse[]>([]);

  constructor(
    public authService: AuthService,
    private appointmentService: AppointmentService
  ) {}

  ngOnInit(): void {
    this.appointmentService.getMyAppointments().subscribe({
      next: (data) => {
        this.appointments.set(data);
        this.computeStats(data);
        this.loading.set(false);
      },
      error: () => this.loading.set(false),
    });
  }

  private computeStats(data: AppointmentResponse[]): void {
    this.totalAppointments.set(data.length);
    this.pendingCount.set(data.filter(a =>
      a.status === 'REQUESTED' || a.status === 'PENDING_PAYMENT_VALIDATION').length);
    this.confirmedCount.set(data.filter(a => a.status === 'CONFIRMED').length);
    this.completedCount.set(data.filter(a => a.status === 'COMPLETED').length);

    const now = new Date();
    const upcoming = data
      .filter(a => parseLocalDateTime(a.appointmentDateTime) >= now &&
        (a.status === 'CONFIRMED' || a.status === 'PENDING_PAYMENT_VALIDATION' || a.status === 'REQUESTED'))
      .sort((a, b) => parseLocalDateTime(a.appointmentDateTime).getTime() - parseLocalDateTime(b.appointmentDateTime).getTime())
      .slice(0, 3);
    this.upcomingAppointments.set(upcoming);
  }

  formatDate(dateStr: string): string {
    return formatLocalDateTime(dateStr);
  }

  getStatusLabel(status: AppointmentStatus): string {
    return APPOINTMENT_STATUS_LABELS[status] || status;
  }

  getStatusBadgeClass(status: AppointmentStatus): string {
    const base = 'inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium';
    const map: Partial<Record<AppointmentStatus, string>> = {
      REQUESTED: `${base} bg-gray-100 text-gray-700`,
      PENDING_PAYMENT_VALIDATION: `${base} bg-yellow-100 text-yellow-800`,
      CONFIRMED: `${base} bg-primary-100 text-sky-800`,
      CANCELED: `${base} bg-red-100 text-red-800`,
      COMPLETED: `${base} bg-blue-100 text-blue-800`,
    };
    return map[status] || base;
  }
}
