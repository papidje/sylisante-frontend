import { Component, OnDestroy, OnInit } from '@angular/core';
import { RouterOutlet } from '@angular/router';
import { Subscription } from 'rxjs';
import { NavbarComponent } from './shared/components/navbar/navbar.component';
import { AccountStatusBannerComponent } from './shared/components/account-status-banner/account-status-banner.component';
import { AuthService } from './core/services/auth.service';
import { NotificationService } from './core/services/notification.service';
import { SecretaryAccessService } from './core/services/secretary-access.service';

@Component({
  selector: 'app-root',
  standalone: true,
  imports: [RouterOutlet, NavbarComponent, AccountStatusBannerComponent],
  template: `
    @if (authService.isLoggedIn()) {
      <app-navbar />
      <app-account-status-banner />
    }
    <router-outlet />
  `,
})
export class AppComponent implements OnInit, OnDestroy {
  private accountStatusSub?: Subscription;

  constructor(
    public authService: AuthService,
    private notificationService: NotificationService,
    _secretaryAccessService: SecretaryAccessService,
  ) {}

  ngOnInit(): void {
    this.authService.syncSessionFromServer().subscribe();
    this.accountStatusSub = this.notificationService.accountStatusChanged.subscribe(() => {
      this.authService.syncSessionFromServer().subscribe();
    });
  }

  ngOnDestroy(): void {
    this.accountStatusSub?.unsubscribe();
  }
}
