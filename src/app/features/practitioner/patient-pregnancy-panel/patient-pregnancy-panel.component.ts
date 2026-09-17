import { Component, Input, OnChanges, SimpleChanges, signal } from '@angular/core';
import { HttpErrorResponse } from '@angular/common/http';
import { FormsModule } from '@angular/forms';
import { PregnancyService } from '../../../core/services/pregnancy.service';
import { SyliSpinnerComponent } from '../../../shared/components/syli-spinner/syli-spinner.component';
import { apiErrorMessage } from '../../../core/utils/http-error';
import { formatLocalDate, todayLocalDateString } from '../../../core/utils/date-utils';
import { parseOptionalNumber } from '../../../core/models/vital.model';
import {
  PregnancyCloseReason,
  PregnancyOverviewDto,
  PREGNANCY_CLOSE_LABELS,
  PREGNANCY_CLOSE_OPTIONS,
} from '../../../core/models/pregnancy.model';

@Component({
  selector: 'app-patient-pregnancy-panel',
  standalone: true,
  imports: [FormsModule, SyliSpinnerComponent],
  template: `
    @if (loading() || error() || overview()?.eligible) {
      <div class="card mb-6 border border-rose-100">
        <p class="text-xs font-semibold uppercase tracking-wide text-rose-800 mb-1">Grossesse</p>
        <p class="text-xs text-gray-500 mb-3">
          Bannière SA = fait patient. Le détail des visites reste le vôtre (cloisonnement).
        </p>

        @if (error()) {
          <p class="text-xs text-red-700 bg-red-50 border border-red-100 rounded-lg px-2 py-1.5 mb-3">{{ error() }}</p>
        }
        @if (success()) {
          <p class="text-xs text-sky-700 mb-3">{{ success() }}</p>
        }

        @if (loading()) {
          <app-syli-spinner size="sm" [showLabel]="true" [centered]="true" />
        } @else if (overview()?.episode?.status === 'ACTIVE') {
          <div class="rounded-xl bg-rose-50 border border-rose-100 p-3 mb-4">
            <p class="text-lg font-bold text-rose-900">Enceinte · {{ overview()!.episode!.gestationalLabel }}</p>
            <p class="text-xs text-rose-700 mt-0.5">
              DPA {{ formatLocalDate(overview()!.episode!.dueDate) }}
              · {{ overview()!.visitCount }} visite{{ overview()!.visitCount > 1 ? 's' : '' }}
            </p>
          </div>

          <form class="grid sm:grid-cols-2 gap-2 mb-3" (ngSubmit)="addVisit()" novalidate>
            <label class="text-[11px] text-gray-500">
              Date visite
              <input class="input-field text-sm mt-0.5" type="date" name="visitDate" [(ngModel)]="visitDate" [max]="today"/>
            </label>
            <label class="text-[11px] text-gray-500">
              Poids kg
              <input class="input-field text-sm mt-0.5" type="number" step="0.1" name="weight" [(ngModel)]="weight"/>
            </label>
            <label class="text-[11px] text-gray-500">
              HU cm
              <input class="input-field text-sm mt-0.5" type="number" step="0.1" name="hu" [(ngModel)]="hu"/>
            </label>
            <label class="text-[11px] text-gray-500">
              RCF bpm
              <input class="input-field text-sm mt-0.5" type="number" name="rcf" [(ngModel)]="rcf"/>
            </label>
            <label class="text-[11px] text-gray-500 sm:col-span-2">
              Notes (visibles par la patiente)
              <textarea class="input-field text-sm mt-0.5" rows="2" name="notes" [(ngModel)]="notes"></textarea>
            </label>
            <button type="submit" class="btn-secondary text-sm py-2" [disabled]="saving()">Ajouter la visite</button>
          </form>
          <p class="text-[11px] text-gray-400 mb-3">Poids 30–200 kg · HU 10–50 cm · RCF 80–220 bpm</p>

          @if (overview()!.visits.length === 0) {
            <p class="text-xs text-gray-400">Vous n'avez pas encore enregistré de visite pour cette patiente.</p>
          } @else {
            <ul class="space-y-2 text-xs text-gray-600">
              @for (v of overview()!.visits; track v.id) {
                <li class="flex flex-col border-t border-gray-100 pt-2">
                  <span class="font-medium text-gray-800">{{ formatLocalDate(v.visitDate) }} · {{ v.gestationalLabel }}</span>
                  <span>
                    @if (v.weightKg != null) { {{ v.weightKg }} kg }
                    @if (v.fundalHeightCm != null) { · HU {{ v.fundalHeightCm }} }
                    @if (v.fetalHeartRate != null) { · RCF {{ v.fetalHeartRate }} }
                  </span>
                  @if (v.notes) {
                    <span class="text-gray-500 whitespace-pre-line">{{ v.notes }}</span>
                  }
                </li>
              }
            </ul>
          }

          <form class="flex gap-2 items-end mt-4" (ngSubmit)="close()" novalidate>
            <label class="text-[11px] text-gray-500 flex-1">
              Clôturer
              <select class="input-field text-sm mt-0.5" name="reason" [(ngModel)]="closeReason">
                @for (r of closeReasons; track r) {
                  <option [value]="r">{{ closeLabels[r] }}</option>
                }
              </select>
            </label>
            <button type="submit" class="btn-secondary text-sm py-2" [disabled]="saving()">OK</button>
          </form>
        } @else if (overview()?.eligible) {
          @if (overview()?.episode; as closed) {
            <p class="text-xs text-gray-500 mb-3">
              Dernier suivi clôturé ({{ closed.closedReasonLabel }}) le {{ formatLocalDate(closed.closedAt) }}.
            </p>
          }
          <form class="grid sm:grid-cols-3 gap-2 items-end" (ngSubmit)="start()" novalidate>
            <label class="text-[11px] text-gray-500">
              DDR
              <input class="input-field text-sm mt-0.5" type="date" name="lmp" [(ngModel)]="lmp" [max]="today"/>
            </label>
            <label class="text-[11px] text-gray-500">
              DPA (opt.)
              <input class="input-field text-sm mt-0.5" type="date" name="due" [(ngModel)]="due"/>
            </label>
            <button type="submit" class="btn-secondary text-sm py-2" [disabled]="saving()">Ouvrir</button>
          </form>
        }
      </div>
    }
  `,
})
export class PatientPregnancyPanelComponent implements OnChanges {
  @Input({ required: true }) patientUserId!: number;

  loading = signal(true);
  saving = signal(false);
  error = signal('');
  success = signal('');
  overview = signal<PregnancyOverviewDto | null>(null);
  lmp = '';
  due = '';
  visitDate = todayLocalDateString();
  weight = '';
  hu = '';
  rcf = '';
  notes = '';
  closeReason: PregnancyCloseReason = 'DELIVERY';
  readonly today = todayLocalDateString();
  readonly closeReasons = PREGNANCY_CLOSE_OPTIONS;
  readonly closeLabels = PREGNANCY_CLOSE_LABELS;
  readonly formatLocalDate = formatLocalDate;

  constructor(private pregnancyService: PregnancyService) {}

  ngOnChanges(changes: SimpleChanges): void {
    if (changes['patientUserId'] && this.patientUserId) {
      this.reload();
    }
  }

  start(): void {
    if (!this.lmp) {
      this.error.set('Indiquez la DDR.');
      return;
    }
    this.saving.set(true);
    this.error.set('');
    this.pregnancyService.startForPatient(this.patientUserId, {
      lastMenstrualPeriod: this.lmp,
      dueDate: this.due || null,
    }).subscribe({
      next: (data) => {
        this.overview.set(data);
        this.saving.set(false);
        this.success.set('Suivi ouvert.');
        setTimeout(() => this.success.set(''), 3000);
      },
      error: (err: HttpErrorResponse) => {
        this.saving.set(false);
        this.error.set(apiErrorMessage(err, 'Ouverture impossible.'));
      },
    });
  }

  close(): void {
    this.saving.set(true);
    this.error.set('');
    this.pregnancyService.closeForPatient(this.patientUserId, { reason: this.closeReason }).subscribe({
      next: (data) => {
        this.overview.set(data);
        this.saving.set(false);
        this.success.set('Suivi clôturé.');
        setTimeout(() => this.success.set(''), 3000);
      },
      error: (err: HttpErrorResponse) => {
        this.saving.set(false);
        this.error.set(apiErrorMessage(err, 'Clôture impossible.'));
      },
    });
  }

  addVisit(): void {
    if (!this.visitDate) {
      this.error.set('Indiquez la date de visite.');
      return;
    }
    const weightKg = parseOptionalNumber(this.weight);
    const fundalHeightCm = parseOptionalNumber(this.hu);
    const fetalHeartRate = parseOptionalNumber(this.rcf);
    if (weightKg == null && fundalHeightCm == null && fetalHeartRate == null && !this.notes.trim()) {
      this.error.set('Indiquez au moins une donnée (poids, HU, RCF ou notes).');
      return;
    }
    this.saving.set(true);
    this.error.set('');
    this.pregnancyService.addVisit(this.patientUserId, {
      visitDate: this.visitDate,
      weightKg,
      fundalHeightCm,
      fetalHeartRate,
      notes: this.notes.trim() || null,
    }).subscribe({
      next: (created) => {
        this.overview.update(o => o ? { ...o, visitCount: o.visitCount + 1, visits: [created, ...o.visits] } : o);
        this.weight = '';
        this.hu = '';
        this.rcf = '';
        this.notes = '';
        this.saving.set(false);
        this.success.set('Visite enregistrée.');
        setTimeout(() => this.success.set(''), 3000);
      },
      error: (err: HttpErrorResponse) => {
        this.saving.set(false);
        this.error.set(apiErrorMessage(err, 'Enregistrement visite impossible.'));
      },
    });
  }

  private reload(): void {
    this.loading.set(true);
    this.error.set('');
    this.pregnancyService.getForPatient(this.patientUserId).subscribe({
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
