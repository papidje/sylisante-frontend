import { Component, EventEmitter, Input, OnChanges, Output, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormBuilder, FormGroup, ReactiveFormsModule, Validators } from '@angular/forms';
import { debounceTime, distinctUntilChanged, switchMap, of, catchError } from 'rxjs';
import { HttpErrorResponse } from '@angular/common/http';
import { AppointmentService } from '../../../core/services/appointment.service';
import { PatientService } from '../../../core/services/patient.service';
import { PractitionerService } from '../../../core/services/practitioner.service';
import { AuthService } from '../../../core/services/auth.service';
import { SecretaryContextService } from '../../../core/services/secretary-context.service';
import { PatientSearchResult } from '../../../core/models/patient.model';
import { CreateAppointmentRequest } from '../../../core/models/appointment.model';
import {
  DayScheduleResponse,
  PractitionerProfileDto,
  PractitionerSpecialtyDto,
  TimeSlotDto,
} from '../../../core/models/practitioner.model';
import { todayLocalDateString, addDaysToLocalDate } from '../../../core/utils/date-utils';
import { SyliSpinnerComponent } from '../syli-spinner/syli-spinner.component';

type PatientMode = 'existing' | 'guest';
type ModalStep = 'patient' | 'slot';

@Component({
  selector: 'app-create-appointment-modal',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule, SyliSpinnerComponent],
  template: `
    @if (visible) {
      <div class="fixed inset-0 z-50 flex items-center justify-center p-4" (click)="onBackdropClick()">
        <div class="absolute inset-0 bg-slate-900/40 backdrop-blur-sm"></div>
        <div class="relative bg-white rounded-2xl shadow-2xl w-full max-w-lg border border-slate-100 max-h-[90vh] overflow-y-auto"
             (click)="$event.stopPropagation()" role="dialog" aria-modal="true">

          <div class="px-6 pt-6 pb-4 border-b border-slate-100 sticky top-0 bg-white z-10">
            <div class="flex items-start justify-between gap-4">
              <div>
                <h2 class="text-lg font-bold text-slate-900">Nouveau rendez-vous</h2>
                <p class="text-sm text-slate-500 mt-1">
                  @if (step() === 'patient') {
                    Étape 1 — Patient et type de consultation
                  } @else {
                    Étape 2 — Choix du créneau
                  }
                </p>
              </div>
              <button type="button" (click)="close()"
                      class="p-1.5 rounded-lg text-slate-400 hover:text-slate-600 hover:bg-slate-100"
                      aria-label="Fermer">
                <svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M6 18L18 6M6 6l12 12"/>
                </svg>
              </button>
            </div>
            <div class="flex items-center gap-2 mt-4">
              <div class="flex items-center gap-1.5">
                <span class="w-6 h-6 rounded-full text-xs font-bold flex items-center justify-center"
                      [class.bg-primary-600]="step() === 'patient'"
                      [class.text-white]="step() === 'patient'"
                      [class.bg-primary-100]="step() !== 'patient'"
                      [class.text-primary-700]="step() !== 'patient'">1</span>
                <span class="text-xs text-slate-600">Patient</span>
              </div>
              <div class="flex-1 h-px bg-slate-200"></div>
              <div class="flex items-center gap-1.5">
                <span class="w-6 h-6 rounded-full text-xs font-bold flex items-center justify-center"
                      [class.bg-primary-600]="step() === 'slot'"
                      [class.text-white]="step() === 'slot'"
                      [class.bg-slate-200]="step() !== 'slot'"
                      [class.text-slate-500]="step() !== 'slot'">2</span>
                <span class="text-xs text-slate-600">Créneau</span>
              </div>
            </div>
          </div>

          @if (errorMessage()) {
            <div class="px-6 pt-4">
              <div class="bg-red-50 border border-red-200 rounded-lg p-3">
                <p class="text-sm text-red-700">{{ errorMessage() }}</p>
              </div>
            </div>
          }

          <!-- ═══ ÉTAPE 1 : Patient + type de consultation ═══ -->
          @if (step() === 'patient') {
            <form [formGroup]="form" (ngSubmit)="goToSlotStep()" class="px-6 py-5 space-y-5">
              @if (loadingProfile()) {
                <app-syli-spinner size="sm" [showLabel]="true" />
              }

              <div>
                <p class="text-sm font-medium text-slate-700 mb-2">Patient</p>
                <div class="flex bg-gray-100 rounded-xl p-1 gap-1">
                  <button type="button" (click)="setMode('existing')"
                          class="flex-1 py-2 text-sm font-medium rounded-lg transition-colors"
                          [class.bg-white]="mode() === 'existing'"
                          [class.shadow-sm]="mode() === 'existing'"
                          [class.text-primary-700]="mode() === 'existing'">
                    Rechercher un patient
                  </button>
                  <button type="button" (click)="setMode('guest')"
                          class="flex-1 py-2 text-sm font-medium rounded-lg transition-colors"
                          [class.bg-white]="mode() === 'guest'"
                          [class.shadow-sm]="mode() === 'guest'"
                          [class.text-primary-700]="mode() === 'guest'">
                    Nouveau sans compte
                  </button>
                </div>
              </div>

              @if (mode() === 'existing') {
                <div>
                  <label class="block text-sm font-medium text-slate-700 mb-1">Recherche</label>
                  <input type="text" formControlName="searchQuery"
                         class="input-field"
                         placeholder="Nom, prénom, téléphone ou e-mail…"
                         autocomplete="off" />
                  @if (searchLoading()) {
                    <app-syli-spinner size="xs" class="mt-2" />
                  }
                  @if (searchResults().length > 0) {
                    <ul class="mt-2 border border-slate-200 rounded-lg divide-y max-h-40 overflow-y-auto">
                      @for (p of searchResults(); track p.patientId) {
                        <li>
                          <button type="button" (click)="selectPatient(p)"
                                  class="w-full text-left px-3 py-2 hover:bg-slate-50 transition-colors"
                                  [class.bg-primary-50]="selectedPatient()?.patientId === p.patientId">
                            <p class="text-sm font-medium text-slate-900">
                              {{ p.firstName }} {{ p.lastName }}
                              @if (p.accountStatus === 'GUEST') {
                                <span class="text-xs text-amber-600 ml-1">(invité)</span>
                              }
                            </p>
                            <p class="text-xs text-slate-500">
                              {{ p.phone || '—' }} · {{ p.email || 'sans e-mail' }}
                            </p>
                          </button>
                        </li>
                      }
                    </ul>
                  }
                  @if (selectedPatient()) {
                    <p class="text-xs text-primary-700 mt-2">
                      Sélectionné : {{ selectedPatient()!.firstName }} {{ selectedPatient()!.lastName }}
                    </p>
                  }
                </div>
              } @else {
                <div class="grid grid-cols-2 gap-3">
                  <div>
                    <label class="block text-sm font-medium text-slate-700 mb-1">Prénom *</label>
                    <input type="text" formControlName="guestFirstName" class="input-field" />
                  </div>
                  <div>
                    <label class="block text-sm font-medium text-slate-700 mb-1">Nom *</label>
                    <input type="text" formControlName="guestLastName" class="input-field" />
                  </div>
                </div>
                <div>
                  <label class="block text-sm font-medium text-slate-700 mb-1">Téléphone *</label>
                  <input type="tel" formControlName="guestPhone" class="input-field" />
                </div>
                <div>
                  <label class="block text-sm font-medium text-slate-700 mb-1">E-mail (optionnel)</label>
                  <input type="email" formControlName="guestEmail" class="input-field" />
                </div>
              }

              <div>
                <label class="block text-sm font-medium text-slate-700 mb-1">Type de consultation *</label>
                @if (specialties().length === 0 && !loadingProfile()) {
                  <p class="text-sm text-amber-700 bg-amber-50 border border-amber-200 rounded-lg p-3">
                    Aucune spécialité configurée sur le profil praticien.
                  </p>
                } @else {
                  <select formControlName="specialtyId" class="input-field">
                    <option value="">Choisir une spécialité</option>
                    @for (s of specialties(); track s.specialtyId) {
                      <option [value]="s.specialtyId">
                        {{ s.specialtyName }} ({{ s.consultationDurationMinutes }} min)
                      </option>
                    }
                  </select>
                }
              </div>

              <div>
                <label class="block text-sm font-medium text-slate-700 mb-1">Motif</label>
                <textarea formControlName="reason" rows="2" class="input-field resize-none"
                          placeholder="Motif de la consultation (optionnel)"></textarea>
              </div>

              <div class="flex gap-3 pt-1">
                <button type="button" (click)="close()" class="btn-secondary flex-1">Annuler</button>
                <button type="submit"
                        [disabled]="loadingProfile() || specialties().length === 0 || loadingSlots()"
                        class="btn-primary flex-1">
                  @if (loadingSlots()) {
                    <app-syli-spinner size="xs" class="-ml-1 mr-2 inline-block align-middle" />
                  }
                  Continuer →
                </button>
              </div>
            </form>
          }

          <!-- ═══ ÉTAPE 2 : Créneaux ═══ -->
          @if (step() === 'slot') {
            <div class="px-6 py-5 space-y-4">
              @if (selectedSpecialty()) {
                <div class="bg-slate-50 rounded-lg p-3 text-sm">
                  <p class="font-medium text-slate-900">{{ selectedSpecialty()!.specialtyName }}</p>
                  <p class="text-slate-500">{{ selectedSpecialty()!.consultationDurationMinutes }} min / consultation</p>
                </div>
              }

              <div class="flex items-center justify-between gap-3">
                <button type="button" (click)="prevDay()"
                        [disabled]="!canGoPrev() || loadingSlots()"
                        class="p-2 rounded-lg border border-gray-200 text-gray-600 hover:bg-gray-50
                               disabled:opacity-30 disabled:cursor-not-allowed">
                  <svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M15 19l-7-7 7-7"/>
                  </svg>
                </button>
                <div class="text-center flex-1 min-w-0">
                  <p class="font-semibold text-gray-900 text-sm truncate">{{ formatDateFr(selectedDate()) }}</p>
                </div>
                <button type="button" (click)="nextDay()"
                        [disabled]="!canGoNext() || loadingSlots()"
                        class="p-2 rounded-lg border border-gray-200 text-gray-600 hover:bg-gray-50
                               disabled:opacity-30 disabled:cursor-not-allowed">
                  <svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 5l7 7-7 7"/>
                  </svg>
                </button>
              </div>

              @if (loadingSlots()) {
                <app-syli-spinner size="md" [showLabel]="true" [centered]="true" />
              } @else {
                @if (daySchedule()?.morningSlots?.length) {
                  <div>
                    <h3 class="text-sm font-semibold text-gray-800 mb-2">Matinée</h3>
                    <div class="grid grid-cols-4 sm:grid-cols-5 gap-2">
                      @for (slot of daySchedule()!.morningSlots; track slot.time) {
                        @if (slot.available) {
                          <button type="button" (click)="selectSlot(slot)"
                                  class="py-2 px-1 text-sm font-medium rounded-lg border-2 transition-all"
                                  [class.border-primary-500]="selectedSlot()?.time === slot.time"
                                  [class.bg-primary-500]="selectedSlot()?.time === slot.time"
                                  [class.text-white]="selectedSlot()?.time === slot.time"
                                  [class.border-gray-200]="selectedSlot()?.time !== slot.time">
                            {{ slot.time }}
                          </button>
                        } @else {
                          <div class="py-2 px-1 text-sm rounded-lg border-2 border-gray-100 bg-gray-50 text-center text-gray-300 line-through">
                            {{ slot.time }}
                          </div>
                        }
                      }
                    </div>
                  </div>
                }

                @if (daySchedule()?.afternoonSlots?.length) {
                  <div>
                    <h3 class="text-sm font-semibold text-gray-800 mb-2">Après-midi</h3>
                    <div class="grid grid-cols-4 sm:grid-cols-5 gap-2">
                      @for (slot of daySchedule()!.afternoonSlots; track slot.time) {
                        @if (slot.available) {
                          <button type="button" (click)="selectSlot(slot)"
                                  class="py-2 px-1 text-sm font-medium rounded-lg border-2 transition-all"
                                  [class.border-primary-500]="selectedSlot()?.time === slot.time"
                                  [class.bg-primary-500]="selectedSlot()?.time === slot.time"
                                  [class.text-white]="selectedSlot()?.time === slot.time"
                                  [class.border-gray-200]="selectedSlot()?.time !== slot.time">
                            {{ slot.time }}
                          </button>
                        } @else {
                          <div class="py-2 px-1 text-sm rounded-lg border-2 border-gray-100 bg-gray-50 text-center text-gray-300 line-through">
                            {{ slot.time }}
                          </div>
                        }
                      }
                    </div>
                  </div>
                }

                @if (!daySchedule()?.morningSlots?.length && !daySchedule()?.afternoonSlots?.length) {
                  <div class="text-center py-8 text-gray-400">
                    <p class="font-medium text-sm">Aucun créneau disponible ce jour</p>
                    <p class="text-xs mt-1">Essayez un autre jour avec les flèches.</p>
                  </div>
                }

                @if (selectedSlot()?.replaced) {
                  <div class="bg-orange-50 border border-orange-200 rounded-lg p-3 text-sm text-orange-800">
                    Remplaçant : Dr. {{ selectedSlot()!.substituteName }}
                  </div>
                }
              }

              <div class="flex gap-3 pt-1">
                <button type="button" (click)="backToPatientStep()" class="btn-secondary flex-1">← Retour</button>
                <button type="button" (click)="submit()"
                        [disabled]="!selectedSlot() || loading()"
                        class="btn-primary flex-1">
                  @if (loading()) {
                    <app-syli-spinner size="xs" class="-ml-1 mr-2 inline-block align-middle" />
                    Création…
                  } @else {
                    Créer le RDV
                  }
                </button>
              </div>
            </div>
          }
        </div>
      </div>
    }
  `,
})
export class CreateAppointmentModalComponent implements OnChanges {
  @Input() visible = false;
  @Input() initialDate: Date | null = null;
  @Output() closed = new EventEmitter<void>();
  @Output() created = new EventEmitter<void>();

  form: FormGroup;
  step = signal<ModalStep>('patient');
  mode = signal<PatientMode>('existing');
  searchResults = signal<PatientSearchResult[]>([]);
  searchLoading = signal(false);
  selectedPatient = signal<PatientSearchResult | null>(null);
  loading = signal(false);
  loadingProfile = signal(false);
  loadingSlots = signal(false);
  errorMessage = signal('');

  specialties = signal<PractitionerSpecialtyDto[]>([]);
  selectedDate = signal('');
  daySchedule = signal<DayScheduleResponse | null>(null);
  selectedSlot = signal<TimeSlotDto | null>(null);

  readonly today = todayLocalDateString();
  readonly maxDate = addDaysToLocalDate(todayLocalDateString(), 90);

  private practitionerId: number | null = null;
  private patientPayload: Pick<CreateAppointmentRequest, 'patientId' | 'guestPatientInfo'> | null = null;

  constructor(
    private fb: FormBuilder,
    private appointmentService: AppointmentService,
    private patientService: PatientService,
    private practitionerService: PractitionerService,
    private authService: AuthService,
    private contextService: SecretaryContextService,
  ) {
    this.form = this.fb.group({
      searchQuery: [''],
      guestFirstName: [''],
      guestLastName: [''],
      guestPhone: [''],
      guestEmail: [''],
      specialtyId: ['', Validators.required],
      reason: [''],
    });

    this.form.get('searchQuery')!.valueChanges.pipe(
      debounceTime(300),
      distinctUntilChanged(),
      switchMap((q: string) => {
        const query = (q || '').trim();
        if (query.length < 2) {
          this.searchResults.set([]);
          return of([]);
        }
        this.searchLoading.set(true);
        return this.patientService.search(query).pipe(
          catchError(() => of([] as PatientSearchResult[]))
        );
      }),
    ).subscribe({
      next: (results) => {
        this.searchResults.set(results);
        this.searchLoading.set(false);
      },
      error: () => this.searchLoading.set(false),
    });
  }

  ngOnChanges(): void {
    if (this.visible) {
      this.resetForm();
      this.loadPractitionerSpecialties();
    }
  }

  selectedSpecialty(): PractitionerSpecialtyDto | null {
    const id = Number(this.form.value.specialtyId);
    if (!id) return null;
    return this.specialties().find(s => s.specialtyId === id) ?? null;
  }

  setMode(next: PatientMode): void {
    this.mode.set(next);
    this.selectedPatient.set(null);
    this.searchResults.set([]);
    this.errorMessage.set('');
  }

  selectPatient(patient: PatientSearchResult): void {
    this.selectedPatient.set(patient);
  }

  goToSlotStep(): void {
    this.errorMessage.set('');
    const practitionerId = this.resolvePractitionerId();
    if (!practitionerId) {
      this.errorMessage.set(this.authService.isSecretary()
        ? 'Sélectionnez un praticien dans le menu.'
        : 'Session invalide.');
      return;
    }

    if (this.form.invalid) {
      this.form.markAllAsTouched();
      return;
    }

    const specialtyId = Number(this.form.value.specialtyId);
    if (!specialtyId) {
      this.errorMessage.set('Choisissez un type de consultation.');
      return;
    }

    if (this.mode() === 'existing') {
      const selected = this.selectedPatient();
      if (!selected) {
        this.errorMessage.set('Sélectionnez un patient dans la liste.');
        return;
      }
      this.patientPayload = { patientId: selected.patientId };
    } else {
      const firstName = this.form.value.guestFirstName?.trim();
      const lastName = this.form.value.guestLastName?.trim();
      const phone = this.form.value.guestPhone?.trim();
      const email = this.form.value.guestEmail?.trim();
      if (!firstName || !lastName || !phone) {
        this.errorMessage.set('Nom, prénom et téléphone sont obligatoires pour un patient invité.');
        return;
      }
      this.patientPayload = {
        guestPatientInfo: { firstName, lastName, phone, email: email || null },
      };
    }

    this.loadingSlots.set(true);
    const initialDateStr = this.initialDate ? this.toDateString(this.initialDate) : null;

    if (initialDateStr) {
      this.selectedDate.set(initialDateStr);
      this.loadSlotsForDate(initialDateStr, (ok) => {
        if (ok) this.step.set('slot');
      });
    } else {
      this.practitionerService.getPublicNextAvailableDate(practitionerId, specialtyId).subscribe({
        next: (res) => {
          const date = res.nextDate || this.today;
          this.selectedDate.set(date);
          this.loadSlotsForDate(date, (ok) => {
            if (ok) this.step.set('slot');
          });
        },
        error: () => {
          this.loadingSlots.set(false);
          this.errorMessage.set('Impossible de charger les créneaux disponibles.');
        },
      });
    }
  }

  backToPatientStep(): void {
    this.step.set('patient');
    this.selectedSlot.set(null);
    this.daySchedule.set(null);
    this.errorMessage.set('');
  }

  canGoPrev(): boolean {
    return this.selectedDate() > this.today;
  }

  canGoNext(): boolean {
    return this.selectedDate() < this.maxDate;
  }

  prevDay(): void {
    if (!this.canGoPrev()) return;
    const prev = addDaysToLocalDate(this.selectedDate(), -1);
    this.selectedDate.set(prev);
    this.selectedSlot.set(null);
    this.loadSlotsForDate(prev);
  }

  nextDay(): void {
    if (!this.canGoNext()) return;
    const next = addDaysToLocalDate(this.selectedDate(), 1);
    this.selectedDate.set(next);
    this.selectedSlot.set(null);
    this.loadSlotsForDate(next);
  }

  selectSlot(slot: TimeSlotDto): void {
    this.selectedSlot.set(slot);
  }

  submit(): void {
    const slot = this.selectedSlot();
    const practitionerId = this.resolvePractitionerId();
    const specialty = this.selectedSpecialty();
    if (!slot || !practitionerId || !specialty || !this.patientPayload) return;

    this.loading.set(true);
    this.errorMessage.set('');

    const payload: CreateAppointmentRequest = {
      practitionerId,
      appointmentDateTime: `${this.selectedDate()}T${slot.time}:00`,
      consultationType: specialty.specialtyName,
      reason: this.form.value.reason?.trim() || null,
      ...this.patientPayload,
    };

    this.appointmentService.createAppointment(payload).subscribe({
      next: () => {
        this.loading.set(false);
        this.created.emit();
        this.close();
      },
      error: (err: HttpErrorResponse) => {
        this.loading.set(false);
        this.errorMessage.set(err.error?.detail || 'Erreur lors de la création du rendez-vous.');
      },
    });
  }

  close(): void {
    this.closed.emit();
  }

  onBackdropClick(): void {
    this.close();
  }

  formatDateFr(d: string): string {
    if (!d) return '';
    const [year, month, day] = d.split('-').map(Number);
    const days = ['dimanche', 'lundi', 'mardi', 'mercredi', 'jeudi', 'vendredi', 'samedi'];
    const months = ['janvier', 'février', 'mars', 'avril', 'mai', 'juin',
      'juillet', 'août', 'septembre', 'octobre', 'novembre', 'décembre'];
    const dow = new Date(year, month - 1, day).getDay();
    return `${days[dow]} ${day} ${months[month - 1]} ${year}`;
  }

  private loadPractitionerSpecialties(): void {
    const id = this.resolvePractitionerId();
    if (!id) return;

    this.practitionerId = id;
    this.loadingProfile.set(true);

    const profile$ = this.authService.isPractitioner() && this.authService.currentUser()?.userId === id
      ? this.practitionerService.getMyProfile()
      : this.practitionerService.getPublicById(id);

    profile$.subscribe({
      next: (profile: PractitionerProfileDto) => {
        this.specialties.set(profile.practitionerSpecialties ?? []);
        this.loadingProfile.set(false);
      },
      error: () => {
        this.loadingProfile.set(false);
        this.errorMessage.set('Impossible de charger les spécialités du praticien.');
      },
    });
  }

  private loadSlotsForDate(date: string, onDone?: (success: boolean) => void): void {
    const practitionerId = this.resolvePractitionerId();
    const specialtyId = Number(this.form.value.specialtyId);
    if (!practitionerId || !specialtyId) return;

    this.loadingSlots.set(true);
    this.practitionerService.getPublicSlots(practitionerId, date, specialtyId).subscribe({
      next: (schedule) => {
        this.daySchedule.set(schedule);
        if (schedule.date) {
          this.selectedDate.set(schedule.date);
        }
        this.loadingSlots.set(false);
        onDone?.(true);
      },
      error: (err: HttpErrorResponse) => {
        this.loadingSlots.set(false);
        this.errorMessage.set(err.error?.detail || 'Impossible de charger les créneaux.');
        onDone?.(false);
      },
    });
  }

  private resolvePractitionerId(): number | null {
    if (this.authService.isSecretary()) {
      return this.contextService.selectedPractitionerId();
    }
    return this.authService.currentUser()?.userId ?? null;
  }

  private resetForm(): void {
    this.step.set('patient');
    this.mode.set('existing');
    this.selectedPatient.set(null);
    this.searchResults.set([]);
    this.specialties.set([]);
    this.selectedDate.set('');
    this.daySchedule.set(null);
    this.selectedSlot.set(null);
    this.patientPayload = null;
    this.errorMessage.set('');
    this.form.reset({
      searchQuery: '',
      guestFirstName: '',
      guestLastName: '',
      guestPhone: '',
      guestEmail: '',
      specialtyId: '',
      reason: '',
    });
  }

  private toDateString(d: Date): string {
    const pad = (n: number) => (n < 10 ? `0${n}` : `${n}`);
    return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}`;
  }
}
