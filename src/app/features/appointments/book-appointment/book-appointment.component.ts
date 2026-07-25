import { Component, OnInit, signal } from '@angular/core';
import { FormBuilder, FormGroup, Validators, ReactiveFormsModule } from '@angular/forms';
import { Router } from '@angular/router';
import { HttpErrorResponse } from '@angular/common/http';
import { CommonModule } from '@angular/common';
import { PractitionerService } from '../../../core/services/practitioner.service';
import { AppointmentService } from '../../../core/services/appointment.service';
import { ReferenceDataService } from '../../../core/services/reference-data.service';
import { PractitionerSearchResult, DayScheduleResponse, TimeSlotDto } from '../../../core/models/practitioner.model';
import { AppointmentResponse, MERCHANT_TYPE_LABELS } from '../../../core/models/appointment.model';
import { CityDto, SpecialtyDto } from '../../../core/models/city.model';
import { todayLocalDateString, addDaysToLocalDate } from '../../../core/utils/date-utils';
import { SyliSpinnerComponent } from '../../../shared/components/syli-spinner/syli-spinner.component';
import { UserProfileModalComponent } from '../../../shared/components/user-profile-modal/user-profile-modal.component';

type BookingStep = 'search' | 'select-slot' | 'payment-instructions' | 'submit-reference';

@Component({
  selector: 'app-book-appointment',
  standalone: true,
  imports: [  ReactiveFormsModule, CommonModule, SyliSpinnerComponent, UserProfileModalComponent],
  template: `
    <div class="max-w-3xl mx-auto px-4 py-8">
      <div class="mb-8">
        <h1 class="text-2xl font-bold text-gray-900">Prendre un rendez-vous</h1>
        <p class="text-gray-500 mt-1">Trouvez un praticien et choisissez votre créneau</p>
      </div>

      <!-- Stepper -->
      <div class="flex items-center mb-8">
        @for (step of steps; track step.id; let i = $index) {
          <div class="flex items-center" [class.flex-1]="i < steps.length - 1">
            <div class="flex items-center gap-2">
              <div class="w-8 h-8 rounded-full flex items-center justify-center text-sm font-medium transition-colors"
                   [class.bg-primary-600]="isStepDone(step.id) || currentStep() === step.id"
                   [class.text-white]="isStepDone(step.id) || currentStep() === step.id"
                   [class.bg-gray-200]="!isStepDone(step.id) && currentStep() !== step.id"
                   [class.text-gray-500]="!isStepDone(step.id) && currentStep() !== step.id">
                @if (isStepDone(step.id)) {
                  <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M5 13l4 4L19 7"/>
                  </svg>
                } @else { {{ i + 1 }} }
              </div>
              <span class="text-xs font-medium hidden sm:block"
                    [class.text-primary-700]="currentStep() === step.id"
                    [class.text-gray-500]="currentStep() !== step.id">{{ step.label }}</span>
            </div>
            @if (i < steps.length - 1) {
              <div class="flex-1 h-0.5 mx-2"
                   [class.bg-primary-400]="isStepDone(step.id)"
                   [class.bg-gray-200]="!isStepDone(step.id)"></div>
            }
          </div>
        }
      </div>

      @if (errorMessage()) {
        <div class="bg-red-50 border border-red-200 rounded-lg p-4 mb-6">
          <p class="text-sm text-red-700">{{ errorMessage() }}</p>
        </div>
      }

      <!-- ═══════════════════════════════════════════════════════
           ÉTAPE 1 : Recherche ville + spécialité → liste praticiens
           ═══════════════════════════════════════════════════════ -->
      @if (currentStep() === 'search') {
        <div class="space-y-5">
          <div class="card">
            <h2 class="text-lg font-semibold text-gray-900 mb-4">Trouver un praticien</h2>
            <form [formGroup]="searchForm" (ngSubmit)="doSearch()" class="space-y-4">
              <div class="grid sm:grid-cols-2 gap-4">
                <div>
                  <label for="cityId" class="block text-sm font-medium text-gray-700 mb-1">
                    Ville <span class="text-red-500">*</span>
                  </label>
                  <select id="cityId" formControlName="cityId" class="input-field">
                    <option value="">Toutes les villes</option>
                    @for (city of cities(); track city.id) {
                      <option [value]="city.id">{{ city.name }}</option>
                    }
                  </select>
                </div>
                <div>
                  <label for="specialtyId" class="block text-sm font-medium text-gray-700 mb-1">
                    Spécialité <span class="text-red-500">*</span>
                  </label>
                  <select id="specialtyId" formControlName="specialtyId" class="input-field">
                    <option value="">Choisir une spécialité</option>
                    @for (s of specialties(); track s.id) {
                      <option [value]="s.id">{{ s.name }}</option>
                    }
                  </select>
                </div>
              </div>
              <button type="submit" [disabled]="!searchForm.value.specialtyId || searching()" class="btn-primary w-full">
                @if (searching()) { Recherche en cours... } @else { Rechercher }
              </button>
            </form>
          </div>

          <!-- Résultats -->
          @if (searchDone()) {
            @if (practitioners().length === 0) {
              <div class="card text-center py-10 text-gray-400">
                <svg class="w-10 h-10 mx-auto mb-2 text-gray-300" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path stroke-linecap="round" stroke-linejoin="round" stroke-width="1.5"
                        d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0"/>
                </svg>
                <p class="font-medium">Aucun praticien disponible</p>
                <p class="text-sm mt-1">Essayez une autre ville ou spécialité.</p>
              </div>
            } @else {
              <div class="space-y-3">
                @for (p of practitioners(); track p.userId) {
                  <button (click)="selectPractitioner(p)"
                          class="w-full text-left p-4 border-2 border-gray-200 rounded-xl transition-all
                                 hover:border-primary-400 hover:bg-primary-50/30">
                    <div class="flex items-start gap-4">
                      <div class="w-12 h-12 rounded-full bg-primary-100 flex items-center justify-center flex-shrink-0">
                        <span class="text-primary-700 font-semibold text-sm">
                          {{ p.firstName.charAt(0) }}{{ p.lastName.charAt(0) }}
                        </span>
                      </div>
                      <div class="flex-1 min-w-0">
                        <button type="button"
                                (click)="openPractitionerProfile(p.userId, $event)"
                                class="font-semibold text-gray-900 hover:text-primary-700 hover:underline text-left">
                          Dr. {{ p.firstName }} {{ p.lastName }}
                        </button>
                        <p class="text-sm text-primary-700 font-medium">{{ p.specialtyName }}</p>
                        <div class="flex flex-wrap items-center gap-3 mt-1">
                          @if (p.cityName) {
                            <span class="text-xs text-gray-500 flex items-center gap-1">
                              <svg class="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2"
                                      d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z"/>
                              </svg>
                              {{ p.cityName }}
                            </span>
                          }
                          <span class="text-xs text-gray-500">
                            Consultation : {{ p.consultationDurationMinutes }} min
                          </span>
                        </div>
                        <p class="text-xs text-sky-700 font-medium mt-2 flex items-center gap-1">
                          <svg class="w-3.5 h-3.5 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2"
                                  d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z"/>
                          </svg>
                          Prochain créneau : {{ formatDateFr(p.firstAvailableDate) }}
                        </p>
                        @if (p.bio) {
                          <p class="text-xs text-gray-400 mt-1 line-clamp-2">{{ p.bio }}</p>
                        }
                      </div>
                      <svg class="w-5 h-5 text-gray-300 flex-shrink-0 mt-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 5l7 7-7 7"/>
                      </svg>
                    </div>
                  </button>
                }
              </div>
            }
          }
        </div>
      }

      <!-- ═══════════════════════════════════════════════════════
           ÉTAPE 2 : Créneaux Matin / Après-midi
           ═══════════════════════════════════════════════════════ -->
      @if (currentStep() === 'select-slot') {
        <div class="space-y-5">
          <!-- En-tête praticien -->
          <div class="card flex items-center gap-4">
            <div class="w-14 h-14 rounded-full bg-primary-100 flex items-center justify-center flex-shrink-0">
              <span class="text-primary-700 font-bold">
                {{ selectedPractitioner()!.firstName.charAt(0) }}{{ selectedPractitioner()!.lastName.charAt(0) }}
              </span>
            </div>
            <div>
              <button type="button"
                      (click)="openPractitionerProfile(selectedPractitioner()!.userId, $event)"
                      class="font-bold text-gray-900 hover:text-primary-700 hover:underline text-left">
                Dr. {{ selectedPractitioner()!.firstName }} {{ selectedPractitioner()!.lastName }}
              </button>
              <p class="text-sm text-primary-700">{{ daySchedule()?.specialtyName }}</p>
              <p class="text-sm text-gray-500">
                <strong>{{ daySchedule()?.consultationDurationMinutes }} min</strong> / consultation
              </p>
            </div>
          </div>

          <!-- Navigation par date (aujourd'hui → +3 mois) -->
          <div class="card flex items-center justify-between gap-3">
            <button type="button" (click)="prevDay()"
                    [disabled]="!canGoPrev() || loadingSlots()"
                    class="p-2 rounded-lg border border-gray-200 text-gray-600 hover:bg-gray-50
                           disabled:opacity-30 disabled:cursor-not-allowed transition-colors"
                    title="Jour précédent">
              <svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M15 19l-7-7 7-7"/>
              </svg>
            </button>
            <div class="text-center flex-1 min-w-0">
              <p class="font-semibold text-gray-900 truncate">{{ formatDateFr(selectedDate()) }}</p>
              <p class="text-xs text-gray-400 mt-0.5">Naviguez jusqu'à 3 mois</p>
            </div>
            <button type="button" (click)="nextDay()"
                    [disabled]="!canGoNext() || loadingSlots()"
                    class="p-2 rounded-lg border border-gray-200 text-gray-600 hover:bg-gray-50
                           disabled:opacity-30 disabled:cursor-not-allowed transition-colors"
                    title="Jour suivant">
              <svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 5l7 7-7 7"/>
              </svg>
            </button>
          </div>

          @if (loadingSlots()) {
            <app-syli-spinner size="md" [showLabel]="true" [centered]="true" />
          } @else {
            <!-- Bloc Matinée -->
            @if (daySchedule()?.morningSlots?.length) {
              <div class="card">
                <h3 class="text-base font-semibold text-gray-800 mb-3 flex items-center gap-2">
                  <svg class="w-5 h-5 text-yellow-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2"
                          d="M12 3v1m0 16v1m9-9h-1M4 12H3m15.364-6.364l-.707.707M6.343 17.657l-.707.707M17.657 17.657l-.707-.707M6.343 6.343l-.707-.707"/>
                  </svg>
                  Matinée <span class="text-xs font-normal text-gray-400">(avant 12h)</span>
                </h3>
                <div class="grid grid-cols-4 sm:grid-cols-6 gap-2">
                  @for (slot of daySchedule()!.morningSlots; track slot.time) {
                    @if (slot.available) {
                      <button (click)="selectSlot(slot)"
                              class="py-2 px-1 text-sm font-medium rounded-lg border-2 transition-all text-center"
                              [class.border-primary-500]="selectedSlot()?.time === slot.time"
                              [class.bg-primary-500]="selectedSlot()?.time === slot.time"
                              [class.text-white]="selectedSlot()?.time === slot.time"
                              [class.border-gray-200]="selectedSlot()?.time !== slot.time"
                              [class.hover:border-primary-300]="selectedSlot()?.time !== slot.time">
                        {{ slot.time }}
                        @if (slot.replaced) { <span class="block text-[10px] opacity-75">Rempl.</span> }
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

            <!-- Bloc Après-midi -->
            @if (daySchedule()?.afternoonSlots?.length) {
              <div class="card">
                <h3 class="text-base font-semibold text-gray-800 mb-3 flex items-center gap-2">
                  <svg class="w-5 h-5 text-orange-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2"
                          d="M20.354 15.354A9 9 0 018.646 3.646 9.003 9.003 0 0012 21a9.003 9.003 0 008.354-5.646z"/>
                  </svg>
                  Après-midi <span class="text-xs font-normal text-gray-400">(dès 12h)</span>
                </h3>
                <div class="grid grid-cols-4 sm:grid-cols-6 gap-2">
                  @for (slot of daySchedule()!.afternoonSlots; track slot.time) {
                    @if (slot.available) {
                      <button (click)="selectSlot(slot)"
                              class="py-2 px-1 text-sm font-medium rounded-lg border-2 transition-all text-center"
                              [class.border-primary-500]="selectedSlot()?.time === slot.time"
                              [class.bg-primary-500]="selectedSlot()?.time === slot.time"
                              [class.text-white]="selectedSlot()?.time === slot.time"
                              [class.border-gray-200]="selectedSlot()?.time !== slot.time"
                              [class.hover:border-primary-300]="selectedSlot()?.time !== slot.time">
                        {{ slot.time }}
                        @if (slot.replaced) { <span class="block text-[10px] opacity-75">Rempl.</span> }
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
              <div class="card text-center py-10 text-gray-400">
                <p class="font-medium">Aucun créneau disponible ce jour</p>
                <p class="text-sm mt-1">Essayez un autre jour avec les flèches ci-dessus.</p>
              </div>
            }

            <!-- Motif + info remplaçant — visible uniquement après sélection d'un créneau -->
            @if (selectedSlot()) {
              @if (selectedSlot()!.replaced) {
                <div class="bg-orange-50 border border-orange-200 rounded-xl p-4">
                  <p class="text-sm text-orange-800 font-medium">
                    Remplaçant sur ce créneau : Dr. {{ selectedSlot()!.substituteName }}
                  </p>
                </div>
              }

              <div class="card">
                <label for="reason" class="block text-sm font-medium text-gray-700 mb-1">
                  Motif de consultation <span class="text-gray-400">(optionnel)</span>
                </label>
                <textarea id="reason" [formControl]="reasonControl" rows="2"
                          class="input-field resize-none"
                          placeholder="Décrivez brièvement votre motif..."></textarea>
              </div>
            }
          }

          <div class="flex justify-between gap-3">
            <button class="btn-secondary" (click)="backToSearch()">Retour</button>
            <button class="btn-primary flex-1" [disabled]="!selectedSlot() || loadingSlots()" (click)="goToPaymentInstructions()">
              Confirmer le créneau {{ selectedSlot()?.time }}
            </button>
          </div>
        </div>
      }

      <!-- ═══════════════════════════════════════════════════════
           ÉTAPE 3 : Instructions paiement Mobile Money
           ═══════════════════════════════════════════════════════ -->
      @if (currentStep() === 'payment-instructions') {
        <div class="card space-y-5">
          <h2 class="text-lg font-semibold text-gray-900">Instructions de paiement</h2>

          <div class="bg-amber-50 border border-amber-200 rounded-xl p-4 flex gap-3">
            <svg class="w-5 h-5 text-amber-600 flex-shrink-0 mt-0.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2"
                    d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"/>
            </svg>
            <p class="text-sm text-amber-800">
              Effectuez le paiement Mobile Money ci-dessous, puis saisissez la référence de transaction reçue par SMS.
            </p>
          </div>

          <!-- Récapitulatif -->
          <div class="bg-gray-50 rounded-xl p-5 space-y-2">
            <div class="flex justify-between text-sm">
              <span class="text-gray-600">Praticien</span>
              <span class="font-medium">Dr. {{ selectedPractitioner()!.firstName }} {{ selectedPractitioner()!.lastName }}</span>
            </div>
            <div class="flex justify-between text-sm">
              <span class="text-gray-600">Spécialité</span>
              <span class="font-medium">{{ selectedPractitioner()!.specialtyName }}</span>
            </div>
            <div class="flex justify-between text-sm">
              <span class="text-gray-600">Créneau</span>
              <span class="font-medium">{{ formatDateFr(selectedDate()) }} à {{ selectedSlot()?.time }}</span>
            </div>
            @if (selectedSlot()?.replaced) {
              <div class="flex justify-between text-sm">
                <span class="text-gray-600">Remplaçant</span>
                <span class="font-medium text-orange-700">Dr. {{ selectedSlot()?.substituteName }}</span>
              </div>
            }
          </div>

          <!-- Coordonnées Mobile Money -->
          @if (selectedPractitioner()!.merchantNumber) {
            <div class="border-2 border-primary-200 bg-primary-50 rounded-xl p-5">
              <p class="font-semibold text-gray-900 mb-3">Numéro Marchand</p>
              <div class="flex items-center justify-between bg-white rounded-lg p-3 border border-primary-200">
                <span class="text-2xl font-mono font-bold text-primary-800 tracking-wider">
                  {{ selectedPractitioner()!.merchantNumber }}
                </span>
                <button (click)="copyMerchantNumber()" class="text-xs text-primary-600 border border-primary-300 rounded px-2 py-1 hover:bg-primary-100">
                  Copier
                </button>
              </div>
            </div>
          }

          <div class="flex justify-between">
            <button class="btn-secondary" (click)="goToStep('select-slot')">Retour</button>
            <button class="btn-primary" (click)="createAppointmentAndGoToReference()" [disabled]="creatingAppointment()">
              @if (creatingAppointment()) { Création... } @else { J'ai effectué le paiement → }
            </button>
          </div>
        </div>
      }

      <!-- ═══════════════════════════════════════════════════════
           ÉTAPE 4 : Saisie de la référence de paiement
           ═══════════════════════════════════════════════════════ -->
      @if (currentStep() === 'submit-reference') {
        <div class="card space-y-5">
          <h2 class="text-lg font-semibold text-gray-900">Référence de transaction</h2>
          <div class="bg-blue-50 border border-blue-200 rounded-lg p-4">
            <p class="text-sm text-blue-800">
              Votre demande a été enregistrée. Saisissez la référence SMS pour valider votre réservation.
            </p>
          </div>
          <form [formGroup]="referenceForm" (ngSubmit)="submitReference()">
            <label for="paymentReference" class="block text-sm font-medium text-gray-700 mb-1">
              Référence de transaction SMS
            </label>
            <input id="paymentReference" type="text" formControlName="paymentReference"
                   class="input-field font-mono text-lg tracking-wide"
                   placeholder="Ex: TXN2024XXXXXX"/>
            @if (referenceForm.get('paymentReference')?.invalid && referenceForm.get('paymentReference')?.touched) {
              <p class="error-message">La référence est obligatoire (min. 4 caractères).</p>
            }
            <p class="text-xs text-gray-400 mt-1">Exemple : "Référence: ORM2024123456"</p>
            <button type="submit" class="btn-success w-full py-3 mt-4"
                    [disabled]="referenceForm.invalid || submittingReference()">
              @if (submittingReference()) { Envoi... } @else { Valider ma réservation }
            </button>
          </form>
        </div>
      }
    </div>

    <!-- Popup consignes de fin de réservation -->
    @if (showInstructionsModal()) {
      <div class="fixed inset-0 z-50 flex items-center justify-center p-4" (click)="closeInstructionsModal()">
        <div class="absolute inset-0 bg-slate-900/40 backdrop-blur-sm"></div>
        <div class="relative bg-white rounded-2xl shadow-2xl w-full max-w-lg border border-slate-100"
             (click)="$event.stopPropagation()" role="dialog" aria-modal="true">
          <div class="px-6 pt-6 pb-4 border-b border-slate-100">
            <div class="flex items-start justify-between gap-4">
              <div>
                <h2 class="text-lg font-bold text-slate-900">Réservation enregistrée</h2>
                <p class="text-sm text-slate-500 mt-1">
                  Votre demande a été transmise au praticien pour validation du paiement.
                </p>
              </div>
              <button type="button" (click)="closeInstructionsModal()"
                      class="p-1.5 rounded-lg text-slate-400 hover:text-slate-600 hover:bg-slate-100"
                      aria-label="Fermer">
                <svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M6 18L18 6M6 6l12 12"/>
                </svg>
              </button>
            </div>
          </div>
          <div class="px-6 py-5 space-y-4">
            @if (selectedPractitioner()?.appointmentInstructions) {
              <div class="bg-sky-50 border border-sky-200 rounded-xl p-4">
                <p class="text-sm font-semibold text-sky-900 mb-2 flex items-center gap-2">
                  <svg class="w-4 h-4 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2"
                          d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"/>
                  </svg>
                  Consignes du Dr. {{ selectedPractitioner()!.lastName }}
                </p>
                <p class="text-sm text-sky-800 whitespace-pre-wrap">{{ selectedPractitioner()!.appointmentInstructions }}</p>
              </div>
            } @else {
              <p class="text-sm text-slate-600">
                Vous recevrez une notification dès que le praticien aura confirmé votre rendez-vous.
              </p>
            }
            <button type="button" (click)="closeInstructionsModal()" class="btn-primary w-full">
              Voir mes rendez-vous
            </button>
          </div>
        </div>
      </div>
    }

    <app-user-profile-modal
      [visible]="profileModalVisible()"
      mode="practitioner"
      [userId]="profileModalUserId()"
      (closed)="closeProfileModal()" />
  `,
})
export class BookAppointmentComponent implements OnInit {
  currentStep = signal<BookingStep>('search');

  cities = signal<CityDto[]>([]);
  specialties = signal<SpecialtyDto[]>([]);
  practitioners = signal<PractitionerSearchResult[]>([]);
  selectedPractitioner = signal<PractitionerSearchResult | null>(null);
  selectedDate = signal<string>('');
  daySchedule = signal<DayScheduleResponse | null>(null);
  selectedSlot = signal<TimeSlotDto | null>(null);

  searching = signal(false);
  searchDone = signal(false);
  loadingSlots = signal(false);
  creatingAppointment = signal(false);
  submittingReference = signal(false);
  errorMessage = signal('');
  createdAppointmentId = signal<number | null>(null);
  showInstructionsModal = signal(false);
  profileModalVisible = signal(false);
  profileModalUserId = signal<number | null>(null);

  readonly today = todayLocalDateString();
  readonly maxDate = addDaysToLocalDate(todayLocalDateString(), 90);

  readonly steps = [
    { id: 'search' as BookingStep, label: 'Recherche' },
    { id: 'select-slot' as BookingStep, label: 'Créneau' },
    { id: 'payment-instructions' as BookingStep, label: 'Paiement' },
    { id: 'submit-reference' as BookingStep, label: 'Confirmation' },
  ];

  searchForm: FormGroup;
  referenceForm: FormGroup;
  reasonControl: import('@angular/forms').FormControl;

  constructor(
    private fb: FormBuilder,
    private practitionerService: PractitionerService,
    private appointmentService: AppointmentService,
    private referenceDataService: ReferenceDataService,
    private router: Router
  ) {
    this.searchForm = this.fb.group({
      cityId: [''],
      specialtyId: ['', Validators.required],
    });
    this.referenceForm = this.fb.group({
      paymentReference: ['', [Validators.required, Validators.minLength(4), Validators.maxLength(100)]],
    });
    this.reasonControl = this.fb.control('');
  }

  ngOnInit(): void {
    this.referenceDataService.getCities().subscribe(c => this.cities.set(c.filter(x => x.active)));
    this.referenceDataService.getSpecialties().subscribe(s => this.specialties.set(s.filter(x => x.active)));
  }

  doSearch(): void {
    const { cityId, specialtyId } = this.searchForm.value;
    if (!specialtyId) return;
    this.searching.set(true);
    this.searchDone.set(false);
    this.practitioners.set([]);
    this.selectedPractitioner.set(null);
    this.selectedDate.set('');
    this.reasonControl.setValue(''); // réinitialise le motif si nouvelle recherche
    this.practitionerService.search(cityId || null, specialtyId).subscribe({
      next: (data) => {
        this.practitioners.set(data);
        this.searching.set(false);
        this.searchDone.set(true);
      },
      error: () => { this.searching.set(false); this.searchDone.set(true); },
    });
  }

  selectPractitioner(p: PractitionerSearchResult): void {
    this.selectedPractitioner.set(p);
    this.selectedDate.set(p.firstAvailableDate);
    this.daySchedule.set(null);
    this.selectedSlot.set(null);
    this.reasonControl.setValue('');
    this.errorMessage.set('');
    this.currentStep.set('select-slot');
    this.loadSlotsForDate(p.firstAvailableDate);
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

  loadSlotsForDate(date: string): void {
    const p = this.selectedPractitioner();
    const specialtyId = this.searchForm.value.specialtyId;
    if (!p || !specialtyId || !date) return;

    this.loadingSlots.set(true);
    this.errorMessage.set('');
    this.practitionerService.getSlots(p.userId, date, specialtyId).subscribe({
      next: (schedule) => {
        this.daySchedule.set(schedule);
        if (schedule.date) {
          this.selectedDate.set(schedule.date);
        }
        this.loadingSlots.set(false);
      },
      error: (err: HttpErrorResponse) => {
        this.loadingSlots.set(false);
        this.errorMessage.set(err.error?.detail || 'Impossible de charger les créneaux.');
      },
    });
  }

  selectSlot(slot: TimeSlotDto): void {
    this.selectedSlot.set(slot);
  }

  goToPaymentInstructions(): void {
    if (!this.selectedSlot()) return;
    this.currentStep.set('payment-instructions');
  }

  goToStep(step: BookingStep): void {
    this.errorMessage.set('');
    this.currentStep.set(step);
  }

  backToSearch(): void {
    this.currentStep.set('search');
    this.daySchedule.set(null);
    this.selectedSlot.set(null);
    this.selectedPractitioner.set(null);
    this.selectedDate.set('');
  }

  createAppointmentAndGoToReference(): void {
    const p = this.selectedPractitioner();
    const slot = this.selectedSlot();
    if (!p || !slot) return;

    this.creatingAppointment.set(true);
    this.errorMessage.set('');

    const appointmentDateTime = `${this.selectedDate()}T${slot.time}:00`;

    // Spécialité choisie → consultationType (automatique, sans saisie patient)
    const specialtyId = this.searchForm.value.specialtyId;
    const specialty = this.specialties().find(s => s.id == specialtyId);
    const consultationType = specialty?.name || null;

    this.appointmentService.createAppointment({
      practitionerId: p.userId,
      appointmentDateTime,
      consultationType,
      reason: this.reasonControl.value || null,
    }).subscribe({
      next: (appointment: AppointmentResponse) => {
        this.creatingAppointment.set(false);
        this.createdAppointmentId.set(appointment.id);
        this.currentStep.set('submit-reference');
      },
      error: (err: HttpErrorResponse) => {
        this.creatingAppointment.set(false);
        this.errorMessage.set(err.error?.detail || 'Erreur lors de la création du rendez-vous.');
      },
    });
  }

  submitReference(): void {
    const id = this.createdAppointmentId();
    if (!id || this.referenceForm.invalid) return;
    this.submittingReference.set(true);
    this.appointmentService.submitPaymentReference(id, {
      paymentReference: this.referenceForm.value.paymentReference,
    }).subscribe({
      next: () => {
        this.submittingReference.set(false);
        this.showInstructionsModal.set(true);
      },
      error: (err: HttpErrorResponse) => {
        this.submittingReference.set(false);
        this.errorMessage.set(err.error?.detail || 'Erreur lors de l\'envoi de la référence.');
      },
    });
  }

  closeInstructionsModal(): void {
    this.showInstructionsModal.set(false);
    this.router.navigate(['/appointments']);
  }

  openPractitionerProfile(userId: number, event: Event): void {
    event.stopPropagation();
    this.profileModalUserId.set(userId);
    this.profileModalVisible.set(true);
  }

  closeProfileModal(): void {
    this.profileModalVisible.set(false);
    this.profileModalUserId.set(null);
  }

  copyMerchantNumber(): void {
    const n = this.selectedPractitioner()?.merchantNumber;
    if (n) navigator.clipboard.writeText(n);
  }

  isStepDone(stepId: BookingStep): boolean {
    const order: BookingStep[] = ['search', 'select-slot', 'payment-instructions', 'submit-reference'];
    return order.indexOf(stepId) < order.indexOf(this.currentStep());
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
}
