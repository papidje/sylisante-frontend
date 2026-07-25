import { Component, OnInit, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { PlanningAlertService } from '../../../core/services/planning-alert.service';
import { PlanningAlertDto } from '../../../core/models/planning-alert.model';
import { formatLocalDateTime, parseLocalDateTime } from '../../../core/utils/date-utils';
import { SyliSpinnerComponent } from '../../../shared/components/syli-spinner/syli-spinner.component';

@Component({
  selector: 'app-planning-alerts',
  standalone: true,
  imports: [  CommonModule, SyliSpinnerComponent],
  template: `
    <div class="max-w-4xl mx-auto px-4 py-8">
      <div class="mb-8">
        <div class="flex items-center gap-3">
          <h1 class="text-2xl font-bold text-gray-900">Alertes de planning</h1>
          @if (unresolvedCount() > 0) {
            <span class="inline-flex items-center justify-center px-2.5 py-0.5 rounded-full text-sm font-bold bg-red-100 text-red-700">
              {{ unresolvedCount() }} non résolues
            </span>
          }
        </div>
        <p class="text-gray-500 mt-1">Rendez-vous impactés par des modifications de votre planning</p>
      </div>

      @if (loading()) {
        <app-syli-spinner size="md" [showLabel]="true" [centered]="true" />
      } @else if (alerts().length === 0) {
        <div class="card text-center py-16">
          <svg class="w-16 h-16 text-gray-300 mx-auto mb-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="1.5"
                  d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z"/>
          </svg>
          <p class="text-gray-500 font-medium">Aucune alerte de planning</p>
          <p class="text-gray-400 text-sm mt-1">Tous vos rendez-vous sont synchronisés avec votre planning</p>
        </div>
      } @else {
        <div class="space-y-4">
          @for (alert of alerts(); track alert.id) {
            <div class="card transition-all"
                 [class.border-l-4]="!alert.resolved"
                 [class.border-yellow-400]="!alert.resolved"
                 [class.opacity-60]="alert.resolved">
              <div class="flex items-start justify-between gap-4">
                <div class="flex items-start gap-3 flex-1 min-w-0">
                  <div class="w-8 h-8 rounded-full flex items-center justify-center flex-shrink-0 mt-0.5"
                       [class.bg-yellow-100]="!alert.resolved"
                       [class.bg-gray-100]="alert.resolved">
                    <svg class="w-4 h-4" [class.text-yellow-600]="!alert.resolved"
                         [class.text-gray-400]="alert.resolved"
                         fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2"
                            d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z"/>
                    </svg>
                  </div>
                  <div class="flex-1 min-w-0">
                    <p class="text-sm font-medium text-gray-900">{{ alert.message }}</p>
                    @if (alert.patientName && alert.appointmentDateTime) {
                      <div class="mt-2 flex flex-wrap gap-3">
                        <span class="text-xs bg-gray-100 text-gray-700 px-2 py-1 rounded-full">
                          👤 {{ alert.patientName }}
                        </span>
                        <span class="text-xs bg-blue-100 text-blue-700 px-2 py-1 rounded-full">
                          📅 {{ formatDate(alert.appointmentDateTime) }}
                        </span>
                        <span class="text-xs bg-orange-100 text-orange-700 px-2 py-1 rounded-full font-medium">
                          ⚠️ RDV marqué IMPACTÉ
                        </span>
                      </div>
                    }
                    <p class="text-xs text-gray-400 mt-2">{{ formatRelative(alert.createdAt) }}</p>
                  </div>
                </div>
                <div class="flex-shrink-0">
                  @if (!alert.resolved) {
                    <button (click)="resolveAlert(alert.id)"
                            [disabled]="resolvingId() === alert.id"
                            class="btn-secondary text-xs px-3 py-1">
                      @if (resolvingId() === alert.id) {
                        Résolution...
                      } @else {
                        Marquer résolu
                      }
                    </button>
                  } @else {
                    <span class="text-xs text-sky-600 font-medium flex items-center gap-1">
                      <svg class="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M5 13l4 4L19 7"/>
                      </svg>
                      Résolu
                    </span>
                  }
                </div>
              </div>
            </div>
          }
        </div>
      }
    </div>
  `,
})
export class PlanningAlertsComponent implements OnInit {
  alerts = signal<PlanningAlertDto[]>([]);
  loading = signal(true);
  resolvingId = signal<number | null>(null);
  unresolvedCount = signal(0);

  constructor(private planningAlertService: PlanningAlertService) {}

  ngOnInit(): void {
    this.planningAlertService.getMyAlerts().subscribe({
      next: (data) => {
        this.alerts.set(data);
        this.unresolvedCount.set(data.filter(a => !a.resolved).length);
        this.loading.set(false);
      },
      error: () => this.loading.set(false),
    });
  }

  resolveAlert(alertId: number): void {
    this.resolvingId.set(alertId);
    this.planningAlertService.resolveAlert(alertId).subscribe({
      next: (updated) => {
        this.alerts.update(list => list.map(a => a.id === updated.id ? updated : a));
        this.unresolvedCount.update(c => Math.max(0, c - 1));
        this.resolvingId.set(null);
      },
      error: () => this.resolvingId.set(null),
    });
  }

  formatDate(dateStr: string): string {
    return formatLocalDateTime(dateStr);
  }

  formatRelative(dateStr: string): string {
    const diff = Date.now() - parseLocalDateTime(dateStr).getTime();
    const mins = Math.floor(diff / 60000);
    if (mins < 60) return `il y a ${mins} min`;
    const hours = Math.floor(mins / 60);
    if (hours < 24) return `il y a ${hours}h`;
    return formatLocalDateTime(dateStr);
  }
}
