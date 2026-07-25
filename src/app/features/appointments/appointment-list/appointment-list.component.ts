import { Component, OnInit, signal } from '@angular/core';
import { RouterLink } from '@angular/router';
import { Router } from '@angular/router';
import { CommonModule } from '@angular/common';
import { AppointmentService } from '../../../core/services/appointment.service';
import { AuthService } from '../../../core/services/auth.service';
import { AppointmentResponse, AppointmentStatus, APPOINTMENT_STATUS_LABELS } from '../../../core/models/appointment.model';
import { formatLocalDateTime } from '../../../core/utils/date-utils';
import { SyliSpinnerComponent } from '../../../shared/components/syli-spinner/syli-spinner.component';
import { AppointmentActionModalComponent, AppointmentActionMode } from '../../../shared/components/appointment-action-modal/appointment-action-modal.component';

type ListTab = 'upcoming' | 'past' | 'cancelled';

@Component({
  selector: 'app-appointment-list',
  standalone: true,
  imports: [RouterLink, CommonModule, SyliSpinnerComponent, AppointmentActionModalComponent],
  template: `
    <div class="max-w-5xl mx-auto px-4 py-8">
      <div class="flex items-center justify-between mb-6">
        <div>
          <h1 class="text-2xl font-bold text-gray-900">
            {{ authService.isPatient() ? 'Mes rendez-vous' : 'Mon planning' }}
          </h1>
          <p class="text-gray-500 mt-1">
            {{ authService.isPatient() ? 'Gérez vos consultations' : 'Gérez vos rendez-vous patients' }}
          </p>
        </div>
        <div class="flex items-center gap-3">
          @if (authService.isPractitioner()) {
            <a routerLink="/calendar"
               class="btn-secondary text-sm flex items-center gap-1.5">
              <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2"
                      d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z"/>
              </svg>
              Vue Calendrier
            </a>
          }
          @if (authService.isPatient()) {
            <a routerLink="/appointments/book" class="btn-primary">
              + Nouveau RDV
            </a>
          }
        </div>
      </div>

      <!-- Onglets -->
      <div class="flex border-b border-gray-200 mb-6 gap-1 overflow-x-auto">
        <button (click)="setTab('upcoming')" [class]="tabClass('upcoming')">
          <svg class="w-4 h-4 mr-1.5 inline" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2"
                  d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z"/>
          </svg>
          À venir
          @if (upcoming().length > 0) {
            <span class="ml-1.5 bg-primary-100 text-primary-700 text-xs font-semibold px-1.5 py-0.5 rounded-full">
              {{ upcoming().length }}
            </span>
          }
        </button>
        <button (click)="setTab('past')" [class]="tabClass('past')">
          <svg class="w-4 h-4 mr-1.5 inline" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2"
                  d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"/>
          </svg>
          Historique
        </button>
        <button (click)="setTab('cancelled')" [class]="tabClass('cancelled')">
          <svg class="w-4 h-4 mr-1.5 inline" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M6 18L18 6M6 6l12 12"/>
          </svg>
          Annulés / Refusés
          @if (cancelled().length > 0) {
            <span class="ml-1.5 bg-red-100 text-red-700 text-xs font-semibold px-1.5 py-0.5 rounded-full">
              {{ cancelled().length }}
            </span>
          }
        </button>
      </div>

      @if (loading()) {
        <app-syli-spinner size="md" [showLabel]="true" [centered]="true" />
      } @else if (visibleAppointments().length === 0) {
        <div class="card text-center py-16">
          <svg class="w-16 h-16 text-gray-300 mx-auto mb-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="1.5"
                  d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z"/>
          </svg>
          @if (activeTab() === 'upcoming') {
            <p class="text-gray-500 font-medium">Aucun rendez-vous à venir</p>
            @if (authService.isPatient()) {
              <a routerLink="/appointments/book" class="btn-primary mt-4 inline-block">Prendre un RDV</a>
            }
          } @else if (activeTab() === 'past') {
            <p class="text-gray-500 font-medium">Aucun historique de consultation</p>
          } @else {
            <p class="text-gray-500 font-medium">Aucun rendez-vous annulé ou refusé</p>
          }
        </div>
      } @else {
        <div class="space-y-4">
          @for (appt of visibleAppointments(); track appt.id) {
            <div class="card hover:shadow-md transition-shadow">
              <div class="flex flex-col sm:flex-row sm:items-center gap-4">
                <div class="flex-1">
                  <div class="flex items-start justify-between gap-3">
                    <div>
                      <p class="font-semibold text-gray-900">
                        @if (authService.isPatient()) {
                          Dr. {{ appt.practitionerFirstName }} {{ appt.practitionerLastName }}
                        } @else {
                          {{ appt.patientFirstName }} {{ appt.patientLastName }}
                        }
                      </p>
                      <div class="flex items-center gap-2 flex-wrap mt-0.5">
                        @if (appt.consultationType) {
                          <span class="inline-flex items-center gap-1 text-xs font-semibold
                                       bg-primary-100 text-primary-800 px-2 py-0.5 rounded-full">
                            <svg class="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2"
                                    d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2"/>
                            </svg>
                            {{ appt.consultationType }}
                          </span>
                        }
                        @if (appt.reason) {
                          <span class="relative group cursor-help">
                            <svg class="w-4 h-4 text-gray-400 hover:text-gray-600 transition-colors"
                                 fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2"
                                    d="M8.228 9c.549-1.165 2.03-2 3.772-2 2.21 0 4 1.343 4 3 0 1.4-1.278 2.575-3.006 2.907-.542.104-.994.54-.994 1.093m0 3h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"/>
                            </svg>
                            <span class="absolute left-5 -top-1 z-20 hidden group-hover:block
                                         bg-gray-900 text-white text-xs rounded-lg px-3 py-2
                                         w-56 shadow-xl whitespace-pre-wrap leading-relaxed pointer-events-none">
                              <span class="font-semibold block mb-1 text-gray-300">Note du patient</span>
                              {{ appt.reason }}
                            </span>
                          </span>
                        }
                        <span class="text-xs text-gray-500">{{ formatDate(appt.appointmentDateTime) }}</span>
                      </div>
                    </div>
                    <span [class]="getStatusBadgeClass(appt.status)">
                      {{ getStatusLabel(appt.status) }}
                    </span>
                  </div>

                  <div class="flex flex-wrap gap-2 mt-3">
                    @if (appt.cancellationReason && (appt.status === 'CANCELED' || appt.status === 'REFUSED')) {
                      <div class="w-full text-xs bg-red-50 border border-red-100 text-red-800 rounded-lg px-3 py-2">
                        <span class="font-semibold">{{ cancellationReasonLabel(appt.status) }} :</span>
                        {{ appt.cancellationReason }}
                        @if (appt.cancelledBy) {
                          <span class="text-red-600/70"> — par {{ cancelledByLabel(appt.cancelledBy) }}</span>
                        }
                      </div>
                    }
                    @if (appt.amountPaid) {
                      <span class="text-xs bg-gray-100 text-gray-600 px-2 py-1 rounded-full">
                        💰 {{ appt.amountPaid | number:'1.0-0' }} GNF
                      </span>
                    }
                    @if (appt.paymentReference) {
                      <span class="text-xs bg-blue-100 text-blue-700 px-2 py-1 rounded-full font-mono">
                        Réf: {{ appt.paymentReference }}
                      </span>
                    }
                    @if (appt.paymentStatus === 'VALIDATED') {
                      <span class="text-xs bg-primary-100 text-sky-700 px-2 py-1 rounded-full">
                        ✓ Paiement validé
                      </span>
                    }
                  </div>
                </div>

                <!-- Actions selon rôle et statut -->
                <div class="flex gap-2 flex-shrink-0 flex-wrap">
                  @if (authService.isPractitioner() && appt.status === 'PENDING_PAYMENT_VALIDATION') {
                    <button (click)="validatePayment(appt.id)" [disabled]="actionLoading() === appt.id"
                            class="btn-success text-sm">
                      ✓ Valider paiement
                    </button>
                    <button (click)="openRefuse(appt.id)" [disabled]="actionLoading() === appt.id"
                            class="btn-danger text-sm">
                      Refuser
                    </button>
                  }

                  @if (authService.isPractitioner() && appt.status === 'REQUESTED') {
                    <button (click)="openRefuse(appt.id)" [disabled]="actionLoading() === appt.id"
                            class="btn-danger text-sm">
                      Refuser
                    </button>
                  }

                  @if (authService.isPractitioner() && appt.status === 'CONFIRMED') {
                    <button (click)="goToReport(appt.id)"
                            [disabled]="actionLoading() === appt.id"
                            class="btn-secondary text-sm">
                      Compte rendu
                    </button>
                    <button (click)="markCompleted(appt.id)" [disabled]="actionLoading() === appt.id"
                            class="btn-primary text-sm">
                      Marquer terminé
                    </button>
                    <button (click)="openCancel(appt.id)" [disabled]="actionLoading() === appt.id"
                            class="btn-danger text-sm">
                      Annuler
                    </button>
                  }

                  @if (authService.isPatient() && canPatientCancel(appt.status)) {
                    <button (click)="openCancel(appt.id)" [disabled]="actionLoading() === appt.id"
                            class="btn-secondary text-sm text-red-600">
                      Annuler
                    </button>
                  }

                  @if (authService.isPatient() && appt.status === 'REQUESTED' && !appt.paymentReference) {
                    <a [routerLink]="['/appointments/book']"
                       class="btn-primary text-sm">
                      Soumettre paiement
                    </a>
                  }
                </div>
              </div>
            </div>
          }
        </div>
      }

      <app-appointment-action-modal
        [visible]="actionModalVisible()"
        [mode]="actionModalMode()"
        [loading]="actionLoading() !== null"
        (closed)="closeActionModal()"
        (confirmed)="confirmAction($event)" />
    </div>
  `,
})
export class AppointmentListComponent implements OnInit {
  upcoming      = signal<AppointmentResponse[]>([]);
  past          = signal<AppointmentResponse[]>([]);
  cancelled     = signal<AppointmentResponse[]>([]);
  loading       = signal(true);
  actionLoading = signal<number | null>(null);
  activeTab     = signal<ListTab>('upcoming');
  actionModalVisible = signal(false);
  actionModalMode    = signal<AppointmentActionMode>('cancel');
  private pendingActionId: number | null = null;

  constructor(
    public authService: AuthService,
    private appointmentService: AppointmentService,
    private router: Router
  ) {}

  ngOnInit(): void {
    this.loadAppointments();
  }

  loadAppointments(): void {
    this.loading.set(true);
    this.appointmentService.getUpcoming().subscribe({
      next: (data) => { this.upcoming.set(data); this.loading.set(false); },
      error: () => this.loading.set(false),
    });
    this.appointmentService.getPast().subscribe({
      next: (data) => this.past.set(data),
    });
    this.appointmentService.getCancelled().subscribe({
      next: (data) => this.cancelled.set(data),
    });
  }

  visibleAppointments(): AppointmentResponse[] {
    if (this.activeTab() === 'upcoming') return this.upcoming();
    if (this.activeTab() === 'past') return this.past();
    return this.cancelled();
  }

  setTab(tab: ListTab): void {
    this.activeTab.set(tab);
  }

  tabClass(tab: ListTab): string {
    const base = 'px-4 py-2.5 text-sm font-medium border-b-2 transition-colors flex items-center -mb-px';
    return this.activeTab() === tab
      ? `${base} border-primary-600 text-primary-600`
      : `${base} border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300`;
  }

  validatePayment(appointmentId: number): void {
    this.actionLoading.set(appointmentId);
    this.appointmentService.validatePayment(appointmentId).subscribe({
      next: () => { this.loadAppointments(); this.actionLoading.set(null); },
      error: () => this.actionLoading.set(null),
    });
  }

  goToReport(appointmentId: number): void {
    this.router.navigate(['/consultation-reports'], { queryParams: { appointmentId } });
  }

  markCompleted(appointmentId: number): void {
    this.actionLoading.set(appointmentId);
    this.appointmentService.markCompleted(appointmentId).subscribe({
      next: () => { this.loadAppointments(); this.actionLoading.set(null); },
      error: () => this.actionLoading.set(null),
    });
  }

  openCancel(id: number): void {
    this.pendingActionId = id;
    this.actionModalMode.set('cancel');
    this.actionModalVisible.set(true);
  }

  openRefuse(id: number): void {
    this.pendingActionId = id;
    this.actionModalMode.set('refuse');
    this.actionModalVisible.set(true);
  }

  closeActionModal(): void {
    this.actionModalVisible.set(false);
    this.pendingActionId = null;
  }

  confirmAction(reason: string): void {
    const id = this.pendingActionId;
    if (!id) return;
    this.actionLoading.set(id);
    const req = { reason };
    const obs = this.actionModalMode() === 'refuse'
      ? this.appointmentService.refuseAppointment(id, req)
      : this.appointmentService.cancelAppointment(id, req);
    obs.subscribe({
      next: () => {
        this.actionLoading.set(null);
        this.closeActionModal();
        this.loadAppointments();
      },
      error: () => this.actionLoading.set(null),
    });
  }

  canPatientCancel(status: AppointmentStatus): boolean {
    return status === 'REQUESTED'
      || status === 'PENDING_PAYMENT_VALIDATION'
      || status === 'CONFIRMED';
  }

  cancelledByLabel(by: string): string {
    return by === 'PATIENT' ? 'le patient' : 'le praticien';
  }

  cancellationReasonLabel(status: AppointmentStatus): string {
    return status === 'REFUSED' ? 'Motif du refus' : 'Motif de l\'annulation';
  }

  formatDate(dateStr: string): string {
    return formatLocalDateTime(dateStr);
  }

  getStatusLabel(status: AppointmentStatus): string {
    return APPOINTMENT_STATUS_LABELS[status] || status;
  }

  getStatusBadgeClass(status: AppointmentStatus): string {
    const base = 'inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium whitespace-nowrap';
    const classes: Partial<Record<AppointmentStatus, string>> = {
      REQUESTED: `${base} bg-gray-100 text-gray-800`,
      PENDING_PAYMENT_VALIDATION: `${base} bg-yellow-100 text-yellow-800`,
      CONFIRMED: `${base} bg-primary-100 text-sky-800`,
      REFUSED: `${base} bg-red-100 text-red-800`,
      CANCELED: `${base} bg-red-100 text-red-800 line-through`,
      COMPLETED: `${base} bg-blue-100 text-blue-800`,
      NO_SHOW: `${base} bg-orange-100 text-orange-800`,
    };
    return classes[status] || base;
  }
}
