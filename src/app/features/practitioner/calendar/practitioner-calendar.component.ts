import { Component, OnInit, signal, computed } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterLink } from '@angular/router';
import { Router } from '@angular/router';
import { AppointmentService } from '../../../core/services/appointment.service';
import { AppointmentResponse, AppointmentStatus, APPOINTMENT_STATUS_LABELS } from '../../../core/models/appointment.model';
import { formatLocalDateTime, parseLocalDateTime } from '../../../core/utils/date-utils';
import { SyliSpinnerComponent } from '../../../shared/components/syli-spinner/syli-spinner.component';
import { UserProfileModalComponent } from '../../../shared/components/user-profile-modal/user-profile-modal.component';

type CalendarView = 'day' | 'week' | 'month';

interface CalendarDay {
  date: Date;
  isCurrentMonth: boolean;
  isToday: boolean;
  appointments: AppointmentResponse[];
}

@Component({
  selector: 'app-practitioner-calendar',
  standalone: true,
  imports: [  CommonModule, RouterLink, SyliSpinnerComponent, UserProfileModalComponent],
  template: `
    <div class="max-w-7xl mx-auto px-4 py-6">

      <!-- En-tête -->
      <div class="flex items-center justify-between mb-6 flex-wrap gap-3">
        <div>
          <h1 class="text-2xl font-bold text-gray-900">Calendrier</h1>
          <p class="text-gray-500 text-sm mt-0.5">Vue interactive de vos rendez-vous</p>
        </div>
        <div class="flex items-center gap-3 flex-wrap">
          <!-- Bascule Jour / Semaine / Mois -->
          <div class="flex bg-gray-100 rounded-xl p-1 gap-0.5">
            @for (v of views; track v.id) {
              <button (click)="setView(v.id)"
                      [class]="viewBtnClass(v.id)">
                {{ v.label }}
              </button>
            }
          </div>
          <!-- Navigation -->
          <div class="flex items-center gap-1">
            <button (click)="navigatePrev()" class="p-2 rounded-lg hover:bg-gray-100 transition-colors">
              <svg class="w-5 h-5 text-gray-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M15 19l-7-7 7-7"/>
              </svg>
            </button>
            <button (click)="goToToday()"
                    class="px-3 py-1.5 text-sm font-medium text-primary-700 hover:bg-primary-50 rounded-lg transition-colors">
              Aujourd'hui
            </button>
            <button (click)="navigateNext()" class="p-2 rounded-lg hover:bg-gray-100 transition-colors">
              <svg class="w-5 h-5 text-gray-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 5l7 7-7 7"/>
              </svg>
            </button>
          </div>
          <!-- Titre période -->
          <span class="text-base font-semibold text-gray-800">{{ periodLabel() }}</span>
        </div>
      </div>

      <!-- Légende -->
      <div class="flex items-center gap-4 mb-4 flex-wrap">
        <div class="flex items-center gap-1.5">
          <span class="w-3 h-3 rounded-full bg-sky-500"></span>
          <span class="text-xs text-gray-600">Confirmé</span>
        </div>
        <div class="flex items-center gap-1.5">
          <span class="w-3 h-3 rounded-full bg-amber-400"></span>
          <span class="text-xs text-gray-600">En attente</span>
        </div>
        <div class="flex items-center gap-1.5">
          <span class="w-3 h-3 rounded-full bg-blue-500"></span>
          <span class="text-xs text-gray-600">Terminé</span>
        </div>
        <div class="flex items-center gap-1.5">
          <span class="w-3 h-3 rounded-full bg-red-400"></span>
          <span class="text-xs text-gray-600">Annulé</span>
        </div>
        <div class="flex items-center gap-1.5">
          <span class="w-3 h-3 rounded-full bg-red-300 opacity-70"></span>
          <span class="text-xs text-gray-600">Refusé</span>
        </div>
      </div>

      @if (loading()) {
        <app-syli-spinner size="lg" [showLabel]="true" [centered]="true" />
      }

      <!-- ══════════ VUE MOIS ══════════ -->
      @if (!loading() && currentView() === 'month') {
        <div class="bg-white rounded-2xl border border-gray-200 overflow-hidden shadow-sm">
          <!-- Jours de la semaine -->
          <div class="grid grid-cols-7 border-b border-gray-200">
            @for (d of dayNames; track d) {
              <div class="py-2 text-center text-xs font-semibold text-gray-500 uppercase tracking-wide">{{ d }}</div>
            }
          </div>
          <!-- Grille jours -->
          <div class="grid grid-cols-7 divide-x divide-y divide-gray-100">
            @for (day of monthDays(); track day.date.toISOString()) {
              <div (click)="drillIntoDay(day.date)"
                   class="min-h-[100px] p-2 cursor-pointer hover:bg-gray-50 transition-colors"
                   [class.bg-gray-50]="!day.isCurrentMonth"
                   [class.ring-2]="day.isToday"
                   [class.ring-inset]="day.isToday"
                   [class.ring-primary-400]="day.isToday">
                <p class="text-xs font-medium mb-1"
                   [class.text-primary-600]="day.isToday"
                   [class.font-bold]="day.isToday"
                   [class.text-gray-300]="!day.isCurrentMonth"
                   [class.text-gray-800]="day.isCurrentMonth && !day.isToday">
                  {{ day.date.getDate() }}
                </p>
                <div class="space-y-0.5">
                  @for (appt of day.appointments.slice(0, 3); track appt.id) {
                    <div (click)="openModal(appt); $event.stopPropagation()"
                         [class]="apptPillClass(appt.status)"
                         [title]="hoverTitle(appt)"
                         class="text-xs rounded px-1.5 py-0.5 truncate cursor-pointer hover:opacity-90">
                      {{ timeOf(appt.appointmentDateTime) }} {{ appt.patientFirstName }}
                    </div>
                  }
                  @if (day.appointments.length > 3) {
                    <p class="text-xs text-gray-400">+{{ day.appointments.length - 3 }} autres</p>
                  }
                </div>
              </div>
            }
          </div>
        </div>
      }

      <!-- ══════════ VUE SEMAINE ══════════ -->
      @if (!loading() && currentView() === 'week') {
        <div class="bg-white rounded-2xl border border-gray-200 overflow-hidden shadow-sm">
          <!-- En-têtes jours -->
          <div class="grid grid-cols-7 border-b border-gray-200">
            @for (day of weekDays(); track day.date.toISOString()) {
              <div class="py-3 text-center"
                   [class.bg-primary-50]="day.isToday">
                <p class="text-xs text-gray-500 uppercase">{{ shortDayName(day.date) }}</p>
                <p class="text-lg font-semibold mt-0.5"
                   [class.text-primary-600]="day.isToday"
                   [class.text-gray-800]="!day.isToday">
                  {{ day.date.getDate() }}
                </p>
                @if (day.appointments.length > 0) {
                  <span class="text-xs bg-primary-100 text-primary-700 rounded-full px-1.5 py-0.5 font-medium">
                    {{ day.appointments.length }}
                  </span>
                }
              </div>
            }
          </div>
          <!-- Contenu par jour -->
          <div class="grid grid-cols-7 divide-x divide-gray-100 min-h-[400px]">
            @for (day of weekDays(); track day.date.toISOString()) {
              <div [class]="'p-2 space-y-1.5' + (day.isToday ? ' bg-blue-50' : '')">
                @for (appt of day.appointments; track appt.id) {
                  <div (click)="openModal(appt)"
                       [class]="apptCardClass(appt.status) + ' rounded-lg p-2 cursor-pointer hover:opacity-90 transition-opacity'"
                       [title]="hoverTitle(appt)">
                    <p class="text-xs font-semibold">{{ timeOf(appt.appointmentDateTime) }}</p>
                    <p class="text-xs truncate">{{ appt.patientFirstName }} {{ appt.patientLastName }}</p>
                    @if (appt.consultationType) {
                      <p class="text-xs opacity-75 truncate">{{ appt.consultationType }}</p>
                    }
                  </div>
                }
                @if (day.appointments.length === 0) {
                  <p class="text-xs text-gray-300 text-center pt-4">-</p>
                }
              </div>
            }
          </div>
        </div>
      }

      <!-- ══════════ VUE JOUR ══════════ -->
      @if (!loading() && currentView() === 'day') {
        <div class="bg-white rounded-2xl border border-gray-200 shadow-sm overflow-hidden">
          <div class="px-6 py-4 border-b border-gray-200 bg-gray-50">
            <p class="font-semibold text-gray-800 text-base">
              {{ formatDayFull(currentDate()) }}
            </p>
            <p class="text-sm text-gray-500 mt-0.5">
              {{ dayAppointments().length }} rendez-vous
            </p>
          </div>
          @if (dayAppointments().length === 0) {
            <div class="flex flex-col items-center py-16 text-gray-400">
              <svg class="w-12 h-12 mb-3 text-gray-200" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="1.5"
                      d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z"/>
              </svg>
              <p class="font-medium">Aucun rendez-vous ce jour</p>
            </div>
          }
          <div class="divide-y divide-gray-100">
            @for (appt of dayAppointments(); track appt.id) {
              <div (click)="openModal(appt)"
                   [title]="hoverTitle(appt)"
                   class="flex items-center gap-4 px-6 py-4 hover:bg-gray-50 cursor-pointer transition-colors group">
                <!-- Heure -->
                <div class="w-16 flex-shrink-0 text-center">
                  <p class="text-lg font-bold text-gray-800">{{ timeOf(appt.appointmentDateTime) }}</p>
                </div>
                <!-- Barre couleur -->
                <div class="w-1 h-12 rounded-full flex-shrink-0" [class]="statusBarClass(appt.status)"></div>
                <!-- Infos -->
                <div class="flex-1 min-w-0">
                  <p class="font-semibold text-gray-900">
                    {{ appt.patientFirstName }} {{ appt.patientLastName }}
                  </p>
                  <div class="flex items-center gap-2 mt-0.5">
                    @if (appt.consultationType) {
                      <span class="text-xs text-primary-700 bg-primary-50 px-2 py-0.5 rounded-full">
                        {{ appt.consultationType }}
                      </span>
                    }
                    <span [class]="getStatusBadgeClass(appt.status)" class="text-xs">
                      {{ getStatusLabel(appt.status) }}
                    </span>
                  </div>
                </div>
                <svg class="w-5 h-5 text-gray-300 group-hover:text-gray-500 transition-colors flex-shrink-0"
                     fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 5l7 7-7 7"/>
                </svg>
              </div>
            }
          </div>
        </div>
      }

      <!-- ══════════ MODAL DÉTAIL RDV ══════════ -->
      @if (modalAppointment()) {
        <div class="fixed inset-0 z-50 flex items-center justify-center p-4"
             (click)="closeModal()">
          <div class="absolute inset-0 bg-black/40 backdrop-blur-sm"></div>
          <div class="relative bg-white rounded-2xl shadow-2xl w-full max-w-md"
               (click)="$event.stopPropagation()">

            <!-- En-tête coloré -->
            <div class="rounded-t-2xl px-6 py-4 flex items-center justify-between"
                 [class]="modalHeaderBg(modalAppointment()!.status)">
              <div>
                <button type="button"
                        (click)="openPatientProfile(modalAppointment()!.patientId)"
                        class="font-bold text-white text-lg hover:underline text-left">
                  {{ modalAppointment()!.patientFirstName }} {{ modalAppointment()!.patientLastName }}
                </button>
                <p class="text-white/80 text-sm">{{ formatLocalDateTime(modalAppointment()!.appointmentDateTime) }}</p>
              </div>
              <button (click)="closeModal()"
                      class="text-white/70 hover:text-white transition-colors">
                <svg class="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M6 18L18 6M6 6l12 12"/>
                </svg>
              </button>
            </div>

            <!-- Corps -->
            <div class="px-6 py-5 space-y-4">
              <!-- Statut -->
              <div class="flex items-center justify-between">
                <span class="text-sm text-gray-500">Statut</span>
                <span [class]="getStatusBadgeClass(modalAppointment()!.status)" class="text-xs font-semibold">
                  {{ getStatusLabel(modalAppointment()!.status) }}
                </span>
              </div>

              @if (modalAppointment()!.consultationType) {
                <div class="flex items-center justify-between">
                  <span class="text-sm text-gray-500">Type de consultation</span>
                  <span class="text-sm font-medium text-primary-700">{{ modalAppointment()!.consultationType }}</span>
                </div>
              }

              @if (modalAppointment()!.reason) {
                <div>
                  <p class="text-sm text-gray-500 mb-1">Note du patient</p>
                  <p class="text-sm text-gray-800 bg-gray-50 rounded-lg px-3 py-2 whitespace-pre-wrap">
                    {{ modalAppointment()!.reason }}
                  </p>
                </div>
              }

              @if (modalAppointment()!.cancellationReason) {
                <div>
                  <p class="text-sm text-gray-500 mb-1">
                    {{ cancellationReasonLabel(modalAppointment()!.status) }}
                  </p>
                  <p class="text-sm text-red-800 bg-red-50 rounded-lg px-3 py-2 whitespace-pre-wrap">
                    {{ modalAppointment()!.cancellationReason }}
                  </p>
                </div>
              }

              @if (modalAppointment()!.paymentReference) {
                <div class="flex items-center justify-between">
                  <span class="text-sm text-gray-500">Référence paiement</span>
                  <span class="text-sm font-mono font-medium text-gray-800 bg-gray-100 px-2 py-0.5 rounded">
                    {{ modalAppointment()!.paymentReference }}
                  </span>
                </div>
              }

              @if (modalAppointment()!.amountPaid) {
                <div class="flex items-center justify-between">
                  <span class="text-sm text-gray-500">Montant</span>
                  <span class="text-sm font-semibold text-gray-800">
                    {{ modalAppointment()!.amountPaid | number:'1.0-0' }} GNF
                  </span>
                </div>
              }
            </div>

            <!-- Actions -->
            <div class="px-6 pb-5 flex flex-wrap gap-3">
              <button type="button" (click)="openPatientProfile(modalAppointment()!.patientId)"
                      class="btn-secondary flex-1 text-sm min-w-[140px]">
                Fiche patient
              </button>
              @if (modalAppointment()!.status === 'CONFIRMED') {
                <button (click)="goToReport(modalAppointment()!.id)"
                        class="btn-secondary flex-1 text-sm">
                  Compte rendu
                </button>
              }
              @if (modalAppointment()!.status === 'PENDING_PAYMENT_VALIDATION') {
                <button (click)="validatePaymentFromModal()" [disabled]="actionLoading()"
                        class="btn-success flex-1 text-sm">
                  Valider paiement
                </button>
              }
              <button (click)="closeModal()" class="btn-secondary text-sm">Fermer</button>
            </div>
          </div>
        </div>
      }

      <app-user-profile-modal
        [visible]="profileModalVisible()"
        mode="patient"
        [userId]="profileModalUserId()"
        (closed)="closeProfileModal()" />

    </div>
  `,
})
export class PractitionerCalendarComponent implements OnInit {
  currentView    = signal<CalendarView>('week');
  currentDate    = signal<Date>(new Date());
  appointments   = signal<AppointmentResponse[]>([]);
  loading        = signal(true);
  modalAppointment = signal<AppointmentResponse | null>(null);
  actionLoading  = signal(false);
  profileModalVisible = signal(false);
  profileModalUserId = signal<number | null>(null);

  readonly views = [
    { id: 'day'   as CalendarView, label: 'Jour'    },
    { id: 'week'  as CalendarView, label: 'Semaine' },
    { id: 'month' as CalendarView, label: 'Mois'    },
  ];

  readonly dayNames = ['Lun', 'Mar', 'Mer', 'Jeu', 'Ven', 'Sam', 'Dim'];

  constructor(
    private appointmentService: AppointmentService,
    private router: Router,
  ) {}

  ngOnInit(): void {
    this.loadAppointments();
  }

  setView(v: CalendarView): void {
    this.currentView.set(v);
    this.loadAppointments();
  }

  drillIntoDay(date: Date): void {
    this.currentDate.set(new Date(date));
    this.currentView.set('day');
  }

  navigatePrev(): void {
    const d = new Date(this.currentDate());
    if (this.currentView() === 'day')   d.setDate(d.getDate() - 1);
    if (this.currentView() === 'week')  d.setDate(d.getDate() - 7);
    if (this.currentView() === 'month') d.setMonth(d.getMonth() - 1);
    this.currentDate.set(d);
    this.loadAppointments();
  }

  navigateNext(): void {
    const d = new Date(this.currentDate());
    if (this.currentView() === 'day')   d.setDate(d.getDate() + 1);
    if (this.currentView() === 'week')  d.setDate(d.getDate() + 7);
    if (this.currentView() === 'month') d.setMonth(d.getMonth() + 1);
    this.currentDate.set(d);
    this.loadAppointments();
  }

  goToToday(): void {
    this.currentDate.set(new Date());
    this.loadAppointments();
  }

  loadAppointments(): void {
    this.loading.set(true);
    const { from, to } = this.dateRange();
    const fmt = (d: Date) => `${d.getFullYear()}-${pad(d.getMonth()+1)}-${pad(d.getDate())}T00:00:00`;
    const fmtEnd = (d: Date) => `${d.getFullYear()}-${pad(d.getMonth()+1)}-${pad(d.getDate())}T23:59:59`;
    this.appointmentService.getCalendar(fmt(from), fmtEnd(to)).subscribe({
      next: (data) => { this.appointments.set(data); this.loading.set(false); },
      error: () => this.loading.set(false),
    });
  }

  private dateRange(): { from: Date; to: Date } {
    const d = this.currentDate();
    if (this.currentView() === 'day') {
      return { from: startOfDay(d), to: startOfDay(d) };
    }
    if (this.currentView() === 'week') {
      const from = startOfWeek(d);
      const to = new Date(from); to.setDate(to.getDate() + 6);
      return { from, to };
    }
    const from = new Date(d.getFullYear(), d.getMonth(), 1);
    const to   = new Date(d.getFullYear(), d.getMonth() + 1, 0);
    return { from, to };
  }

  periodLabel(): string {
    const d = this.currentDate();
    const months = ['Janvier','Février','Mars','Avril','Mai','Juin',
                    'Juillet','Août','Septembre','Octobre','Novembre','Décembre'];
    if (this.currentView() === 'day')   return this.formatDayFull(d);
    if (this.currentView() === 'month') return `${months[d.getMonth()]} ${d.getFullYear()}`;
    const from = startOfWeek(d);
    const to   = new Date(from); to.setDate(to.getDate() + 6);
    return `${from.getDate()} – ${to.getDate()} ${months[to.getMonth()]} ${to.getFullYear()}`;
  }

  monthDays(): CalendarDay[] {
    const d = this.currentDate();
    const firstDay = new Date(d.getFullYear(), d.getMonth(), 1);
    const lastDay  = new Date(d.getFullYear(), d.getMonth() + 1, 0);

    const start = startOfWeek(firstDay);
    const end   = new Date(lastDay);
    const dow   = lastDay.getDay();
    end.setDate(lastDay.getDate() + (dow === 0 ? 0 : 7 - dow));

    const days: CalendarDay[] = [];
    const cursor = new Date(start);
    while (cursor <= end) {
      const date = new Date(cursor);
      days.push({
        date,
        isCurrentMonth: date.getMonth() === d.getMonth(),
        isToday: isSameDay(date, new Date()),
        appointments: this.appointmentsForDay(date),
      });
      cursor.setDate(cursor.getDate() + 1);
    }
    return days;
  }

  weekDays(): CalendarDay[] {
    const from = startOfWeek(this.currentDate());
    return Array.from({ length: 7 }, (_, i) => {
      const date = new Date(from); date.setDate(date.getDate() + i);
      return {
        date,
        isCurrentMonth: true,
        isToday: isSameDay(date, new Date()),
        appointments: this.appointmentsForDay(date),
      };
    });
  }

  dayAppointments(): AppointmentResponse[] {
    return this.appointmentsForDay(this.currentDate());
  }

  private appointmentsForDay(date: Date): AppointmentResponse[] {
    return this.appointments().filter(a => {
      const d = parseLocalDateTime(a.appointmentDateTime);
      return isSameDay(d, date);
    });
  }

  openModal(appt: AppointmentResponse): void  { this.modalAppointment.set(appt); }
  closeModal(): void { this.modalAppointment.set(null); }

  goToReport(id: number): void {
    this.closeModal();
    this.router.navigate(['/consultation-reports'], { queryParams: { appointmentId: id } });
  }

  validatePaymentFromModal(): void {
    const appt = this.modalAppointment();
    if (!appt) return;
    this.actionLoading.set(true);
    this.appointmentService.validatePayment(appt.id).subscribe({
      next: (updated) => {
        this.appointments.update(list => list.map(a => a.id === updated.id ? updated : a));
        this.modalAppointment.set(updated);
        this.actionLoading.set(false);
      },
      error: () => this.actionLoading.set(false),
    });
  }

  timeOf(dateStr: string): string {
    const dt = parseLocalDateTime(dateStr);
    return `${pad(dt.getHours())}:${pad(dt.getMinutes())}`;
  }

  formatDayFull(d: Date): string {
    const days   = ['Dimanche','Lundi','Mardi','Mercredi','Jeudi','Vendredi','Samedi'];
    const months = ['janvier','février','mars','avril','mai','juin',
                    'juillet','août','septembre','octobre','novembre','décembre'];
    return `${days[d.getDay()]} ${d.getDate()} ${months[d.getMonth()]} ${d.getFullYear()}`;
  }

  shortDayName(d: Date): string {
    return ['Dim','Lun','Mar','Mer','Jeu','Ven','Sam'][d.getDay()];
  }

  formatLocalDateTime(s: string): string { return formatLocalDateTime(s); }

  viewBtnClass(v: CalendarView): string {
    const base = 'px-3 py-1.5 rounded-lg text-sm font-medium transition-colors';
    return this.currentView() === v
      ? `${base} bg-white text-primary-700 shadow-sm`
      : `${base} text-gray-600 hover:text-gray-800`;
  }

  hoverTitle(appt: AppointmentResponse): string {
    if (appt.cancellationReason && (appt.status === 'CANCELED' || appt.status === 'REFUSED')) {
      const kind = appt.status === 'REFUSED' ? 'Refus' : 'Annulation';
      return `${kind} — ${appt.cancellationReason}`;
    }
    return `${appt.patientFirstName} ${appt.patientLastName} (${this.getStatusLabel(appt.status)})`;
  }

  apptPillClass(status: AppointmentStatus): string {
    const map: Partial<Record<AppointmentStatus, string>> = {
      CONFIRMED: 'bg-primary-100 text-sky-800',
      REQUESTED: 'bg-amber-100 text-amber-800',
      PENDING_PAYMENT_VALIDATION: 'bg-amber-100 text-amber-800',
      COMPLETED: 'bg-blue-100 text-blue-800',
      REFUSED: 'bg-red-50 text-red-700 line-through opacity-75',
      CANCELED: 'bg-red-100 text-red-800 line-through opacity-75',
      NO_SHOW:   'bg-red-100 text-red-800',
      IMPACTED_BY_CHANGE: 'bg-orange-100 text-orange-800',
    };
    return map[status] || 'bg-gray-100 text-gray-800';
  }

  apptCardClass(status: AppointmentStatus): string {
    const map: Partial<Record<AppointmentStatus, string>> = {
      CONFIRMED: 'bg-sky-50 border border-sky-200 text-sky-900',
      REQUESTED: 'bg-amber-50 border border-amber-200 text-amber-900',
      PENDING_PAYMENT_VALIDATION: 'bg-amber-50 border border-amber-200 text-amber-900',
      COMPLETED: 'bg-blue-50 border border-blue-200 text-blue-900',
      REFUSED: 'bg-red-50 border border-red-200 text-red-800 line-through opacity-80',
      CANCELED:  'bg-red-50 border border-red-200 text-red-900 line-through opacity-80',
      NO_SHOW:   'bg-red-50 border border-red-200 text-red-900',
      IMPACTED_BY_CHANGE: 'bg-orange-50 border border-orange-200 text-orange-900',
    };
    return map[status] || 'bg-gray-50 border border-gray-200 text-gray-900';
  }

  statusBarClass(status: AppointmentStatus): string {
    const map: Partial<Record<AppointmentStatus, string>> = {
      CONFIRMED: 'bg-sky-500',
      REQUESTED: 'bg-amber-400',
      PENDING_PAYMENT_VALIDATION: 'bg-amber-400',
      COMPLETED: 'bg-blue-500',
      REFUSED: 'bg-red-300',
      CANCELED:  'bg-red-400',
      NO_SHOW:   'bg-red-400',
      IMPACTED_BY_CHANGE: 'bg-orange-400',
    };
    return map[status] || 'bg-gray-400';
  }

  modalHeaderBg(status: AppointmentStatus): string {
    const map: Partial<Record<AppointmentStatus, string>> = {
      CONFIRMED: 'bg-primary-600',
      REQUESTED: 'bg-amber-500',
      PENDING_PAYMENT_VALIDATION: 'bg-amber-500',
      COMPLETED: 'bg-blue-600',
      REFUSED: 'bg-red-400',
      CANCELED:  'bg-red-500',
      NO_SHOW:   'bg-red-500',
      IMPACTED_BY_CHANGE: 'bg-orange-500',
    };
    return map[status] || 'bg-gray-600';
  }

  getStatusLabel(status: AppointmentStatus): string {
    return APPOINTMENT_STATUS_LABELS[status] || status;
  }

  cancellationReasonLabel(status: AppointmentStatus): string {
    return status === 'REFUSED' ? 'Motif du refus' : 'Motif de l\'annulation';
  }

  openPatientProfile(patientId: number): void {
    this.profileModalUserId.set(patientId);
    this.profileModalVisible.set(true);
  }

  closeProfileModal(): void {
    this.profileModalVisible.set(false);
    this.profileModalUserId.set(null);
  }

  getStatusBadgeClass(status: AppointmentStatus): string {
    const base = 'inline-flex items-center px-2 py-0.5 rounded-full font-medium';
    const map: Partial<Record<AppointmentStatus, string>> = {
      CONFIRMED: `${base} bg-primary-100 text-sky-800`,
      REQUESTED: `${base} bg-gray-100 text-gray-800`,
      PENDING_PAYMENT_VALIDATION: `${base} bg-yellow-100 text-yellow-800`,
      COMPLETED: `${base} bg-blue-100 text-blue-800`,
      REFUSED: `${base} bg-red-100 text-red-800`,
      CANCELED:  `${base} bg-red-100 text-red-800`,
      NO_SHOW:   `${base} bg-orange-100 text-orange-800`,
      IMPACTED_BY_CHANGE: `${base} bg-orange-100 text-orange-800`,
    };
    return map[status] || base;
  }
}

// ── Helpers de dates ────────────────────────────────────────────────────────

function pad(n: number): string { return n < 10 ? `0${n}` : `${n}`; }

function startOfDay(d: Date): Date {
  return new Date(d.getFullYear(), d.getMonth(), d.getDate());
}

function startOfWeek(d: Date): Date {
  const result = new Date(d);
  const dow = result.getDay();
  const diff = (dow === 0 ? -6 : 1 - dow);
  result.setDate(result.getDate() + diff);
  result.setHours(0, 0, 0, 0);
  return result;
}

function isSameDay(a: Date, b: Date): boolean {
  return a.getFullYear() === b.getFullYear() &&
         a.getMonth()    === b.getMonth()    &&
         a.getDate()     === b.getDate();
}
