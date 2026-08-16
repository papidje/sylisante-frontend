import { Component, Input } from '@angular/core';
import { CHIROPRAXIE_SITE, ChiropraxieBlock } from './chiropraxie-content';

@Component({
  selector: 'app-chiropraxie-blocks',
  standalone: true,
  templateUrl: './chiropraxie-blocks.component.html',
})
export class ChiropraxieBlocksComponent {
  @Input({ required: true }) blocks!: ChiropraxieBlock[];

  readonly site = CHIROPRAXIE_SITE;
}
