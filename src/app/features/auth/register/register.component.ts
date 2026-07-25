import { Component, signal } from '@angular/core';
import { FormBuilder, FormGroup, Validators, ReactiveFormsModule } from '@angular/forms';
import { Router, RouterLink } from '@angular/router';
import { HttpErrorResponse } from '@angular/common/http';
import { AuthService } from '../../../core/services/auth.service';
import { Role } from '../../../core/models/user.model';
import { SyliSpinnerComponent } from '../../../shared/components/syli-spinner/syli-spinner.component';

@Component({
  selector: 'app-register',
  standalone: true,
  imports: [  ReactiveFormsModule, RouterLink, SyliSpinnerComponent],
  template: `
    <div class="min-h-screen bg-gray-50 flex items-center justify-center p-4">
      <!-- Bandeau logo en haut -->
      <div class="w-full max-w-lg">
        <div class="text-center mb-6">
          <img src="assets/syliSante.png" alt="SyliSanté" class="h-12 w-auto mx-auto mb-2"/>
          <p class="text-xl font-bold text-gray-900">SyliSanté</p>
          <p class="text-sm text-gray-400">Plateforme médicale — Guinée</p>
        </div>
        <div class="card">
          <div class="mb-6">
            <h1 class="text-2xl font-bold text-gray-900">Créer un compte</h1>
            <p class="text-gray-500 mt-1 text-sm">Rejoignez la plateforme SyliSanté</p>
          </div>

          @if (errorMessage()) {
            <div class="bg-red-50 border border-red-200 rounded-lg p-4 mb-6">
              <p class="text-sm text-red-700">{{ errorMessage() }}</p>
            </div>
          }

          <form [formGroup]="registerForm" (ngSubmit)="onSubmit()" class="space-y-5">
            <div class="grid grid-cols-2 gap-4">
              <div>
                <label for="firstName" class="block text-sm font-medium text-gray-700 mb-1">Prénom</label>
                <input id="firstName" type="text" formControlName="firstName"
                       class="input-field" [class.input-error]="isFieldInvalid('firstName')"
                       placeholder="Mamadou" autocomplete="given-name"/>
                @if (isFieldInvalid('firstName')) {
                  <p class="error-message">{{ getFieldError('firstName') }}</p>
                }
              </div>
              <div>
                <label for="lastName" class="block text-sm font-medium text-gray-700 mb-1">Nom</label>
                <input id="lastName" type="text" formControlName="lastName"
                       class="input-field" [class.input-error]="isFieldInvalid('lastName')"
                       placeholder="Diallo" autocomplete="family-name"/>
                @if (isFieldInvalid('lastName')) {
                  <p class="error-message">{{ getFieldError('lastName') }}</p>
                }
              </div>
            </div>

            <div>
              <label for="email" class="block text-sm font-medium text-gray-700 mb-1">Adresse email</label>
              <input id="email" type="email" formControlName="email"
                     class="input-field" [class.input-error]="isFieldInvalid('email')"
                     placeholder="votre@email.com" autocomplete="email"/>
              @if (isFieldInvalid('email')) {
                <p class="error-message">{{ getFieldError('email') }}</p>
              }
            </div>

            <div>
              <label for="password" class="block text-sm font-medium text-gray-700 mb-1">Mot de passe</label>
              <input id="password" type="password" formControlName="password"
                     class="input-field" [class.input-error]="isFieldInvalid('password')"
                     placeholder="Minimum 8 caractères" autocomplete="new-password"/>
              @if (isFieldInvalid('password')) {
                <p class="error-message">{{ getFieldError('password') }}</p>
              }
            </div>

            <div>
              <label class="block text-sm font-medium text-gray-700 mb-2">Je suis</label>
              <div class="grid grid-cols-2 gap-3">
                <label class="relative flex cursor-pointer">
                  <input type="radio" formControlName="role" value="ROLE_PATIENT" class="sr-only peer"/>
                  <div class="flex flex-col items-center gap-2 p-4 w-full border-2 border-gray-200 rounded-xl
                               peer-checked:border-primary-500 peer-checked:bg-primary-50 hover:border-gray-300 transition-all">
                    <svg class="w-8 h-8 text-gray-400 peer-checked:text-primary-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2"
                            d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z"/>
                    </svg>
                    <span class="text-sm font-medium text-gray-700">Patient</span>
                  </div>
                </label>
                <label class="relative flex cursor-pointer">
                  <input type="radio" formControlName="role" value="ROLE_PRATICIEN" class="sr-only peer"/>
                  <div class="flex flex-col items-center gap-2 p-4 w-full border-2 border-gray-200 rounded-xl
                               peer-checked:border-primary-500 peer-checked:bg-primary-50 hover:border-gray-300 transition-all">
                    <svg class="w-8 h-8 text-gray-400 peer-checked:text-primary-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2"
                            d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2m-3 7h3m-3 4h3m-6-4h.01M9 16h.01"/>
                    </svg>
                    <span class="text-sm font-medium text-gray-700">Praticien</span>
                  </div>
                </label>
              </div>
              @if (isFieldInvalid('role')) {
                <p class="error-message mt-1">Veuillez sélectionner un rôle.</p>
              }
            </div>

            <button type="submit" class="btn-primary w-full py-3" [disabled]="loading()">
              @if (loading()) {
                <app-syli-spinner size="xs" class="-ml-1 mr-2 inline-block align-middle" />
                Inscription...
              } @else {
                Créer mon compte
              }
            </button>
          </form>

          <p class="mt-6 text-center text-sm text-gray-600">
            Déjà un compte ?
            <a routerLink="/auth/login" class="text-primary-600 font-medium hover:underline">Se connecter</a>
          </p>
        </div>
      </div>
    </div>
  `,
})
export class RegisterComponent {
  registerForm: FormGroup;
  loading = signal(false);
  errorMessage = signal('');

  constructor(
    private fb: FormBuilder,
    private authService: AuthService,
    private router: Router
  ) {
    this.registerForm = this.fb.group({
      firstName: ['', [Validators.required, Validators.maxLength(100)]],
      lastName: ['', [Validators.required, Validators.maxLength(100)]],
      email: ['', [Validators.required, Validators.email]],
      password: ['', [Validators.required, Validators.minLength(8)]],
      role: ['' as Role, Validators.required],
    });
  }

  onSubmit(): void {
    if (this.registerForm.invalid) {
      this.registerForm.markAllAsTouched();
      return;
    }

    this.loading.set(true);
    this.errorMessage.set('');

    this.authService.register(this.registerForm.value).subscribe({
      next: () => {
        this.router.navigate(['/auth/validate'], {
          queryParams: { email: this.registerForm.value.email },
        });
      },
      error: (err: HttpErrorResponse) => {
        this.loading.set(false);
        this.errorMessage.set(err.error?.detail || 'Une erreur est survenue lors de l\'inscription.');
      },
    });
  }

  isFieldInvalid(field: string): boolean {
    const control = this.registerForm.get(field);
    return !!(control && control.invalid && control.touched);
  }

  getFieldError(field: string): string {
    const control = this.registerForm.get(field);
    if (control?.errors?.['required']) return 'Ce champ est obligatoire.';
    if (control?.errors?.['email']) return 'Veuillez entrer une adresse email valide.';
    if (control?.errors?.['minlength']) {
      const min = control.errors?.['minlength'].requiredLength;
      return `Minimum ${min} caractères requis.`;
    }
    if (control?.errors?.['maxlength']) return 'Valeur trop longue.';
    return '';
  }
}
