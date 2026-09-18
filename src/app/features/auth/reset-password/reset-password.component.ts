import { Component, OnInit, signal } from '@angular/core';
import { AbstractControl, FormBuilder, FormGroup, ReactiveFormsModule, ValidationErrors, Validators } from '@angular/forms';
import { ActivatedRoute, Router, RouterLink } from '@angular/router';
import { HttpErrorResponse } from '@angular/common/http';
import { AuthService } from '../../../core/services/auth.service';
import { SyliSpinnerComponent } from '../../../shared/components/syli-spinner/syli-spinner.component';
import { apiErrorMessage } from '../../../core/utils/http-error';

function passwordsMatch(group: AbstractControl): ValidationErrors | null {
  const newPassword = group.get('newPassword')?.value;
  const confirmPassword = group.get('confirmPassword')?.value;
  if (newPassword && confirmPassword && newPassword !== confirmPassword) {
    return { passwordsMismatch: true };
  }
  return null;
}

@Component({
  selector: 'app-reset-password',
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
            <h1 class="text-2xl font-bold text-slate-900">Nouveau mot de passe</h1>
            <p class="text-slate-500 mt-1 text-sm">Choisissez un mot de passe d'au moins 8 caractères.</p>

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

            @if (!token) {
              <p class="text-sm text-red-700 mt-6">Lien incomplet. Demandez un nouvel e-mail depuis la page de connexion.</p>
            } @else if (!successMessage()) {
              <form [formGroup]="form" (ngSubmit)="onSubmit()" class="space-y-5 mt-6">
                <div>
                  <label class="block text-sm font-medium text-slate-700 mb-1">Nouveau mot de passe</label>
                  <input type="password" formControlName="newPassword" class="input-field" autocomplete="new-password"/>
                  @if (form.get('newPassword')?.invalid && form.get('newPassword')?.touched) {
                    <p class="error-message">Au moins 8 caractères.</p>
                  }
                </div>
                <div>
                  <label class="block text-sm font-medium text-slate-700 mb-1">Confirmer</label>
                  <input type="password" formControlName="confirmPassword" class="input-field" autocomplete="new-password"/>
                  @if (form.hasError('passwordsMismatch') && form.get('confirmPassword')?.touched) {
                    <p class="error-message">Les mots de passe ne correspondent pas.</p>
                  }
                </div>
                <button type="submit" class="btn-primary w-full" [disabled]="loading() || form.invalid">
                  @if (loading()) {
                    <app-syli-spinner size="xs" class="mr-2 inline-block align-middle" />
                  }
                  Enregistrer
                </button>
              </form>
            }

            <p class="text-center text-sm text-slate-600 mt-6">
              <a routerLink="/auth/login" class="text-[#0EA5E9] font-medium hover:underline">Retour à la connexion</a>
            </p>
          </div>
        </div>
      </div>
    </div>
  `,
})
export class ResetPasswordComponent implements OnInit {
  form: FormGroup;
  loading = signal(false);
  errorMessage = signal('');
  successMessage = signal('');
  token = '';

  constructor(
    private fb: FormBuilder,
    private route: ActivatedRoute,
    private authService: AuthService,
    private router: Router
  ) {
    this.form = this.fb.group({
      newPassword: ['', [Validators.required, Validators.minLength(8)]],
      confirmPassword: ['', Validators.required],
    }, { validators: passwordsMatch });
  }

  ngOnInit(): void {
    this.token = this.route.snapshot.queryParamMap.get('token') ?? '';
    if (!this.token) {
      this.errorMessage.set('Lien invalide ou incomplet.');
    }
  }

  onSubmit(): void {
    if (!this.token || this.form.invalid) {
      this.form.markAllAsTouched();
      return;
    }
    this.loading.set(true);
    this.errorMessage.set('');
    const { newPassword, confirmPassword } = this.form.value;
    this.authService.resetPassword(this.token, newPassword, confirmPassword).subscribe({
      next: (res) => {
        this.loading.set(false);
        this.successMessage.set(res.message);
        setTimeout(() => this.router.navigate(['/auth/login']), 1800);
      },
      error: (err: HttpErrorResponse) => {
        this.loading.set(false);
        this.errorMessage.set(apiErrorMessage(err, 'Lien invalide ou expiré.'));
      },
    });
  }
}
