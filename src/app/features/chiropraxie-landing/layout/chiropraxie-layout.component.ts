import { Component, OnDestroy, ViewEncapsulation, signal } from '@angular/core';
import { NavigationEnd, Router, RouterLink, RouterLinkActive, RouterOutlet } from '@angular/router';
import { filter, Subscription } from 'rxjs';
import {
  CHIROPRAXIE_HOME,
  CHIROPRAXIE_PAGES,
  CHIROPRAXIE_PAGE_TITLES,
  CHIROPRAXIE_STATIC_PAGES,
  CHIROPRAXIE_SITE,
} from '../chiropraxie-content';

@Component({
  selector: 'app-chiropraxie-layout',
  standalone: true,
  imports: [RouterOutlet, RouterLink, RouterLinkActive],
  templateUrl: './chiropraxie-layout.component.html',
  styleUrl: '../chiropraxie.shared.css',
  encapsulation: ViewEncapsulation.None,
})
export class ChiropraxieLayoutComponent implements OnDestroy {
  readonly site = CHIROPRAXIE_SITE;
  readonly home = CHIROPRAXIE_HOME;
  readonly currentYear = new Date().getFullYear();
  readonly basePath = '/chiropraxie';

  mobileMenuOpen = signal(false);
  openDropdown = signal<'chiro' | 'infos' | null>(null);
  pageTitle = signal<string | null>(null);
  pageEyebrow = signal<string | null>(null);
  pageBannerImage = signal<string | null>(null);
  isHome = signal(true);

  private routerSub?: Subscription;

  constructor(private router: Router) {
    this.updatePageContext(this.router.url);
    this.routerSub = this.router.events
      .pipe(filter((e): e is NavigationEnd => e instanceof NavigationEnd))
      .subscribe(e => {
        this.mobileMenuOpen.set(false);
        this.openDropdown.set(null);
        this.updatePageContext(e.urlAfterRedirects);
      });
  }

  ngOnDestroy(): void {
    this.routerSub?.unsubscribe();
  }

  toggleMobileMenu(): void {
    this.mobileMenuOpen.update(v => !v);
  }

  toggleDropdown(name: 'chiro' | 'infos'): void {
    this.openDropdown.update(current => (current === name ? null : name));
  }

  isChiroSectionActive(): boolean {
    const url = this.router.url.split('?')[0];
    return this.site.menuChiropraxie.some(item => url.endsWith('/' + item.path));
  }

  isInfosSectionActive(): boolean {
    const url = this.router.url.split('?')[0];
    return this.site.menuInfos.some(item => url.endsWith('/' + item.path));
  }

  private updatePageContext(url: string): void {
    const path = url.split('?')[0];
    const home = path === '/chiropraxie' || path === '/chiropraxie/';
    this.isHome.set(home);
    if (home) {
      this.pageTitle.set(null);
      this.pageEyebrow.set(null);
      this.pageBannerImage.set(null);
      return;
    }
    const slug = path.replace('/chiropraxie/', '');
    const page = CHIROPRAXIE_PAGES[slug];
    const staticPage = CHIROPRAXIE_STATIC_PAGES[slug];
    this.pageTitle.set(CHIROPRAXIE_PAGE_TITLES[slug] ?? page?.title ?? null);
    this.pageEyebrow.set(page?.eyebrow ?? staticPage?.eyebrow ?? null);
    this.pageBannerImage.set(page?.bannerImage ?? staticPage?.bannerImage ?? null);
  }
}
