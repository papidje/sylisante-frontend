import { Component, OnInit, signal } from '@angular/core';
import { HttpErrorResponse } from '@angular/common/http';
import { FormsModule } from '@angular/forms';
import { RouterLink } from '@angular/router';
import { PregnancyService } from '../../../core/services/pregnancy.service';
import { SyliSpinnerComponent } from '../../../shared/components/syli-spinner/syli-spinner.component';
import { VitalChartComponent, VitalChartSeries } from '../../../shared/components/vital-chart/vital-chart.component';
import { apiErrorMessage } from '../../../core/utils/http-error';
import { formatLocalDate, todayLocalDateString } from '../../../core/utils/date-utils';
import {
  PregnancyCloseReason,
  PregnancyEpisodeDto,
  PregnancyOverviewDto,
  PregnancyVisitDto,
  PREGNANCY_CLOSE_LABELS,
  PREGNANCY_CLOSE_OPTIONS,
  pregnancyProgressPercent,
} from '../../../core/models/pregnancy.model';

@Component({
  selector: 'app-pregnancy',
  standalone: true,
  imports: [FormsModule, RouterLink, SyliSpinnerComponent, VitalChartComponent],
  template: `
    <div class="max-w-3xl mx-auto px-4 py-8">
      <a routerLink="/health" class="text-sm text-primary-600 hover:text-primary-700">← Suivi</a>
      <h1 class="text-2xl font-bold text-gray-900 mt-3">Grossesse</h1>
      <p class="text-gray-500 mt-1 text-sm">
        Suivi indicatif (DDR → SA et date prévue). Ce n'est pas un dossier obstétrical complet.
      </p>

      @if (error()) {
        <div class="mt-4 bg-red-50 border border-red-200 rounded-lg p-3 text-sm text-red-700">{{ error() }}</div>
      }
      @if (success()) {
        <div class="mt-4 bg-sky-50 border border-sky-200 rounded-lg p-3 text-sm text-sky-700">{{ success() }}</div>
      }

      @if (loading()) {
        <div class="mt-8"><app-syli-spinner size="md" [showLabel]="true" [centered]="true" /></div>
      } @else if (!overview()?.eligible) {
        <div class="card mt-6 text-center py-10">
          <p class="font-medium text-gray-800">Ce suivi s'affiche pour un profil de sexe Femme</p>
          <p class="text-sm text-gray-500 mt-2 max-w-md mx-auto">
            Indiquez « Femme » dans votre profil pour ouvrir un suivi de grossesse.
          </p>
          <a routerLink="/patient-profile" class="btn-primary mt-5 inline-block text-sm">Compléter mon profil</a>
        </div>
      } @else if (!episode() || episode()!.status === 'CLOSED') {
        @if (episode(); as closed) {
          <div class="card mt-6 bg-slate-50">
            <p class="text-sm text-gray-600">
              Dernier suivi clôturé le {{ formatLocalDate(closed.closedAt) }}
              · {{ closed.closedReasonLabel }}
              · {{ closed.gestationalLabel }}
            </p>
          </div>
        }
        <div class="card mt-6">
          <h2 class="text-base font-semibold text-gray-900 mb-1">Ouvrir un suivi</h2>
          <p class="text-xs text-gray-400 mb-4">Date des dernières règles (DDR). La DPA est calculée (DDR + 280 jours) si vous ne la saisissez pas.</p>
          <form class="grid sm:grid-cols-3 gap-3 items-end" (ngSubmit)="start()" novalidate>
            <label class="text-sm text-gray-700">
              DDR
              <input class="input-field mt-1" type="date" name="lmp" [(ngModel)]="lmp" [max]="today"/>
            </label>
            <label class="text-sm text-gray-700">
              DPA (opt.)
              <input class="input-field mt-1" type="date" name="due" [(ngModel)]="due"/>
            </label>
            <button type="submit" class="btn-primary" [disabled]="saving()">
              @if (saving()) { Enregistrement… } @else { Démarrer }
            </button>
          </form>
        </div>
      } @else {
        <div class="card mt-6 border-l-4 border-rose-400">
          <p class="text-xs uppercase tracking-wide text-rose-600 font-medium">Enceinte</p>
          <p class="text-4xl font-bold text-gray-900 mt-2">{{ episode()!.gestationalLabel }}</p>
          <p class="text-sm text-gray-500 mt-1">
            DPA {{ formatLocalDate(episode()!.dueDate) }}
            · {{ episode()!.daysRemaining >= 0
                ? episode()!.daysRemaining + ' j. restants'
                : 'terme dépassé de ' + (-episode()!.daysRemaining) + ' j.' }}
          </p>
          <div class="h-2 bg-rose-100 rounded-full mt-4 overflow-hidden">
            <div class="h-full bg-rose-500 rounded-full" [style.width.%]="progress()"></div>
          </div>
          <p class="text-xs text-gray-400 mt-2">DDR {{ formatLocalDate(episode()!.lastMenstrualPeriod) }} · {{ progress() }} % de 40 SA</p>
        </div>

        <div class="card mt-6">
          <h2 class="text-base font-semibold text-gray-900 mb-2">Poids aux visites</h2>
          <app-vital-chart [series]="weightSeries()" ariaLabel="Poids au cours de la grossesse"/>
        </div>

        <div class="card mt-6">
          <h2 class="text-base font-semibold text-gray-900 mb-3">Visites</h2>
          @if (visits().length === 0) {
            <p class="text-sm text-gray-400">Aucune visite enregistrée par un praticien pour le moment.</p>
          } @else {
            <ul class="space-y-3">
              @for (v of visits(); track v.id) {
                <li class="border border-gray-100 rounded-xl p-3">
                  <div class="flex justify-between gap-2 text-sm">
                    <span class="font-semibold text-gray-900">{{ formatLocalDate(v.visitDate) }} · {{ v.gestationalLabel }}</span>
                    <span class="text-xs text-gray-400">{{ v.recordedByName }}</span>
                  </div>
                  <p class="text-xs text-gray-500 mt-1">
                    @if (v.weightKg != null) { Poids {{ v.weightKg }} kg }
                    @if (v.fundalHeightCm != null) { · HU {{ v.fundalHeightCm }} cm }
                    @if (v.fetalHeartRate != null) { · RCF {{ v.fetalHeartRate }} bpm }
                  </p>
                  @if (v.notes) {
                    <p class="text-sm text-gray-700 mt-2 whitespace-pre-line">{{ v.notes }}</p>
                  }
                </li>
              }
            </ul>
          }
        </div>

        <div class="card mt-6">
          <h2 class="text-base font-semibold text-gray-900 mb-3">Clôturer le suivi</h2>
          <form class="flex flex-wrap gap-3 items-end" (ngSubmit)="close()" novalidate>
            <label class="text-sm text-gray-700 flex-1 min-w-[180px]">
              Motif
              <select class="input-field mt-1" name="reason" [(ngModel)]="closeReason">
                @for (r of closeReasons; track r) {
                  <option [value]="r">{{ closeLabels[r] }}</option>
                }
              </select>
            </label>
            <button type="submit" class="btn-secondary" [disabled]="saving()">Clôturer</button>
          </form>
        </div>
      }
    </div>
  `,
})
export class PregnancyComponent implements OnInit {
  loading = signal(true);
  saving = signal(false);
  error = signal('');
  success = signal('');
  overview = signal<PregnancyOverviewDto | null>(null);
  lmp = '';
  due = '';
  closeReason: PregnancyCloseReason = 'DELIVERY';
  readonly today = todayLocalDateString();
  readonly closeReasons = PREGNANCY_CLOSE_OPTIONS;
  readonly closeLabels = PREGNANCY_CLOSE_LABELS;
  readonly formatLocalDate = formatLocalDate;

  constructor(private pregnancyService: PregnancyService) {}

  ngOnInit(): void {
    this.reload();
  }

  episode(): PregnancyEpisodeDto | null {
    return this.overview()?.episode ?? null;
  }

  visits(): PregnancyVisitDto[] {
    return this.overview()?.visits ?? [];
  }

  progress(): number {
    const ep = this.episode();
    return ep ? pregnancyProgressPercent(ep.gestationalWeeks) : 0;
  }

  weightSeries(): VitalChartSeries[] {
    const points = this.visits()
      .filter(v => v.weightKg != null)
      .map(v => ({ t: formatLocalDate(v.visitDate), v: Number(v.weightKg) }));
    return [{ label: 'Poids (kg)', color: '#e11d48', points }];
  }

  start(): void {
    if (!this.lmp) {
      this.error.set('Indiquez la date des dernières règles (DDR).');
      return;
    }
    this.saving.set(true);
    this.error.set('');
    this.pregnancyService.startMine({
      lastMenstrualPeriod: this.lmp,
      dueDate: this.due || null,
    }).subscribe({
      next: (data) => {
        this.overview.set(data);
        this.saving.set(false);
        this.success.set('Suivi de grossesse ouvert.');
        setTimeout(() => this.success.set(''), 3500);
      },
      error: (err: HttpErrorResponse) => {
        this.saving.set(false);
        this.error.set(apiErrorMessage(err, 'Impossible d\'ouvrir le suivi.'));
      },
    });
  }

  close(): void {
    this.saving.set(true);
    this.error.set('');
    this.pregnancyService.closeMine({ reason: this.closeReason }).subscribe({
      next: (data) => {
        this.overview.set(data);
        this.saving.set(false);
        this.success.set('Suivi clôturé.');
        setTimeout(() => this.success.set(''), 3500);
      },
      error: (err: HttpErrorResponse) => {
        this.saving.set(false);
        this.error.set(apiErrorMessage(err, 'Impossible de clôturer le suivi.'));
      },
    });
  }

  private reload(): void {
    this.loading.set(true);
    this.pregnancyService.getMine().subscribe({
      next: (data) => {
        this.overview.set(data);
        this.loading.set(false);
      },
      error: (err: HttpErrorResponse) => {
        this.loading.set(false);
        this.error.set(apiErrorMessage(err, 'Impossible de charger le suivi grossesse.'));
      },
    });
  }
}
