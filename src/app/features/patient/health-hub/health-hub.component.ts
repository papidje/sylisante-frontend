import { Component, OnInit, signal } from '@angular/core';
import { RouterLink } from '@angular/router';
import { forkJoin } from 'rxjs';
import { VitalService } from '../../../core/services/vital.service';
import { PregnancyService } from '../../../core/services/pregnancy.service';
import { VaccinationService } from '../../../core/services/vaccination.service';
import { SyliSpinnerComponent } from '../../../shared/components/syli-spinner/syli-spinner.component';
import {
  BloodPressureReadingDto,
  GlucoseReadingDto,
  VitalSummaryDto,
  BP_CLASS_BADGE,
  GLUCOSE_CLASS_BADGE,
  formatBp,
  formatGlucoseValue,
} from '../../../core/models/vital.model';
import { formatLocalDate } from '../../../core/utils/date-utils';
import { PregnancyOverviewDto } from '../../../core/models/pregnancy.model';
import { VaccinationOverviewDto } from '../../../core/models/vaccination.model';

@Component({
  selector: 'app-health-hub',
  standalone: true,
  imports: [RouterLink, SyliSpinnerComponent],
  template: `
    <div class="max-w-3xl mx-auto px-4 py-8">
      <div class="mb-8">
        <h1 class="text-2xl font-bold text-gray-900">Suivi</h1>
        <p class="text-gray-500 mt-1 text-sm">
          Tension, glycémie, grossesse et vaccins — les seuils sont indicatifs, ce n'est pas un diagnostic.
        </p>
      </div>

      @if (loading()) {
        <app-syli-spinner size="md" [showLabel]="true" [centered]="true" />
      } @else {
        <div class="grid sm:grid-cols-2 gap-4">
          <a routerLink="/health/blood-pressure"
             class="card hover:shadow-md transition-shadow border-l-4"
             [class.border-red-400]="bpCrisis()"
             [class.border-sky-400]="!bpCrisis()">
            <p class="text-xs uppercase tracking-wide text-gray-400 font-medium">Tension artérielle</p>
            <p class="text-3xl font-bold text-gray-900 mt-2">{{ bpLabel() }}</p>
            @if (latestBp(); as bp) {
              <span class="inline-flex mt-3 text-xs font-medium px-2 py-0.5 rounded-full border"
                    [class]="bpBadge(bp)">
                {{ bp.classificationLabel }}
              </span>
            } @else {
              <p class="text-sm text-gray-400 mt-3">Aucune mesure. Saisissez votre tension à domicile.</p>
            }
            <p class="text-sm text-primary-600 font-medium mt-4">Ouvrir le suivi →</p>
          </a>

          <a routerLink="/health/diabetes"
             class="card hover:shadow-md transition-shadow border-l-4 border-emerald-400">
            <p class="text-xs uppercase tracking-wide text-gray-400 font-medium">Diabète / glycémie</p>
            <p class="text-3xl font-bold text-gray-900 mt-2">{{ glucoseLabel() }}</p>
            @if (latestGlucose(); as g) {
              @if (g.classificationLabel) {
                <span class="inline-flex mt-3 text-xs font-medium px-2 py-0.5 rounded-full border"
                      [class]="glucoseBadge(g)">
                  {{ g.classificationLabel }}
                </span>
              }
            } @else {
              <p class="text-sm text-gray-400 mt-3">Aucune glycémie. Unité : mmol/L.</p>
            }
            <p class="text-sm text-primary-600 font-medium mt-4">Ouvrir le suivi →</p>
          </a>

          @if (pregnancy()?.eligible) {
            <a routerLink="/health/pregnancy"
               class="card hover:shadow-md transition-shadow border-l-4 border-rose-400">
              <p class="text-xs uppercase tracking-wide text-gray-400 font-medium">Grossesse</p>
              @if (pregnancy()?.episode?.status === 'ACTIVE') {
                <p class="text-3xl font-bold text-gray-900 mt-2">{{ pregnancy()!.episode!.gestationalLabel }}</p>
                <p class="text-sm text-gray-500 mt-1">Enceinte · DPA {{ formatLocalDate(pregnancy()!.episode!.dueDate) }}</p>
              } @else {
                <p class="text-xl font-bold text-gray-900 mt-2">Ouvrir un suivi</p>
                <p class="text-sm text-gray-400 mt-1">Date des dernières règles (DDR)</p>
              }
              <p class="text-sm text-primary-600 font-medium mt-4">Ouvrir le suivi →</p>
            </a>
          }

          <a routerLink="/health/vaccinations"
             class="card hover:shadow-md transition-shadow border-l-4 border-teal-400">
            <p class="text-xs uppercase tracking-wide text-gray-400 font-medium">Carnet vaccinal</p>
            <p class="text-3xl font-bold text-gray-900 mt-2">{{ vaccineCountLabel() }}</p>
            @if (vaccinations()?.latest; as latest) {
              <p class="text-sm text-gray-500 mt-1">
                Dernier : {{ latest.displayName }} · {{ formatLocalDate(latest.administeredOn) }}
              </p>
            } @else {
              <p class="text-sm text-gray-400 mt-3">Aucune dose. Déclarez un vaccin reçu.</p>
            }
            <p class="text-sm text-primary-600 font-medium mt-4">Ouvrir le carnet →</p>
          </a>
        </div>
      }
    </div>
  `,
})
export class HealthHubComponent implements OnInit {
  loading = signal(true);
  summary = signal<VitalSummaryDto | null>(null);
  pregnancy = signal<PregnancyOverviewDto | null>(null);
  vaccinations = signal<VaccinationOverviewDto | null>(null);
  readonly formatLocalDate = formatLocalDate;

  constructor(
    private vitalService: VitalService,
    private pregnancyService: PregnancyService,
    private vaccinationService: VaccinationService
  ) {}

  ngOnInit(): void {
    forkJoin({
      vitals: this.vitalService.getMySummary(),
      pregnancy: this.pregnancyService.getMine(),
      vaccinations: this.vaccinationService.getMine(),
    }).subscribe({
      next: ({ vitals, pregnancy, vaccinations }) => {
        this.summary.set(vitals);
        this.pregnancy.set(pregnancy);
        this.vaccinations.set(vaccinations);
        this.loading.set(false);
      },
      error: () => this.loading.set(false),
    });
  }

  latestBp(): BloodPressureReadingDto | null {
    return this.summary()?.latestBloodPressure ?? null;
  }

  latestGlucose(): GlucoseReadingDto | null {
    return this.summary()?.latestGlucose ?? null;
  }

  bpCrisis(): boolean {
    return !!this.latestBp()?.crisis;
  }

  bpLabel(): string {
    const bp = this.latestBp();
    return bp ? `${formatBp(bp)} mmHg` : '—';
  }

  glucoseLabel(): string {
    const g = this.latestGlucose();
    if (!g) return '—';
    return formatGlucoseValue(g.fasting ?? g.postprandial);
  }

  bpBadge(bp: BloodPressureReadingDto): string {
    return BP_CLASS_BADGE[bp.classification];
  }

  glucoseBadge(g: GlucoseReadingDto): string {
    return g.classification ? GLUCOSE_CLASS_BADGE[g.classification] : '';
  }

  vaccineCountLabel(): string {
    const total = this.vaccinations()?.total ?? 0;
    if (total === 0) return '—';
    return total === 1 ? '1 dose' : `${total} doses`;
  }
}
