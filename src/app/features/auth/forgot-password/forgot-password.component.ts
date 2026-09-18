import { Component, signal } from '@angular/core';
import { FormBuilder, FormGroup, ReactiveFormsModule, Validators } from '@angular/forms';
import { RouterLink } from '@angular/router';
import { HttpErrorResponse } from '@angular/common/http';
import { AuthService } from '../../../core/services/auth.service';
import { SyliSpinnerComponent } from '../../../shared/components/syli-spinner/syli-spinner.component';
import { apiErrorMessage } from '../../../core/utils/http-error';

@Component({
  selector: 'app-forgot-password',
  standalone: true,
  imports: [ReactiveFormsModule, RouterLink, SyliSpinnerComponent],
  template: `
    <div class="min-h-screen flex">
      <div class="hidden lg:flex w-2/5 bg-gradient-to-br from-white via-slate-50 to-sky-50
                  flex-col items-center justify-center p-12 gap-6 border-r border-slate-100">
        <img src="assets/syliSante.png" alt="SyliSanté" class="h-28 w-auto mix-blend-multiply"/>
        <p class="text-4xl font-extrabold bg-gradient-to-r from-[#10B981] to-[#0EA5E9]
                  bg-clip-text text-transparent tracking-tight">SyliSanté</p>
      </div>
      <div class="flex-1 bg-white flex items-center justify-center p-6">
        <div class="w-full max-w-md">
          <div class="card border-slate-100 shadow-sm">
            <h1 class="text-2xl font-bold text-slate-900">Mot de passe oublié</h1>
            <p class="text-slate-500 mt-1 text-sm">
              Indiquez l'e-mail de votre compte. Si un compte existe, vous recevrez un lien de réinitialisation.
            </p>

            @if (errorMessage()) {
              <div class="bg-red-50 border border-red-200 rounded-lg p-4 mt-6">
                <p class="text-sm text-red-700">{{ errorMessage() }}</p>
              </div>
            }
            @if (successMessage()) {
              <div class="bg-sky-50 border border-sky-200 rounded-lg p-4 mt-6">
                <p class="text-sm text-sky-800">{{ successMessage() }}</p>
              </div>
            }

            <form [formGroup]="form" (ngSubmit)="onSubmit()" class="space-y-5 mt-6">
              <div>
                <label for="email" class="block text-sm font-medium text-slate-700 mb-1">Adresse email</label>
                <input id="email" type="email" formControlName="email" class="input-field"
                       autocomplete="email" placeholder="votre@email.com"/>
                @if (form.get('email')?.invalid && form.get('email')?.touched) {
                  <p class="error-message">Indiquez une adresse email valide.</p>
                }
              </div>
              <button type="submit" class="btn-primary w-full" [disabled]="loading() || form.invalid">
                @if (loading()) {
                  <app-syli-spinner size="xs" class="mr-2 inline-block align-middle" />
                }
                Envoyer le lien
              </button>
            </form>

            <p class="text-center text-sm text-slate-600 mt-6">
              <a routerLink="/auth/login" class="text-[#0EA5E9] font-medium hover:underline">← Retour à la connexion</a>
            </p>
          </div>
        </div>
      </div>
    </div>
  `,
})
export class ForgotPasswordComponent {
  form: FormGroup;
  loading = signal(false);
  errorMessage = signal('');
  successMessage = signal('');

  constructor(private fb: FormBuilder, private authService: AuthService) {
    this.form = this.fb.group({
      email: ['', [Validators.required, Validators.email]],
    });
  }

  onSubmit(): void {
    if (this.form.invalid) {
      this.form.markAllAsTouched();
      return;
    }
    this.loading.set(true);
    this.errorMessage.set('');
    this.successMessage.set('');
    this.authService.forgotPassword(this.form.value.email).subscribe({
      next: (res) => {
        this.loading.set(false);
        this.successMessage.set(res.message);
      },
      error: (err: HttpErrorResponse) => {
        this.loading.set(false);
        this.errorMessage.set(apiErrorMessage(err, 'Impossible d\'envoyer la demande.'));
      },
    });
  }
}
