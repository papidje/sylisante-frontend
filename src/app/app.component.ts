import { Component, OnDestroy, OnInit, signal } from '@angular/core';
import { Router, RouterOutlet, NavigationEnd } from '@angular/router';
import { Subscription, filter } from 'rxjs';
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
    @if (authService.isLoggedIn() && !isChiropraxieLanding()) {
      <app-navbar />
      <app-account-status-banner />
    }
    <router-outlet />
  `,
})
export class AppComponent implements OnInit, OnDestroy {
  private accountStatusSub?: Subscription;
  private routerSub?: Subscription;
  isChiropraxieLanding = signal(false);

  constructor(
    public authService: AuthService,
    private notificationService: NotificationService,
    private router: Router,
    _secretaryAccessService: SecretaryAccessService,
  ) {}

  ngOnInit(): void {
    this.updateLandingMode(this.router.url);
    this.routerSub = this.router.events
      .pipe(filter((e): e is NavigationEnd => e instanceof NavigationEnd))
      .subscribe(e => this.updateLandingMode(e.urlAfterRedirects));

    this.authService.syncSessionFromServer().subscribe();
    this.accountStatusSub = this.notificationService.accountStatusChanged.subscribe(() => {
      this.authService.syncSessionFromServer().subscribe();
    });
  }

  ngOnDestroy(): void {
    this.accountStatusSub?.unsubscribe();
    this.routerSub?.unsubscribe();
  }

  private updateLandingMode(url: string): void {
    const path = url.split('?')[0];
    this.isChiropraxieLanding.set(
      path === '/chiropraxie' ||
        path.startsWith('/chiropraxie/') ||
        path === '/cabinet-nabe' ||
        path.startsWith('/cabinet-nabe/'),
    );
  }
}
