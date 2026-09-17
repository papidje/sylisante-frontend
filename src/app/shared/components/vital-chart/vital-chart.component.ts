import { Component, Input, OnChanges, SimpleChanges } from '@angular/core';
import { VitalSource } from '../../../core/models/vital.model';

export interface VitalChartPoint {
  t: string;
  v: number;
  source?: VitalSource;
}

export interface VitalChartSeries {
  label: string;
  color: string;
  points: VitalChartPoint[];
}

interface PlottedPoint {
  cx: number;
  cy: number;
  color: string;
  fill: string;
  title: string;
  home: boolean;
}

interface PlottedLine {
  d: string;
  color: string;
  dashed: boolean;
}

@Component({
  selector: 'app-vital-chart',
  standalone: true,
  template: `
    @if (!hasData) {
      <p class="text-sm text-gray-400 py-8 text-center">Pas encore assez de mesures pour un graphique.</p>
    } @else {
      <svg viewBox="0 0 640 200" class="w-full h-44" role="img" [attr.aria-label]="ariaLabel">
        @for (line of lines; track $index) {
          <path [attr.d]="line.d" fill="none" [attr.stroke]="line.color" stroke-width="2.5"
                stroke-linecap="round" stroke-linejoin="round"
                [attr.stroke-dasharray]="line.dashed ? '6 5' : null"/>
        }
        @for (p of plotted; track $index) {
          <circle [attr.cx]="p.cx" [attr.cy]="p.cy" r="4.5"
                  [attr.fill]="p.fill" [attr.stroke]="p.color" stroke-width="2">
            <title>{{ p.title }}</title>
          </circle>
        }
      </svg>
      <div class="flex flex-wrap gap-3 text-xs text-gray-500 mt-1">
        @for (s of series; track s.label) {
          <span class="inline-flex items-center gap-1.5">
            <span class="w-2.5 h-2.5 rounded-full" [style.background]="s.color"></span>
            {{ s.label }}
          </span>
        }
        @if (distinguishSource) {
          <span class="inline-flex items-center gap-1.5">
            <span class="w-5 border-t-2 border-dashed border-slate-500"></span>
            Domicile
          </span>
          <span class="inline-flex items-center gap-1.5">
            <span class="w-5 border-t-2 border-slate-700"></span>
            Cabinet / labo
          </span>
        }
      </div>
    }
  `,
})
export class VitalChartComponent implements OnChanges {
  @Input() series: VitalChartSeries[] = [];
  @Input() distinguishSource = false;
  @Input() ariaLabel = 'Graphique de suivi';

  plotted: PlottedPoint[] = [];
  lines: PlottedLine[] = [];
  hasData = false;

  ngOnChanges(_changes: SimpleChanges): void {
    this.rebuild();
  }

  private rebuild(): void {
    const padX = 28;
    const padY = 22;
    const width = 640;
    const height = 200;
    const all = this.series.flatMap(s => s.points.map(p => p.v));
    this.hasData = all.length >= 2;
    this.plotted = [];
    this.lines = [];
    if (!this.hasData) return;

    const min = Math.min(...all);
    const max = Math.max(...all);
    const span = max - min || 1;

    for (const s of this.series) {
      const chronological = [...s.points].reverse();
      if (chronological.length === 0) continue;
      const n = chronological.length;
      const coords = chronological.map((p, i) => ({
        x: padX + (n === 1 ? (width - 2 * padX) / 2 : (i * (width - 2 * padX)) / (n - 1)),
        y: padY + (height - 2 * padY) * (1 - (p.v - min) / span),
        p,
      }));

      for (let i = 0; i < coords.length - 1; i++) {
        const a = coords[i];
        const b = coords[i + 1];
        const aHome = this.isHome(a.p.source);
        const bHome = this.isHome(b.p.source);
        if (!this.distinguishSource || aHome === bHome) {
          this.lines.push({
            d: `M${a.x.toFixed(1)} ${a.y.toFixed(1)} L${b.x.toFixed(1)} ${b.y.toFixed(1)}`,
            color: s.color,
            dashed: this.distinguishSource && aHome,
          });
        } else {
          const mx = (a.x + b.x) / 2;
          const my = (a.y + b.y) / 2;
          this.lines.push({
            d: `M${a.x.toFixed(1)} ${a.y.toFixed(1)} L${mx.toFixed(1)} ${my.toFixed(1)}`,
            color: s.color,
            dashed: aHome,
          });
          this.lines.push({
            d: `M${mx.toFixed(1)} ${my.toFixed(1)} L${b.x.toFixed(1)} ${b.y.toFixed(1)}`,
            color: s.color,
            dashed: bHome,
          });
        }
      }

      for (const c of coords) {
        const home = this.distinguishSource && this.isHome(c.p.source);
        this.plotted.push({
          cx: c.x,
          cy: c.y,
          color: s.color,
          fill: home ? '#ffffff' : s.color,
          home,
          title: `${s.label} ${c.p.v} — ${c.p.t}`,
        });
      }
    }
  }

  private isHome(source: VitalSource | undefined): boolean {
    return source === 'SELF';
  }
}
