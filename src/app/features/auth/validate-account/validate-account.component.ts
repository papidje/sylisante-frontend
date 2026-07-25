import { Component, OnInit, signal } from '@angular/core';
import { FormBuilder, FormGroup, Validators, ReactiveFormsModule } from '@angular/forms';
import { Router, RouterLink, ActivatedRoute } from '@angular/router';
import { HttpErrorResponse } from '@angular/common/http';
import { AuthService } from '../../../core/services/auth.service';
import { SyliSpinnerComponent } from '../../../shared/components/syli-spinner/syli-spinner.component';

@Component({
  selector: 'app-validate-account',
  standalone: true,
  imports: [  ReactiveFormsModule, RouterLink, SyliSpinnerComponent],
  template: `
    <div class="min-h-screen bg-gradient-to-br from-primary-50 to-blue-100 flex items-center justify-center p-4">
      <div class="w-full max-w-md">
        <div class="card">
          <div class="text-center mb-8">
            <div class="inline-flex items-center justify-center w-16 h-16 bg-sky-500 rounded-2xl mb-4">
              <svg class="w-8 h-8 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2"
                      d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z"/>
              </svg>
            </div>
            <h1 class="text-2xl font-bold text-gray-900">Activation du compte</h1>
            <p class="text-gray-500 mt-1 text-sm">
              Entrez le code à 6 chiffres reçu par email/SMS
            </p>
          </div>

          @if (successMessage()) {
            <div class="bg-sky-50 border border-sky-200 rounded-lg p-4 mb-6">
              <div class="flex items-center gap-2">
                <svg class="w-5 h-5 text-sky-600 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M5 13l4 4L19 7"/>
                </svg>
                <p class="text-sm text-sky-700">{{ successMessage() }}</p>
              </div>
            </div>
          }

          @if (errorMessage()) {
            <div class="bg-red-50 border border-red-200 rounded-lg p-4 mb-6">
              <p class="text-sm text-red-700">{{ errorMessage() }}</p>
            </div>
          }

          <form [formGroup]="validateForm" (ngSubmit)="onSubmit()" class="space-y-5">
            <div>
              <label for="email" class="block text-sm font-medium text-gray-700 mb-1">Adresse email</label>
              <input id="email" type="email" formControlName="email"
                     class="input-field" [class.input-error]="isFieldInvalid('email')"
                     placeholder="votre@email.com"/>
              @if (isFieldInvalid('email')) {
                <p class="error-message">Adresse email invalide.</p>
              }
            </div>

            <div>
              <label for="code" class="block text-sm font-medium text-gray-700 mb-1">
                Code d'activation (6 chiffres)
              </label>
              <input id="code" type="text" formControlName="code"
                     class="input-field text-center text-2xl tracking-[0.5em] font-mono"
                     [class.input-error]="isFieldInvalid('code')"
                     placeholder="000000" maxlength="6" autocomplete="one-time-code"/>
              @if (isFieldInvalid('code')) {
                <p class="error-message">Le code doit contenir 6 chiffres.</p>
              }
            </div>

            <button type="submit" class="btn-primary w-full py-3" [disabled]="loading()">
              @if (loading()) {
                <app-syli-spinner size="xs" class="-ml-1 mr-2 inline-block align-middle" />
                Validation...
              } @else {
                Activer mon compte
              }
            </button>
          </form>

          <div class="mt-6 border-t border-gray-100 pt-5">
            <p class="text-center text-sm text-gray-600 mb-3">Code non reçu ?</p>
            <button (click)="resendCode()" [disabled]="resendLoading() || !validateForm.get('email')?.valid"
                    class="btn-secondary w-full text-sm">
              @if (resendLoading()) {
                Envoi en cours...
              } @else {
                Renvoyer le code
              }
            </button>
          </div>

          <p class="mt-4 text-center text-sm text-gray-600">
            <a routerLink="/auth/login" class="text-primary-600 font-medium hover:underline">
              Retour à la connexion
            </a>
          </p>
        </div>
      </div>
    </div>
  `,
})
export class ValidateAccountComponent implements OnInit {
  validateForm: FormGroup;
  loading = signal(false);
  resendLoading = signal(false);
  errorMessage = signal('');
  successMessage = signal('');

  constructor(
    private fb: FormBuilder,
    private authService: AuthService,
    private router: Router,
    private route: ActivatedRoute
  ) {
    this.validateForm = this.fb.group({
      email: ['', [Validators.required, Validators.email]],
      code: ['', [Validators.required, Validators.minLength(6), Validators.maxLength(6)]],
    });
  }

  ngOnInit(): void {
    const email = this.route.snapshot.queryParamMap.get('email');
    if (email) {
      this.validateForm.patchValue({ email });
    }
  }

  onSubmit(): void {
    if (this.validateForm.invalid) {
      this.validateForm.markAllAsTouched();
      return;
    }

    this.loading.set(true);
    this.errorMessage.set('');

    this.authService.validateAccount(this.validateForm.value).subscribe({
      next: (response) => {
        this.loading.set(false);
        this.successMessage.set(response.message);
        setTimeout(() => this.router.navigate(['/auth/login']), 2000);
      },
      error: (err: HttpErrorResponse) => {
        this.loading.set(false);
        this.errorMessage.set(err.error?.detail || 'Code invalide ou expiré.');
      },
    });
  }

  resendCode(): void {
    const email = this.validateForm.get('email')?.value;
    if (!email) return;

    this.resendLoading.set(true);
    this.errorMessage.set('');

    this.authService.resendCode({ email }).subscribe({
      next: () => {
        this.resendLoading.set(false);
        this.successMessage.set('Un nouveau code a été envoyé à votre adresse email.');
      },
      error: (err: HttpErrorResponse) => {
        this.resendLoading.set(false);
        this.errorMessage.set(err.error?.detail || 'Erreur lors du renvoi du code.');
      },
    });
  }

  isFieldInvalid(field: string): boolean {
    const control = this.validateForm.get(field);
    return !!(control && control.invalid && control.touched);
  }
}
