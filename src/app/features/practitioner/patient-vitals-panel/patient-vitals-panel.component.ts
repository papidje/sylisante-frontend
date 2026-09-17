import { Component, Input, OnChanges, SimpleChanges, signal } from '@angular/core';
import { HttpErrorResponse } from '@angular/common/http';
import { FormsModule } from '@angular/forms';
import { forkJoin } from 'rxjs';
import { VitalService } from '../../../core/services/vital.service';
import { SyliSpinnerComponent } from '../../../shared/components/syli-spinner/syli-spinner.component';
import { VitalChartComponent, VitalChartSeries } from '../../../shared/components/vital-chart/vital-chart.component';
import {
  BloodPressureReadingDto,
  GlucoseReadingDto,
  Hba1cReadingDto,
  BP_CLASS_BADGE,
  GLUCOSE_CLASS_BADGE,
  SOURCE_BADGE,
  VITAL_SOURCE_LABELS,
  formatBp,
  formatGlucoseValue,
  formatVitalDate,
  parseOptionalNumber,
  validateBloodPressure,
  validateGlucose,
  validateHba1c,
} from '../../../core/models/vital.model';
import { apiErrorMessage } from '../../../core/utils/http-error';

@Component({
  selector: 'app-patient-vitals-panel',
  standalone: true,
  imports: [FormsModule, SyliSpinnerComponent, VitalChartComponent],
  template: `
    <div class="card mb-6 border border-sky-100">
      <p class="text-xs font-semibold uppercase tracking-wide text-sky-800 mb-1">Constantes</p>
      <p class="text-xs text-gray-500 mb-4">
        Faits patient — lisibles car relation de soin. Trait plein = cabinet / labo, pointillé = domicile.
      </p>

      @if (error()) {
        <p class="text-xs text-red-600 mb-3">{{ error() }}</p>
      }
      @if (success()) {
        <p class="text-xs text-sky-700 mb-3">{{ success() }}</p>
      }

      @if (loading()) {
        <app-syli-spinner size="sm" [showLabel]="true" [centered]="true" />
      } @else {
        <div class="grid lg:grid-cols-2 gap-6">
          <div>
            <div class="flex items-baseline justify-between mb-2">
              <h3 class="text-sm font-semibold text-gray-900">Tension</h3>
              @if (latestBp(); as bp) {
                <span class="text-xs px-2 py-0.5 rounded-full border" [class]="BP_CLASS_BADGE[bp.classification]">
                  {{ formatBp(bp) }} · {{ bp.classificationLabel }}
                </span>
              }
            </div>
            <app-vital-chart [series]="bpSeries()" [distinguishSource]="true" ariaLabel="Tension patient"/>
            <form class="grid grid-cols-4 gap-2 mt-3 items-end" (ngSubmit)="submitBp()" novalidate>
              <label class="text-[11px] text-gray-500">
                SYS mmHg
                <input class="input-field text-sm mt-0.5" type="number" name="sys" [(ngModel)]="sys" placeholder="120"/>
              </label>
              <label class="text-[11px] text-gray-500">
                DIA mmHg
                <input class="input-field text-sm mt-0.5" type="number" name="dia" [(ngModel)]="dia" placeholder="80"/>
              </label>
              <label class="text-[11px] text-gray-500">
                Pouls bpm
                <input class="input-field text-sm mt-0.5" type="number" name="hr" [(ngModel)]="hr" placeholder="72"/>
              </label>
              <button type="submit" class="btn-secondary text-sm py-2" [disabled]="savingBp()">OK</button>
            </form>
            <p class="text-[11px] text-gray-400 mt-1">Bornes : SYS 60–250 · DIA 40–150 · SYS &gt; DIA · pouls 30–220</p>
            @if (bpError()) {
              <p class="text-xs text-red-700 bg-red-50 border border-red-100 rounded-lg px-2 py-1.5 mt-2">{{ bpError() }}</p>
            }
            <ul class="mt-3 space-y-1.5 text-xs text-gray-600">
              @for (r of bpReadings().slice(0, 5); track r.groupId) {
                <li class="flex justify-between gap-2">
                  <span>{{ formatVitalDate(r.measuredAt) }}</span>
                  <span class="font-medium">{{ formatBp(r) }}</span>
                  <span class="px-1.5 rounded-full border" [class]="SOURCE_BADGE[r.source]">
                    {{ VITAL_SOURCE_LABELS[r.source] }}
                  </span>
                </li>
              }
            </ul>
          </div>

          <div>
            <div class="flex items-baseline justify-between mb-2">
              <h3 class="text-sm font-semibold text-gray-900">Glycémie (mmol/L)</h3>
              @if (latestGlucose()?.classificationLabel) {
                <span class="text-xs px-2 py-0.5 rounded-full border"
                      [class]="glucoseBadge(latestGlucose()!)">
                  {{ latestGlucose()!.classificationLabel }}
                </span>
              }
            </div>
            <app-vital-chart [series]="glucoseSeries()" [distinguishSource]="true" ariaLabel="Glycémie patient"/>
            <form class="grid grid-cols-3 gap-2 mt-3 items-end" (ngSubmit)="submitGlucose()" novalidate>
              <label class="text-[11px] text-gray-500">
                À jeun mmol/L
                <input class="input-field text-sm mt-0.5" type="number" step="0.1" name="fasting" [(ngModel)]="fasting" placeholder="5,2"/>
              </label>
              <label class="text-[11px] text-gray-500">
                Post mmol/L
                <input class="input-field text-sm mt-0.5" type="number" step="0.1" name="post" [(ngModel)]="post" placeholder="7,8"/>
              </label>
              <button type="submit" class="btn-secondary text-sm py-2" [disabled]="savingGlucose()">OK</button>
            </form>
            <p class="text-[11px] text-gray-400 mt-1">Au moins une valeur · 1,5–35 mmol/L</p>
            @if (glucoseError()) {
              <p class="text-xs text-red-700 bg-red-50 border border-red-100 rounded-lg px-2 py-1.5 mt-2">{{ glucoseError() }}</p>
            }
            <form class="flex gap-2 mt-3 items-end" (ngSubmit)="submitHba1c()" novalidate>
              <label class="text-[11px] text-gray-500 flex-1">
                HbA1c %
                <input class="input-field text-sm mt-0.5" type="number" step="0.1" name="hba" [(ngModel)]="hba" placeholder="6,5"/>
              </label>
              <label class="text-xs text-gray-600 flex items-center gap-1 pb-2">
                <input type="checkbox" [(ngModel)]="labResult" name="lab"/> Labo
              </label>
              <button type="submit" class="btn-secondary text-sm py-2" [disabled]="savingHba()">HbA1c</button>
            </form>
            <p class="text-[11px] text-gray-400 mt-1">Bornes HbA1c : 3–20 %</p>
            @if (hbaError()) {
              <p class="text-xs text-red-700 bg-red-50 border border-red-100 rounded-lg px-2 py-1.5 mt-2">{{ hbaError() }}</p>
            }
            @if (hba1c()) {
              <p class="text-xs text-gray-500 mt-2">
                Dernière HbA1c : {{ hba1c()!.value }} % · {{ hba1c()!.classificationLabel }}
                · {{ VITAL_SOURCE_LABELS[hba1c()!.source] }}
              </p>
            }
            <ul class="mt-3 space-y-1.5 text-xs text-gray-600">
              @for (r of glucoseReadings().slice(0, 5); track r.groupId) {
                <li class="flex justify-between gap-2">
                  <span>{{ formatVitalDate(r.measuredAt) }}</span>
                  <span class="font-medium">{{ formatGlucoseValue(r.fasting ?? r.postprandial) }}</span>
                  <span class="px-1.5 rounded-full border" [class]="SOURCE_BADGE[r.source]">
                    {{ VITAL_SOURCE_LABELS[r.source] }}
                  </span>
                </li>
              }
            </ul>
          </div>
        </div>
      }
    </div>
  `,
})
export class PatientVitalsPanelComponent implements OnChanges {
  @Input({ required: true }) patientUserId!: number;

  loading = signal(true);
  error = signal('');
  bpError = signal('');
  glucoseError = signal('');
  hbaError = signal('');
  success = signal('');
  bpReadings = signal<BloodPressureReadingDto[]>([]);
  glucoseReadings = signal<GlucoseReadingDto[]>([]);
  hba1c = signal<Hba1cReadingDto | null>(null);

  sys = '';
  dia = '';
  hr = '';
  fasting = '';
  post = '';
  hba = '';
  labResult = true;
  savingBp = signal(false);
  savingGlucose = signal(false);
  savingHba = signal(false);

  readonly formatBp = formatBp;
  readonly formatGlucoseValue = formatGlucoseValue;
  readonly formatVitalDate = formatVitalDate;
  readonly BP_CLASS_BADGE = BP_CLASS_BADGE;
  readonly SOURCE_BADGE = SOURCE_BADGE;
  readonly VITAL_SOURCE_LABELS = VITAL_SOURCE_LABELS;

  constructor(private vitalService: VitalService) {}

  ngOnChanges(changes: SimpleChanges): void {
    if (changes['patientUserId'] && this.patientUserId) {
      this.reload();
    }
  }

  latestBp(): BloodPressureReadingDto | null {
    return this.bpReadings()[0] ?? null;
  }

  latestGlucose(): GlucoseReadingDto | null {
    return this.glucoseReadings()[0] ?? null;
  }

  glucoseBadge(r: GlucoseReadingDto): string {
    return r.classification ? GLUCOSE_CLASS_BADGE[r.classification] : '';
  }

  bpSeries(): VitalChartSeries[] {
    return [
      {
        label: 'SYS',
        color: '#ef4444',
        points: this.bpReadings().map(r => ({
          t: formatVitalDate(r.measuredAt),
          v: Number(r.systolic),
          source: r.source,
        })),
      },
      {
        label: 'DIA',
        color: '#0ea5e9',
        points: this.bpReadings().map(r => ({
          t: formatVitalDate(r.measuredAt),
          v: Number(r.diastolic),
          source: r.source,
        })),
      },
    ];
  }

  glucoseSeries(): VitalChartSeries[] {
    return [{
      label: 'À jeun',
      color: '#10b981',
      points: this.glucoseReadings()
        .filter(r => r.fasting != null)
        .map(r => ({ t: formatVitalDate(r.measuredAt), v: Number(r.fasting), source: r.source })),
    }];
  }

  submitBp(): void {
    const systolic = parseOptionalNumber(this.sys);
    const diastolic = parseOptionalNumber(this.dia);
    const heartRate = parseOptionalNumber(this.hr);
    const localError = validateBloodPressure(systolic, diastolic, heartRate);
    if (localError) {
      this.bpError.set(localError);
      return;
    }
    this.savingBp.set(true);
    this.bpError.set('');
    this.vitalService.addBloodPressureForPatient(this.patientUserId, {
      systolic: systolic!,
      diastolic: diastolic!,
      heartRate,
    }).subscribe({
      next: (created) => {
        this.bpReadings.update(list => [created, ...list]);
        this.sys = '';
        this.dia = '';
        this.hr = '';
        this.savingBp.set(false);
        this.success.set('Tension enregistrée (cabinet).');
        setTimeout(() => this.success.set(''), 3000);
      },
      error: (err: HttpErrorResponse) => {
        this.savingBp.set(false);
        this.bpError.set(apiErrorMessage(err, 'Enregistrement tension impossible.'));
      },
    });
  }

  submitGlucose(): void {
    const fasting = parseOptionalNumber(this.fasting);
    const postprandial = parseOptionalNumber(this.post);
    const localError = validateGlucose(fasting, postprandial);
    if (localError) {
      this.glucoseError.set(localError);
      return;
    }
    this.savingGlucose.set(true);
    this.glucoseError.set('');
    this.vitalService.addGlucoseForPatient(this.patientUserId, { fasting, postprandial }).subscribe({
      next: (created) => {
        this.glucoseReadings.update(list => [created, ...list]);
        this.fasting = '';
        this.post = '';
        this.savingGlucose.set(false);
        this.success.set('Glycémie enregistrée (cabinet).');
        setTimeout(() => this.success.set(''), 3000);
      },
      error: (err: HttpErrorResponse) => {
        this.savingGlucose.set(false);
        this.glucoseError.set(apiErrorMessage(err, 'Enregistrement glycémie impossible.'));
      },
    });
  }

  submitHba1c(): void {
    const value = parseOptionalNumber(this.hba);
    const localError = validateHba1c(value);
    if (localError) {
      this.hbaError.set(localError);
      return;
    }
    this.savingHba.set(true);
    this.hbaError.set('');
    this.vitalService.addHba1cForPatient(this.patientUserId, { value: value!, labResult: this.labResult }).subscribe({
      next: (created) => {
        this.hba1c.set(created);
        this.hba = '';
        this.savingHba.set(false);
        this.success.set('HbA1c enregistrée.');
        setTimeout(() => this.success.set(''), 3000);
      },
      error: (err: HttpErrorResponse) => {
        this.savingHba.set(false);
        this.hbaError.set(apiErrorMessage(err, 'Enregistrement HbA1c impossible.'));
      },
    });
  }

  private reload(): void {
    this.loading.set(true);
    this.error.set('');
    this.bpError.set('');
    this.glucoseError.set('');
    this.hbaError.set('');
    forkJoin({
      summary: this.vitalService.getSummaryForPatient(this.patientUserId),
      bp: this.vitalService.listBloodPressureForPatient(this.patientUserId),
      glucose: this.vitalService.listGlucoseForPatient(this.patientUserId),
    }).subscribe({
      next: ({ summary, bp, glucose }) => {
        this.bpReadings.set(bp);
        this.glucoseReadings.set(glucose);
        this.hba1c.set(summary.latestHba1c);
        this.loading.set(false);
      },
      error: (err: HttpErrorResponse) => {
        this.loading.set(false);
        this.error.set(apiErrorMessage(err, 'Impossible de charger les constantes.'));
      },
    });
  }
}
