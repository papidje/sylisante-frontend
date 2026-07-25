import { Component, OnInit, signal } from '@angular/core';
import { RouterLink } from '@angular/router';
import { Router } from '@angular/router';
import { CommonModule } from '@angular/common';
import { AuthService } from '../../../core/services/auth.service';
import { AppointmentService } from '../../../core/services/appointment.service';
import { AppointmentResponse, APPOINTMENT_STATUS_LABELS, AppointmentStatus } from '../../../core/models/appointment.model';
import { formatLocalDateTime, parseLocalDateTime } from '../../../core/utils/date-utils';
import { SyliSpinnerComponent } from '../../../shared/components/syli-spinner/syli-spinner.component';
import { AppointmentActionModalComponent } from '../../../shared/components/appointment-action-modal/appointment-action-modal.component';

@Component({
  selector: 'app-practitioner-dashboard',
  standalone: true,
  imports: [RouterLink, CommonModule, SyliSpinnerComponent, AppointmentActionModalComponent],
  template: `
    <div class="max-w-5xl mx-auto px-4 py-8">
      <div class="mb-8">
        <h1 class="text-2xl font-bold text-gray-900">
          Bonjour, Dr. {{ authService.currentUser()?.firstName }} 👋
        </h1>
        <p class="text-gray-500 mt-1">Tableau de bord praticien</p>
      </div>

      <!-- Stats -->
      <div class="grid grid-cols-2 sm:grid-cols-4 gap-4 mb-8">
        <div class="card text-center">
          <p class="text-3xl font-bold text-primary-600">{{ totalCount() }}</p>
          <p class="text-sm text-gray-500 mt-1">Total patients</p>
        </div>
        <div class="card text-center">
          <p class="text-3xl font-bold text-yellow-500">{{ pendingPaymentCount() }}</p>
          <p class="text-sm text-gray-500 mt-1">À valider</p>
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

      <!-- Accès rapides -->
      <div class="grid sm:grid-cols-2 gap-4 mb-8">
        <a routerLink="/appointments"
           class="card flex items-center gap-4 hover:shadow-md transition-shadow cursor-pointer">
          <div class="w-12 h-12 bg-primary-100 rounded-xl flex items-center justify-center flex-shrink-0">
            <svg class="w-6 h-6 text-primary-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2"
                    d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z"/>
            </svg>
          </div>
          <div>
            <p class="font-semibold text-gray-900">Mon planning</p>
            <p class="text-sm text-gray-500">Gérer les rendez-vous</p>
          </div>
        </a>
        <a routerLink="/profile"
           class="card flex items-center gap-4 hover:shadow-md transition-shadow cursor-pointer">
          <div class="w-12 h-12 bg-primary-100 rounded-xl flex items-center justify-center flex-shrink-0">
            <svg class="w-6 h-6 text-primary-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2"
                    d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z"/>
            </svg>
          </div>
          <div>
            <p class="font-semibold text-gray-900">Mon profil</p>
            <p class="text-sm text-gray-500">Infos Mobile Money & tarifs</p>
          </div>
        </a>
      </div>

      <!-- Rendez-vous nécessitant une action -->
      @if (pendingPaymentCount() > 0) {
        <div class="card border-l-4 border-yellow-400 mb-4">
          <div class="flex items-center gap-3 mb-4">
            <svg class="w-5 h-5 text-yellow-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2"
                    d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z"/>
            </svg>
            <h2 class="font-semibold text-yellow-800">
              {{ pendingPaymentCount() }} paiement(s) à valider
            </h2>
          </div>
          <div class="space-y-3">
            @for (appt of pendingPaymentAppointments(); track appt.id) {
              <div class="flex items-center justify-between gap-4 bg-yellow-50 rounded-lg p-3">
                <div>
                  <p class="font-medium text-gray-900 text-sm">
                    {{ appt.patientFirstName }} {{ appt.patientLastName }}
                  </p>
                  <div class="flex items-center gap-1.5 flex-wrap mt-0.5">
                    @if (appt.consultationType) {
                      <span class="text-xs font-semibold bg-yellow-200 text-yellow-900 px-2 py-0.5 rounded-full">
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
                          <span class="font-semibold block mb-1 text-gray-300">Note du patient</span>
                          {{ appt.reason }}
                        </span>
                      </span>
                    }
                  </div>
                  @if (appt.paymentReference) {
                    <p class="text-xs font-mono text-blue-700 mt-1">Réf: {{ appt.paymentReference }}</p>
                  }
                </div>
                <div class="flex gap-2">
                  <button (click)="validatePayment(appt.id)"
                          [disabled]="actionLoading() === appt.id"
                          class="btn-success text-xs px-3 py-1">
                    Valider
                  </button>
                  <button (click)="openRefuse(appt.id)"
                          [disabled]="actionLoading() === appt.id"
                          class="btn-danger text-xs px-3 py-1">
                    Refuser
                  </button>
                </div>
              </div>
            }
          </div>
        </div>
      }

      <!-- Planning du jour -->
      <div class="card">
        <h2 class="text-lg font-semibold text-gray-900 mb-4">Rendez-vous à venir</h2>
        @if (loading()) {
          <app-syli-spinner size="sm" [showLabel]="true" [centered]="true" />
        } @else if (upcomingAppointments().length === 0) {
          <p class="text-center text-gray-400 py-6">Aucun rendez-vous à venir</p>
        } @else {
          <div class="space-y-3">
            @for (appt of upcomingAppointments(); track appt.id) {
              <div class="flex items-center justify-between gap-4 p-3 bg-gray-50 rounded-lg">
                <div class="flex items-center gap-3">
                  <div class="w-9 h-9 bg-primary-100 rounded-lg flex items-center justify-center flex-shrink-0">
                    <span class="text-primary-700 font-semibold text-xs">
                      {{ appt.patientFirstName.charAt(0) }}{{ appt.patientLastName.charAt(0) }}
                    </span>
                  </div>
                  <div>
                    <p class="font-medium text-gray-900 text-sm">
                      {{ appt.patientFirstName }} {{ appt.patientLastName }}
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
                            <span class="font-semibold block mb-1 text-gray-300">Note du patient</span>
                            {{ appt.reason }}
                          </span>
                        </span>
                      }
                    </div>
                  </div>
                </div>
                <div class="flex items-center gap-2">
                  <span [class]="getStatusBadgeClass(appt.status)">{{ getStatusLabel(appt.status) }}</span>
                  @if (appt.status === 'CONFIRMED') {
                    <button (click)="goToReport(appt.id)"
                            class="btn-secondary text-xs px-2 py-1">
                      Compte rendu
                    </button>
                    <button (click)="markCompleted(appt.id)" [disabled]="actionLoading() === appt.id"
                            class="btn-primary text-xs px-2 py-1">
                      Marquer terminé
                    </button>
                  }
                </div>
              </div>
            }
          </div>
        }
        <div class="mt-4 pt-4 border-t border-gray-100">
          <a routerLink="/appointments" class="text-sm text-primary-600 font-medium hover:underline">
            Voir tout le planning →
          </a>
        </div>
      </div>

      <app-appointment-action-modal
        [visible]="refuseModalVisible()"
        mode="refuse"
        [loading]="actionLoading() !== null"
        (closed)="closeRefuseModal()"
        (confirmed)="confirmRefuse($event)" />
    </div>
  `,
})
export class PractitionerDashboardComponent implements OnInit {
  appointments = signal<AppointmentResponse[]>([]);
  loading = signal(true);
  actionLoading = signal<number | null>(null);

  totalCount = signal(0);
  pendingPaymentCount = signal(0);
  confirmedCount = signal(0);
  completedCount = signal(0);
  upcomingAppointments = signal<AppointmentResponse[]>([]);
  pendingPaymentAppointments = signal<AppointmentResponse[]>([]);
  refuseModalVisible = signal(false);
  private pendingRefuseId: number | null = null;

  constructor(
    public authService: AuthService,
    private appointmentService: AppointmentService,
    private router: Router
  ) {}

  ngOnInit(): void {
    this.loadAppointments();
  }

  loadAppointments(): void {
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
    this.totalCount.set(data.length);

    const pendingPayment = data.filter(a => a.status === 'PENDING_PAYMENT_VALIDATION');
    this.pendingPaymentCount.set(pendingPayment.length);
    this.pendingPaymentAppointments.set(pendingPayment);

    this.confirmedCount.set(data.filter(a => a.status === 'CONFIRMED').length);
    this.completedCount.set(data.filter(a => a.status === 'COMPLETED').length);

    const now = new Date();
    const upcoming = data
      .filter(a => parseLocalDateTime(a.appointmentDateTime) >= now &&
        (a.status === 'CONFIRMED' || a.status === 'PENDING_PAYMENT_VALIDATION'))
      .sort((a, b) => parseLocalDateTime(a.appointmentDateTime).getTime() - parseLocalDateTime(b.appointmentDateTime).getTime())
      .slice(0, 5);
    this.upcomingAppointments.set(upcoming);
  }

  validatePayment(appointmentId: number): void {
    this.actionLoading.set(appointmentId);
    this.appointmentService.validatePayment(appointmentId).subscribe({
      next: () => {
        this.actionLoading.set(null);
        this.loadAppointments();
      },
      error: () => this.actionLoading.set(null),
    });
  }

  goToReport(appointmentId: number): void {
    this.router.navigate(['/consultation-reports'], { queryParams: { appointmentId } });
  }

  markCompleted(appointmentId: number): void {
    this.actionLoading.set(appointmentId);
    this.appointmentService.markCompleted(appointmentId).subscribe({
      next: () => {
        this.actionLoading.set(null);
        this.loadAppointments();
      },
      error: () => this.actionLoading.set(null),
    });
  }

  openRefuse(id: number): void {
    this.pendingRefuseId = id;
    this.refuseModalVisible.set(true);
  }

  closeRefuseModal(): void {
    this.refuseModalVisible.set(false);
    this.pendingRefuseId = null;
  }

  confirmRefuse(reason: string): void {
    const id = this.pendingRefuseId;
    if (!id) return;
    this.actionLoading.set(id);
    this.appointmentService.refuseAppointment(id, { reason }).subscribe({
      next: () => {
        this.actionLoading.set(null);
        this.closeRefuseModal();
        this.loadAppointments();
      },
      error: () => this.actionLoading.set(null),
    });
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
      PENDING_PAYMENT_VALIDATION: `${base} bg-yellow-100 text-yellow-800`,
      CONFIRMED: `${base} bg-primary-100 text-sky-800`,
      COMPLETED: `${base} bg-blue-100 text-blue-800`,
    };
    return map[status] || `${base} bg-gray-100 text-gray-700`;
  }
}
