import { Component } from '@angular/core';
import { RouterOutlet } from '@angular/router';
import { NavbarComponent } from './shared/components/navbar/navbar.component';
import { AuthService } from './core/services/auth.service';

@Component({
  selector: 'app-root',
  standalone: true,
  imports: [RouterOutlet, NavbarComponent],
  template: `
    @if (authService.isLoggedIn()) {
      <app-navbar />
    }
    <router-outlet />
  `,
})
export class AppComponent {
  constructor(public authService: AuthService) {}
}
