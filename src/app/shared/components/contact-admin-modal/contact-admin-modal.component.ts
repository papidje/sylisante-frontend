import { Component, EventEmitter, Input, Output, signal } from '@angular/core';
import { FormBuilder, FormGroup, ReactiveFormsModule, Validators } from '@angular/forms';
import { CommonModule } from '@angular/common';
import { SupportService } from '../../../core/services/support.service';
import { SyliSpinnerComponent } from '../syli-spinner/syli-spinner.component';

@Component({
  selector: 'app-contact-admin-modal',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule, SyliSpinnerComponent],
  template: `
    @if (visible) {
      <div class="fixed inset-0 z-50 flex items-center justify-center p-4" (click)="onBackdropClick()">
        <div class="absolute inset-0 bg-slate-900/40 backdrop-blur-sm"></div>
        <div class="relative bg-white rounded-2xl shadow-2xl w-full max-w-lg border border-slate-100"
             (click)="$event.stopPropagation()" role="dialog" aria-modal="true">

          <div class="px-6 pt-6 pb-4 border-b border-slate-100">
            <div class="flex items-start justify-between gap-4">
              <div>
                <h2 class="text-lg font-bold text-slate-900">Contacter l'administrateur</h2>
                <p class="text-sm text-slate-500 mt-1">
                  Décrivez votre demande. Elle sera transmise à l'équipe SyliSanté.
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
          </div>

          @if (successMessage()) {
            <div class="px-6 py-5">
              <div class="bg-sky-50 border border-sky-200 rounded-lg p-4">
                <p class="text-sm text-sky-700">{{ successMessage() }}</p>
              </div>
              <button type="button" (click)="close()" class="btn-primary w-full mt-4">Fermer</button>
            </div>
          } @else {
            <form [formGroup]="form" (ngSubmit)="submit()" class="px-6 py-5 space-y-4">
              @if (errorMessage()) {
                <div class="bg-red-50 border border-red-200 rounded-lg p-3">
                  <p class="text-sm text-red-700">{{ errorMessage() }}</p>
                </div>
              }

              <div>
                <label for="supportMessage" class="block text-sm font-medium text-slate-700 mb-1">
                  Votre message <span class="text-red-500">*</span>
                </label>
                <textarea id="supportMessage" formControlName="message" rows="5"
                          class="input-field resize-none"
                          placeholder="Expliquez votre situation et ce que vous attendez de l'administrateur…"></textarea>
                @if (form.get('message')?.invalid && form.get('message')?.touched) {
                  <p class="text-xs text-red-500 mt-1">Le message doit contenir entre 10 et 2000 caractères.</p>
                }
              </div>

              <div class="flex gap-3 pt-1">
                <button type="button" (click)="close()" class="btn-secondary flex-1">Annuler</button>
                <button type="submit" [disabled]="form.invalid || loading()" class="btn-primary flex-1">
                  @if (loading()) {
                    <app-syli-spinner size="xs" class="-ml-1 mr-2 inline-block align-middle" />
                    Envoi…
                  } @else {
                    Envoyer
                  }
                </button>
              </div>
            </form>
          }
        </div>
      </div>
    }
  `,
})
export class ContactAdminModalComponent {
  @Input() visible = false;
  @Output() closed = new EventEmitter<void>();

  form: FormGroup;
  loading = signal(false);
  successMessage = signal('');
  errorMessage = signal('');

  constructor(
    private fb: FormBuilder,
    private supportService: SupportService
  ) {
    this.form = this.fb.group({
      message: ['', [Validators.required, Validators.minLength(10), Validators.maxLength(2000)]],
    });
  }

  submit(): void {
    if (this.form.invalid) {
      this.form.markAllAsTouched();
      return;
    }

    this.loading.set(true);
    this.errorMessage.set('');

    this.supportService.contactAdmin(this.form.value.message).subscribe({
      next: (res) => {
        this.loading.set(false);
        this.successMessage.set(res.message);
      },
      error: (err) => {
        this.loading.set(false);
        this.errorMessage.set(err.error?.detail || 'Erreur lors de l\'envoi. Réessayez.');
      },
    });
  }

  close(): void {
    this.form.reset({ message: '' });
    this.successMessage.set('');
    this.errorMessage.set('');
    this.closed.emit();
  }

  onBackdropClick(): void {
    this.close();
  }
}
