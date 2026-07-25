import { Component, OnInit, signal } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { AuditLogService } from '../../../core/services/audit-log.service';
import {
  AuditLogResponse,
  AuditAction,
  AUDIT_ACTION_LABELS,
  AUDIT_ACTION_COLORS,
} from '../../../core/models/audit-log.model';
import { formatLocalDateTime } from '../../../core/utils/date-utils';
import { SyliSpinnerComponent } from '../../../shared/components/syli-spinner/syli-spinner.component';

@Component({
  selector: 'app-audit-logs',
  standalone: true,
  imports: [  FormsModule, SyliSpinnerComponent],
  template: `
    <div class="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      <div class="mb-6">
        <h1 class="text-2xl font-bold text-gray-900">Journal d'audit</h1>
        <p class="text-sm text-gray-500 mt-1">Historique de toutes les actions sensibles du système</p>
      </div>

      <!-- Filtres -->
      <div class="bg-white rounded-xl border border-gray-200 shadow-sm p-4 mb-6">
        <div class="flex flex-wrap gap-4 items-end">
          <div class="flex-1 min-w-[200px]">
            <label class="block text-xs font-medium text-gray-700 mb-1">Email utilisateur</label>
            <input [(ngModel)]="filterEmail" (keyup.enter)="load()"
                   type="email" placeholder="Rechercher par email…"
                   class="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-primary-500 focus:border-transparent"/>
          </div>
          <div class="w-64">
            <label class="block text-xs font-medium text-gray-700 mb-1">Type d'action</label>
            <select [(ngModel)]="filterAction" class="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm">
              <option value="">Toutes les actions</option>
              @for (a of allActions; track a) {
                <option [value]="a">{{ actionLabel(a) }}</option>
              }
            </select>
          </div>
          <button (click)="load()" class="btn-primary text-sm px-6">Filtrer</button>
          <button (click)="resetFilters()" class="btn-secondary text-sm px-4">Réinitialiser</button>
        </div>
      </div>

      <!-- Stats bar -->
      <div class="flex items-center justify-between mb-4">
        <span class="text-sm text-gray-500">
          {{ totalElements() }} entrée{{ totalElements() !== 1 ? 's' : '' }} trouvée{{ totalElements() !== 1 ? 's' : '' }}
        </span>
        <div class="flex items-center gap-2 text-sm text-gray-500">
          Page {{ currentPage() + 1 }} / {{ totalPages() || 1 }}
        </div>
      </div>

      <!-- Table -->
      <div class="bg-white rounded-xl border border-gray-200 shadow-sm overflow-hidden">
        @if (loading()) {
          <div class="p-8 text-center">
            <app-syli-spinner size="sm" [showLabel]="true" [centered]="true" />
          </div>
        } @else if (logs().length === 0) {
          <div class="p-8 text-center text-gray-400">
            <svg class="w-12 h-12 mx-auto mb-3 opacity-30" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="1.5"
                    d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"/>
            </svg>
            <p class="font-medium">Aucune entrée d'audit</p>
          </div>
        } @else {
          <table class="w-full text-sm">
            <thead>
              <tr class="bg-gray-50 border-b border-gray-100">
                <th class="px-4 py-3 text-left text-xs font-semibold text-gray-500 uppercase tracking-wide">Date</th>
                <th class="px-4 py-3 text-left text-xs font-semibold text-gray-500 uppercase tracking-wide">Utilisateur</th>
                <th class="px-4 py-3 text-left text-xs font-semibold text-gray-500 uppercase tracking-wide">Action</th>
                <th class="px-4 py-3 text-left text-xs font-semibold text-gray-500 uppercase tracking-wide">Détails</th>
                <th class="px-4 py-3 text-left text-xs font-semibold text-gray-500 uppercase tracking-wide">IP</th>
              </tr>
            </thead>
            <tbody class="divide-y divide-gray-50">
              @for (log of logs(); track log.id) {
                <tr class="hover:bg-gray-50 transition-colors">
                  <td class="px-4 py-3 text-gray-600 whitespace-nowrap font-mono text-xs">
                    {{ formatDate(log.createdAt) }}
                  </td>
                  <td class="px-4 py-3">
                    <span class="text-gray-900 font-medium">{{ log.userEmail }}</span>
                  </td>
                  <td class="px-4 py-3">
                    <span class="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-semibold"
                          [class]="actionColor(log.action)">
                      {{ actionLabel(log.action) }}
                    </span>
                  </td>
                  <td class="px-4 py-3 text-gray-500 max-w-xs truncate">{{ log.details ?? '—' }}</td>
                  <td class="px-4 py-3 text-gray-400 font-mono text-xs">{{ log.ipAddress ?? '—' }}</td>
                </tr>
              }
            </tbody>
          </table>
        }
      </div>

      <!-- Pagination -->
      @if (totalPages() > 1) {
        <div class="mt-4 flex justify-center gap-2">
          <button (click)="goToPage(currentPage() - 1)" [disabled]="currentPage() === 0"
                  class="btn-secondary text-sm px-3 py-1 disabled:opacity-40">← Précédent</button>
          @for (p of pageNumbers(); track p) {
            <button (click)="goToPage(p)"
                    class="text-sm px-3 py-1 rounded-lg border font-medium transition-colors"
                    [class]="p === currentPage()
                      ? 'bg-primary-600 text-white border-primary-600'
                      : 'border-gray-300 text-gray-700 hover:bg-gray-50'">
              {{ p + 1 }}
            </button>
          }
          <button (click)="goToPage(currentPage() + 1)" [disabled]="currentPage() >= totalPages() - 1"
                  class="btn-secondary text-sm px-3 py-1 disabled:opacity-40">Suivant →</button>
        </div>
      }
    </div>
  `
})
export class AuditLogsComponent implements OnInit {
  logs = signal<AuditLogResponse[]>([]);
  loading = signal(false);
  totalElements = signal(0);
  totalPages = signal(0);
  currentPage = signal(0);

  filterEmail = '';
  filterAction = '';

  readonly allActions: AuditAction[] = Object.keys(AUDIT_ACTION_LABELS) as AuditAction[];
  private readonly PAGE_SIZE = 50;

  constructor(private auditLogService: AuditLogService) {}

  ngOnInit(): void {
    this.load();
  }

  load(): void {
    this.loading.set(true);
    this.currentPage.set(0);
    this.auditLogService.getLogs(
      this.filterEmail || undefined,
      this.filterAction || undefined,
      0, this.PAGE_SIZE
    ).subscribe({
      next: res => {
        this.logs.set(res.content);
        this.totalElements.set(res.totalElements);
        this.totalPages.set(res.totalPages);
        this.loading.set(false);
      },
      error: () => this.loading.set(false)
    });
  }

  goToPage(p: number): void {
    if (p < 0 || p >= this.totalPages()) return;
    this.loading.set(true);
    this.currentPage.set(p);
    this.auditLogService.getLogs(
      this.filterEmail || undefined,
      this.filterAction || undefined,
      p, this.PAGE_SIZE
    ).subscribe({
      next: res => {
        this.logs.set(res.content);
        this.loading.set(false);
      },
      error: () => this.loading.set(false)
    });
  }

  resetFilters(): void {
    this.filterEmail = '';
    this.filterAction = '';
    this.load();
  }

  pageNumbers(): number[] {
    const total = this.totalPages();
    const cur = this.currentPage();
    const start = Math.max(0, cur - 2);
    const end = Math.min(total - 1, cur + 2);
    return Array.from({ length: end - start + 1 }, (_, i) => start + i);
  }

  formatDate(s: string): string {
    return formatLocalDateTime(s);
  }

  actionLabel(action: AuditAction): string {
    return AUDIT_ACTION_LABELS[action] ?? action;
  }

  actionColor(action: AuditAction): string {
    return AUDIT_ACTION_COLORS[action] ?? 'bg-gray-100 text-gray-700';
  }
}
