import { Component } from '@angular/core';
import { RouterLink } from '@angular/router';
import { CHIROPRAXIE_HOME, CHIROPRAXIE_SITE } from '../chiropraxie-content';

@Component({
  selector: 'app-chiropraxie-mentions',
  standalone: true,
  imports: [RouterLink],
  templateUrl: './chiropraxie-mentions.component.html',
})
export class ChiropraxieMentionsComponent {
  readonly site = CHIROPRAXIE_SITE;
}
