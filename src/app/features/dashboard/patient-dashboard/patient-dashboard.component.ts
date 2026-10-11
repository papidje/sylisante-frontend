import { Component, OnInit, signal } from '@angular/core';
import { RouterLink } from '@angular/router';
import { CommonModule } from '@angular/common';
import { AuthService } from '../../../core/services/auth.service';
import { AppointmentService } from '../../../core/services/appointment.service';
import { AppointmentResponse, APPOINTMENT_STATUS_LABELS, AppointmentStatus } from '../../../core/models/appointment.model';
import { formatLocalTime, parseLocalDateTime } from '../../../core/utils/date-utils';
import { SyliSpinnerComponent } from '../../../shared/components/syli-spinner/syli-spinner.component';
import { ClinicalProfileService } from '../../../core/services/clinical-profile.service';
import { ClinicalProfileDto } from '../../../core/models/clinical-profile.model';
import { VitalService } from '../../../core/services/vital.service';
import { PregnancyService } from '../../../core/services/pregnancy.service';
import { PregnancyOverviewDto } from '../../../core/models/pregnancy.model';
import { VaccinationService } from '../../../core/services/vaccination.service';
import { VaccinationOverviewDto } from '../../../core/models/vaccination.model';
import {
  BloodPressureReadingDto,
  GlucoseReadingDto,
  VitalSummaryDto,
  BP_CLASS_BADGE,
  GLUCOSE_CLASS_BADGE,
  formatBp,
} from '../../../core/models/vital.model';

const MONTHS_SHORT = ['JAN', 'FÉV', 'MAR', 'AVR', 'MAI', 'JUN', 'JUL', 'AOÛ', 'SEP', 'OCT', 'NOV', 'DÉC'];

@Component({
  selector: 'app-patient-dashboard',
  standalone: true,
  imports: [RouterLink, CommonModule, SyliSpinnerComponent],
  template: `
    <div class="pb-10">
      <header class="bg-gradient-to-br from-primary-800 via-primary-600 to-sky-400 text-white">
        <div class="max-w-5xl mx-auto px-4 pt-6 sm:pt-8 pb-16 sm:pb-20">
          <div class="flex items-start justify-between gap-3">
            <div class="min-w-0">
              <p class="text-white/70 text-sm">Bonjour</p>
              <h1 class="text-2xl sm:text-3xl font-bold tracking-tight truncate">
                {{ authService.currentUser()?.firstName }} {{ authService.currentUser()?.lastName }}
              </h1>
              <p class="mt-2 text-sm text-white/85 flex flex-wrap items-center gap-x-2 gap-y-1">
                @if (clinical()?.bloodTypeLabel) {
                  <span class="font-semibold">{{ clinical()!.bloodTypeLabel }}</span>
                  <span class="text-white/40">·</span>
                }
                @if (hasAllergies()) {
                  <span class="inline-flex items-center gap-1">
                    <svg class="w-3.5 h-3.5 text-amber-200 flex-shrink-0" fill="currentColor" viewBox="0 0 20 20">
                      <path fill-rule="evenodd" d="M8.257 3.099c.765-1.36 2.722-1.36 3.486 0l5.58 9.92c.75 1.334-.213 2.98-1.742 2.98H4.42c-1.53 0-2.493-1.646-1.743-2.98l5.58-9.92zM11 13a1 1 0 11-2 0 1 1 0 012 0zm-1-8a1 1 0 00-1 1v3a1 1 0 002 0V6a1 1 0 00-1-1z" clip-rule="evenodd"/>
                    </svg>
                    {{ allergySummary() }}
                  </span>
                } @else {
                  <span class="text-white/70">Aucune allergie connue</span>
                }
              </p>
              <div class="mt-3 flex flex-wrap items-center gap-2">
                <span class="inline-flex items-center gap-1.5 rounded-full bg-black/20 px-3 py-1 text-xs font-medium">
                  <span class="text-white/60">NIN</span>
                  <span>{{ clinical()?.nationalId || '—' }}</span>
                </span>
                <a routerLink="/patient-profile" class="text-xs font-medium text-white/80 hover:text-white underline underline-offset-2">
                  Compléter le profil
                </a>
              </div>
            </div>
            <a routerLink="/appointments/book"
               class="flex-shrink-0 inline-flex items-center gap-1.5 rounded-full bg-white text-sky-800 px-3.5 py-2 text-sm font-semibold shadow-sm hover:bg-sky-50 transition-colors">
              + RDV
            </a>
          </div>
        </div>
      </header>

      <div class="max-w-5xl mx-auto px-3 sm:px-4 -mt-12 sm:-mt-14">
        <section>
          <div class="grid gap-1.5 sm:gap-3"
               [class.grid-cols-3]="!showPregnancy()"
               [class.grid-cols-4]="showPregnancy()">
            <a routerLink="/health/blood-pressure" class="vital-card"
               [class.vital-card-alert]="bpCrisis()">
              @if (latestBp(); as bp) {
                <p class="vital-value" [class.text-red-600]="bpCrisis()">{{ formatBp(bp) }}</p>
                <p class="vital-unit">mmHg</p>
                <p class="vital-label">Tension</p>
                <span class="vital-pill" [class]="bpBadge(bp)">{{ bp.classificationLabel }}</span>
              } @else {
                <p class="vital-value text-slate-300">—</p>
                <p class="vital-unit">mmHg</p>
                <p class="vital-label">Tension</p>
                <span class="vital-pill bg-slate-50 text-slate-400 border-slate-100">Saisir</span>
              }
            </a>

            <a routerLink="/health/diabetes" class="vital-card">
              @if (latestGlucose(); as g) {
                <p class="vital-value">{{ glucoseNumber(g) }}</p>
                <p class="vital-unit">mmol/L</p>
                <p class="vital-label">Glycémie</p>
                @if (g.classificationLabel) {
                  <span class="vital-pill" [class]="glucoseBadge(g)">{{ g.classificationLabel }}</span>
                } @else {
                  <span class="vital-pill bg-slate-50 text-slate-500 border-slate-100">{{ glucoseHint(g) }}</span>
                }
              } @else {
                <p class="vital-value text-slate-300">—</p>
                <p class="vital-unit">mmol/L</p>
                <p class="vital-label">Glycémie</p>
                <span class="vital-pill bg-slate-50 text-slate-400 border-slate-100">Saisir</span>
              }
            </a>

            @if (showPregnancy()) {
              <a routerLink="/health/pregnancy" class="vital-card">
                <p class="vital-value text-rose-700">{{ pregnancy()!.episode!.gestationalLabel }}</p>
                <p class="vital-unit">semaines</p>
                <p class="vital-label">Grossesse</p>
                <span class="vital-pill bg-rose-50 text-rose-700 border-rose-100">{{ trimesterLabel() }}</span>
              </a>
            }

            <a routerLink="/health/vaccinations" class="vital-card">
              @if (vaccinations()?.latest; as latest) {
                <p class="vital-value">{{ vaccinations()!.total }}</p>
                <p class="vital-unit">dose{{ vaccinations()!.total > 1 ? 's' : '' }}</p>
                <p class="vital-label">Vaccins</p>
                <span class="vital-pill bg-teal-50 text-teal-800 border-teal-100">{{ latest.displayName }}</span>
              } @else {
                <p class="vital-value text-slate-300">—</p>
                <p class="vital-unit">doses</p>
                <p class="vital-label">Vaccins</p>
                <span class="vital-pill bg-slate-50 text-slate-400 border-slate-100">Carnet</span>
              }
            </a>
          </div>
          <p class="mt-2.5 text-[11px] text-slate-400 px-0.5">
            Seuils indicatifs — ce n'est pas un diagnostic.
          </p>
        </section>

        <section class="mt-5 sm:mt-7 rounded-2xl sm:rounded-3xl bg-white border border-slate-100 shadow-sm overflow-hidden">
          <div class="flex items-center justify-between px-4 sm:px-5 pt-4 pb-2">
            <h2 class="text-[11px] font-semibold uppercase tracking-wider text-slate-400">Prochains rendez-vous</h2>
            <a routerLink="/appointments" class="text-xs font-medium text-sky-700 hover:underline">Tous</a>
          </div>
          @if (loading()) {
            <div class="py-8"><app-syli-spinner size="sm" [showLabel]="true" [centered]="true" /></div>
          } @else if (upcomingAppointments().length === 0) {
            <div class="text-center py-8 px-4">
              <p class="text-slate-500 text-sm">Aucun rendez-vous à venir</p>
              <a routerLink="/appointments/book" class="btn-primary mt-3 inline-block text-sm">Prendre rendez-vous</a>
            </div>
          } @else {
            <ul class="divide-y divide-slate-100">
              @for (appt of upcomingAppointments(); track appt.id) {
                <li class="flex items-center gap-3 px-4 sm:px-5 py-3.5">
                  <div class="w-12 h-14 rounded-2xl bg-slate-50 border border-slate-100 flex flex-col items-center justify-center flex-shrink-0">
                    <span class="text-lg font-bold text-slate-900 leading-none tabular-nums">{{ appointmentDay(appt.appointmentDateTime) }}</span>
                    <span class="text-[10px] font-semibold uppercase tracking-wide text-slate-400 mt-1">{{ appointmentMonth(appt.appointmentDateTime) }}</span>
                  </div>
                  <div class="flex-1 min-w-0">
                    <p class="font-semibold text-slate-900 text-sm truncate">
                      Dr. {{ appt.practitionerFirstName }} {{ appt.practitionerLastName }}
                    </p>
                    <p class="text-xs text-slate-500 truncate mt-0.5">
                      @if (appt.practitionerSpeciality) { {{ appt.practitionerSpeciality }} · }
                      @if (appt.consultationType) { {{ appt.consultationType }} · }
                      {{ appointmentHour(appt.appointmentDateTime) }}
                    </p>
                  </div>
                  <span [class]="getStatusBadgeClass(appt.status)" class="flex-shrink-0">
                    {{ getStatusLabel(appt.status) }}
                  </span>
                </li>
              }
            </ul>
          }
        </section>

        <nav class="mt-5 grid grid-cols-2 gap-2 sm:gap-3">
          <a routerLink="/appointments" class="quick-link">
            <span class="quick-icon bg-sky-50 text-sky-700">
              <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2"
                      d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z"/>
              </svg>
            </span>
            <span class="text-sm font-semibold text-slate-800">Mes RDV</span>
            <span class="text-[11px] text-slate-500 hidden sm:block">Agenda</span>
          </a>
          <a routerLink="/dossier" class="quick-link">
            <span class="quick-icon bg-emerald-50 text-emerald-700">
              <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2"
                      d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"/>
              </svg>
            </span>
            <span class="text-sm font-semibold text-slate-800">Dossier</span>
            <span class="text-[11px] text-slate-500 hidden sm:block">Comptes rendus</span>
          </a>
        </nav>
      </div>
    </div>
  `,
  styles: [`
    .vital-card {
      @apply min-w-0 rounded-2xl sm:rounded-3xl bg-white shadow-md border border-white
             px-1.5 py-3 sm:px-4 sm:py-5 text-center hover:shadow-lg transition-shadow;
    }
    .vital-card-alert {
      @apply ring-2 ring-red-300;
    }
    .vital-value {
      @apply text-[15px] sm:text-3xl font-bold text-slate-900 leading-none tabular-nums tracking-tight;
    }
    .vital-unit {
      @apply mt-1 text-[9px] sm:text-xs text-slate-400;
    }
    .vital-label {
      @apply mt-1.5 sm:mt-2 text-[10px] sm:text-sm text-slate-500;
    }
    .vital-pill {
      @apply mt-2 inline-flex max-w-full truncate text-[9px] sm:text-[11px] font-medium
             px-1.5 sm:px-2.5 py-0.5 rounded-full border;
    }
    .quick-link {
      @apply rounded-2xl border border-slate-100 bg-white px-3 py-3 flex flex-col items-start gap-1.5
             hover:border-sky-200 hover:bg-sky-50/40 transition-colors;
    }
    .quick-icon {
      @apply w-8 h-8 rounded-xl flex items-center justify-center;
    }
  `],
})
export class PatientDashboardComponent implements OnInit {
  appointments = signal<AppointmentResponse[]>([]);
  loading = signal(true);
  upcomingAppointments = signal<AppointmentResponse[]>([]);
  clinical = signal<ClinicalProfileDto | null>(null);
  vitals = signal<VitalSummaryDto | null>(null);
  pregnancy = signal<PregnancyOverviewDto | null>(null);
  vaccinations = signal<VaccinationOverviewDto | null>(null);

  readonly formatBp = formatBp;

  constructor(
    public authService: AuthService,
    private appointmentService: AppointmentService,
    private clinicalProfileService: ClinicalProfileService,
    private vitalService: VitalService,
    private pregnancyService: PregnancyService,
    private vaccinationService: VaccinationService
  ) {}

  ngOnInit(): void {
    this.appointmentService.getMyAppointments().subscribe({
      next: (data) => {
        this.appointments.set(data);
        this.computeUpcoming(data);
        this.loading.set(false);
      },
      error: () => this.loading.set(false),
    });
    this.clinicalProfileService.getMine().subscribe({
      next: (c) => this.clinical.set(c),
    });
    this.vitalService.getMySummary().subscribe({
      next: (v) => this.vitals.set(v),
    });
    this.pregnancyService.getMine().subscribe({
      next: (p) => this.pregnancy.set(p),
    });
    this.vaccinationService.getMine().subscribe({
      next: (v) => this.vaccinations.set(v),
    });
  }

  showPregnancy(): boolean {
    return this.pregnancy()?.episode?.status === 'ACTIVE';
  }

  trimesterLabel(): string {
    const weeks = this.pregnancy()?.episode?.gestationalWeeks ?? 0;
    if (weeks < 14) return 'T1';
    if (weeks < 28) return 'T2';
    return 'T3';
  }

  latestBp(): BloodPressureReadingDto | null {
    return this.vitals()?.latestBloodPressure ?? null;
  }

  latestGlucose(): GlucoseReadingDto | null {
    return this.vitals()?.latestGlucose ?? null;
  }

  bpCrisis(): boolean {
    return !!this.latestBp()?.crisis;
  }

  glucoseNumber(g: GlucoseReadingDto): string {
    const value = g.fasting ?? g.postprandial;
    return value == null ? '—' : String(value);
  }

  glucoseHint(g: GlucoseReadingDto): string {
    if (g.fasting != null) return 'À jeun';
    if (g.postprandial != null) return 'Post-prandiale';
    return '';
  }

  hasAllergies(): boolean {
    return (this.clinical()?.allergies.length ?? 0) > 0;
  }

  private computeUpcoming(data: AppointmentResponse[]): void {
    const now = new Date();
    const upcoming = data
      .filter(a => parseLocalDateTime(a.appointmentDateTime) >= now &&
        (a.status === 'CONFIRMED' || a.status === 'PENDING_PAYMENT_VALIDATION' || a.status === 'REQUESTED'))
      .sort((a, b) => parseLocalDateTime(a.appointmentDateTime).getTime() - parseLocalDateTime(b.appointmentDateTime).getTime())
      .slice(0, 3);
    this.upcomingAppointments.set(upcoming);
  }

  appointmentDay(dateStr: string): string {
    const datePart = dateStr.split('T')[0];
    return String(Number(datePart.split('-')[2]));
  }

  appointmentMonth(dateStr: string): string {
    const datePart = dateStr.split('T')[0];
    const month = Number(datePart.split('-')[1]);
    return MONTHS_SHORT[month - 1] ?? '';
  }

  appointmentHour(dateStr: string): string {
    return formatLocalTime(dateStr);
  }

  allergySummary(): string {
    const allergies = this.clinical()?.allergies ?? [];
    return allergies.length ? allergies.map(a => a.substance).join(', ') : 'Aucune';
  }

  bpBadge(bp: BloodPressureReadingDto): string {
    return BP_CLASS_BADGE[bp.classification];
  }

  glucoseBadge(g: GlucoseReadingDto): string {
    return g.classification ? GLUCOSE_CLASS_BADGE[g.classification] : '';
  }

  getStatusLabel(status: AppointmentStatus): string {
    return APPOINTMENT_STATUS_LABELS[status] || status;
  }

  getStatusBadgeClass(status: AppointmentStatus): string {
    const base = 'inline-flex items-center px-2 py-0.5 rounded-full text-[10px] sm:text-xs font-medium';
    const map: Partial<Record<AppointmentStatus, string>> = {
      REQUESTED: `${base} bg-gray-100 text-gray-700`,
      PENDING_PAYMENT_VALIDATION: `${base} bg-yellow-100 text-yellow-800`,
      CONFIRMED: `${base} bg-sky-100 text-sky-800`,
      CANCELED: `${base} bg-red-100 text-red-800`,
      COMPLETED: `${base} bg-blue-100 text-blue-800`,
    };
    return map[status] || base;
  }
}
