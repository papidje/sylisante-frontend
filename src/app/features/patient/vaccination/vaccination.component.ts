import { Component, OnInit, signal } from '@angular/core';
import { HttpErrorResponse } from '@angular/common/http';
import { FormsModule } from '@angular/forms';
import { RouterLink } from '@angular/router';
import { VaccinationService } from '../../../core/services/vaccination.service';
import { SyliSpinnerComponent } from '../../../shared/components/syli-spinner/syli-spinner.component';
import { apiErrorMessage } from '../../../core/utils/http-error';
import { formatLocalDate, todayLocalDateString } from '../../../core/utils/date-utils';
import {
  CreateVaccinationRequest,
  VaccineCode,
  VaccinationOverviewDto,
  VaccineGroup,
  VACCINE_DOSE_OPTIONS,
  VACCINE_LABELS,
  VACCINE_OPTIONS,
  VACCINE_SOURCE_BADGE,
  VACCINE_SOURCE_LABELS,
  groupVaccinations,
  validateVaccination,
} from '../../../core/models/vaccination.model';

@Component({
  selector: 'app-vaccination',
  standalone: true,
  imports: [FormsModule, RouterLink, SyliSpinnerComponent],
  template: `
    <div class="max-w-3xl mx-auto px-4 py-8">
      <a routerLink="/health" class="text-sm text-primary-600 hover:text-primary-700">← Suivi</a>
      <h1 class="text-2xl font-bold text-gray-900 mt-3">Carnet vaccinal</h1>
      <p class="text-gray-500 mt-1 text-sm">
        Catalogue PEV / usage courant. Pas de certificat ni de QR en V1 — ce n'est pas un calendrier « à jour ».
      </p>

      @if (error()) {
        <div class="mt-4 bg-red-50 border border-red-200 rounded-lg p-3 text-sm text-red-700">{{ error() }}</div>
      }
      @if (success()) {
        <div class="mt-4 bg-sky-50 border border-sky-200 rounded-lg p-3 text-sm text-sky-700">{{ success() }}</div>
      }

      @if (loading()) {
        <div class="mt-8"><app-syli-spinner size="md" [showLabel]="true" [centered]="true" /></div>
      } @else {
        <div class="grid sm:grid-cols-3 gap-3 mt-6">
          <div class="card">
            <p class="text-xs uppercase tracking-wide text-gray-400">Total</p>
            <p class="text-2xl font-bold text-gray-900 mt-1">{{ overview()?.total ?? 0 }}</p>
          </div>
          <div class="card">
            <p class="text-xs uppercase tracking-wide text-gray-400">Professionnels</p>
            <p class="text-2xl font-bold text-emerald-700 mt-1">{{ overview()?.professionalCount ?? 0 }}</p>
          </div>
          <div class="card">
            <p class="text-xs uppercase tracking-wide text-gray-400">Auto-déclarés</p>
            <p class="text-2xl font-bold text-amber-700 mt-1">{{ overview()?.selfCount ?? 0 }}</p>
          </div>
        </div>

        <div class="card mt-6">
          <h2 class="text-base font-semibold text-gray-900 mb-1">Ajouter un vaccin</h2>
          <p class="text-xs text-gray-400 mb-4">
            Déclarez une dose reçue. Les lignes professionnelles restent gérées par le praticien.
          </p>
          <form class="grid sm:grid-cols-2 gap-3" (ngSubmit)="add()" novalidate>
            <label class="text-sm text-gray-700">
              Vaccin
              <select class="input-field mt-1" name="code" [(ngModel)]="vaccineCode">
                <option value="">Choisir…</option>
                @for (code of vaccineOptions; track code) {
                  <option [value]="code">{{ vaccineLabels[code] }}</option>
                }
              </select>
            </label>
            @if (vaccineCode === 'OTHER') {
              <label class="text-sm text-gray-700">
                Nom du vaccin
                <input class="input-field mt-1" name="custom" [(ngModel)]="customName" maxlength="120"/>
              </label>
            }
            <label class="text-sm text-gray-700">
              Dose
              <select class="input-field mt-1" name="dose" [(ngModel)]="doseLabel">
                <option value="">Non précisée</option>
                @for (d of doseOptions; track d) {
                  <option [value]="d">{{ d }}</option>
                }
              </select>
            </label>
            <label class="text-sm text-gray-700">
              Date
              <input class="input-field mt-1" type="date" name="on" [(ngModel)]="administeredOn" [max]="today"/>
            </label>
            <label class="text-sm text-gray-700 sm:col-span-2">
              Notes (opt.)
              <textarea class="input-field mt-1" rows="2" name="notes" [(ngModel)]="notes" maxlength="500"></textarea>
            </label>
            <button type="submit" class="btn-primary sm:col-span-2" [disabled]="saving()">
              @if (saving()) { Enregistrement… } @else { Enregistrer }
            </button>
          </form>
        </div>

        <div class="card mt-6">
          <h2 class="text-base font-semibold text-gray-900 mb-3">Historique</h2>
          @if (groups().length === 0) {
            <p class="text-sm text-gray-400">Aucune dose enregistrée pour le moment.</p>
          } @else {
            <div class="space-y-5">
              @for (group of groups(); track group.key) {
                <div>
                  <p class="text-sm font-semibold text-gray-900">{{ group.name }}</p>
                  <ul class="mt-2 space-y-2">
                    @for (dose of group.doses; track dose.id) {
                      <li class="flex items-start justify-between gap-3 border border-gray-100 rounded-xl p-3">
                        <div class="min-w-0">
                          <p class="text-sm font-medium text-gray-800">
                            {{ formatLocalDate(dose.administeredOn) }}
                            @if (dose.doseLabel) { · {{ dose.doseLabel }} }
                          </p>
                          <p class="text-xs text-gray-500 mt-0.5">
                            {{ dose.recordedByName }}
                            @if (dose.lotNumber) { · lot {{ dose.lotNumber }} }
                          </p>
                          @if (dose.notes) {
                            <p class="text-xs text-gray-600 mt-1 whitespace-pre-line">{{ dose.notes }}</p>
                          }
                          <span class="inline-flex mt-2 text-[11px] font-medium px-2 py-0.5 rounded-full border"
                                [class]="sourceBadge(dose.source)">
                            {{ sourceLabels[dose.source] }}
                          </span>
                        </div>
                        @if (dose.canDelete) {
                          <button type="button" class="text-xs text-red-600 hover:text-red-800 flex-shrink-0"
                                  [disabled]="saving()" (click)="remove(dose.id)">
                            Retirer
                          </button>
                        }
                      </li>
                    }
                  </ul>
                </div>
              }
            </div>
          }
        </div>
      }
    </div>
  `,
})
export class VaccinationComponent implements OnInit {
  loading = signal(true);
  saving = signal(false);
  error = signal('');
  success = signal('');
  overview = signal<VaccinationOverviewDto | null>(null);

  vaccineCode: VaccineCode | '' = '';
  customName = '';
  doseLabel = '';
  administeredOn = todayLocalDateString();
  notes = '';

  readonly today = todayLocalDateString();
  readonly vaccineOptions = VACCINE_OPTIONS;
  readonly vaccineLabels = VACCINE_LABELS;
  readonly doseOptions = VACCINE_DOSE_OPTIONS;
  readonly sourceLabels = VACCINE_SOURCE_LABELS;
  readonly formatLocalDate = formatLocalDate;

  constructor(private vaccinationService: VaccinationService) {}

  ngOnInit(): void {
    this.reload();
  }

  groups(): VaccineGroup[] {
    return groupVaccinations(this.overview()?.records ?? []);
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
      notes: this.notes.trim() || null,
    };
    this.saving.set(true);
    this.error.set('');
    this.vaccinationService.addMine(request).subscribe({
      next: () => {
        this.saving.set(false);
        this.customName = '';
        this.notes = '';
        this.success.set('Vaccin enregistré.');
        setTimeout(() => this.success.set(''), 3000);
        this.reload();
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
    this.vaccinationService.deleteMine(id).subscribe({
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
    this.vaccinationService.getMine().subscribe({
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
