import { Component, EventEmitter, Input, OnChanges, Output, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { HttpErrorResponse } from '@angular/common/http';
import { PractitionerService } from '../../../core/services/practitioner.service';
import { UserProfileService } from '../../../core/services/user-profile.service';
import { AdminService } from '../../../core/services/admin.service';
import { PractitionerProfileDto } from '../../../core/models/practitioner.model';
import { PatientProfileViewDto, GENDER_LABELS } from '../../../core/models/user-profile.model';
import { AdminUserDetailDto, ROLE_LABELS, USER_STATUS_LABELS } from '../../../core/models/user.model';
import { SyliSpinnerComponent } from '../syli-spinner/syli-spinner.component';
import { formatLocalDate } from '../../../core/utils/date-utils';

export type ProfileViewMode = 'practitioner' | 'patient' | 'admin';

@Component({
  selector: 'app-user-profile-modal',
  standalone: true,
  imports: [CommonModule, SyliSpinnerComponent],
  template: `
    @if (visible) {
      <div class="fixed inset-0 z-50 flex items-center justify-center p-4" (click)="close()">
        <div class="absolute inset-0 bg-slate-900/40 backdrop-blur-sm"></div>
        <div class="relative bg-white rounded-2xl shadow-2xl w-full max-w-lg max-h-[90vh] overflow-y-auto border border-slate-100"
             (click)="$event.stopPropagation()" role="dialog" aria-modal="true">

          <div class="sticky top-0 bg-white px-6 pt-6 pb-4 border-b border-slate-100 flex items-start justify-between gap-4">
            <div>
              <h2 class="text-lg font-bold text-slate-900">{{ title() }}</h2>
              @if (subtitle()) {
                <p class="text-sm text-slate-500 mt-1">{{ subtitle() }}</p>
              }
            </div>
            <button type="button" (click)="close()"
                    class="p-1.5 rounded-lg text-slate-400 hover:text-slate-600 hover:bg-slate-100"
                    aria-label="Fermer">
              <svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M6 18L18 6M6 6l12 12"/>
              </svg>
            </button>
          </div>

          <div class="px-6 py-5">
            @if (loading()) {
              <app-syli-spinner size="md" [showLabel]="true" [centered]="true" />
            } @else if (error()) {
              <p class="text-sm text-red-600">{{ error() }}</p>
            } @else {
              @if (mode === 'practitioner' && practitioner()) {
                <div class="space-y-4">
                  @for (row of practitionerRows(); track row.label) {
                    @if (row.value) {
                      <div>
                        <p class="text-xs font-medium text-slate-500 uppercase tracking-wide">{{ row.label }}</p>
                        <p class="text-sm text-slate-900 mt-0.5 whitespace-pre-wrap">{{ row.value }}</p>
                      </div>
                    }
                  }
                  @if (practitioner()!.practitionerSpecialties?.length) {
                    <div>
                      <p class="text-xs font-medium text-slate-500 uppercase tracking-wide mb-2">Spécialités</p>
                      <div class="flex flex-wrap gap-2">
                        @for (s of practitioner()!.practitionerSpecialties; track s.id) {
                          <span class="text-xs bg-primary-50 text-primary-800 px-2 py-1 rounded-lg">
                            {{ s.specialtyName }} ({{ s.consultationDurationMinutes }} min)
                          </span>
                        }
                      </div>
                    </div>
                  }
                </div>
              }

              @if (mode === 'patient' && patient()) {
                <div class="space-y-4">
                  @for (row of patientRows(); track row.label) {
                    @if (row.value) {
                      <div>
                        <p class="text-xs font-medium text-slate-500 uppercase tracking-wide">{{ row.label }}</p>
                        <p class="text-sm text-slate-900 mt-0.5 whitespace-pre-wrap">{{ row.value }}</p>
                      </div>
                    }
                  }
                </div>
              }

              @if (mode === 'admin' && adminDetail()) {
                <div class="space-y-4">
                  @for (row of adminRows(); track row.label) {
                    @if (row.value) {
                      <div>
                        <p class="text-xs font-medium text-slate-500 uppercase tracking-wide">{{ row.label }}</p>
                        <p class="text-sm text-slate-900 mt-0.5 whitespace-pre-wrap">{{ row.value }}</p>
                      </div>
                    }
                  }
                  @if (adminDetail()!.practitionerProfile) {
                    <div class="pt-4 border-t border-slate-100 space-y-4">
                      <p class="text-sm font-semibold text-slate-800">Profil professionnel</p>
                      @for (row of adminPractitionerRows(); track row.label) {
                        @if (row.value) {
                          <div>
                            <p class="text-xs font-medium text-slate-500 uppercase tracking-wide">{{ row.label }}</p>
                            <p class="text-sm text-slate-900 mt-0.5 whitespace-pre-wrap">{{ row.value }}</p>
                          </div>
                        }
                      }
                    </div>
                  }
                </div>
              }
            }
          </div>

          <div class="px-6 pb-5">
            <button type="button" (click)="close()" class="btn-secondary w-full">Fermer</button>
          </div>
        </div>
      </div>
    }
  `,
})
export class UserProfileModalComponent implements OnChanges {
  @Input() visible = false;
  @Input() mode: ProfileViewMode = 'practitioner';
  @Input() userId: number | null = null;
  @Output() closed = new EventEmitter<void>();

  loading = signal(false);
  error = signal('');
  title = signal('Profil');
  subtitle = signal('');
  practitioner = signal<PractitionerProfileDto | null>(null);
  patient = signal<PatientProfileViewDto | null>(null);
  adminDetail = signal<AdminUserDetailDto | null>(null);

  constructor(
    private practitionerService: PractitionerService,
    private userProfileService: UserProfileService,
    private adminService: AdminService,
  ) {}

  ngOnChanges(): void {
    if (this.visible && this.userId) {
      this.load();
    } else if (!this.visible) {
      this.reset();
    }
  }

  close(): void {
    this.closed.emit();
  }

  practitionerRows(): { label: string; value: string | null }[] {
    const p = this.practitioner();
    if (!p) return [];
    return [
      { label: 'Spécialité principale', value: p.speciality },
      { label: 'Ville', value: p.cityName },
      { label: 'Adresse', value: p.address },
      { label: 'Biographie', value: p.bio },
      { label: 'Consignes de rendez-vous', value: p.appointmentInstructions },
      { label: 'Frais de consultation', value: p.consultationFee != null ? `${p.consultationFee} GNF` : null },
      { label: 'Mobile Money', value: p.merchantNumber },
    ];
  }

  patientRows(): { label: string; value: string | null }[] {
    const p = this.patient();
    if (!p) return [];
    return [
      { label: 'E-mail', value: p.email },
      { label: 'Téléphone', value: p.phone },
      { label: 'Adresse', value: p.address },
      { label: 'Date de naissance', value: p.birthDate ? formatLocalDate(p.birthDate) : null },
      { label: 'Sexe', value: p.gender ? (GENDER_LABELS[p.gender] ?? p.gender) : null },
      { label: 'Notes médicales / allergies', value: p.description },
    ];
  }

  adminRows(): { label: string; value: string | null }[] {
    const d = this.adminDetail();
    if (!d) return [];
    const p = d.profile;
    return [
      { label: 'Rôle', value: ROLE_LABELS[p.role] ?? p.role },
      { label: 'Statut', value: USER_STATUS_LABELS[p.status] ?? p.status },
      { label: 'E-mail', value: p.email },
      { label: 'Téléphone', value: p.phone },
      { label: 'Adresse', value: p.address },
      { label: 'Date de naissance', value: p.birthDate ? formatLocalDate(p.birthDate) : null },
      { label: 'Sexe', value: p.gender ? (GENDER_LABELS[p.gender] ?? p.gender) : null },
      { label: 'Description', value: p.description },
      { label: 'Inscription', value: p.createdAt ? formatLocalDate(p.createdAt) : null },
    ];
  }

  adminPractitionerRows(): { label: string; value: string | null }[] {
    const pp = this.adminDetail()?.practitionerProfile;
    if (!pp) return [];
    return [
      { label: 'Spécialité principale', value: pp.speciality },
      { label: 'Ville', value: pp.cityName },
      { label: 'Adresse cabinet', value: pp.address },
      { label: 'Biographie', value: pp.bio },
      { label: 'Consignes RDV', value: pp.appointmentInstructions },
      { label: 'Frais', value: pp.consultationFee != null ? `${pp.consultationFee} GNF` : null },
      { label: 'Mobile Money', value: pp.merchantNumber },
    ];
  }

  private load(): void {
    if (!this.userId) return;
    this.loading.set(true);
    this.error.set('');
    this.practitioner.set(null);
    this.patient.set(null);
    this.adminDetail.set(null);

    if (this.mode === 'practitioner') {
      this.practitionerService.getById(this.userId).subscribe({
        next: (data: PractitionerProfileDto) => {
          this.practitioner.set(data);
          this.title.set(`Dr. ${data.firstName} ${data.lastName}`);
          this.subtitle.set(data.speciality ?? data.practitionerSpecialties?.[0]?.specialtyName ?? 'Praticien');
          this.loading.set(false);
        },
        error: (err: HttpErrorResponse) => {
          this.error.set(err.error?.detail || 'Impossible de charger le profil.');
          this.loading.set(false);
        },
      });
    } else if (this.mode === 'patient') {
      this.userProfileService.getPatientProfile(this.userId).subscribe({
        next: (data: PatientProfileViewDto) => {
          this.patient.set(data);
          this.title.set(`${data.firstName} ${data.lastName}`);
          this.subtitle.set('Fiche patient');
          this.loading.set(false);
        },
        error: (err: HttpErrorResponse) => {
          this.error.set(err.error?.detail || 'Impossible de charger la fiche patient.');
          this.loading.set(false);
        },
      });
    } else {
      this.adminService.getUserById(this.userId).subscribe({
        next: (data: AdminUserDetailDto) => {
          this.adminDetail.set(data);
          this.title.set(`${data.profile.firstName} ${data.profile.lastName}`);
          this.subtitle.set(ROLE_LABELS[data.profile.role] ?? data.profile.role);
          this.loading.set(false);
        },
        error: (err: HttpErrorResponse) => {
          this.error.set(err.error?.detail || 'Impossible de charger le profil.');
          this.loading.set(false);
        },
      });
    }
  }

  private reset(): void {
    this.loading.set(false);
    this.error.set('');
    this.practitioner.set(null);
    this.patient.set(null);
    this.adminDetail.set(null);
  }
}
