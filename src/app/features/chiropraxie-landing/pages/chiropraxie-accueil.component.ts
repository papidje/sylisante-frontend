import { Component } from '@angular/core';
import { RouterLink } from '@angular/router';
import { CHIROPRAXIE_HOME, CHIROPRAXIE_SITE } from '../chiropraxie-content';

@Component({
  selector: 'app-chiropraxie-accueil',
  standalone: true,
  imports: [RouterLink],
  templateUrl: './chiropraxie-accueil.component.html',
})
export class ChiropraxieAccueilComponent {
  readonly site = CHIROPRAXIE_SITE;
  readonly home = CHIROPRAXIE_HOME;
}
