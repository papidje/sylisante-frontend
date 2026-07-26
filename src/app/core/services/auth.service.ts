import { Injectable, signal, computed } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Router } from '@angular/router';
import { tap, Observable, of } from 'rxjs';
import {
  AuthResponse,
  LoginRequest,
  RegisterRequest,
  ValidateAccountRequest,
  ResendCodeRequest,
  isAccountRestricted,
  isPendingAdminValidation,
  needsAccountDisclaimer,
} from '../models/user.model';
import { NotificationService } from './notification.service';

@Injectable({ providedIn: 'root' })
export class AuthService {
  private readonly TOKEN_KEY = 'sylisante_token';
  private readonly REFRESH_TOKEN_KEY = 'sylisante_refresh_token';
  private readonly USER_KEY = 'sylisante_user';

  private _currentUser = signal<AuthResponse | null>(this.loadStoredUser());
  readonly currentUser = this._currentUser.asReadonly();
  readonly isLoggedIn = computed(() => this._currentUser() !== null);
  readonly isPatient = computed(() => this._currentUser()?.role === 'ROLE_PATIENT');
  readonly isPractitioner = computed(() => this._currentUser()?.role === 'ROLE_PRATICIEN');
  readonly isAdmin = computed(() => this._currentUser()?.role === 'ROLE_ADMIN');
  readonly isAccountRestricted = computed(() =>
    isAccountRestricted(this._currentUser()?.status)
  );
  readonly isPendingValidation = computed(() =>
    isPendingAdminValidation(this._currentUser()?.status)
  );
  readonly needsAccountDisclaimer = computed(() =>
    needsAccountDisclaimer(this._currentUser()?.status, this._currentUser()?.role)
  );

  constructor(
    private http: HttpClient,
    private router: Router,
    private notificationService: NotificationService
  ) {
    // Rétablir le flux SSE si l'utilisateur est déjà connecté (rafraîchissement de page)
    const token = this.getToken();
    if (token && this._currentUser()) {
      setTimeout(() => notificationService.connect(token), 500);
    }
  }

  register(request: RegisterRequest): Observable<{ message: string }> {
    return this.http.post<{ message: string }>('/api/auth/register', request);
  }

  validateAccount(request: ValidateAccountRequest): Observable<{ message: string }> {
    return this.http.post<{ message: string }>('/api/auth/validate', request);
  }

  resendCode(request: ResendCodeRequest): Observable<{ message: string }> {
    return this.http.post<{ message: string }>('/api/auth/resend-code', request);
  }

  login(request: LoginRequest): Observable<AuthResponse> {
    return this.http.post<AuthResponse>('/api/auth/login', request).pipe(
      tap(response => {
        this.storeSession(response);
        if (response.token) {
          this.notificationService.connect(response.token);
        }
      })
    );
  }

  /** Rafraîchit l'access token via le refresh token stocké. */
  refreshAccessToken(): Observable<AuthResponse> {
    const refreshToken = this.getRefreshToken();
    return this.http.post<AuthResponse>('/api/auth/refresh', { refreshToken }).pipe(
      tap(response => {
        this.storeSession(response);
        if (response.token) {
          this.notificationService.reconnect(response.token);
        }
      })
    );
  }

  getProfile(): Observable<AuthResponse> {
    return this.http.get<AuthResponse>('/api/auth/me').pipe(
      tap(response => {
        const stored = { ...response, token: this.getToken(), refreshToken: this.getRefreshToken() };
        localStorage.setItem(this.USER_KEY, JSON.stringify(stored));
        this._currentUser.set(stored);
      })
    );
  }

  /** Resynchronise le statut compte depuis le serveur et redirige si restreint. */
  syncSessionFromServer(): Observable<AuthResponse | null> {
    if (!this.isLoggedIn() || !this.getToken()) {
      return of(null);
    }
    return this.getProfile().pipe(
      tap(() => {
        if (this.isAccountRestricted()) {
          this.router.navigate(['/account-restricted']);
        }
      })
    );
  }

  /** Déconnexion sécurisée : révoque le refresh token côté serveur, puis vide la session locale. */
  logout(): void {
    const refreshToken = this.getRefreshToken();
    if (refreshToken) {
      this.http.post('/api/auth/logout', { refreshToken }).subscribe({
        error: () => { /* ignoré : on déconnecte quoi qu'il arrive */ }
      });
    }
    this.clearSession();
  }

  getDefaultRoute(): string {
    if (this.isAccountRestricted()) {
      return '/account-restricted';
    }
    const role = this._currentUser()?.role;
    if (role === 'ROLE_ADMIN') return '/admin/dashboard';
    if (role === 'ROLE_PRATICIEN') return '/dashboard/practitioner';
    return '/dashboard/patient';
  }

  getToken(): string | null {
    return localStorage.getItem(this.TOKEN_KEY);
  }

  getRefreshToken(): string | null {
    return localStorage.getItem(this.REFRESH_TOKEN_KEY);
  }

  clearSession(): void {
    this.notificationService.disconnect();
    localStorage.removeItem(this.TOKEN_KEY);
    localStorage.removeItem(this.REFRESH_TOKEN_KEY);
    localStorage.removeItem(this.USER_KEY);
    this._currentUser.set(null);
    this.router.navigate(['/auth/login']);
  }

  private storeSession(response: AuthResponse): void {
    if (response.token) {
      localStorage.setItem(this.TOKEN_KEY, response.token);
    }
    if (response.refreshToken) {
      localStorage.setItem(this.REFRESH_TOKEN_KEY, response.refreshToken);
    }
    localStorage.setItem(this.USER_KEY, JSON.stringify(response));
    this._currentUser.set(response);
  }

  private loadStoredUser(): AuthResponse | null {
    const stored = localStorage.getItem(this.USER_KEY);
    return stored ? JSON.parse(stored) : null;
  }
}
