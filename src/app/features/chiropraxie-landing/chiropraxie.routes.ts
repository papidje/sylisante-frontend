import { Routes } from '@angular/router';
import { ChiropraxieLayoutComponent } from './layout/chiropraxie-layout.component';

export const CHIROPRAXIE_ROUTES: Routes = [
  {
    path: '',
    component: ChiropraxieLayoutComponent,
    children: [
      {
        path: '',
        loadComponent: () =>
          import('./pages/chiropraxie-accueil.component').then(m => m.ChiropraxieAccueilComponent),
      },
      {
        path: 'prendre-rendez-vous-chiropracteur-thiais',
        loadComponent: () =>
          import('./pages/chiropraxie-contact.component').then(m => m.ChiropraxieContactComponent),
      },
      {
        path: 'mentions-legales',
        loadComponent: () =>
          import('./pages/chiropraxie-mentions.component').then(m => m.ChiropraxieMentionsComponent),
      },
      {
        path: 'plan-du-site',
        loadComponent: () =>
          import('./pages/chiropraxie-sitemap.component').then(m => m.ChiropraxieSitemapComponent),
      },
      {
        path: ':slug',
        loadComponent: () =>
          import('./pages/chiropraxie-page.component').then(m => m.ChiropraxiePageComponent),
      },
    ],
  },
];
