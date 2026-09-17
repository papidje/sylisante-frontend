import { Component, OnInit, signal } from '@angular/core';
import { RouterLink } from '@angular/router';
import { VitalService } from '../../../core/services/vital.service';
import { SyliSpinnerComponent } from '../../../shared/components/syli-spinner/syli-spinner.component';
import {
  BloodPressureReadingDto,
  GlucoseReadingDto,
  VitalSummaryDto,
  BP_CLASS_BADGE,
  GLUCOSE_CLASS_BADGE,
  formatBp,
  formatGlucoseValue,
} from '../../../core/models/vital.model';

@Component({
  selector: 'app-health-hub',
  standalone: true,
  imports: [RouterLink, SyliSpinnerComponent],
  template: `
    <div class="max-w-3xl mx-auto px-4 py-8">
      <div class="mb-8">
        <h1 class="text-2xl font-bold text-gray-900">Suivi</h1>
        <p class="text-gray-500 mt-1 text-sm">
          Tension et glycémie — mesures à domicile ou au cabinet.
          Les seuils sont indicatifs, ce n'est pas un diagnostic.
        </p>
      </div>

      @if (loading()) {
        <app-syli-spinner size="md" [showLabel]="true" [centered]="true" />
      } @else {
        <div class="grid sm:grid-cols-2 gap-4">
          <a routerLink="/health/blood-pressure"
             class="card hover:shadow-md transition-shadow border-l-4"
             [class.border-red-400]="bpCrisis()"
             [class.border-sky-400]="!bpCrisis()">
            <p class="text-xs uppercase tracking-wide text-gray-400 font-medium">Tension artérielle</p>
            <p class="text-3xl font-bold text-gray-900 mt-2">{{ bpLabel() }}</p>
            @if (latestBp(); as bp) {
              <span class="inline-flex mt-3 text-xs font-medium px-2 py-0.5 rounded-full border"
                    [class]="bpBadge(bp)">
                {{ bp.classificationLabel }}
              </span>
              @if (summary()?.averageSystolic != null) {
                <p class="text-xs text-gray-400 mt-3">
                  Moyenne {{ summary()!.averageSystolic }}/{{ summary()!.averageDiastolic }} mmHg
                  · {{ summary()!.bloodPressureCount }} mesure{{ summary()!.bloodPressureCount > 1 ? 's' : '' }}
                </p>
              }
            } @else {
              <p class="text-sm text-gray-400 mt-3">Aucune mesure. Saisissez votre tension à domicile.</p>
            }
            <p class="text-sm text-primary-600 font-medium mt-4">Ouvrir le suivi →</p>
          </a>

          <a routerLink="/health/diabetes"
             class="card hover:shadow-md transition-shadow border-l-4 border-emerald-400">
            <p class="text-xs uppercase tracking-wide text-gray-400 font-medium">Diabète / glycémie</p>
            <p class="text-3xl font-bold text-gray-900 mt-2">{{ glucoseLabel() }}</p>
            @if (latestGlucose(); as g) {
              @if (g.classificationLabel) {
                <span class="inline-flex mt-3 text-xs font-medium px-2 py-0.5 rounded-full border"
                      [class]="glucoseBadge(g)">
                  {{ g.classificationLabel }}
                </span>
              }
              @if (summary()?.latestHba1c; as hba) {
                <p class="text-xs text-gray-500 mt-3">
                  HbA1c {{ hba.value }} %
                  · {{ hba.classificationLabel }}
                </p>
              }
            } @else {
              <p class="text-sm text-gray-400 mt-3">Aucune glycémie. Unité : mmol/L.</p>
            }
            <p class="text-sm text-primary-600 font-medium mt-4">Ouvrir le suivi →</p>
          </a>
        </div>

        <p class="text-xs text-gray-400 mt-6">
          Grossesse et carnet vaccinal arriveront dans une prochaine étape.
        </p>
      }
    </div>
  `,
})
export class HealthHubComponent implements OnInit {
  loading = signal(true);
  summary = signal<VitalSummaryDto | null>(null);

  constructor(private vitalService: VitalService) {}

  ngOnInit(): void {
    this.vitalService.getMySummary().subscribe({
      next: (s) => {
        this.summary.set(s);
        this.loading.set(false);
      },
      error: () => this.loading.set(false),
    });
  }

  latestBp(): BloodPressureReadingDto | null {
    return this.summary()?.latestBloodPressure ?? null;
  }

  latestGlucose(): GlucoseReadingDto | null {
    return this.summary()?.latestGlucose ?? null;
  }

  bpCrisis(): boolean {
    return !!this.latestBp()?.crisis;
  }

  bpLabel(): string {
    const bp = this.latestBp();
    return bp ? `${formatBp(bp)} mmHg` : '—';
  }

  glucoseLabel(): string {
    const g = this.latestGlucose();
    if (!g) return '—';
    return formatGlucoseValue(g.fasting ?? g.postprandial);
  }

  bpBadge(bp: BloodPressureReadingDto): string {
    return BP_CLASS_BADGE[bp.classification];
  }

  glucoseBadge(g: GlucoseReadingDto): string {
    return g.classification ? GLUCOSE_CLASS_BADGE[g.classification] : '';
  }
}
