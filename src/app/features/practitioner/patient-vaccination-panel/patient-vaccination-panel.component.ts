import { Component, Input, OnChanges, SimpleChanges, signal } from '@angular/core';
import { HttpErrorResponse } from '@angular/common/http';
import { FormsModule } from '@angular/forms';
import { VaccinationService } from '../../../core/services/vaccination.service';
import { SyliSpinnerComponent } from '../../../shared/components/syli-spinner/syli-spinner.component';
import { apiErrorMessage } from '../../../core/utils/http-error';
import { formatLocalDate, todayLocalDateString } from '../../../core/utils/date-utils';
import {
  CreateVaccinationRequest,
  VaccineCode,
  VaccinationOverviewDto,
  VACCINE_DOSE_OPTIONS,
  VACCINE_LABELS,
  VACCINE_OPTIONS,
  VACCINE_SOURCE_BADGE,
  VACCINE_SOURCE_LABELS,
  validateVaccination,
} from '../../../core/models/vaccination.model';

@Component({
  selector: 'app-patient-vaccination-panel',
  standalone: true,
  imports: [FormsModule, SyliSpinnerComponent],
  template: `
    <div class="card mb-6 border border-emerald-100">
      <p class="text-xs font-semibold uppercase tracking-wide text-emerald-800 mb-1">Carnet vaccinal</p>
      <p class="text-xs text-gray-500 mb-3">
        Fait patient — toutes les doses (auto-déclarées et professionnelles) sont visibles.
      </p>

      @if (error()) {
        <p class="text-xs text-red-700 bg-red-50 border border-red-100 rounded-lg px-2 py-1.5 mb-3">{{ error() }}</p>
      }
      @if (success()) {
        <p class="text-xs text-sky-700 mb-3">{{ success() }}</p>
      }

      @if (loading()) {
        <app-syli-spinner size="sm" [showLabel]="true" [centered]="true" />
      } @else {
        <p class="text-xs text-gray-500 mb-3">
          {{ overview()?.total ?? 0 }} dose{{ (overview()?.total ?? 0) > 1 ? 's' : '' }}
          · {{ overview()?.professionalCount ?? 0 }} professionnelle{{ (overview()?.professionalCount ?? 0) > 1 ? 's' : '' }}
        </p>

        <form class="grid sm:grid-cols-2 gap-2 mb-3" (ngSubmit)="add()" novalidate>
          <label class="text-[11px] text-gray-500">
            Vaccin
            <select class="input-field text-sm mt-0.5" name="code" [(ngModel)]="vaccineCode">
              <option value="">Choisir…</option>
              @for (code of vaccineOptions; track code) {
                <option [value]="code">{{ vaccineLabels[code] }}</option>
              }
            </select>
          </label>
          @if (vaccineCode === 'OTHER') {
            <label class="text-[11px] text-gray-500">
              Nom
              <input class="input-field text-sm mt-0.5" name="custom" [(ngModel)]="customName" maxlength="120"/>
            </label>
          }
          <label class="text-[11px] text-gray-500">
            Dose
            <select class="input-field text-sm mt-0.5" name="dose" [(ngModel)]="doseLabel">
              <option value="">Non précisée</option>
              @for (d of doseOptions; track d) {
                <option [value]="d">{{ d }}</option>
              }
            </select>
          </label>
          <label class="text-[11px] text-gray-500">
            Date
            <input class="input-field text-sm mt-0.5" type="date" name="on" [(ngModel)]="administeredOn" [max]="today"/>
          </label>
          <label class="text-[11px] text-gray-500">
            Lot (opt.)
            <input class="input-field text-sm mt-0.5" name="lot" [(ngModel)]="lotNumber" maxlength="40"/>
          </label>
          <label class="text-[11px] text-gray-500 sm:col-span-2">
            Notes
            <textarea class="input-field text-sm mt-0.5" rows="2" name="notes" [(ngModel)]="notes" maxlength="500"></textarea>
          </label>
          <button type="submit" class="btn-secondary text-sm py-2" [disabled]="saving()">Enregistrer</button>
        </form>

        @if (!overview()?.records?.length) {
          <p class="text-xs text-gray-400">Aucune dose pour ce patient.</p>
        } @else {
          <ul class="space-y-2 text-xs text-gray-600">
            @for (dose of overview()!.records; track dose.id) {
              <li class="flex items-start justify-between gap-2 border-t border-gray-100 pt-2">
                <div class="min-w-0">
                  <span class="font-medium text-gray-800">
                    {{ formatLocalDate(dose.administeredOn) }} · {{ dose.displayName }}
                    @if (dose.doseLabel) { · {{ dose.doseLabel }} }
                  </span>
                  <p class="text-gray-500 mt-0.5">
                    {{ dose.recordedByName }}
                    @if (dose.lotNumber) { · lot {{ dose.lotNumber }} }
                  </p>
                  @if (dose.notes) {
                    <p class="text-gray-500 whitespace-pre-line mt-0.5">{{ dose.notes }}</p>
                  }
                  <span class="inline-flex mt-1 text-[10px] font-medium px-2 py-0.5 rounded-full border"
                        [class]="sourceBadge(dose.source)">
                    {{ sourceLabels[dose.source] }}
                  </span>
                </div>
                <button type="button" class="text-red-600 hover:text-red-800 flex-shrink-0"
                        [disabled]="saving()" (click)="remove(dose.id)">
                  Retirer
                </button>
              </li>
            }
          </ul>
        }
      }
    </div>
  `,
})
export class PatientVaccinationPanelComponent implements OnChanges {
  @Input({ required: true }) patientUserId!: number;

  loading = signal(true);
  saving = signal(false);
  error = signal('');
  success = signal('');
  overview = signal<VaccinationOverviewDto | null>(null);

  vaccineCode: VaccineCode | '' = '';
  customName = '';
  doseLabel = '';
  administeredOn = todayLocalDateString();
  lotNumber = '';
  notes = '';

  readonly today = todayLocalDateString();
  readonly vaccineOptions = VACCINE_OPTIONS;
  readonly vaccineLabels = VACCINE_LABELS;
  readonly doseOptions = VACCINE_DOSE_OPTIONS;
  readonly sourceLabels = VACCINE_SOURCE_LABELS;
  readonly formatLocalDate = formatLocalDate;

  constructor(private vaccinationService: VaccinationService) {}

  ngOnChanges(changes: SimpleChanges): void {
    if (changes['patientUserId'] && this.patientUserId) {
      this.reload();
    }
  }

  sourceBadge(source: 'SELF' | 'PRACTITIONER'): string {
    return VACCINE_SOURCE_BADGE[source];
  }

  add(): void {
    const validation = validateVaccination({
      vaccineCode: this.vaccineCode,
      customName: this.customName,
      administeredOn: this.administeredOn,
    });
    if (validation) {
      this.error.set(validation);
      return;
    }
    const request: CreateVaccinationRequest = {
      vaccineCode: this.vaccineCode as VaccineCode,
      customName: this.vaccineCode === 'OTHER' ? this.customName.trim() : null,
      doseLabel: this.doseLabel || null,
      administeredOn: this.administeredOn,
      lotNumber: this.lotNumber.trim() || null,
      notes: this.notes.trim() || null,
    };
    this.saving.set(true);
    this.error.set('');
    this.vaccinationService.addForPatient(this.patientUserId, request).subscribe({
      next: (created) => {
        this.overview.update(o => o
          ? {
              ...o,
              total: o.total + 1,
              professionalCount: o.professionalCount + 1,
              latest: created,
              records: [created, ...o.records],
            }
          : o);
        this.customName = '';
        this.lotNumber = '';
        this.notes = '';
        this.saving.set(false);
        this.success.set('Vaccin enregistré.');
        setTimeout(() => this.success.set(''), 3000);
      },
      error: (err: HttpErrorResponse) => {
        this.saving.set(false);
        this.error.set(apiErrorMessage(err, 'Enregistrement impossible.'));
      },
    });
  }

  remove(id: number): void {
    this.saving.set(true);
    this.error.set('');
    this.vaccinationService.deleteForPatient(this.patientUserId, id).subscribe({
      next: () => {
        this.saving.set(false);
        this.success.set('Ligne retirée.');
        setTimeout(() => this.success.set(''), 3000);
        this.reload();
      },
      error: (err: HttpErrorResponse) => {
        this.saving.set(false);
        this.error.set(apiErrorMessage(err, 'Suppression impossible.'));
      },
    });
  }

  private reload(): void {
    this.loading.set(true);
    this.error.set('');
    this.vaccinationService.getForPatient(this.patientUserId).subscribe({
      next: (data) => {
        this.overview.set(data);
        this.loading.set(false);
      },
      error: (err: HttpErrorResponse) => {
        this.loading.set(false);
        this.error.set(apiErrorMessage(err, 'Impossible de charger le carnet vaccinal.'));
      },
    });
  }
}
