import { Component, signal } from '@angular/core';
import { FormBuilder, FormGroup, Validators, ReactiveFormsModule } from '@angular/forms';
import { Router, RouterLink } from '@angular/router';
import { HttpErrorResponse } from '@angular/common/http';
import { AuthService } from '../../../core/services/auth.service';
import { SyliSpinnerComponent } from '../../../shared/components/syli-spinner/syli-spinner.component';

@Component({
  selector: 'app-login',
  standalone: true,
  imports: [  ReactiveFormsModule, RouterLink, SyliSpinnerComponent],
  template: `
    <div class="min-h-screen flex">
      <!-- Zone gauche — présentation -->
      <div class="hidden lg:flex w-2/5 bg-gradient-to-br from-white via-slate-50 to-sky-50
                  flex-col items-center justify-center p-12 gap-6 border-r border-slate-100">
        <img src="assets/syliSante.png" alt="SyliSanté" class="h-28 w-auto mix-blend-multiply"/>
        <div class="text-center">
          <p class="text-4xl font-extrabold bg-gradient-to-r from-[#10B981] to-[#0EA5E9]
                    bg-clip-text text-transparent tracking-tight">
            SyliSanté
          </p>
          <p class="text-slate-500 mt-3 text-sm leading-relaxed">
            Plateforme médicale digitale<br/>pour le marché guinéen
          </p>
        </div>
        <div class="mt-6 flex items-center gap-2">
          <span class="w-2 h-2 rounded-full bg-[#0EA5E9]"></span>
          <span class="text-xs text-slate-500">Santé connectée, soins de qualité</span>
        </div>
      </div>

      <!-- Formulaire -->
      <div class="flex-1 bg-white flex items-center justify-center p-6">
        <div class="w-full max-w-md">
          <!-- Logo visible uniquement sur mobile -->
          <div class="lg:hidden text-center mb-8">
            <img src="assets/syliSante.png" alt="SyliSanté" class="h-14 w-auto mx-auto mb-2"/>
            <p class="text-2xl font-extrabold bg-gradient-to-r from-[#38bdf8] to-[#0EA5E9]
                      bg-clip-text text-transparent tracking-tight">
              SyliSanté
            </p>
          </div>

          <div class="card border-slate-100 shadow-sm">
            <div class="mb-8">
              <h1 class="text-2xl font-bold text-slate-900">Connexion</h1>
              <p class="text-slate-500 mt-1 text-sm">Accédez à votre espace SyliSanté</p>
            </div>

            @if (errorMessage()) {
              <div class="bg-red-50 border border-red-200 rounded-lg p-4 mb-6">
                <p class="text-sm text-red-700">{{ errorMessage() }}</p>
              </div>
            }

            <form [formGroup]="loginForm" (ngSubmit)="onSubmit()" class="space-y-5">
              <div>
                <label for="email" class="block text-sm font-medium text-slate-700 mb-1">
                  Adresse email
                </label>
                <input
                  id="email"
                  type="email"
                  formControlName="email"
                  class="login-input"
                  [class.input-error]="isFieldInvalid('email')"
                  placeholder="votre@email.com"
                  autocomplete="email"
                />
                @if (isFieldInvalid('email')) {
                  <p class="error-message">{{ getFieldError('email') }}</p>
                }
              </div>

              <div>
                <label for="password" class="block text-sm font-medium text-slate-700 mb-1">
                  Mot de passe
                </label>
                <input
                  id="password"
                  type="password"
                  formControlName="password"
                  class="login-input"
                  [class.input-error]="isFieldInvalid('password')"
                  placeholder="••••••••"
                  autocomplete="current-password"
                />
                @if (isFieldInvalid('password')) {
                  <p class="error-message">{{ getFieldError('password') }}</p>
                }
              </div>

              <button
                type="submit"
                class="w-full py-3 rounded-xl bg-[#0EA5E9] text-white font-semibold
                       hover:bg-[#0284c7] transition-all duration-200 shadow-sm
                       focus:outline-none focus:ring-2 focus:ring-[#0EA5E9]/40 focus:ring-offset-2
                       disabled:opacity-50 disabled:cursor-not-allowed
                       inline-flex items-center justify-center"
                [disabled]="loading()">
                @if (loading()) {
                  <app-syli-spinner size="xs" class="-ml-1 mr-2 inline-block align-middle" />
                  Connexion...
                } @else {
                  Se connecter
                }
              </button>
            </form>

            <div class="mt-6 text-center space-y-2">
              <p class="text-sm text-slate-600">
                Pas encore de compte ?
                <a routerLink="/auth/register"
                   class="text-[#0EA5E9] font-medium hover:underline">
                  S'inscrire
                </a>
              </p>
              <p class="text-sm text-slate-600">
                Code d'activation reçu ?
                <a routerLink="/auth/validate"
                   class="text-[#0EA5E9] font-medium hover:underline">
                  Activer mon compte
                </a>
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  `,
  styles: [`
    .login-input {
      @apply block w-full px-3 py-2.5 border border-slate-200 rounded-lg
             bg-white text-slate-900 placeholder-slate-400
             text-sm transition-all duration-200;
    }
    .login-input:focus {
      outline: none;
      border-color: #0EA5E9;
      box-shadow: 0 0 0 3px rgba(14, 165, 233, 0.2);
    }
    .login-input.input-error {
      @apply border-red-300;
    }
    .login-input.input-error:focus {
      border-color: #ef4444;
      box-shadow: 0 0 0 3px rgba(239, 68, 68, 0.2);
    }
  `],
})
export class LoginComponent {
  loginForm: FormGroup;
  loading = signal(false);
  errorMessage = signal('');

  constructor(
    private fb: FormBuilder,
    private authService: AuthService,
    private router: Router
  ) {
    this.loginForm = this.fb.group({
      email: ['', [Validators.required, Validators.email]],
      password: ['', Validators.required],
    });
  }

  onSubmit(): void {
    if (this.loginForm.invalid) {
      this.loginForm.markAllAsTouched();
      return;
    }

    this.loading.set(true);
    this.errorMessage.set('');

    this.authService.login(this.loginForm.value).subscribe({
      next: () => {
        this.router.navigate([this.authService.getDefaultRoute()]);
      },
      error: (err: HttpErrorResponse) => {
        this.loading.set(false);
        this.errorMessage.set(err.error?.detail || 'Email ou mot de passe incorrect.');
      },
    });
  }

  isFieldInvalid(field: string): boolean {
    const control = this.loginForm.get(field);
    return !!(control && control.invalid && control.touched);
  }

  getFieldError(field: string): string {
    const control = this.loginForm.get(field);
    if (control?.errors?.['required']) return 'Ce champ est obligatoire.';
    if (control?.errors?.['email']) return 'Veuillez entrer une adresse email valide.';
    return '';
  }
}
