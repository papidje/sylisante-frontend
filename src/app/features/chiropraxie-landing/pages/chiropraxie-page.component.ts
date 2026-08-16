import { Component, DestroyRef, inject } from '@angular/core';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { DomSanitizer, SafeResourceUrl } from '@angular/platform-browser';
import { ActivatedRoute, Router } from '@angular/router';
import { map } from 'rxjs';
import { CHIROPRAXIE_PAGES, ChiropraxiePageDef } from '../chiropraxie-content';
import { ChiropraxieBlocksComponent } from '../chiropraxie-blocks.component';

@Component({
  selector: 'app-chiropraxie-page',
  standalone: true,
  imports: [ChiropraxieBlocksComponent],
  templateUrl: './chiropraxie-page.component.html',
})
export class ChiropraxiePageComponent {
  private readonly route = inject(ActivatedRoute);
  private readonly router = inject(Router);
  private readonly sanitizer = inject(DomSanitizer);
  private readonly destroyRef = inject(DestroyRef);

  page: ChiropraxiePageDef | null = null;

  constructor() {
    this.route.paramMap
      .pipe(
        map(params => params.get('slug')),
        takeUntilDestroyed(this.destroyRef),
      )
      .subscribe(slug => {
        if (!slug || !CHIROPRAXIE_PAGES[slug]) {
          void this.router.navigate(['/chiropraxie']);
          return;
        }
        this.page = CHIROPRAXIE_PAGES[slug];
      });
  }

  youtubeEmbedUrl(id: string): SafeResourceUrl {
    return this.sanitizer.bypassSecurityTrustResourceUrl(`https://www.youtube.com/embed/${id}`);
  }
}
