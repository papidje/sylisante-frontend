import { Component } from '@angular/core';
import { RouterLink } from '@angular/router';
import { CHIROPRAXIE_SITE } from '../chiropraxie-content';

@Component({
  selector: 'app-chiropraxie-sitemap',
  standalone: true,
  imports: [RouterLink],
  templateUrl: './chiropraxie-sitemap.component.html',
})
export class ChiropraxieSitemapComponent {
  readonly site = CHIROPRAXIE_SITE;
  readonly basePath = '/chiropraxie';
}
