import { Component, OnInit, signal } from '@angular/core';
import { FormsModule, FormBuilder, FormGroup, Validators, ReactiveFormsModule } from '@angular/forms';
import { CommonModule } from '@angular/common';
import { RouterLink } from '@angular/router';
import { UserProfileService } from '../../../core/services/user-profile.service';
import { ClinicalProfileService } from '../../../core/services/clinical-profile.service';
import { UserProfileDto, GENDER_LABELS } from '../../../core/models/user-profile.model';
import {
  BloodType,
  BLOOD_TYPE_LABELS,
  BLOOD_TYPE_OPTIONS,
  ClinicalProfileDto,
} from '../../../core/models/clinical-profile.model';
import { formatLocalDateTime } from '../../../core/utils/date-utils';
import { ChangePasswordModalComponent } from '../../../shared/components/change-password-modal/change-password-modal.component';
import { SyliSpinnerComponent } from '../../../shared/components/syli-spinner/syli-spinner.component';

@Component({
  selector: 'app-patient-profile',
  standalone: true,
  imports: [  CommonModule, FormsModule, ReactiveFormsModule, RouterLink, ChangePasswordModalComponent, SyliSpinnerComponent],
  template: `
    <div class="max-w-2xl mx-auto px-4 py-8">

      <!-- En-tête -->
      <div class="flex items-center justify-between mb-8">
        <div>
          <h1 class="text-2xl font-bold text-gray-900">Mon profil</h1>
          <p class="text-gray-500 mt-1">Gérez vos informations personnelles</p>
        </div>
        @if (!editMode()) {
          <button (click)="startEdit()" class="btn-primary">
            ✏️ Modifier mon profil
          </button>
        }
      </div>

      <!-- Chargement -->
      @if (loading()) {
        <app-syli-spinner size="md" [showLabel]="true" [centered]="true" />
      }

      <!-- Messages globaux -->
      @if (successMsg()) {
        <div class="rounded-lg bg-sky-50 border border-sky-200 px-4 py-3 text-sm text-sky-700 mb-6">
          {{ successMsg() }}
        </div>
      }

      <!-- Mode Lecture -->
      @if (!loading() && !editMode() && profile()) {
        <div class="card space-y-6">
          <!-- Avatar initiales -->
          <div class="flex items-center gap-4">
            <div class="w-16 h-16 rounded-full bg-primary-100 flex items-center justify-center text-primary-700 font-bold text-2xl">
              {{ initials() }}
            </div>
            <div>
              <p class="text-xl font-semibold text-gray-900">
                {{ profile()!.firstName }} {{ profile()!.lastName }}
              </p>
              <p class="text-sm text-gray-500">{{ profile()!.email }}</p>
              <span class="inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium bg-blue-100 text-blue-800 mt-1">
                Patient
              </span>
            </div>
          </div>

          <hr class="border-gray-100"/>

          <div class="grid grid-cols-1 sm:grid-cols-2 gap-4 text-sm">
            <div>
              <p class="text-gray-400 font-medium uppercase tracking-wide text-xs mb-1">Téléphone</p>
              <p class="text-gray-800">{{ profile()!.phone || '—' }}</p>
            </div>
            <div>
              <p class="text-gray-400 font-medium uppercase tracking-wide text-xs mb-1">Sexe</p>
              <p class="text-gray-800">{{ genderLabel(profile()!.gender) }}</p>
            </div>
            <div>
              <p class="text-gray-400 font-medium uppercase tracking-wide text-xs mb-1">Date de naissance</p>
              <p class="text-gray-800">{{ profile()!.birthDate || '—' }}</p>
            </div>
            <div>
              <p class="text-gray-400 font-medium uppercase tracking-wide text-xs mb-1">Adresse</p>
              <p class="text-gray-800">{{ profile()!.address || '—' }}</p>
            </div>
            <div class="sm:col-span-2">
              <p class="text-gray-400 font-medium uppercase tracking-wide text-xs mb-1">Description / Notes</p>
              <p class="text-gray-800 whitespace-pre-wrap">{{ profile()!.description || '—' }}</p>
            </div>
            <div>
              <p class="text-gray-400 font-medium uppercase tracking-wide text-xs mb-1">Membre depuis</p>
              <p class="text-gray-800">{{ profile()!.createdAt | date:'dd/MM/yyyy' }}</p>
            </div>
          </div>
        </div>
      }

      @if (!loading() && profile()) {
        <div class="card mt-6 space-y-5">
          <div>
            <h2 class="text-base font-semibold text-slate-900">Dossier clinique</h2>
            <p class="text-sm text-slate-500 mt-1">
              Groupe sanguin, identifiant national et allergies. Visibles par vos praticiens lors d'un rendez-vous.
            </p>
          </div>
          @if (clinical()) {
            <div class="grid grid-cols-1 sm:grid-cols-2 gap-4 text-sm">
              <div>
                <p class="text-gray-400 font-medium uppercase tracking-wide text-xs mb-1">Groupe sanguin</p>
                <p class="text-gray-800">{{ clinical()!.bloodTypeLabel || '—' }}</p>
                @if (clinical()!.bloodTypeLocked) {
                  <p class="text-xs text-amber-700 mt-1">Enregistré par un praticien — non modifiable ici.</p>
                }
              </div>
              <div>
                <p class="text-gray-400 font-medium uppercase tracking-wide text-xs mb-1">NIN</p>
                <p class="text-gray-800">{{ clinical()!.nationalId || '—' }}</p>
              </div>
              <div class="sm:col-span-2">
                <p class="text-gray-400 font-medium uppercase tracking-wide text-xs mb-2">Allergies</p>
                @if (clinical()!.allergies.length === 0) {
                  <p class="text-gray-800">Aucune allergie déclarée</p>
                } @else {
                  <div class="flex flex-wrap gap-2">
                    @for (a of clinical()!.allergies; track a.id) {
                      <span class="inline-flex items-center gap-1.5 text-xs bg-red-50 text-red-700 border border-red-100 px-2.5 py-1 rounded-full">
                        {{ a.substance }}
                        <button type="button" class="text-red-400 hover:text-red-700" (click)="removeAllergy(a.id)" aria-label="Retirer">×</button>
                      </span>
                    }
                  </div>
                }
              </div>
            </div>
            <div class="grid grid-cols-1 sm:grid-cols-2 gap-4 pt-2 border-t border-slate-100">
              <div>
                <label class="label">Groupe sanguin</label>
                <select class="input" [(ngModel)]="bloodTypeDraft" [disabled]="clinical()!.bloodTypeLocked">
                  <option value="">— Non renseigné —</option>
                  @for (t of bloodTypes; track t) {
                    <option [value]="t">{{ bloodLabels[t] }}</option>
                  }
                </select>
              </div>
              <div>
                <label class="label">NIN</label>
                <input class="input" [(ngModel)]="nationalIdDraft" maxlength="32" placeholder="GN-1991-…"/>
              </div>
              <div class="sm:col-span-2 flex gap-2">
                <input class="input flex-1" [(ngModel)]="allergyDraft" placeholder="Ajouter une allergie (ex. Pénicilline)"/>
                <button type="button" class="btn-secondary" (click)="addAllergy()" [disabled]="allergyDraft.trim().length < 2">Ajouter</button>
              </div>
            </div>
            @if (clinicalError()) {
              <p class="text-sm text-red-600">{{ clinicalError() }}</p>
            }
            @if (clinicalSuccess()) {
              <p class="text-sm text-sky-700">{{ clinicalSuccess() }}</p>
            }
            <div class="flex justify-end">
              <button type="button" class="btn-primary" (click)="saveClinical()" [disabled]="savingClinical()">
                @if (savingClinical()) { Enregistrement... } @else { Enregistrer le dossier clinique }
              </button>
            </div>
          }
        </div>
      }

      <!-- Sécurité du compte (toujours visible) -->
      @if (!loading() && profile()) {
        <div class="card mt-6">
          <h2 class="text-base font-semibold text-slate-900 mb-1">Sécurité du compte</h2>
          <p class="text-sm text-slate-500 mb-4">Protégez votre accès à SyliSanté</p>
          <div class="flex items-center justify-between gap-4 p-4 rounded-xl bg-slate-50 border border-slate-100">
            <div class="flex items-center gap-3">
              <div class="w-10 h-10 rounded-lg bg-white border border-slate-200 flex items-center justify-center">
                <svg class="w-5 h-5 text-slate-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2"
                        d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z"/>
                </svg>
              </div>
              <div>
                <p class="text-sm font-medium text-slate-800">Mot de passe</p>
                <p class="text-xs text-slate-500">••••••••••••</p>
              </div>
            </div>
            <button type="button" (click)="openPasswordModal()"
                    class="px-4 py-2 rounded-xl text-sm font-medium text-[#0EA5E9]
                           border border-sky-200 bg-white hover:bg-sky-50 transition-colors">
              Modifier
            </button>
          </div>
        </div>
      }

      <!-- Mode Édition -->
      @if (!loading() && editMode()) {
        <form [formGroup]="form" (ngSubmit)="save()" class="card space-y-5">
          <h2 class="text-lg font-semibold text-gray-900">Modifier mes informations</h2>
          <p class="text-xs text-gray-400">L'adresse e-mail ne peut pas être modifiée (identifiant unique).</p>

          <div class="grid grid-cols-1 sm:grid-cols-2 gap-4">

            <div>
              <label class="label">Prénom *</label>
              <input formControlName="firstName" type="text" class="input"
                     [class.border-red-400]="isInvalid('firstName')"/>
              @if (isInvalid('firstName')) {
                <p class="text-xs text-red-500 mt-1">Prénom obligatoire</p>
              }
            </div>

            <div>
              <label class="label">Nom *</label>
              <input formControlName="lastName" type="text" class="input"
                     [class.border-red-400]="isInvalid('lastName')"/>
              @if (isInvalid('lastName')) {
                <p class="text-xs text-red-500 mt-1">Nom obligatoire</p>
              }
            </div>

            <div>
              <label class="label">Téléphone</label>
              <input formControlName="phone" type="tel" class="input" placeholder="+224 6XX XXX XXX"/>
            </div>

            <div>
              <label class="label">Sexe</label>
              <select formControlName="gender" class="input">
                <option value="">— Non précisé —</option>
                <option value="MALE">Homme</option>
                <option value="FEMALE">Femme</option>
                <option value="OTHER">Autre</option>
              </select>
            </div>

            <div>
              <label class="label">Date de naissance</label>
              <input formControlName="birthDate" type="date" class="input"/>
            </div>

            <div>
              <label class="label">Adresse</label>
              <input formControlName="address" type="text" class="input" placeholder="Quartier, Conakry"/>
            </div>

            <div class="sm:col-span-2">
              <label class="label">Description / Notes médicales</label>
              <textarea formControlName="description" rows="3" class="input resize-none"
                        placeholder="Allergies connues, antécédents importants..."></textarea>
            </div>

          </div>

          <!-- Erreur globale -->
          @if (errorMsg()) {
            <div class="rounded-lg bg-red-50 border border-red-200 px-4 py-3 text-sm text-red-700">
              {{ errorMsg() }}
            </div>
          }

          <!-- Succès -->
          @if (successMsg()) {
            <div class="rounded-lg bg-sky-50 border border-sky-200 px-4 py-3 text-sm text-sky-700">
              {{ successMsg() }}
            </div>
          }

          <!-- Actions -->
          <div class="flex gap-3 justify-end pt-2">
            <button type="button" (click)="cancelEdit()" class="btn-secondary">
              Annuler
            </button>
            <button type="submit" [disabled]="saving() || form.invalid" class="btn-primary">
              @if (saving()) {
                <app-syli-spinner size="xs" class="mr-2 inline-block align-middle" />
              }
              Enregistrer
            </button>
          </div>
        </form>
      }

      <app-change-password-modal
        [visible]="passwordModalOpen()"
        (closed)="closePasswordModal()"
        (changed)="onPasswordChanged()" />
    </div>
  `,
})
export class PatientProfileComponent implements OnInit {
  profile    = signal<UserProfileDto | null>(null);
  clinical   = signal<ClinicalProfileDto | null>(null);
  loading    = signal(true);
  editMode   = signal(false);
  saving     = signal(false);
  savingClinical = signal(false);
  errorMsg   = signal('');
  successMsg = signal('');
  clinicalError = signal('');
  clinicalSuccess = signal('');
  passwordModalOpen = signal(false);
  bloodTypeDraft = '';
  nationalIdDraft = '';
  allergyDraft = '';
  readonly bloodTypes = BLOOD_TYPE_OPTIONS;
  readonly bloodLabels = BLOOD_TYPE_LABELS;

  form!: FormGroup;

  constructor(
    private profileService: UserProfileService,
    private clinicalProfileService: ClinicalProfileService,
    private fb: FormBuilder,
  ) {}

  ngOnInit(): void {
    this.profileService.getMyProfile().subscribe({
      next: (p) => {
        this.profile.set(p);
        this.buildForm(p);
        this.loading.set(false);
        this.clinicalProfileService.getMine().subscribe({
          next: (c) => {
            this.clinical.set(c);
            this.bloodTypeDraft = c.bloodType ?? '';
            this.nationalIdDraft = c.nationalId ?? '';
          },
        });
      },
      error: () => this.loading.set(false),
    });
  }

  private buildForm(p: UserProfileDto): void {
    this.form = this.fb.group({
      firstName:   [p.firstName,  [Validators.required, Validators.maxLength(100)]],
      lastName:    [p.lastName,   [Validators.required, Validators.maxLength(100)]],
      phone:       [p.phone       || ''],
      gender:      [p.gender      || ''],
      birthDate:   [p.birthDate   || ''],
      address:     [p.address     || ''],
      description: [p.description || ''],
    });
  }

  startEdit(): void {
    this.successMsg.set('');
    this.errorMsg.set('');
    this.editMode.set(true);
  }

  cancelEdit(): void {
    this.editMode.set(false);
    if (this.profile()) this.buildForm(this.profile()!);
  }

  save(): void {
    if (this.form.invalid) return;
    this.saving.set(true);
    this.errorMsg.set('');
    const raw = this.form.value;
    this.profileService.updateMyProfile({
      firstName:   raw.firstName,
      lastName:    raw.lastName,
      phone:       raw.phone   || null,
      gender:      raw.gender  || null,
      birthDate:   raw.birthDate || null,
      address:     raw.address || null,
      description: raw.description || null,
    }).subscribe({
      next: (updated) => {
        this.profile.set(updated);
        this.saving.set(false);
        this.editMode.set(false);
        this.successMsg.set('Profil mis à jour avec succès.');
        setTimeout(() => this.successMsg.set(''), 4000);
      },
      error: (err) => {
        this.errorMsg.set(err?.error?.message || 'Erreur lors de la mise à jour.');
        this.saving.set(false);
      },
    });
  }

  isInvalid(field: string): boolean {
    const ctrl = this.form.get(field);
    return !!(ctrl && ctrl.invalid && ctrl.touched);
  }

  initials(): string {
    const p = this.profile();
    if (!p) return '?';
    return (p.firstName[0] || '') + (p.lastName[0] || '');
  }

  genderLabel(gender: string | null): string {
    return gender ? (GENDER_LABELS[gender] || gender) : '—';
  }

  openPasswordModal(): void {
    this.passwordModalOpen.set(true);
  }

  closePasswordModal(): void {
    this.passwordModalOpen.set(false);
  }

  onPasswordChanged(): void {
    this.successMsg.set('Mot de passe modifié avec succès.');
    setTimeout(() => this.successMsg.set(''), 4000);
  }

  saveClinical(): void {
    this.savingClinical.set(true);
    this.clinicalError.set('');
    const locked = this.clinical()?.bloodTypeLocked;
    this.clinicalProfileService.updateMine({
      bloodType: locked ? undefined : ((this.bloodTypeDraft as BloodType) || undefined),
      nationalId: this.nationalIdDraft.trim() || '',
    }).subscribe({
      next: (c) => {
        this.clinical.set(c);
        this.bloodTypeDraft = c.bloodType ?? '';
        this.nationalIdDraft = c.nationalId ?? '';
        this.savingClinical.set(false);
        this.clinicalSuccess.set('Dossier clinique mis à jour.');
        setTimeout(() => this.clinicalSuccess.set(''), 4000);
      },
      error: (err) => {
        this.clinicalError.set(err?.error?.detail || 'Impossible d\'enregistrer le dossier clinique.');
        this.savingClinical.set(false);
      },
    });
  }

  addAllergy(): void {
    const substance = this.allergyDraft.trim();
    if (substance.length < 2) return;
    this.clinicalError.set('');
    this.clinicalProfileService.addAllergyMine({ substance }).subscribe({
      next: (created) => {
        this.clinical.update(c => c ? { ...c, allergies: [created, ...c.allergies] } : c);
        this.allergyDraft = '';
      },
      error: (err) => {
        this.clinicalError.set(err?.error?.detail || 'Impossible d\'ajouter l\'allergie.');
      },
    });
  }

  removeAllergy(id: number): void {
    this.clinicalProfileService.deleteAllergyMine(id).subscribe({
      next: () => {
        this.clinical.update(c => c ? { ...c, allergies: c.allergies.filter(a => a.id !== id) } : c);
      },
      error: (err) => {
        this.clinicalError.set(err?.error?.detail || 'Impossible de retirer l\'allergie.');
      },
    });
  }
}
