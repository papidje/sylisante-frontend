import { Component, OnInit, signal } from '@angular/core';
import { HttpErrorResponse } from '@angular/common/http';
import { FormsModule } from '@angular/forms';
import { RouterLink } from '@angular/router';
import { forkJoin } from 'rxjs';
import { VitalService } from '../../../core/services/vital.service';
import { SyliSpinnerComponent } from '../../../shared/components/syli-spinner/syli-spinner.component';
import { VitalChartComponent, VitalChartSeries } from '../../../shared/components/vital-chart/vital-chart.component';
import {
  GlucoseReadingDto,
  Hba1cReadingDto,
  GLUCOSE_CLASS_BADGE,
  SOURCE_BADGE,
  VITAL_SOURCE_LABELS,
  formatGlucoseValue,
  formatVitalDate,
  parseOptionalNumber,
} from '../../../core/models/vital.model';

@Component({
  selector: 'app-diabetes',
  standalone: true,
  imports: [FormsModule, RouterLink, SyliSpinnerComponent, VitalChartComponent],
  template: `
    <div class="max-w-3xl mx-auto px-4 py-8">
      <a routerLink="/health" class="text-sm text-primary-600 hover:text-primary-700">← Suivi</a>
      <h1 class="text-2xl font-bold text-gray-900 mt-3">Diabète / glycémie</h1>
      <p class="text-gray-500 mt-1 text-sm">
        Unité mmol/L. L'HbA1c est saisie par le praticien (bilan), pas sur le glucomètre à domicile.
      </p>

      @if (error()) {
        <div class="mt-4 bg-red-50 border border-red-200 rounded-lg p-3 text-sm text-red-700">{{ error() }}</div>
      }
      @if (success()) {
        <div class="mt-4 bg-sky-50 border border-sky-200 rounded-lg p-3 text-sm text-sky-700">{{ success() }}</div>
      }

      <div class="card mt-6">
        <h2 class="text-base font-semibold text-gray-900 mb-4">Nouvelle glycémie (domicile)</h2>
        <form class="grid sm:grid-cols-3 gap-3 items-end" (ngSubmit)="submit()">
          <label class="text-sm text-gray-700">
            À jeun
            <input class="input-field mt-1" type="number" step="0.1" name="fasting" [(ngModel)]="fasting" min="1.5" max="35"/>
          </label>
          <label class="text-sm text-gray-700">
            Post-prandiale
            <input class="input-field mt-1" type="number" step="0.1" name="post" [(ngModel)]="post" min="1.5" max="35"/>
          </label>
          <button type="submit" class="btn-primary" [disabled]="saving()">
            @if (saving()) { Enregistrement… } @else { Enregistrer }
          </button>
        </form>
        <p class="text-xs text-gray-400 mt-2">Indiquez au moins une des deux valeurs.</p>
      </div>

      @if (loading()) {
        <div class="mt-8"><app-syli-spinner size="md" [showLabel]="true" [centered]="true" /></div>
      } @else {
        <div class="grid sm:grid-cols-3 gap-4 mt-6">
          <div class="card">
            <p class="text-xs uppercase tracking-wide text-gray-400">À jeun</p>
            <p class="text-2xl font-bold mt-1">{{ formatGlucoseValue(latest()?.fasting) }}</p>
            @if (latest()?.classificationLabel) {
              <span class="inline-flex mt-2 text-xs font-medium px-2 py-0.5 rounded-full border"
                    [class]="glucoseBadge(latest()!)">{{ latest()!.classificationLabel }}</span>
            }
          </div>
          <div class="card">
            <p class="text-xs uppercase tracking-wide text-gray-400">Post-prandiale</p>
            <p class="text-2xl font-bold mt-1">{{ formatGlucoseValue(latest()?.postprandial) }}</p>
          </div>
          <div class="card">
            <p class="text-xs uppercase tracking-wide text-gray-400">HbA1c</p>
            <p class="text-2xl font-bold mt-1">{{ hba1c() ? hba1c()!.value + ' %' : '—' }}</p>
            @if (hba1c()) {
              <p class="text-xs mt-2" [class.text-emerald-700]="hba1c()!.onTarget" [class.text-orange-700]="!hba1c()!.onTarget">
                {{ hba1c()!.classificationLabel }}
              </p>
            } @else {
              <p class="text-xs text-gray-400 mt-2">Saisie réservée au praticien</p>
            }
          </div>
        </div>

        <div class="card mt-6">
          <h2 class="text-base font-semibold text-gray-900 mb-2">Évolution (à jeun)</h2>
          <app-vital-chart [series]="chartSeries()" ariaLabel="Évolution de la glycémie à jeun"/>
        </div>

        <div class="card mt-6 overflow-x-auto">
          <h2 class="text-base font-semibold text-gray-900 mb-3">Historique</h2>
          @if (readings().length === 0) {
            <p class="text-sm text-gray-400">Aucune glycémie enregistrée.</p>
          } @else {
            <table class="w-full text-sm">
              <thead>
                <tr class="text-left text-xs uppercase text-gray-400">
                  <th class="pb-2">Date</th>
                  <th class="pb-2">À jeun</th>
                  <th class="pb-2">Post</th>
                  <th class="pb-2">Classe</th>
                  <th class="pb-2">Source</th>
                </tr>
              </thead>
              <tbody>
                @for (r of readings(); track r.groupId) {
                  <tr class="border-t border-gray-100">
                    <td class="py-2 text-gray-600">{{ formatVitalDate(r.measuredAt) }}</td>
                    <td class="py-2 font-medium">{{ r.fasting ?? '—' }}</td>
                    <td class="py-2">{{ r.postprandial ?? '—' }}</td>
                    <td class="py-2">
                      @if (r.classificationLabel) {
                        <span class="text-xs px-2 py-0.5 rounded-full border" [class]="glucoseBadge(r)">
                          {{ r.classificationLabel }}
                        </span>
                      } @else { — }
                    </td>
                    <td class="py-2">
                      <span class="text-xs px-2 py-0.5 rounded-full border" [class]="SOURCE_BADGE[r.source]">
                        {{ VITAL_SOURCE_LABELS[r.source] }}
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
export class DiabetesComponent implements OnInit {
  readings = signal<GlucoseReadingDto[]>([]);
  hba1c = signal<Hba1cReadingDto | null>(null);
  loading = signal(true);
  saving = signal(false);
  error = signal('');
  success = signal('');
  fasting = '';
  post = '';

  readonly formatGlucoseValue = formatGlucoseValue;
  readonly formatVitalDate = formatVitalDate;
  readonly SOURCE_BADGE = SOURCE_BADGE;
  readonly VITAL_SOURCE_LABELS = VITAL_SOURCE_LABELS;

  constructor(private vitalService: VitalService) {}

  ngOnInit(): void {
    this.loading.set(true);
    forkJoin({
      glucose: this.vitalService.listMyGlucose(),
      summary: this.vitalService.getMySummary(),
    }).subscribe({
      next: ({ glucose, summary }) => {
        this.readings.set(glucose);
        this.hba1c.set(summary.latestHba1c);
        this.loading.set(false);
      },
      error: () => this.loading.set(false),
    });
  }

  latest(): GlucoseReadingDto | null {
    return this.readings()[0] ?? null;
  }

  glucoseBadge(r: GlucoseReadingDto): string {
    return r.classification ? GLUCOSE_CLASS_BADGE[r.classification] : '';
  }

  chartSeries(): VitalChartSeries[] {
    const fastingPoints = this.readings()
      .filter(r => r.fasting != null)
      .map(r => ({ t: formatVitalDate(r.measuredAt), v: Number(r.fasting) }));
    return [{ label: 'Glycémie à jeun', color: '#10b981', points: fastingPoints }];
  }

  submit(): void {
    const fasting = parseOptionalNumber(this.fasting);
    const postprandial = parseOptionalNumber(this.post);
    if (fasting == null && postprandial == null) {
      this.error.set('Indiquez au moins une glycémie à jeun ou post-prandiale.');
      return;
    }
    this.saving.set(true);
    this.error.set('');
    this.vitalService.addMyGlucose({ fasting, postprandial }).subscribe({
      next: (created) => {
        this.readings.update(list => [created, ...list]);
        this.fasting = '';
        this.post = '';
        this.saving.set(false);
        this.success.set('Glycémie enregistrée.');
        setTimeout(() => this.success.set(''), 3500);
      },
      error: (err: HttpErrorResponse) => {
        this.saving.set(false);
        this.error.set(err.error?.detail || 'Impossible d\'enregistrer la glycémie.');
      },
    });
  }
}
