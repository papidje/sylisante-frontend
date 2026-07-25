import { Component, OnInit, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormBuilder, FormGroup, Validators, ReactiveFormsModule } from '@angular/forms';
import { HttpErrorResponse } from '@angular/common/http';
import { PractitionerService } from '../../../core/services/practitioner.service';
import { ReferenceDataService } from '../../../core/services/reference-data.service';
import { UserProfileService } from '../../../core/services/user-profile.service';
import { PractitionerProfileDto, PractitionerSpecialtyDto, MerchantType } from '../../../core/models/practitioner.model';
import { CityDto, SpecialtyDto } from '../../../core/models/city.model';
import { ChangePasswordModalComponent } from '../../../shared/components/change-password-modal/change-password-modal.component';
import { SyliSpinnerComponent } from '../../../shared/components/syli-spinner/syli-spinner.component';

@Component({
  selector: 'app-practitioner-profile',
  standalone: true,
  imports: [  ReactiveFormsModule, CommonModule, ChangePasswordModalComponent, SyliSpinnerComponent],
  template: `
    <div class="max-w-5xl mx-auto px-4 py-8">
      <div class="mb-6">
        <h1 class="text-2xl font-bold text-gray-900">Mon profil professionnel</h1>
        <p class="text-gray-500 mt-1">Configurez votre profil visible par les patients</p>
      </div>

      @if (successMessage()) {
        <div class="bg-sky-50 border border-sky-200 rounded-lg p-4 mb-5 flex items-center gap-2">
          <svg class="w-5 h-5 text-sky-600 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M5 13l4 4L19 7"/>
          </svg>
          <p class="text-sm text-sky-700">{{ successMessage() }}</p>
        </div>
      }
      @if (errorMessage()) {
        <div class="bg-red-50 border border-red-200 rounded-lg p-4 mb-5">
          <p class="text-sm text-red-700">{{ errorMessage() }}</p>
        </div>
      }

      <!-- Grille 2 colonnes -->
      <form [formGroup]="profileForm" (ngSubmit)="onSubmit()">
        <div class="grid grid-cols-1 md:grid-cols-2 gap-6 items-start">

          <!-- ═══════════════════════════════════════════
               COLONNE GAUCHE — Fixe
               ═══════════════════════════════════════════ -->
          <div class="space-y-5">

            <!-- ── Section Identité personnelle (formulaire séparé) ── -->
            <div class="card">
              <h2 class="text-base font-semibold text-gray-900 mb-4 flex items-center gap-2">
                <svg class="w-4 h-4 text-primary-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2"
                        d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z"/>
                </svg>
                Identité personnelle
              </h2>

              <div [formGroup]="personalForm" class="space-y-3">
                <div class="grid grid-cols-2 gap-3">
                  <div>
                    <label class="block text-sm font-medium text-gray-700 mb-1">Prénom *</label>
                    <input type="text" formControlName="firstName" class="input-field" placeholder="Prénom"/>
                  </div>
                  <div>
                    <label class="block text-sm font-medium text-gray-700 mb-1">Nom *</label>
                    <input type="text" formControlName="lastName" class="input-field" placeholder="Nom"/>
                  </div>
                </div>
                <div class="grid grid-cols-2 gap-3">
                  <div>
                    <label class="block text-sm font-medium text-gray-700 mb-1">Téléphone</label>
                    <input type="tel" formControlName="phone" class="input-field" placeholder="+224 6XX XXX XXX"/>
                  </div>
                  <div>
                    <label class="block text-sm font-medium text-gray-700 mb-1">Sexe</label>
                    <select formControlName="gender" class="input-field">
                      <option value="">— Non précisé —</option>
                      <option value="MALE">Homme</option>
                      <option value="FEMALE">Femme</option>
                      <option value="OTHER">Autre</option>
                    </select>
                  </div>
                </div>
                <div>
                  <label class="block text-sm font-medium text-gray-700 mb-1">Date de naissance</label>
                  <input type="date" formControlName="birthDate" class="input-field"/>
                </div>
                <button type="button" (click)="savePersonalInfo()"
                        [disabled]="savingPersonal() || personalForm.invalid"
                        class="btn-primary w-full text-sm mt-1">
                  @if (savingPersonal()) {
                    <app-syli-spinner size="xs" class="mr-2 inline-block align-middle" />
                  }
                  Enregistrer les infos personnelles
                </button>
                @if (personalSuccessMsg()) {
                  <p class="text-xs text-sky-600 mt-1">{{ personalSuccessMsg() }}</p>
                }
              </div>
            </div>

            <!-- Sécurité du compte -->
            <div class="card">
              <h2 class="text-base font-semibold text-slate-900 mb-1 flex items-center gap-2">
                <svg class="w-4 h-4 text-[#0EA5E9]" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2"
                        d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z"/>
                </svg>
                Sécurité du compte
              </h2>
              <p class="text-xs text-slate-500 mb-3">Protégez votre accès à SyliSanté</p>
              <div class="flex items-center justify-between gap-3 p-3 rounded-xl bg-slate-50 border border-slate-100">
                <div>
                  <p class="text-sm font-medium text-slate-800">Mot de passe</p>
                  <p class="text-xs text-slate-500">••••••••••••</p>
                </div>
                <button type="button" (click)="openPasswordModal()"
                        class="px-3 py-1.5 rounded-xl text-sm font-medium text-[#0EA5E9]
                               border border-sky-200 bg-white hover:bg-sky-50 transition-colors">
                  Modifier
                </button>
              </div>
            </div>

            <!-- Section Informations générales -->
            <div class="card">
              <h2 class="text-base font-semibold text-gray-900 mb-4 flex items-center gap-2">
                <svg class="w-4 h-4 text-primary-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2"
                        d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z"/>
                </svg>
                Informations générales
              </h2>
              <div class="space-y-4">
                <!-- Spécialité principale — champ texte libre lié à la colonne speciality -->
                <div>
                  <label for="speciality" class="block text-sm font-medium text-gray-700 mb-1">
                    Spécialité principale <span class="text-gray-400">(texte libre)</span>
                  </label>
                  <input id="speciality" type="text" formControlName="speciality" class="input-field"
                         placeholder="Ex: Médecin Généraliste, Pédiatre, Cardiologue..."/>
                  <p class="text-xs text-gray-400 mt-1">
                    Affiché sur votre fiche — complété par vos spécialités officielles ci-contre.
                  </p>
                </div>
                <div>
                  <label for="bio" class="block text-sm font-medium text-gray-700 mb-1">Biographie</label>
                  <textarea id="bio" formControlName="bio" rows="3" class="input-field"
                            placeholder="Votre expérience, formation, spécialisations..."></textarea>
                </div>
                <div>
                  <label for="consultationFee" class="block text-sm font-medium text-gray-700 mb-1">
                    Frais de consultation (GNF)
                  </label>
                  <input id="consultationFee" type="number" formControlName="consultationFee" class="input-field"
                         placeholder="150000"/>
                </div>
              </div>
            </div>

            <!-- Section Localisation -->
            <div class="card">
              <h2 class="text-base font-semibold text-gray-900 mb-4 flex items-center gap-2">
                <svg class="w-4 h-4 text-primary-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2"
                        d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z"/>
                </svg>
                Localisation
              </h2>
              <div class="space-y-3">
                <div>
                  <label for="cityId" class="block text-sm font-medium text-gray-700 mb-1">
                    Ville d'exercice <span class="text-red-500">*</span>
                  </label>
                  <select id="cityId" formControlName="cityId" class="input-field">
                    <option value="">Sélectionner une ville</option>
                    @for (city of cities(); track city.id) {
                      <option [value]="city.id">{{ city.name }}</option>
                    }
                  </select>
                </div>
                <div>
                  <label for="address" class="block text-sm font-medium text-gray-700 mb-1">Adresse physique</label>
                  <input id="address" type="text" formControlName="address" class="input-field"
                         placeholder="Quartier, Avenue, Immeuble..."/>
                </div>
              </div>
            </div>

            <!-- Section Consignes de rendez-vous -->
            <div class="card">
              <h2 class="text-base font-semibold text-gray-900 mb-1 flex items-center gap-2">
                <svg class="w-4 h-4 text-primary-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2"
                        d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"/>
                </svg>
                Consignes de rendez-vous
              </h2>
              <p class="text-xs text-gray-400 mb-3">
                Informations transmises au patient à la fin de la réservation et lors de la confirmation
                (accès au cabinet, repères, documents à apporter…).
              </p>
              <textarea id="appointmentInstructions" formControlName="appointmentInstructions" rows="5"
                        class="input-field resize-y"
                        placeholder="Ex : Cabinet au 2e étage, entrée par la rue X. Présentez-vous 10 min avant avec votre carnet de santé…"></textarea>
            </div>

            <!-- Section Mobile Money -->
            <div class="card">
              <h2 class="text-base font-semibold text-gray-900 mb-4 flex items-center gap-2">
                <svg class="w-4 h-4 text-primary-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2"
                        d="M12 18h.01M8 21h8a2 2 0 002-2V5a2 2 0 00-2-2H8a2 2 0 00-2 2v14a2 2 0 002 2z"/>
                </svg>
                Paiement Mobile Money
              </h2>
              <div class="space-y-3">
                <div>
                  <label for="merchantNumber" class="block text-sm font-medium text-gray-700 mb-1">Numéro Marchand</label>
                  <input id="merchantNumber" type="text" formControlName="merchantNumber" class="input-field"
                         placeholder="620 000 000"/>
                </div>
                <div>
                  <label for="merchantType" class="block text-sm font-medium text-gray-700 mb-1">Opérateur</label>
                  <select id="merchantType" formControlName="merchantType" class="input-field">
                    <option value="">Sélectionner</option>
                    <option value="ORANGE_MONEY">Orange Money</option>
                    <option value="MTN_MOMO">MTN MoMo</option>
                  </select>
                </div>
              </div>
            </div>

            <button type="submit" [disabled]="saving()" class="btn-primary w-full py-3 sticky bottom-4 shadow-lg">
              @if (saving()) {
                <app-syli-spinner size="xs" class="-ml-1 mr-2 inline-block align-middle" />
                Enregistrement...
              } @else {
                Sauvegarder le profil
              }
            </button>
          </div>

          <!-- ═══════════════════════════════════════════
               COLONNE DROITE — Spécialités (scrollable)
               ═══════════════════════════════════════════ -->
          <div class="card h-fit">
            <h2 class="text-base font-semibold text-gray-900 mb-1 flex items-center gap-2">
              <svg class="w-4 h-4 text-primary-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2"
                      d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2"/>
              </svg>
              Spécialités officielles & Durées
              <span class="ml-auto text-xs font-normal text-gray-400">{{ selectedCount() }} sélectionnée(s)</span>
            </h2>
            <p class="text-xs text-gray-400 mb-4">
              Pour chaque spécialité cochée, définissez la durée de consultation en minutes.
              Cette durée pilote le découpage automatique de vos créneaux.
            </p>

            <!-- Liste scrollable indépendamment -->
            <div class="overflow-y-auto max-h-[520px] space-y-2 pr-1">
              @if (availableSpecialties().length === 0) {
                <div class="text-center py-8 text-gray-400 text-sm">Chargement des spécialités...</div>
              }
              @for (specialty of availableSpecialties(); track specialty.id) {
                <div class="flex items-center gap-3 p-3 rounded-lg border transition-colors cursor-pointer"
                     [class.border-primary-200]="isSpecialtySelected(specialty.id)"
                     [class.bg-primary-50]="isSpecialtySelected(specialty.id)"
                     [class.border-gray-100]="!isSpecialtySelected(specialty.id)"
                     [class.hover:bg-gray-50]="!isSpecialtySelected(specialty.id)">
                  <label class="flex items-center gap-3 flex-1 cursor-pointer min-w-0">
                    <input type="checkbox"
                           [checked]="isSpecialtySelected(specialty.id)"
                           (change)="toggleSpecialty(specialty.id, $event)"
                           class="w-4 h-4 text-primary-600 rounded border-gray-300 flex-shrink-0"/>
                    <span class="text-sm font-medium text-gray-800 truncate">{{ specialty.name }}</span>
                  </label>
                  @if (isSpecialtySelected(specialty.id)) {
                    <div class="flex items-center gap-1.5 flex-shrink-0">
                      <input type="number"
                             [value]="getSpecialtyDuration(specialty.id)"
                             (change)="updateSpecialtyDuration(specialty.id, $event)"
                             (click)="$event.stopPropagation()"
                             min="5" max="480" step="5"
                             class="w-16 text-center text-sm border border-primary-300 rounded-lg px-2 py-1
                                    focus:outline-none focus:ring-1 focus:ring-primary-500"/>
                      <span class="text-xs text-gray-500">min</span>
                    </div>
                  }
                </div>
              }
            </div>
          </div>

        </div>
      </form>

      <app-change-password-modal
        [visible]="passwordModalOpen()"
        (closed)="closePasswordModal()"
        (changed)="onPasswordChanged()" />
    </div>
  `,
})
export class PractitionerProfileComponent implements OnInit {
  availableSpecialties = signal<SpecialtyDto[]>([]);
  cities = signal<CityDto[]>([]);
  saving = signal(false);
  savingPersonal = signal(false);
  successMessage = signal('');
  errorMessage = signal('');
  personalSuccessMsg = signal('');
  passwordModalOpen = signal(false);

  profileForm!: FormGroup;
  personalForm!: FormGroup;

  private selectedSpecialties = new Map<number, number>();

  constructor(
    private fb: FormBuilder,
    private practitionerService: PractitionerService,
    private referenceDataService: ReferenceDataService,
    private userProfileService: UserProfileService,
  ) {}

  ngOnInit(): void {
    this.profileForm = this.fb.group({
      cityId: [''],
      address: ['', Validators.maxLength(300)],
      speciality: ['', Validators.maxLength(100)],
      bio: [''],
      appointmentInstructions: [''],
      consultationFee: [null],
      merchantNumber: [''],
      merchantType: [''],
    });

    this.personalForm = this.fb.group({
      firstName:  ['', [Validators.required, Validators.maxLength(100)]],
      lastName:   ['', [Validators.required, Validators.maxLength(100)]],
      phone:      [''],
      gender:     [''],
      birthDate:  [''],
    });

    this.referenceDataService.getCities().subscribe(c => this.cities.set(c.filter(x => x.active)));
    this.referenceDataService.getSpecialties().subscribe(s => this.availableSpecialties.set(s.filter(x => x.active)));

    this.userProfileService.getMyProfile().subscribe(u => {
      this.personalForm.patchValue({
        firstName: u.firstName ?? '',
        lastName:  u.lastName  ?? '',
        phone:     u.phone     ?? '',
        gender:    u.gender    ?? '',
        birthDate: u.birthDate ?? '',
      });
    });

    this.practitionerService.getMyProfile().subscribe(profile => {
      this.profileForm.patchValue({
        cityId: profile.cityId ?? '',
        address: profile.address ?? '',
        speciality: profile.speciality ?? '',
        bio: profile.bio ?? '',
        appointmentInstructions: profile.appointmentInstructions ?? '',
        consultationFee: profile.consultationFee,
        merchantNumber: profile.merchantNumber ?? '',
        merchantType: profile.merchantType ?? '',
      });
      for (const ps of profile.practitionerSpecialties) {
        this.selectedSpecialties.set(ps.specialtyId, ps.consultationDurationMinutes);
      }
    });
  }

  savePersonalInfo(): void {
    if (this.personalForm.invalid) return;
    this.savingPersonal.set(true);
    const v = this.personalForm.value;
    this.userProfileService.updateMyProfile({
      firstName: v.firstName,
      lastName:  v.lastName,
      phone:     v.phone     || null,
      gender:    v.gender    || null,
      birthDate: v.birthDate || null,
    }).subscribe({
      next: () => {
        this.savingPersonal.set(false);
        this.personalSuccessMsg.set('Informations personnelles mises à jour.');
        setTimeout(() => this.personalSuccessMsg.set(''), 3000);
      },
      error: () => {
        this.savingPersonal.set(false);
      },
    });
  }

  selectedCount(): number { return this.selectedSpecialties.size; }

  isSpecialtySelected(id: number): boolean { return this.selectedSpecialties.has(id); }

  getSpecialtyDuration(id: number): number { return this.selectedSpecialties.get(id) ?? 20; }

  toggleSpecialty(id: number, event: Event): void {
    const checked = (event.target as HTMLInputElement).checked;
    if (checked) this.selectedSpecialties.set(id, 20);
    else this.selectedSpecialties.delete(id);
  }

  updateSpecialtyDuration(id: number, event: Event): void {
    const val = parseInt((event.target as HTMLInputElement).value, 10);
    if (!isNaN(val) && val >= 5) this.selectedSpecialties.set(id, val);
  }

  onSubmit(): void {
    this.saving.set(true);
    this.errorMessage.set('');
    this.successMessage.set('');

    const v = this.profileForm.value;
    const specialties = Array.from(this.selectedSpecialties.entries()).map(([specialtyId, d]) => ({
      specialtyId,
      consultationDurationMinutes: d,
    }));

    const request: any = {
      ...(v.cityId ? { cityId: Number(v.cityId) } : {}),
      ...(v.address ? { address: v.address } : {}),
      ...(v.speciality !== null && v.speciality !== undefined ? { speciality: v.speciality } : {}),
      ...(v.bio ? { bio: v.bio } : {}),
      appointmentInstructions: v.appointmentInstructions ?? '',
      ...(v.consultationFee ? { consultationFee: v.consultationFee } : {}),
      ...(v.merchantNumber ? { merchantNumber: v.merchantNumber } : {}),
      ...(v.merchantType ? { merchantType: v.merchantType } : {}),
      specialties,
    };

    this.practitionerService.updateMyProfile(request).subscribe({
      next: () => {
        this.saving.set(false);
        this.successMessage.set('Profil mis à jour avec succès.');
        setTimeout(() => this.successMessage.set(''), 3000);
      },
      error: (err: HttpErrorResponse) => {
        this.saving.set(false);
        this.errorMessage.set(err.error?.detail || 'Erreur lors de la mise à jour.');
      },
    });
  }

  openPasswordModal(): void {
    this.passwordModalOpen.set(true);
  }

  closePasswordModal(): void {
    this.passwordModalOpen.set(false);
  }

  onPasswordChanged(): void {
    this.successMessage.set('Mot de passe modifié avec succès.');
    setTimeout(() => this.successMessage.set(''), 4000);
  }
}
