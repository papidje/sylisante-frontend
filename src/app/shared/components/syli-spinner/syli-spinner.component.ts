import { Component, Input } from '@angular/core';
import { CommonModule } from '@angular/common';

export type SyliSpinnerSize = 'xs' | 'sm' | 'md' | 'lg';

@Component({
  selector: 'app-syli-spinner',
  standalone: true,
  imports: [CommonModule],
  template: `
    <div class="syli-spinner-host" [class.syli-spinner-host--centered]="centered">
      <div class="syli-spinner" [attr.data-size]="size">
        @if (showInnerRings) {
          <div class="syli-ring syli-ring-static syli-ring-inner" aria-hidden="true"></div>
          <div class="syli-ring syli-ring-static syli-ring-middle" aria-hidden="true"></div>
        }
        <div class="syli-ring syli-ring-spin" aria-hidden="true"></div>
        @if (showLogo) {
          <img src="assets/syliSante.png" alt="" class="syli-logo mix-blend-multiply" aria-hidden="true"/>
        }
      </div>
      @if (showLabel) {
        <p class="syli-spinner-label">{{ label }}</p>
      }
    </div>
  `,
  styles: [`
    .syli-spinner-host {
      display: inline-flex;
      flex-direction: column;
      align-items: center;
      gap: 0.75rem;
    }

    .syli-spinner-host--centered {
      display: flex;
      justify-content: center;
      width: 100%;
    }

    .syli-spinner {
      position: relative;
      display: inline-flex;
      align-items: center;
      justify-content: center;
      flex-shrink: 0;
    }

    .syli-spinner[data-size='xs']  { width: 1.25rem;  height: 1.25rem;  }
    .syli-spinner[data-size='sm']  { width: 2rem;    height: 2rem;    }
    .syli-spinner[data-size='md']  { width: 4.5rem;  height: 4.5rem;  }
    .syli-spinner[data-size='lg']  { width: 6rem;    height: 6rem;    }

    .syli-ring {
      position: absolute;
      inset: 0;
      border-radius: 50%;
    }

    /* Anneau rotatif — dégradé vert → bleu SyliSanté */
    .syli-ring-spin {
      background: conic-gradient(
        from 0deg,
        #10B981 0%,
        #0EA5E9 45%,
        #38bdf8 70%,
        #10B981 100%
      );
      animation: syli-spin 1.1s linear infinite;
      -webkit-mask: radial-gradient(farthest-side, transparent calc(100% - var(--ring-width)), #000 calc(100% - var(--ring-width) + 1px));
      mask: radial-gradient(farthest-side, transparent calc(100% - var(--ring-width)), #000 calc(100% - var(--ring-width) + 1px));
    }

    .syli-spinner[data-size='xs']  { --ring-width: 3px;  }
    .syli-spinner[data-size='sm']  { --ring-width: 4px;  }
    .syli-spinner[data-size='md']  { --ring-width: 7px;  }
    .syli-spinner[data-size='lg']  { --ring-width: 9px;  }

    /* Anneaux intérieurs statiques (effet profondeur) */
    .syli-ring-static {
      pointer-events: none;
    }

    .syli-ring-inner {
      inset: 14%;
      border: 1.5px solid rgba(14, 165, 233, 0.12);
      background: transparent;
    }

    .syli-ring-middle {
      inset: 8%;
      border: 1.5px solid rgba(16, 185, 129, 0.15);
      background: transparent;
    }

    .syli-logo {
      position: relative;
      z-index: 1;
      height: auto;
      object-fit: contain;
      background: transparent;
    }

    .syli-spinner[data-size='sm'] .syli-logo  { width: 55%; }
    .syli-spinner[data-size='md'] .syli-logo  { width: 52%; }
    .syli-spinner[data-size='lg'] .syli-logo  { width: 50%; }

    .syli-spinner-label {
      margin: 0;
      font-size: 0.875rem;
      font-weight: 500;
      color: #94a3b8;
      letter-spacing: 0.01em;
    }

    @keyframes syli-spin {
      to { transform: rotate(360deg); }
    }
  `],
})
export class SyliSpinnerComponent {
  /** xs = boutons inline · sm = sections · md/lg = pages */
  @Input() size: SyliSpinnerSize = 'md';
  @Input() showLabel = false;
  @Input() label = 'Chargement...';
  @Input() centered = false;

  get showLogo(): boolean {
    return this.size !== 'xs';
  }

  get showInnerRings(): boolean {
    return this.size === 'md' || this.size === 'lg';
  }
}
