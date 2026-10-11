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
  formatGlucoseValue,
  formatVitalDate,
  formatVitalDayMonth,
  parseOptionalNumber,
  validateGlucose,
} from '../../../core/models/vital.model';
import { apiErrorMessage } from '../../../core/utils/http-error';

type FollowTab = 'chart' | 'history' | 'advice';

@Component({
  selector: 'app-diabetes',
  standalone: true,
  imports: [FormsModule, RouterLink, SyliSpinnerComponent, VitalChartComponent],
  template: `
    <div class="max-w-3xl mx-auto px-4 py-8">
      <a routerLink="/dashboard/patient" class="text-sm text-primary-600 hover:text-primary-700">← Accueil</a>
      <h1 class="text-2xl font-bold text-gray-900 mt-3">Diabète / glycémie</h1>
      <p class="text-gray-500 mt-1 text-sm">
        Unité mmol/L. L'HbA1c est saisie par le praticien (bilan), pas sur le glucomètre à domicile.
      </p>

      @if (success()) {
        <div class="mt-4 bg-sky-50 border border-sky-200 rounded-lg p-3 text-sm text-sky-700">{{ success() }}</div>
      }

      @if (loading()) {
        <div class="mt-8"><app-syli-spinner size="md" [showLabel]="true" [centered]="true" /></div>
      } @else {
        @if (latest(); as g) {
          <div class="relative mt-6 overflow-hidden rounded-2xl border border-teal-800/40 bg-gradient-to-br from-slate-900 to-teal-950 px-5 py-6 sm:px-6 text-white">
            <div class="pointer-events-none absolute -top-8 -right-8 h-32 w-32 rounded-full bg-teal-300/10"></div>
            <p class="text-[11px] font-medium uppercase tracking-[0.16em] text-teal-100/80">
              Dernière mesure · {{ formatVitalDayMonth(g.measuredAt) }}
            </p>
            <p class="mt-2 text-5xl font-bold leading-none tracking-tight">
              {{ headlineGlucose(g) }}<span class="text-lg font-medium text-white/70"> mmol/L</span>
            </p>
            @if (glucoseContext(g)) {
              <p class="mt-2 text-sm text-white/70">{{ glucoseContext(g) }}</p>
            }
            @if (g.classificationLabel) {
              <span class="mt-3 inline-flex items-center rounded-full bg-teal-300/20 px-3.5 py-1 text-xs font-semibold text-teal-50 pointer-events-none select-none">
                {{ g.classificationLabel }}
              </span>
            }
          </div>
        }

        <div class="grid gap-4 mt-4" [class.sm:grid-cols-2]="!!latest()" [class.sm:grid-cols-3]="!latest()">
          @if (!latest()) {
            <div class="card">
              <p class="text-xs uppercase tracking-wide text-gray-400">À jeun</p>
              <p class="text-2xl font-bold mt-1">—</p>
            </div>
          }
          <div class="card">
            <p class="text-xs uppercase tracking-wide text-gray-400">Post-prandiale</p>
            <p class="text-2xl font-bold mt-1">{{ formatGlucoseValue(latest()?.postprandial) }}</p>
          </div>
          <div class="card">
            <p class="text-xs uppercase tracking-wide text-gray-400">HbA1c</p>
            <p class="text-2xl font-bold mt-1">{{ hba1c() ? hba1c()!.value + ' %' : '—' }}</p>
            @if (hba1c()) {
              <span class="inline-flex mt-2 text-xs font-medium px-2.5 py-1 rounded-full border pointer-events-none"
                    [class]="hba1c()!.onTarget
                      ? 'bg-emerald-50 text-emerald-700 border-emerald-300'
                      : 'bg-orange-50 text-orange-700 border-orange-300'">
                {{ hba1c()!.onTarget ? 'Dans la cible' : 'Au-dessus' }}
              </span>
            } @else {
              <p class="text-xs text-gray-400 mt-2">Saisie réservée au praticien</p>
            }
          </div>
        </div>

        <div class="card mt-6 !p-0 overflow-hidden">
          <div class="grid grid-cols-3 border-b border-slate-100" role="tablist">
            @for (item of tabs; track item.id) {
              <button type="button" role="tab"
                      class="py-3 text-sm font-medium border-b-2 transition-colors"
                      [class.border-primary-600]="tab() === item.id"
                      [class.text-primary-700]="tab() === item.id"
                      [class.border-transparent]="tab() !== item.id"
                      [class.text-slate-500]="tab() !== item.id"
                      [attr.aria-selected]="tab() === item.id"
                      (click)="tab.set(item.id)">
                {{ item.label }}
              </button>
            }
          </div>

          <div class="p-4 sm:p-6">
            @if (tab() === 'chart') {
              <app-vital-chart [series]="chartSeries()" [distinguishSource]="true" ariaLabel="Évolution de la glycémie à jeun"/>
            }

            @if (tab() === 'history') {
              @if (readings().length === 0) {
                <p class="text-sm text-gray-400">Aucune glycémie enregistrée.</p>
              } @else {
                <ul class="divide-y divide-slate-100">
                  @for (r of readings(); track r.groupId; let first = $first) {
                    <li class="flex items-center gap-3 py-3 px-2 rounded-xl" [class.bg-slate-50]="first">
                      <span class="w-12 shrink-0 text-center text-sm font-semibold text-slate-700 tabular-nums">
                        {{ formatVitalDayMonth(r.measuredAt) }}
                      </span>
                      <span class="flex-1 min-w-0 text-sm text-slate-900">
                        @if (r.fasting != null && r.postprandial != null) {
                          <span class="font-bold">{{ r.fasting }}</span>
                          <span class="font-normal text-slate-400"> / </span>
                          <span class="font-bold">{{ r.postprandial }}</span>
                        } @else if (r.fasting != null) {
                          <span class="font-bold">{{ r.fasting }}</span>
                        } @else {
                          <span class="font-bold">{{ r.postprandial }}</span>
                        }
                        <span class="font-normal text-slate-500"> mmol/L</span>
                      </span>
                      @if (r.classificationLabel) {
                        <span class="shrink-0 inline-flex items-center px-2.5 py-1 rounded-full border text-xs font-medium pointer-events-none select-none"
                              [class]="glucoseBadge(r)">
                          {{ r.classificationLabel }}
                        </span>
                      }
                    </li>
                  }
                </ul>
              }
            }

            @if (tab() === 'advice') {
              <ul class="space-y-2">
                @for (tip of advice; track tip.title) {
                  <li class="flex gap-3 rounded-xl border border-slate-100 p-3.5">
                    <span class="text-xl leading-none" aria-hidden="true">{{ tip.icon }}</span>
                    <div>
                      <p class="text-sm font-semibold text-slate-900">{{ tip.title }}</p>
                      <p class="text-xs text-slate-500 mt-0.5 leading-relaxed">{{ tip.body }}</p>
                    </div>
                  </li>
                }
              </ul>
              <p class="text-xs text-slate-400 mt-3">Repères indicatifs, pas une prescription.</p>
            }
          </div>
        </div>

        @if (showForm()) {
          <div class="card mt-4">
            <h2 class="text-base font-semibold text-gray-900 mb-4">Nouvelle mesure</h2>
            @if (error()) {
              <div class="mb-4 bg-red-50 border border-red-200 rounded-lg p-3 text-sm text-red-700">{{ error() }}</div>
            }
            <form class="space-y-4" (ngSubmit)="submit()" novalidate>
              <div class="grid sm:grid-cols-2 gap-3">
                <label class="text-sm text-gray-700">
                  À jeun (mmol/L)
                  <input class="input-field mt-1" type="number" step="0.1" name="fasting" [(ngModel)]="fasting" placeholder="5,2"/>
                </label>
                <label class="text-sm text-gray-700">
                  Post-prandiale (mmol/L)
                  <input class="input-field mt-1" type="number" step="0.1" name="post" [(ngModel)]="post" placeholder="7,8"/>
                </label>
              </div>
              <p class="text-xs text-gray-400">Au moins une valeur · bornes 1,5–35 mmol/L</p>
              <div class="flex gap-2">
                <button type="button" class="btn-secondary flex-1 sm:flex-none sm:min-w-[8.5rem]" (click)="cancel()" [disabled]="saving()">
                  Annuler
                </button>
                <button type="submit" class="btn-primary flex-[1.6] sm:flex-none sm:min-w-[8.5rem]" [disabled]="saving()">
                  @if (saving()) { Enregistrement… } @else { Enregistrer }
                </button>
              </div>
            </form>
          </div>
        } @else {
          <button type="button" class="btn-primary w-full sm:w-auto mt-4" (click)="openForm()">
            Nouvelle mesure
          </button>
        }
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
  showForm = signal(false);
  tab = signal<FollowTab>('chart');
  fasting = '';
  post = '';

  readonly formatGlucoseValue = formatGlucoseValue;
  readonly formatVitalDayMonth = formatVitalDayMonth;
  readonly tabs: { id: FollowTab; label: string }[] = [
    { id: 'chart', label: 'Courbe' },
    { id: 'history', label: 'Historique' },
    { id: 'advice', label: 'Conseils' },
  ];
  readonly advice = [
    { icon: '🥗', title: 'Alimentation', body: 'Réduisez les sucres rapides. Préférez les légumineuses, les légumes et le poisson.' },
    { icon: '🚶', title: 'Activité', body: 'Une marche de 30 minutes après les repas principaux aide à faire baisser la glycémie.' },
    { icon: '💊', title: 'Traitement', body: 'Prenez-le aux mêmes heures. Ne sautez pas une dose sans avis médical.' },
    { icon: '📊', title: 'Repères', body: 'À jeun souvent visé entre 4,4 et 7,2 mmol/L, post-repas sous 10 mmol/L, HbA1c sous 7 %. Votre médecin ajuste ces cibles.' },
  ];

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

  headlineGlucose(g: GlucoseReadingDto): string {
    const value = g.fasting ?? g.postprandial;
    return value == null ? '—' : String(value);
  }

  glucoseContext(g: GlucoseReadingDto): string {
    if (g.fasting != null && g.postprandial != null) {
      return `Post-repas : ${g.postprandial} mmol/L`;
    }
    if (g.fasting != null) return 'À jeun';
    return g.postprandial != null ? 'Post-prandiale' : '';
  }

  glucoseBadge(r: GlucoseReadingDto): string {
    return r.classification ? GLUCOSE_CLASS_BADGE[r.classification] : '';
  }

  chartSeries(): VitalChartSeries[] {
    const fastingPoints = this.readings()
      .filter(r => r.fasting != null)
      .map(r => ({ t: formatVitalDate(r.measuredAt), v: Number(r.fasting), source: r.source }));
    return [{ label: 'Glycémie à jeun', color: '#10b981', points: fastingPoints }];
  }

  openForm(): void {
    this.error.set('');
    this.showForm.set(true);
  }

  cancel(): void {
    this.fasting = '';
    this.post = '';
    this.error.set('');
    this.showForm.set(false);
  }

  submit(): void {
    const fasting = parseOptionalNumber(this.fasting);
    const postprandial = parseOptionalNumber(this.post);
    const localError = validateGlucose(fasting, postprandial);
    if (localError) {
      this.error.set(localError);
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
        this.showForm.set(false);
        this.success.set('Glycémie enregistrée.');
        setTimeout(() => this.success.set(''), 3500);
      },
      error: (err: HttpErrorResponse) => {
        this.saving.set(false);
        this.error.set(apiErrorMessage(err, 'Impossible d\'enregistrer la glycémie.'));
      },
    });
  }
}
