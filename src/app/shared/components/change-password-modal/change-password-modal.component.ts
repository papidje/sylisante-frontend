import { Component, EventEmitter, Input, OnChanges, Output, signal } from '@angular/core';
import { AbstractControl, FormBuilder, FormGroup, ReactiveFormsModule, ValidationErrors, Validators } from '@angular/forms';
import { CommonModule } from '@angular/common';
import { HttpErrorResponse } from '@angular/common/http';
import { UserProfileService } from '../../../core/services/user-profile.service';
import { SyliSpinnerComponent } from '../syli-spinner/syli-spinner.component';

function passwordsMatch(group: AbstractControl): ValidationErrors | null {
  const newPassword = group.get('newPassword')?.value;
  const confirmPassword = group.get('confirmPassword')?.value;
  if (newPassword && confirmPassword && newPassword !== confirmPassword) {
    return { passwordsMismatch: true };
  }
  return null;
}

@Component({
  selector: 'app-change-password-modal',
  standalone: true,
  imports: [  CommonModule, ReactiveFormsModule, SyliSpinnerComponent],
  template: `
    @if (visible) {
      <div class="fixed inset-0 z-50 flex items-center justify-center p-4"
           (click)="onBackdropClick()">
        <div class="absolute inset-0 bg-slate-900/40 backdrop-blur-sm"></div>

        <div class="relative bg-white rounded-2xl shadow-2xl w-full max-w-md border border-slate-100"
             (click)="$event.stopPropagation()"
             role="dialog"
             aria-labelledby="change-password-title"
             aria-modal="true">

          <!-- En-tête -->
          <div class="px-6 pt-6 pb-4 border-b border-slate-100">
            <div class="flex items-start justify-between gap-4">
              <div>
                <h2 id="change-password-title" class="text-lg font-bold text-slate-900">
                  Modifier le mot de passe
                </h2>
                <p class="text-sm text-slate-500 mt-1">
                  Choisissez un mot de passe sécurisé d'au moins 8 caractères.
                </p>
              </div>
              <button type="button" (click)="close()"
                      class="p-1.5 rounded-lg text-slate-400 hover:text-slate-600 hover:bg-slate-100 transition-colors"
                      aria-label="Fermer">
                <svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M6 18L18 6M6 6l12 12"/>
                </svg>
              </button>
            </div>
          </div>

          <!-- Corps -->
          <form [formGroup]="form" (ngSubmit)="submit()" class="px-6 py-5 space-y-4">

            @if (errorMsg()) {
              <div class="rounded-lg bg-red-50 border border-red-200 px-4 py-3 text-sm text-red-700">
                {{ errorMsg() }}
              </div>
            }

            @if (successMsg()) {
              <div class="rounded-lg bg-sky-50 border border-sky-200 px-4 py-3 text-sm text-sky-700">
                {{ successMsg() }}
              </div>
            }

            <div>
              <label for="newPassword" class="block text-sm font-medium text-slate-700 mb-1">
                Nouveau mot de passe
              </label>
              <input id="newPassword" type="password" formControlName="newPassword"
                     class="modal-input" placeholder="Minimum 8 caractères"
                     autocomplete="new-password"/>
              @if (isInvalid('newPassword')) {
                <p class="text-xs text-red-500 mt-1">
                  @if (form.get('newPassword')?.errors?.['required']) {
                    Le mot de passe est obligatoire.
                  } @else if (form.get('newPassword')?.errors?.['minlength']) {
                    Le mot de passe doit contenir au moins 8 caractères.
                  }
                </p>
              }
            </div>

            <div>
              <label for="confirmPassword" class="block text-sm font-medium text-slate-700 mb-1">
                Confirmer le mot de passe
              </label>
              <input id="confirmPassword" type="password" formControlName="confirmPassword"
                     class="modal-input" placeholder="Répétez le mot de passe"
                     autocomplete="new-password"/>
              @if (isInvalid('confirmPassword')) {
                <p class="text-xs text-red-500 mt-1">La confirmation est obligatoire.</p>
              }
              @if (form.errors?.['passwordsMismatch'] && form.get('confirmPassword')?.touched) {
                <p class="text-xs text-red-500 mt-1">Les mots de passe ne correspondent pas.</p>
              }
            </div>

            <!-- Actions -->
            <div class="flex gap-3 pt-2">
              <button type="button" (click)="close()" [disabled]="saving()"
                      class="flex-1 px-4 py-2.5 rounded-xl border border-slate-200 text-slate-700
                             text-sm font-medium hover:bg-slate-50 transition-colors
                             disabled:opacity-50">
                Annuler
              </button>
              <button type="submit" [disabled]="saving() || form.invalid || successMsg()"
                      class="flex-1 px-4 py-2.5 rounded-xl bg-[#0EA5E9] text-white text-sm font-semibold
                             hover:bg-[#0284c7] transition-all duration-200 shadow-sm
                             disabled:opacity-50 disabled:cursor-not-allowed
                             inline-flex items-center justify-center">
                @if (saving()) {
                  <app-syli-spinner size="xs" class="mr-2 inline-block align-middle" />
                  Enregistrement...
                } @else {
                  Enregistrer
                }
              </button>
            </div>
          </form>
        </div>
      </div>
    }
  `,
  styles: [`
    .modal-input {
      @apply block w-full px-3 py-2.5 border border-slate-200 rounded-lg
             bg-white text-slate-900 placeholder-slate-400 text-sm transition-all duration-200;
    }
    .modal-input:focus {
      outline: none;
      border-color: #0EA5E9;
      box-shadow: 0 0 0 3px rgba(14, 165, 233, 0.2);
    }
  `],
})
export class ChangePasswordModalComponent implements OnChanges {
  @Input({ required: true }) visible = false;
  @Output() closed = new EventEmitter<void>();
  @Output() changed = new EventEmitter<void>();

  form: FormGroup;
  saving = signal(false);
  errorMsg = signal('');
  successMsg = signal('');

  constructor(
    private fb: FormBuilder,
    private profileService: UserProfileService,
  ) {
    this.form = this.fb.group({
      newPassword: ['', [Validators.required, Validators.minLength(8)]],
      confirmPassword: ['', Validators.required],
    }, { validators: passwordsMatch });
  }

  ngOnChanges(): void {
    if (this.visible) {
      this.resetForm();
    }
  }

  submit(): void {
    if (this.form.invalid) {
      this.form.markAllAsTouched();
      return;
    }

    this.saving.set(true);
    this.errorMsg.set('');
    this.successMsg.set('');

    const { newPassword, confirmPassword } = this.form.value;
    this.profileService.changePassword({ newPassword, confirmPassword }).subscribe({
      next: () => {
        this.saving.set(false);
        this.successMsg.set('Mot de passe mis à jour avec succès.');
        this.changed.emit();
        setTimeout(() => this.close(), 1500);
      },
      error: (err: HttpErrorResponse) => {
        this.saving.set(false);
        this.errorMsg.set(err.error?.detail || 'Impossible de modifier le mot de passe.');
      },
    });
  }

  close(): void {
    if (this.saving()) return;
    this.closed.emit();
  }

  onBackdropClick(): void {
    this.close();
  }

  isInvalid(field: string): boolean {
    const ctrl = this.form.get(field);
    return !!(ctrl && ctrl.invalid && ctrl.touched);
  }

  private resetForm(): void {
    this.form.reset();
    this.saving.set(false);
    this.errorMsg.set('');
    this.successMsg.set('');
  }
}
