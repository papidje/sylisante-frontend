import { Component } from '@angular/core';
import { RouterOutlet } from '@angular/router';
import { NavbarComponent } from './shared/components/navbar/navbar.component';
import { AccountStatusBannerComponent } from './shared/components/account-status-banner/account-status-banner.component';
import { AuthService } from './core/services/auth.service';

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
export class AppComponent {
  constructor(public authService: AuthService) {}
}
