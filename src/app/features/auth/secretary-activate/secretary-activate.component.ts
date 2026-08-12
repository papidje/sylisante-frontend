import { Component, OnInit, signal } from '@angular/core';
import { FormBuilder, FormGroup, ReactiveFormsModule, Validators } from '@angular/forms';
import { ActivatedRoute, Router, RouterLink } from '@angular/router';
import { HttpErrorResponse } from '@angular/common/http';
import { AuthService } from '../../../core/services/auth.service';
import { SyliSpinnerComponent } from '../../../shared/components/syli-spinner/syli-spinner.component';

@Component({
  selector: 'app-secretary-activate',
  standalone: true,
  imports: [ReactiveFormsModule, RouterLink, SyliSpinnerComponent],
  template: `
    <div class="min-h-screen bg-gray-50 flex items-center justify-center p-4">
      <div class="w-full max-w-lg card">
        <div class="mb-6">
          <h1 class="text-2xl font-bold text-gray-900">Activer votre compte secrétaire</h1>
          <p class="text-gray-500 mt-1 text-sm">Définissez vos informations et votre mot de passe</p>
        </div>

        @if (errorMessage()) {
          <div class="bg-red-50 border border-red-200 rounded-lg p-4 mb-6">
            <p class="text-sm text-red-700">{{ errorMessage() }}</p>
          </div>
        }

        <form [formGroup]="form" (ngSubmit)="onSubmit()" class="space-y-5">
          <div class="grid grid-cols-2 gap-4">
            <div>
              <label class="block text-sm font-medium text-gray-700 mb-1">Prénom</label>
              <input type="text" formControlName="firstName" class="input-field" autocomplete="given-name"/>
            </div>
            <div>
              <label class="block text-sm font-medium text-gray-700 mb-1">Nom</label>
              <input type="text" formControlName="lastName" class="input-field" autocomplete="family-name"/>
            </div>
          </div>
          <div>
            <label class="block text-sm font-medium text-gray-700 mb-1">Email</label>
            <input type="email" formControlName="email" class="input-field bg-gray-50" readonly/>
          </div>
          <div>
            <label class="block text-sm font-medium text-gray-700 mb-1">Mot de passe</label>
            <input type="password" formControlName="password" class="input-field" autocomplete="new-password"/>
            <p class="text-xs text-gray-400 mt-1">Minimum 8 caractères</p>
          </div>
          <button type="submit" [disabled]="loading() || form.invalid" class="btn-primary w-full">
            @if (loading()) {
              <app-syli-spinner size="xs" class="mr-2 inline-block align-middle" />
            }
            Activer mon compte
          </button>
        </form>

        <p class="text-center text-sm text-gray-500 mt-6">
          Déjà un compte ?
          <a routerLink="/auth/login" class="text-primary-600 hover:underline font-medium">Se connecter</a>
        </p>
      </div>
    </div>
  `,
})
export class SecretaryActivateComponent implements OnInit {
  form: FormGroup;
  loading = signal(false);
  errorMessage = signal('');
  private token = '';

  constructor(
    private fb: FormBuilder,
    private route: ActivatedRoute,
    private authService: AuthService,
    private router: Router
  ) {
    this.form = this.fb.group({
      firstName: ['', Validators.required],
      lastName: ['', Validators.required],
      email: [{ value: '', disabled: true }, [Validators.required, Validators.email]],
      password: ['', [Validators.required, Validators.minLength(8)]],
    });
  }

  ngOnInit(): void {
    this.route.queryParams.subscribe(params => {
      this.token = params['token'] ?? '';
      const email = params['email'] ?? '';
      this.form.patchValue({ email });
      if (!this.token || !email) {
        this.errorMessage.set('Lien d\'invitation invalide. Vérifiez l\'email reçu.');
      }
    });
  }

  onSubmit(): void {
    if (this.form.invalid || !this.token) return;
    this.loading.set(true);
    this.errorMessage.set('');
    const raw = this.form.getRawValue();
    this.authService.activateSecretaryAccount({
      email: raw.email,
      token: this.token,
      password: raw.password,
      firstName: raw.firstName,
      lastName: raw.lastName,
    }).subscribe({
      next: () => {
        this.loading.set(false);
        this.router.navigate(['/dashboard/secretary']);
      },
      error: (err: HttpErrorResponse) => {
        this.loading.set(false);
        this.errorMessage.set(err.error?.detail || 'Activation impossible.');
      },
    });
  }
}
