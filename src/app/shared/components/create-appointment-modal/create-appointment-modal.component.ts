import { Component, EventEmitter, Input, OnChanges, Output, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormBuilder, FormGroup, ReactiveFormsModule, Validators } from '@angular/forms';
import { debounceTime, distinctUntilChanged, switchMap, of, catchError } from 'rxjs';
import { AppointmentService } from '../../../core/services/appointment.service';
import { PatientService } from '../../../core/services/patient.service';
import { AuthService } from '../../../core/services/auth.service';
import { SecretaryContextService } from '../../../core/services/secretary-context.service';
import { PatientSearchResult } from '../../../core/models/patient.model';
import { CreateAppointmentRequest } from '../../../core/models/appointment.model';
import { SyliSpinnerComponent } from '../syli-spinner/syli-spinner.component';

type PatientMode = 'existing' | 'guest';

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
                <p class="text-sm text-slate-500 mt-1">Patient existant ou invité sans compte</p>
              </div>
              <button type="button" (click)="close()"
                      class="p-1.5 rounded-lg text-slate-400 hover:text-slate-600 hover:bg-slate-100"
                      aria-label="Fermer">
                <svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M6 18L18 6M6 6l12 12"/>
                </svg>
              </button>
            </div>
          </div>

          <form [formGroup]="form" (ngSubmit)="submit()" class="px-6 py-5 space-y-5">
            @if (errorMessage()) {
              <div class="bg-red-50 border border-red-200 rounded-lg p-3">
                <p class="text-sm text-red-700">{{ errorMessage() }}</p>
              </div>
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
              <label class="block text-sm font-medium text-slate-700 mb-1">Date et heure *</label>
              <input type="datetime-local" formControlName="appointmentDateTime" class="input-field" />
            </div>

            <div>
              <label class="block text-sm font-medium text-slate-700 mb-1">Type de consultation</label>
              <input type="text" formControlName="consultationType" class="input-field"
                     placeholder="Ex. Consultation générale" />
            </div>

            <div>
              <label class="block text-sm font-medium text-slate-700 mb-1">Motif</label>
              <textarea formControlName="reason" rows="2" class="input-field resize-none"
                        placeholder="Motif de la consultation (optionnel)"></textarea>
            </div>

            <div class="flex gap-3 pt-1">
              <button type="button" (click)="close()" class="btn-secondary flex-1">Annuler</button>
              <button type="submit" [disabled]="loading()" class="btn-primary flex-1">
                @if (loading()) {
                  <app-syli-spinner size="xs" class="-ml-1 mr-2 inline-block align-middle" />
                  Création…
                } @else {
                  Créer le RDV
                }
              </button>
            </div>
          </form>
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
  mode = signal<PatientMode>('existing');
  searchResults = signal<PatientSearchResult[]>([]);
  searchLoading = signal(false);
  selectedPatient = signal<PatientSearchResult | null>(null);
  loading = signal(false);
  errorMessage = signal('');

  constructor(
    private fb: FormBuilder,
    private appointmentService: AppointmentService,
    private patientService: PatientService,
    private authService: AuthService,
    private contextService: SecretaryContextService,
  ) {
    this.form = this.fb.group({
      searchQuery: [''],
      guestFirstName: [''],
      guestLastName: [''],
      guestPhone: [''],
      guestEmail: [''],
      appointmentDateTime: ['', Validators.required],
      consultationType: [''],
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
      if (this.initialDate) {
        this.form.patchValue({ appointmentDateTime: this.toDatetimeLocalValue(this.initialDate) });
      }
    }
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

  submit(): void {
    this.errorMessage.set('');
    let practitionerId = this.authService.currentUser()?.userId;
    if (this.authService.isSecretary()) {
      practitionerId = this.contextService.selectedPractitionerId() ?? undefined;
    }
    if (!practitionerId) {
      this.errorMessage.set(this.authService.isSecretary()
        ? 'Sélectionnez un praticien dans le menu.'
        : 'Session invalide.');
      return;
    }

    const dt = this.form.get('appointmentDateTime')?.value;
    if (!dt) {
      this.form.markAllAsTouched();
      return;
    }

    const payload: CreateAppointmentRequest = {
      practitionerId,
      appointmentDateTime: this.toApiDateTime(dt),
      consultationType: this.form.value.consultationType?.trim() || null,
      reason: this.form.value.reason?.trim() || null,
    };

    if (this.mode() === 'existing') {
      const selected = this.selectedPatient();
      if (!selected) {
        this.errorMessage.set('Sélectionnez un patient dans la liste.');
        return;
      }
      payload.patientId = selected.patientId;
    } else {
      const firstName = this.form.value.guestFirstName?.trim();
      const lastName = this.form.value.guestLastName?.trim();
      const phone = this.form.value.guestPhone?.trim();
      const email = this.form.value.guestEmail?.trim();
      if (!firstName || !lastName || !phone) {
        this.errorMessage.set('Nom, prénom et téléphone sont obligatoires pour un patient invité.');
        return;
      }
      payload.guestPatientInfo = {
        firstName,
        lastName,
        phone,
        email: email || null,
      };
    }

    this.loading.set(true);
    this.appointmentService.createAppointment(payload).subscribe({
      next: () => {
        this.loading.set(false);
        this.created.emit();
        this.close();
      },
      error: (err) => {
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

  private resetForm(): void {
    this.mode.set('existing');
    this.selectedPatient.set(null);
    this.searchResults.set([]);
    this.errorMessage.set('');
    this.form.reset({
      searchQuery: '',
      guestFirstName: '',
      guestLastName: '',
      guestPhone: '',
      guestEmail: '',
      appointmentDateTime: '',
      consultationType: '',
      reason: '',
    });
  }

  private toDatetimeLocalValue(d: Date): string {
    const pad = (n: number) => (n < 10 ? `0${n}` : `${n}`);
    return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}T${pad(d.getHours())}:${pad(d.getMinutes())}`;
  }

  private toApiDateTime(localValue: string): string {
    const [datePart, timePart] = localValue.split('T');
    return `${datePart}T${timePart}:00`;
  }
}
