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
  imports: [ReactiveFormsModule, RouterLink, SyliSpinnerComponent],
  template: `
    <div class="min-h-screen bg-gray-50 flex items-center justify-center p-4">
      <div class="w-full max-w-lg">
        <div class="text-center mb-6">
          <img src="assets/syliSante.png" alt="SyliSanté" class="h-12 w-auto mx-auto mb-2"/>
          <p class="text-xl font-bold text-gray-900">SyliSanté</p>
          <p class="text-sm text-gray-400">Plateforme médicale — Guinée</p>
        </div>
        <div class="card">
          <div class="mb-6">
            <h1 class="text-2xl font-bold text-gray-900">
              @if (isPatientStep2()) {
                Finaliser votre inscription
              } @else {
                Créer un compte
              }
            </h1>
            <p class="text-gray-500 mt-1 text-sm">
              @if (isPatientStep2()) {
                Saisissez le code reçu par email et choisissez votre mot de passe
              } @else {
                Rejoignez la plateforme SyliSanté
              }
            </p>
          </div>

          @if (successMessage()) {
            <div class="bg-sky-50 border border-sky-200 rounded-lg p-4 mb-6">
              <p class="text-sm text-sky-700">{{ successMessage() }}</p>
            </div>
          }

          @if (errorMessage()) {
            <div class="bg-red-50 border border-red-200 rounded-lg p-4 mb-6">
              <p class="text-sm text-red-700">{{ errorMessage() }}</p>
            </div>
          }

          @if (!isPatientStep2()) {
            <form [formGroup]="registerForm" (ngSubmit)="onSubmitStep1()" class="space-y-5">
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

              @if (isPatientSelected()) {
                <div>
                  <label for="phone" class="block text-sm font-medium text-gray-700 mb-1">Téléphone</label>
                  <input id="phone" type="tel" formControlName="phone"
                         class="input-field" [class.input-error]="isFieldInvalid('phone')"
                         placeholder="+224 6XX XX XX XX" autocomplete="tel"/>
                  @if (isFieldInvalid('phone')) {
                    <p class="error-message">{{ getFieldError('phone') }}</p>
                  }
                </div>
              } @else if (isPractitionerSelected()) {
                <div>
                  <label for="password" class="block text-sm font-medium text-gray-700 mb-1">Mot de passe</label>
                  <input id="password" type="password" formControlName="password"
                         class="input-field" [class.input-error]="isFieldInvalid('password')"
                         placeholder="Minimum 8 caractères" autocomplete="new-password"/>
                  @if (isFieldInvalid('password')) {
                    <p class="error-message">{{ getFieldError('password') }}</p>
                  }
                </div>
              }

              <div>
                <label class="block text-sm font-medium text-gray-700 mb-2">Je suis</label>
                <div class="grid grid-cols-2 gap-3">
                  <label class="relative flex cursor-pointer">
                    <input type="radio" formControlName="role" value="ROLE_PATIENT" class="sr-only peer"/>
                    <div class="flex flex-col items-center gap-2 p-4 w-full border-2 border-gray-200 rounded-xl
                                 peer-checked:border-primary-500 peer-checked:bg-primary-50 hover:border-gray-300 transition-all">
                      <span class="text-sm font-medium text-gray-700">Patient</span>
                    </div>
                  </label>
                  <label class="relative flex cursor-pointer">
                    <input type="radio" formControlName="role" value="ROLE_PRATICIEN" class="sr-only peer"/>
                    <div class="flex flex-col items-center gap-2 p-4 w-full border-2 border-gray-200 rounded-xl
                                 peer-checked:border-primary-500 peer-checked:bg-primary-50 hover:border-gray-300 transition-all">
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
                  @if (isPatientSelected()) { Envoi du code… } @else { Inscription… }
                } @else {
                  @if (isPatientSelected()) { Recevoir le code par email } @else { Créer mon compte }
                }
              </button>
            </form>
          } @else {
            <form [formGroup]="completeForm" (ngSubmit)="onSubmitStep2()" class="space-y-5">
              <div>
                <label class="block text-sm font-medium text-gray-700 mb-1">Email</label>
                <input type="email" formControlName="email" class="input-field bg-gray-50" readonly />
              </div>

              <div>
                <label for="validationCode" class="block text-sm font-medium text-gray-700 mb-1">
                  Code de validation (6 chiffres)
                </label>
                <input id="validationCode" type="text" formControlName="validationCode"
                       class="input-field text-center text-2xl tracking-[0.5em] font-mono"
                       placeholder="000000" maxlength="6" autocomplete="one-time-code"/>
                @if (isCompleteFieldInvalid('validationCode')) {
                  <p class="error-message">Le code doit contenir 6 chiffres.</p>
                }
              </div>

              <div>
                <label for="completePassword" class="block text-sm font-medium text-gray-700 mb-1">Mot de passe</label>
                <input id="completePassword" type="password" formControlName="password"
                       class="input-field" placeholder="Minimum 8 caractères" autocomplete="new-password"/>
                @if (isCompleteFieldInvalid('password')) {
                  <p class="error-message">Minimum 8 caractères requis.</p>
                }
              </div>

              <button type="submit" class="btn-primary w-full py-3" [disabled]="loading()">
                @if (loading()) {
                  <app-syli-spinner size="xs" class="-ml-1 mr-2 inline-block align-middle" />
                  Activation…
                } @else {
                  Activer mon compte
                }
              </button>

              <button type="button" (click)="resendCode()" [disabled]="resendLoading()"
                      class="btn-secondary w-full text-sm">
                @if (resendLoading()) { Envoi… } @else { Renvoyer le code }
              </button>
            </form>
          }

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
  completeForm: FormGroup;
  loading = signal(false);
  resendLoading = signal(false);
  errorMessage = signal('');
  successMessage = signal('');
  patientStep = signal<1 | 2>(1);

  constructor(
    private fb: FormBuilder,
    private authService: AuthService,
    private router: Router
  ) {
    this.registerForm = this.fb.group({
      firstName: ['', [Validators.required, Validators.maxLength(100)]],
      lastName: ['', [Validators.required, Validators.maxLength(100)]],
      email: ['', [Validators.required, Validators.email]],
      phone: [''],
      password: [''],
      role: ['' as Role, Validators.required],
    });

    this.completeForm = this.fb.group({
      email: ['', [Validators.required, Validators.email]],
      validationCode: ['', [Validators.required, Validators.minLength(6), Validators.maxLength(6)]],
      password: ['', [Validators.required, Validators.minLength(8)]],
    });

    this.registerForm.get('role')!.valueChanges.subscribe(() => this.updateValidatorsForRole());
  }

  isPatientStep2(): boolean {
    return this.isPatientSelected() && this.patientStep() === 2;
  }

  isPatientSelected(): boolean {
    return this.registerForm.get('role')?.value === 'ROLE_PATIENT';
  }

  isPractitionerSelected(): boolean {
    return this.registerForm.get('role')?.value === 'ROLE_PRATICIEN';
  }

  onSubmitStep1(): void {
    this.updateValidatorsForRole();
    if (this.registerForm.invalid) {
      this.registerForm.markAllAsTouched();
      return;
    }

    this.loading.set(true);
    this.errorMessage.set('');
    this.successMessage.set('');

    const v = this.registerForm.value;

    if (this.isPatientSelected()) {
      this.authService.initiatePatientRegistration({
        firstName: v.firstName,
        lastName: v.lastName,
        email: v.email,
        phone: v.phone,
      }).subscribe({
        next: (res) => {
          this.loading.set(false);
          this.successMessage.set(res.message);
          this.completeForm.patchValue({ email: v.email });
          this.patientStep.set(2);
        },
        error: (err: HttpErrorResponse) => {
          this.loading.set(false);
          this.errorMessage.set(err.error?.detail || 'Erreur lors de l\'envoi du code.');
        },
      });
      return;
    }

    this.authService.register({
      firstName: v.firstName,
      lastName: v.lastName,
      email: v.email,
      password: v.password,
      role: v.role,
    }).subscribe({
      next: () => {
        this.router.navigate(['/auth/validate'], {
          queryParams: { email: v.email },
        });
      },
      error: (err: HttpErrorResponse) => {
        this.loading.set(false);
        this.errorMessage.set(err.error?.detail || 'Une erreur est survenue lors de l\'inscription.');
      },
    });
  }

  onSubmitStep2(): void {
    if (this.completeForm.invalid) {
      this.completeForm.markAllAsTouched();
      return;
    }

    this.loading.set(true);
    this.errorMessage.set('');

    const v = this.completeForm.value;
    this.authService.completePatientRegistration({
      email: v.email,
      validationCode: v.validationCode,
      password: v.password,
    }).subscribe({
      next: () => {
        this.loading.set(false);
        this.router.navigate([this.authService.getDefaultRoute()]);
      },
      error: (err: HttpErrorResponse) => {
        this.loading.set(false);
        this.errorMessage.set(err.error?.detail || 'Code invalide ou expiré.');
      },
    });
  }

  resendCode(): void {
    const email = this.completeForm.get('email')?.value;
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

  private updateValidatorsForRole(): void {
    const phone = this.registerForm.get('phone');
    const password = this.registerForm.get('password');
    if (this.isPatientSelected()) {
      phone?.setValidators([Validators.required, Validators.maxLength(20)]);
      password?.clearValidators();
      password?.setValue('');
    } else if (this.isPractitionerSelected()) {
      phone?.clearValidators();
      phone?.setValue('');
      password?.setValidators([Validators.required, Validators.minLength(8)]);
      this.patientStep.set(1);
    } else {
      phone?.clearValidators();
      password?.clearValidators();
    }
    phone?.updateValueAndValidity();
    password?.updateValueAndValidity();
  }

  isFieldInvalid(field: string): boolean {
    const control = this.registerForm.get(field);
    return !!(control && control.invalid && control.touched);
  }

  isCompleteFieldInvalid(field: string): boolean {
    const control = this.completeForm.get(field);
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
