import { Component, OnInit, signal } from '@angular/core';
import { FormBuilder, FormGroup, ReactiveFormsModule, Validators } from '@angular/forms';
import { CommonModule } from '@angular/common';
import { HttpErrorResponse } from '@angular/common/http';
import { AvailabilitySlotService, AvailabilitySlotDto } from '../../../core/services/availability-slot.service';
import { todayLocalDateString, formatLocalDate } from '../../../core/utils/date-utils';
import { SyliSpinnerComponent } from '../../../shared/components/syli-spinner/syli-spinner.component';

const DAY_OPTIONS = [
  { value: 1, label: 'Lundi' },
  { value: 2, label: 'Mardi' },
  { value: 3, label: 'Mercredi' },
  { value: 4, label: 'Jeudi' },
  { value: 5, label: 'Vendredi' },
  { value: 6, label: 'Samedi' },
  { value: 7, label: 'Dimanche' },
];

@Component({
  selector: 'app-availability-management',
  standalone: true,
  imports: [  ReactiveFormsModule, CommonModule, SyliSpinnerComponent],
  template: `
    <div class="max-w-4xl mx-auto px-4 py-8">
      <div class="mb-8">
        <h1 class="text-2xl font-bold text-gray-900">Gestion des plages horaires</h1>
        <p class="text-gray-500 mt-1">Définissez vos horaires d'ouverture — aucun chevauchement n'est permis</p>
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

      <div class="grid lg:grid-cols-2 gap-6">

        <!-- Formulaire -->
        <div class="card">
          <h2 class="text-base font-semibold text-gray-900 mb-5">Nouvelle plage horaire</h2>
          <form [formGroup]="slotForm" (ngSubmit)="onSubmit()" class="space-y-4">

            <!-- Type -->
            <div>
              <label class="block text-sm font-medium text-gray-700 mb-2">Type de plage</label>
              <div class="grid grid-cols-2 gap-3">
                <label class="cursor-pointer">
                  <input type="radio" formControlName="recurring" [value]="true" class="sr-only peer"/>
                  <div class="flex items-center gap-2 p-3 border-2 border-gray-200 rounded-xl
                               peer-checked:border-primary-500 peer-checked:bg-primary-50 text-sm font-medium transition-all">
                    <svg class="w-4 h-4 text-gray-400 peer-checked:text-primary-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15"/>
                    </svg>
                    Récurrente
                  </div>
                </label>
                <label class="cursor-pointer">
                  <input type="radio" formControlName="recurring" [value]="false" class="sr-only peer"/>
                  <div class="flex items-center gap-2 p-3 border-2 border-gray-200 rounded-xl
                               peer-checked:border-primary-500 peer-checked:bg-primary-50 text-sm font-medium transition-all">
                    <svg class="w-4 h-4 text-gray-400 peer-checked:text-primary-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z"/>
                    </svg>
                    Ponctuelle
                  </div>
                </label>
              </div>
            </div>

            <!-- Jours de la semaine (multi-sélection — récurrente uniquement) -->
            @if (slotForm.get('recurring')?.value === true) {
              <div>
                <label class="block text-sm font-medium text-gray-700 mb-2">
                  Jours de la semaine <span class="text-red-500">*</span>
                </label>
                <div class="flex flex-wrap gap-2">
                  @for (day of dayOptions; track day.value) {
                    <label class="cursor-pointer">
                      <input type="checkbox"
                             [checked]="isDaySelected(day.value)"
                             (change)="toggleDay(day.value, $event)"
                             class="sr-only peer"/>
                      <span class="inline-flex items-center justify-center w-10 h-10 text-xs font-semibold
                                   rounded-full border-2 border-gray-200 text-gray-600 transition-all
                                   peer-checked:border-primary-500 peer-checked:bg-primary-500 peer-checked:text-white
                                   hover:border-primary-300 cursor-pointer">
                        {{ day.label.slice(0, 2) }}
                      </span>
                    </label>
                  }
                </div>
                @if (selectedDays().length === 0 && formSubmitted()) {
                  <p class="text-xs text-red-600 mt-1">Sélectionnez au moins un jour</p>
                }
              </div>
            }

            <!-- Date (ponctuelle uniquement) -->
            @if (slotForm.get('recurring')?.value === false) {
              <div>
                <label for="specificDate" class="block text-sm font-medium text-gray-700 mb-1">
                  Date <span class="text-red-500">*</span>
                </label>
                <input id="specificDate" type="date" formControlName="specificDate"
                       [min]="today" class="input-field"/>
              </div>
            }

            <!-- Horaires -->
            <div class="grid grid-cols-2 gap-3">
              <div>
                <label for="startTime" class="block text-sm font-medium text-gray-700 mb-1">
                  Heure début <span class="text-red-500">*</span>
                </label>
                <input id="startTime" type="time" formControlName="startTime" class="input-field"/>
              </div>
              <div>
                <label for="endTime" class="block text-sm font-medium text-gray-700 mb-1">
                  Heure fin <span class="text-red-500">*</span>
                </label>
                <input id="endTime" type="time" formControlName="endTime" class="input-field"/>
              </div>
            </div>

            <!-- Remplaçant -->
            <div class="border-t border-gray-100 pt-4">
              <label class="flex items-center gap-3 cursor-pointer">
                <input type="checkbox" formControlName="replaced"
                       class="w-4 h-4 text-primary-600 rounded border-gray-300"/>
                <span class="text-sm font-medium text-gray-700">Je serai remplacé sur cette plage</span>
              </label>
              @if (slotForm.get('replaced')?.value) {
                <div class="mt-3">
                  <input type="text" formControlName="substituteName" class="input-field"
                         placeholder="Dr. Nom du remplaçant"/>
                </div>
              }
            </div>

            <button type="submit" [disabled]="saving()" class="btn-primary w-full">
              @if (saving()) { Enregistrement... } @else { + Ajouter la plage }
            </button>
          </form>
        </div>

        <!-- Liste -->
        <div>
          <h2 class="text-base font-semibold text-gray-900 mb-4">
            Mes plages ({{ slots().length }})
          </h2>
          @if (loading()) {
            <app-syli-spinner size="sm" [showLabel]="true" [centered]="true" />
          } @else if (slots().length === 0) {
            <div class="card text-center py-10 text-gray-400">Aucune plage définie</div>
          } @else {
            <div class="space-y-3">
              @for (slot of slots(); track slot.id) {
                <div class="card hover:shadow-md transition-shadow">
                  <div class="flex items-start justify-between gap-3">
                    <div class="flex-1 min-w-0">
                      <div class="flex flex-wrap items-center gap-1.5 mb-1.5">
                        @if (slot.recurring) {
                          <span class="inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium bg-blue-100 text-blue-800">
                            Récurrente
                          </span>
                          @for (label of slot.dayLabels; track label) {
                            <span class="inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium bg-gray-100 text-gray-700">
                              {{ label }}
                            </span>
                          }
                        } @else {
                          <span class="inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium bg-purple-100 text-purple-800">
                            Ponctuelle
                          </span>
                          <span class="text-xs text-gray-500">{{ formatDate(slot.specificDate!) }}</span>
                        }
                        @if (slot.replaced) {
                          <span class="inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium bg-orange-100 text-orange-800">
                            Remplaçant
                          </span>
                        }
                      </div>
                      <p class="text-sm font-semibold text-gray-900">
                        {{ slot.startTime }} – {{ slot.endTime }}
                      </p>
                      @if (slot.replaced && slot.substituteName) {
                        <p class="text-xs text-orange-700 mt-0.5">Dr. {{ slot.substituteName }}</p>
                      }
                    </div>
                    <button (click)="deleteSlot(slot.id)"
                            [disabled]="deletingId() === slot.id"
                            class="text-gray-400 hover:text-red-500 transition-colors p-1 flex-shrink-0">
                      <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2"
                              d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16"/>
                      </svg>
                    </button>
                  </div>
                </div>
              }
            </div>
          }
        </div>
      </div>
    </div>
  `,
})
export class AvailabilityManagementComponent implements OnInit {
  readonly dayOptions = DAY_OPTIONS;
  readonly today = todayLocalDateString();

  slots = signal<AvailabilitySlotDto[]>([]);
  selectedDays = signal<number[]>([]);
  loading = signal(true);
  saving = signal(false);
  deletingId = signal<number | null>(null);
  successMessage = signal('');
  errorMessage = signal('');
  formSubmitted = signal(false);

  slotForm: FormGroup;

  constructor(
    private fb: FormBuilder,
    private slotService: AvailabilitySlotService
  ) {
    this.slotForm = this.fb.group({
      recurring: [true],
      specificDate: [''],
      startTime: ['', Validators.required],
      endTime: ['', Validators.required],
      replaced: [false],
      substituteName: [''],
    });
  }

  ngOnInit(): void {
    this.slotService.getMySlots().subscribe({
      next: (data) => { this.slots.set(data); this.loading.set(false); },
      error: () => this.loading.set(false),
    });
  }

  isDaySelected(dayValue: number): boolean {
    return this.selectedDays().includes(dayValue);
  }

  toggleDay(dayValue: number, event: Event): void {
    const checked = (event.target as HTMLInputElement).checked;
    if (checked) {
      this.selectedDays.update(d => [...d, dayValue].sort());
    } else {
      this.selectedDays.update(d => d.filter(v => v !== dayValue));
    }
  }

  onSubmit(): void {
    this.formSubmitted.set(true);
    this.errorMessage.set('');
    this.successMessage.set('');

    const v = this.slotForm.value;
    const isRecurring = v.recurring === true;

    if (isRecurring && this.selectedDays().length === 0) return;
    if (!v.startTime || !v.endTime) return;

    const request: any = {
      recurring: isRecurring,
      startTime: v.startTime,
      endTime: v.endTime,
      replaced: v.replaced,
      substituteName: v.replaced ? v.substituteName : undefined,
    };

    if (isRecurring) {
      request.days = this.selectedDays();
    } else {
      request.specificDate = v.specificDate;
    }

    this.saving.set(true);
    this.slotService.createSlot(request).subscribe({
      next: (created) => {
        this.slots.update(list => [created, ...list]);
        this.saving.set(false);
        this.formSubmitted.set(false);
        this.selectedDays.set([]);
        this.slotForm.patchValue({ startTime: '', endTime: '', replaced: false, substituteName: '', specificDate: '' });
        this.successMessage.set('Plage ajoutée avec succès.');
        setTimeout(() => this.successMessage.set(''), 3000);
      },
      error: (err: HttpErrorResponse) => {
        this.saving.set(false);
        this.errorMessage.set(err.error?.detail || err.error?.message || 'Erreur lors de l\'ajout de la plage.');
      },
    });
  }

  deleteSlot(id: number): void {
    this.deletingId.set(id);
    this.slotService.deleteSlot(id).subscribe({
      next: (res) => {
        this.slots.update(list => list.filter(s => s.id !== id));
        this.deletingId.set(null);
        this.successMessage.set(res.message);
        setTimeout(() => this.successMessage.set(''), 4000);
      },
      error: () => this.deletingId.set(null),
    });
  }

  formatDate(d: string): string {
    return formatLocalDate(d);
  }
}
