import { Component, Input, OnChanges, SimpleChanges, signal } from '@angular/core';
import { HttpErrorResponse } from '@angular/common/http';
import { FormsModule } from '@angular/forms';
import { ClinicalProfileService } from '../../../core/services/clinical-profile.service';
import { PatientPregnancyPanelComponent } from '../patient-pregnancy-panel/patient-pregnancy-panel.component';
import { PatientVaccinationPanelComponent } from '../patient-vaccination-panel/patient-vaccination-panel.component';
import { PatientVitalsPanelComponent } from '../patient-vitals-panel/patient-vitals-panel.component';
import {
  BloodType,
  BLOOD_TYPE_LABELS,
  BLOOD_TYPE_OPTIONS,
  ClinicalProfileDto,
} from '../../../core/models/clinical-profile.model';
import { apiErrorMessage } from '../../../core/utils/http-error';
import { SyliSpinnerComponent } from '../../../shared/components/syli-spinner/syli-spinner.component';

@Component({
  selector: 'app-patient-clinical-sheet',
  standalone: true,
  imports: [
    FormsModule,
    SyliSpinnerComponent,
    PatientPregnancyPanelComponent,
    PatientVaccinationPanelComponent,
    PatientVitalsPanelComponent,
  ],
  template: `
    <div [class.space-y-4]="true">
      @if (loading()) {
        <app-syli-spinner size="sm" [showLabel]="true" [centered]="true" />
      } @else if (clinical()) {
        <div class="card border border-amber-100 bg-amber-50/40" [class.mb-0]="compact">
          <p class="text-xs font-semibold uppercase tracking-wide text-amber-800 mb-3">Faits patient</p>
          <div class="grid sm:grid-cols-3 gap-3 text-sm mb-4">
            <div>
              <p class="text-xs text-slate-500">Groupe sanguin</p>
              <p class="font-semibold text-slate-900">{{ clinical()!.bloodTypeLabel || '—' }}</p>
            </div>
            <div>
              <p class="text-xs text-slate-500">NIN</p>
              <p class="font-semibold text-slate-900">{{ clinical()!.nationalIdMasked || '—' }}</p>
            </div>
            <div>
              <p class="text-xs text-slate-500">Allergies</p>
              <p class="font-semibold text-red-700">{{ allergySummary() }}</p>
            </div>
          </div>
          <div class="flex flex-col sm:flex-row gap-3">
            <select class="input text-sm" [(ngModel)]="bloodTypeDraft" (change)="saveBloodType()">
              <option value="">Groupe sanguin…</option>
              @for (t of bloodTypes; track t) {
                <option [value]="t">{{ bloodLabels[t] }}</option>
              }
            </select>
            <div class="flex gap-2 flex-1">
              <input class="input text-sm flex-1" [(ngModel)]="allergyDraft" placeholder="Ajouter une allergie"/>
              <button type="button" class="btn-secondary text-sm" (click)="addAllergy()" [disabled]="!allergyDraft.trim()">
                Ajouter
              </button>
            </div>
          </div>
          @if (clinicalError()) {
            <p class="text-xs text-red-600 mt-2">{{ clinicalError() }}</p>
          }
        </div>
      }

      <app-patient-pregnancy-panel [patientUserId]="patientUserId" />
      <app-patient-vaccination-panel [patientUserId]="patientUserId" />
      <app-patient-vitals-panel [patientUserId]="patientUserId" />
    </div>
  `,
})
export class PatientClinicalSheetComponent implements OnChanges {
  @Input({ required: true }) patientUserId!: number;
  @Input() compact = false;

  loading = signal(true);
  clinical = signal<ClinicalProfileDto | null>(null);
  clinicalError = signal('');
  bloodTypeDraft = '';
  allergyDraft = '';
  readonly bloodTypes = BLOOD_TYPE_OPTIONS;
  readonly bloodLabels = BLOOD_TYPE_LABELS;

  constructor(private clinicalProfileService: ClinicalProfileService) {}

  ngOnChanges(changes: SimpleChanges): void {
    if (changes['patientUserId'] && this.patientUserId) {
      this.reload();
    }
  }

  allergySummary(): string {
    const allergies = this.clinical()?.allergies ?? [];
    return allergies.length ? allergies.map(a => a.substance).join(', ') : 'Aucune';
  }

  saveBloodType(): void {
    const next = this.bloodTypeDraft as BloodType | '';
    const current = this.clinical()?.bloodType ?? '';
    if (!next || next === current) {
      return;
    }
    this.clinicalError.set('');
    this.clinicalProfileService.updateForPatient(this.patientUserId, { bloodType: next }).subscribe({
      next: (c) => this.clinical.set(c),
      error: (err: HttpErrorResponse) => {
        this.clinicalError.set(apiErrorMessage(err, 'Impossible d\'enregistrer le groupe sanguin.'));
        this.bloodTypeDraft = current;
      },
    });
  }

  addAllergy(): void {
    const substance = this.allergyDraft.trim();
    if (substance.length < 2) {
      return;
    }
    this.clinicalError.set('');
    this.clinicalProfileService.addAllergyForPatient(this.patientUserId, { substance }).subscribe({
      next: (created) => {
        this.clinical.update(c => c ? { ...c, allergies: [created, ...c.allergies] } : c);
        this.allergyDraft = '';
      },
      error: (err: HttpErrorResponse) => {
        this.clinicalError.set(apiErrorMessage(err, 'Impossible d\'ajouter l\'allergie.'));
      },
    });
  }

  private reload(): void {
    this.loading.set(true);
    this.clinicalError.set('');
    this.clinicalProfileService.getForPatient(this.patientUserId).subscribe({
      next: (c) => {
        this.clinical.set(c);
        this.bloodTypeDraft = c.bloodType ?? '';
        this.loading.set(false);
      },
      error: () => {
        this.clinical.set(null);
        this.loading.set(false);
      },
    });
  }
}
