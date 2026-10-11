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
  formatBp,
  formatVitalDate,
  formatVitalDayMonth,
  parseOptionalNumber,
  validateBloodPressure,
} from '../../../core/models/vital.model';

type FollowTab = 'chart' | 'history' | 'advice';

@Component({
  selector: 'app-blood-pressure',
  standalone: true,
  imports: [FormsModule, RouterLink, SyliSpinnerComponent, VitalChartComponent],
  template: `
    <div class="max-w-3xl mx-auto px-4 py-8">
      <a routerLink="/dashboard/patient" class="text-sm text-primary-600 hover:text-primary-700">← Accueil</a>
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

      @if (success()) {
        <div class="mt-4 bg-sky-50 border border-sky-200 rounded-lg p-3 text-sm text-sky-700">{{ success() }}</div>
      }

      @if (loading()) {
        <div class="mt-8"><app-syli-spinner size="md" [showLabel]="true" [centered]="true" /></div>
      } @else {
        @if (latest(); as bp) {
          <div class="relative mt-6 overflow-hidden rounded-2xl border border-red-900/40 bg-gradient-to-br from-slate-900 to-red-950 px-5 py-6 sm:px-6 text-white">
            <div class="pointer-events-none absolute -top-8 -right-8 h-32 w-32 rounded-full bg-white/10"></div>
            <p class="text-[11px] font-medium uppercase tracking-[0.16em] text-white/70">
              Dernière mesure · {{ formatVitalDayMonth(bp.measuredAt) }}
            </p>
            <p class="mt-2 text-5xl font-bold leading-none tracking-tight">
              {{ bp.systolic }}<span class="text-2xl font-semibold text-white/70">/{{ bp.diastolic }}</span>
            </p>
            <p class="mt-2 text-sm text-white/75">
              mmHg
              @if (bp.heartRate != null) {
                · FC : {{ bp.heartRate }} bpm
              }
            </p>
            <span class="mt-3 inline-flex items-center rounded-full bg-white/20 px-3.5 py-1 text-xs font-semibold pointer-events-none select-none">
              {{ bp.classificationLabel }}
            </span>
          </div>
          <div class="grid grid-cols-2 gap-4 mt-4">
            <div class="card">
              <p class="text-xs uppercase tracking-wide text-gray-400">Pouls</p>
              <p class="text-2xl font-bold mt-1">{{ bp.heartRate ?? '—' }}</p>
            </div>
            <div class="card">
              <p class="text-xs uppercase tracking-wide text-gray-400">Mesures</p>
              <p class="text-2xl font-bold mt-1">{{ readings().length }}</p>
            </div>
          </div>
        }

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
              <app-vital-chart [series]="chartSeries()" [distinguishSource]="true" ariaLabel="Évolution de la tension"/>
            }

            @if (tab() === 'history') {
              @if (readings().length === 0) {
                <p class="text-sm text-gray-400">Aucune mesure enregistrée.</p>
              } @else {
                <ul class="divide-y divide-slate-100">
                  @for (r of readings(); track r.groupId; let first = $first) {
                    <li class="flex items-center gap-3 py-3 px-2 rounded-xl" [class.bg-slate-50]="first">
                      <span class="w-12 shrink-0 text-center text-sm font-semibold text-slate-700 tabular-nums">
                        {{ formatVitalDayMonth(r.measuredAt) }}
                      </span>
                      <span class="flex-1 min-w-0 text-sm text-slate-900">
                        <span class="font-bold">{{ formatBp(r) }}</span>
                        <span class="font-normal text-slate-500"> mmHg</span>
                        @if (r.heartRate != null) {
                          <span class="font-normal text-slate-400"> · {{ r.heartRate }} bpm</span>
                        }
                      </span>
                      <span class="shrink-0 inline-flex items-center px-2.5 py-1 rounded-full border text-xs font-medium pointer-events-none select-none"
                            [class]="bpBadge(r)">
                        {{ r.classificationLabel }}
                      </span>
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
              <div class="mt-3 rounded-xl border border-red-200 bg-red-50 p-3.5">
                <p class="text-sm font-semibold text-red-700">Urgence si tension &gt; 180/120</p>
                <p class="text-xs text-red-800/80 mt-1 leading-relaxed">
                  Maux de tête, vision floue ou douleur thoracique : consultez immédiatement. Ces conseils ne remplacent pas un avis médical.
                </p>
              </div>
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
              <div class="grid sm:grid-cols-3 gap-3">
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
              </div>
              <p class="text-xs text-gray-400">Bornes : SYS 60–250 · DIA 40–150 · SYS &gt; DIA · pouls 30–220</p>
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
export class BloodPressureComponent implements OnInit {
  readings = signal<BloodPressureReadingDto[]>([]);
  loading = signal(true);
  saving = signal(false);
  error = signal('');
  success = signal('');
  showForm = signal(false);
  tab = signal<FollowTab>('chart');
  sys = '';
  dia = '';
  hr = '';

  readonly formatBp = formatBp;
  readonly formatVitalDayMonth = formatVitalDayMonth;
  readonly tabs: { id: FollowTab; label: string }[] = [
    { id: 'chart', label: 'Courbe' },
    { id: 'history', label: 'Historique' },
    { id: 'advice', label: 'Conseils' },
  ];
  readonly advice = [
    { icon: '🧂', title: 'Sel', body: 'Moins de 5 g par jour. Limitez le bouillon cube et les plats très salés.' },
    { icon: '🏃', title: 'Activité', body: '30 minutes de marche rapide par jour, si votre médecin ne vous l\'a pas déconseillée.' },
    { icon: '💊', title: 'Traitement', body: 'Ne l\'arrêtez pas de vous-même, même si vous vous sentez bien.' },
    { icon: '😴', title: 'Sommeil', body: 'Visez 7 à 8 heures. Le stress et le manque de sommeil font monter la tension.' },
  ];

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

  openForm(): void {
    this.error.set('');
    this.showForm.set(true);
  }

  cancel(): void {
    this.sys = '';
    this.dia = '';
    this.hr = '';
    this.error.set('');
    this.showForm.set(false);
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
        this.showForm.set(false);
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
