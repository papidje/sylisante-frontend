import { Component, OnInit, signal } from '@angular/core';
import { HttpErrorResponse } from '@angular/common/http';
import { FormsModule } from '@angular/forms';
import { RouterLink } from '@angular/router';
import { VitalService } from '../../../core/services/vital.service';
import { SyliSpinnerComponent } from '../../../shared/components/syli-spinner/syli-spinner.component';
import { VitalChartComponent, VitalChartSeries } from '../../../shared/components/vital-chart/vital-chart.component';
import { apiErrorMessage } from '../../../core/utils/http-error';
import {
  BloodPressureReadingDto,
  BP_CLASS_BADGE,
  SOURCE_BADGE,
  VITAL_SOURCE_LABELS,
  formatBp,
  formatVitalDate,
  parseOptionalNumber,
  validateBloodPressure,
} from '../../../core/models/vital.model';

@Component({
  selector: 'app-blood-pressure',
  standalone: true,
  imports: [FormsModule, RouterLink, SyliSpinnerComponent, VitalChartComponent],
  template: `
    <div class="max-w-3xl mx-auto px-4 py-8">
      <a routerLink="/health" class="text-sm text-primary-600 hover:text-primary-700">← Suivi</a>
      <h1 class="text-2xl font-bold text-gray-900 mt-3">Tension artérielle</h1>
      <p class="text-gray-500 mt-1 text-sm">
        mmHg. Seuils indicatifs (OMS-like) calculés par SyliSanté — ce n'est pas un diagnostic.
      </p>

      @if (latest()?.crisis) {
        <div class="mt-5 rounded-xl border border-red-200 bg-red-50 p-4">
          <p class="text-sm font-semibold text-red-800">Tension très élevée (&gt; 180/120)</p>
          <p class="text-sm text-red-700 mt-1">
            Consultez immédiatement un professionnel de santé. Ceci n'est pas un diagnostic.
          </p>
        </div>
      }

      @if (error()) {
        <div class="mt-4 bg-red-50 border border-red-200 rounded-lg p-3 text-sm text-red-700">{{ error() }}</div>
      }
      @if (success()) {
        <div class="mt-4 bg-sky-50 border border-sky-200 rounded-lg p-3 text-sm text-sky-700">{{ success() }}</div>
      }

      <div class="card mt-6">
        <h2 class="text-base font-semibold text-gray-900 mb-4">Nouvelle mesure (domicile)</h2>
        <form class="grid sm:grid-cols-4 gap-3 items-end" (ngSubmit)="submit()" novalidate>
          <label class="text-sm text-gray-700">
            Systolique (mmHg)
            <input class="input-field mt-1" type="number" name="sys" [(ngModel)]="sys" placeholder="120"/>
          </label>
          <label class="text-sm text-gray-700">
            Diastolique (mmHg)
            <input class="input-field mt-1" type="number" name="dia" [(ngModel)]="dia" placeholder="80"/>
          </label>
          <label class="text-sm text-gray-700">
            Pouls (bpm, opt.)
            <input class="input-field mt-1" type="number" name="hr" [(ngModel)]="hr" placeholder="72"/>
          </label>
          <button type="submit" class="btn-primary" [disabled]="saving()">
            @if (saving()) { Enregistrement… } @else { Enregistrer }
          </button>
        </form>
        <p class="text-xs text-gray-400 mt-2">Bornes : SYS 60–250 · DIA 40–150 · SYS &gt; DIA · pouls 30–220</p>
      </div>

      @if (loading()) {
        <div class="mt-8"><app-syli-spinner size="md" [showLabel]="true" [centered]="true" /></div>
      } @else {
        @if (latest()) {
          <div class="grid sm:grid-cols-3 gap-4 mt-6">
            <div class="card">
              <p class="text-xs uppercase tracking-wide text-gray-400">Dernière</p>
              <p class="text-2xl font-bold mt-1">{{ formatBp(latest()!) }}</p>
              <span class="inline-flex mt-2 text-xs font-medium px-2 py-0.5 rounded-full border"
                    [class]="bpBadge(latest()!)">{{ latest()!.classificationLabel }}</span>
            </div>
            <div class="card">
              <p class="text-xs uppercase tracking-wide text-gray-400">Pouls</p>
              <p class="text-2xl font-bold mt-1">{{ latest()!.heartRate ?? '—' }}</p>
            </div>
            <div class="card">
              <p class="text-xs uppercase tracking-wide text-gray-400">Mesures</p>
              <p class="text-2xl font-bold mt-1">{{ readings().length }}</p>
            </div>
          </div>
        }

        <div class="card mt-6">
          <h2 class="text-base font-semibold text-gray-900 mb-2">Évolution</h2>
          <app-vital-chart [series]="chartSeries()" [distinguishSource]="true" ariaLabel="Évolution de la tension"/>
        </div>

        <div class="card mt-6 overflow-x-auto">
          <h2 class="text-base font-semibold text-gray-900 mb-3">Historique</h2>
          @if (readings().length === 0) {
            <p class="text-sm text-gray-400">Aucune mesure enregistrée.</p>
          } @else {
            <table class="w-full text-sm">
              <thead>
                <tr class="text-left text-xs uppercase text-gray-400">
                  <th class="pb-2">Date</th>
                  <th class="pb-2">TA</th>
                  <th class="pb-2">Pouls</th>
                  <th class="pb-2">Classe</th>
                  <th class="pb-2">Source</th>
                </tr>
              </thead>
              <tbody>
                @for (r of readings(); track r.groupId) {
                  <tr class="border-t border-gray-100">
                    <td class="py-2 text-gray-600">{{ formatVitalDate(r.measuredAt) }}</td>
                    <td class="py-2 font-medium">{{ formatBp(r) }}</td>
                    <td class="py-2">{{ r.heartRate ?? '—' }}</td>
                    <td class="py-2">
                      <span class="text-xs px-2 py-0.5 rounded-full border" [class]="bpBadge(r)">
                        {{ r.classificationLabel }}
                      </span>
                    </td>
                    <td class="py-2">
                      <span class="text-xs px-2 py-0.5 rounded-full border" [class]="sourceBadge(r)">
                        {{ sourceLabel(r) }}
                      </span>
                    </td>
                  </tr>
                }
              </tbody>
            </table>
          }
        </div>
      }
    </div>
  `,
})
export class BloodPressureComponent implements OnInit {
  readings = signal<BloodPressureReadingDto[]>([]);
  loading = signal(true);
  saving = signal(false);
  error = signal('');
  success = signal('');
  sys = '';
  dia = '';
  hr = '';

  readonly formatBp = formatBp;
  readonly formatVitalDate = formatVitalDate;

  constructor(private vitalService: VitalService) {}

  ngOnInit(): void {
    this.reload();
  }

  latest(): BloodPressureReadingDto | null {
    return this.readings()[0] ?? null;
  }

  bpBadge(r: BloodPressureReadingDto): string {
    return BP_CLASS_BADGE[r.classification];
  }

  sourceBadge(r: BloodPressureReadingDto): string {
    return SOURCE_BADGE[r.source];
  }

  sourceLabel(r: BloodPressureReadingDto): string {
    return VITAL_SOURCE_LABELS[r.source];
  }

  chartSeries(): VitalChartSeries[] {
    return [
      {
        label: 'Systolique',
        color: '#ef4444',
        points: this.readings().map(r => ({
          t: formatVitalDate(r.measuredAt),
          v: Number(r.systolic),
          source: r.source,
        })),
      },
      {
        label: 'Diastolique',
        color: '#0ea5e9',
        points: this.readings().map(r => ({
          t: formatVitalDate(r.measuredAt),
          v: Number(r.diastolic),
          source: r.source,
        })),
      },
    ];
  }

  submit(): void {
    const systolic = parseOptionalNumber(this.sys);
    const diastolic = parseOptionalNumber(this.dia);
    const heartRate = parseOptionalNumber(this.hr);
    const localError = validateBloodPressure(systolic, diastolic, heartRate);
    if (localError) {
      this.error.set(localError);
      return;
    }
    this.saving.set(true);
    this.error.set('');
    this.vitalService.addMyBloodPressure({ systolic: systolic!, diastolic: diastolic!, heartRate }).subscribe({
      next: (created) => {
        this.readings.update(list => [created, ...list]);
        this.sys = '';
        this.dia = '';
        this.hr = '';
        this.saving.set(false);
        this.success.set(created.crisis
          ? 'Mesure enregistrée. Tension très élevée : consultez un professionnel.'
          : 'Mesure enregistrée.');
        setTimeout(() => this.success.set(''), 4000);
      },
      error: (err: HttpErrorResponse) => {
        this.saving.set(false);
        this.error.set(apiErrorMessage(err, 'Impossible d\'enregistrer la mesure.'));
      },
    });
  }

  private reload(): void {
    this.loading.set(true);
    this.vitalService.listMyBloodPressure().subscribe({
      next: (data) => {
        this.readings.set(data);
        this.loading.set(false);
      },
      error: () => this.loading.set(false),
    });
  }
}
