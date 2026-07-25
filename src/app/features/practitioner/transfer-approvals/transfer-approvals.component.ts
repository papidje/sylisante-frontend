import { Component, OnInit, signal } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { ReportTransferService } from '../../../core/services/report-transfer.service';
import {
  TransferResponse,
  SharedReportDto,
} from '../../../core/models/transfer.model';
import { formatLocalDateTime } from '../../../core/utils/date-utils';
import { SyliSpinnerComponent } from '../../../shared/components/syli-spinner/syli-spinner.component';

interface SelectableReport extends SharedReportDto {
  selected: boolean;
}

@Component({
  selector: 'app-transfer-approvals',
  standalone: true,
  imports: [  FormsModule, SyliSpinnerComponent],
  template: `
    <div class="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      <div class="mb-6 flex items-center justify-between">
        <div>
          <h1 class="text-2xl font-bold text-gray-900">Demandes de transfert</h1>
          <p class="text-sm text-gray-500 mt-1">
            Vos patients vous demandent d'autoriser le partage de leurs comptes rendus.
          </p>
        </div>
        @if (pendingTransfers().length > 0) {
          <span class="inline-flex items-center gap-1.5 px-3 py-1.5 bg-amber-100 text-amber-800 text-sm font-semibold rounded-full">
            <span class="w-2 h-2 rounded-full bg-amber-500"></span>
            {{ pendingTransfers().length }} en attente
          </span>
        }
      </div>

      @if (loading()) {
        <div class="text-center py-12 text-gray-400">Chargement…</div>
      } @else if (pendingTransfers().length === 0) {
        <div class="bg-white rounded-xl border border-gray-200 p-10 text-center text-gray-400">
          <svg class="w-12 h-12 mx-auto mb-3 opacity-30" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="1.5"
                  d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z"/>
          </svg>
          <p class="font-medium text-gray-500">Aucune demande en attente</p>
        </div>
      } @else {
        <div class="space-y-6">
          @for (t of pendingTransfers(); track t.id) {
            <div class="bg-white rounded-xl border border-gray-200 shadow-sm overflow-hidden">

              <!-- Header de la demande -->
              <div class="px-5 py-4 border-b border-gray-100 bg-amber-50">
                <div class="flex items-start justify-between gap-4">
                  <div>
                    <div class="flex items-center gap-2 mb-1">
                      <svg class="w-4 h-4 text-amber-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2"
                              d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z"/>
                      </svg>
                      <span class="font-semibold text-gray-900">{{ t.patientName }}</span>
                      <span class="text-gray-400 text-sm">souhaite partager son dossier avec</span>
                      <span class="font-semibold text-primary-700">{{ t.targetPractitionerName }}</span>
                    </div>
                    @if (t.patientNote) {
                      <p class="text-sm text-gray-600 italic mt-1 pl-6">"{{ t.patientNote }}"</p>
                    }
                    <p class="text-xs text-gray-400 mt-1 pl-6">Demandé le {{ formatDate(t.createdAt) }}</p>
                  </div>
                  <span class="flex-shrink-0 text-xs px-2.5 py-1 bg-amber-100 text-amber-800 rounded-full font-medium">
                    En attente
                  </span>
                </div>
              </div>

              <!-- Corps : sélection des CR -->
              <div class="p-5">
                @if (loadingReports() === t.id) {
                  <div class="text-center py-4 text-gray-400 text-sm">Chargement des comptes rendus…</div>
                } @else if (selectableReports().has(t.id)) {
                  <div>
                    <div class="flex items-center justify-between mb-3">
                      <h3 class="text-sm font-semibold text-gray-700">
                        Comptes rendus pour {{ t.patientName }}
                      </h3>
                      <div class="flex gap-2">
                        <button (click)="selectAll(t.id)" class="text-xs text-primary-600 hover:underline">Tout sélectionner</button>
                        <span class="text-gray-300">|</span>
                        <button (click)="selectNone(t.id)" class="text-xs text-gray-500 hover:underline">Aucun</button>
                      </div>
                    </div>

                    <div class="space-y-2 max-h-64 overflow-y-auto pr-1">
                      @for (cr of selectableReports().get(t.id)!; track cr.reportId) {
                        <label class="flex items-start gap-3 p-3 rounded-lg border cursor-pointer transition-colors"
                               [class]="cr.selected ? 'border-primary-300 bg-primary-50' : 'border-gray-200 hover:border-gray-300'">
                          <input type="checkbox" [(ngModel)]="cr.selected"
                                 class="mt-0.5 w-4 h-4 text-primary-600 rounded cursor-pointer"/>
                          <div class="flex-1 min-w-0">
                            <p class="text-sm font-medium text-gray-800">
                              {{ formatDate(cr.appointmentDateTime) }}
                            </p>
                            <p class="text-xs text-gray-500 mt-0.5 line-clamp-2">{{ cr.content }}</p>
                          </div>
                        </label>
                      }
                    </div>

                    <p class="text-xs text-gray-400 mt-2">
                      {{ selectedCount(t.id) }} / {{ selectableReports().get(t.id)!.length }} sélectionné{{ selectedCount(t.id) !== 1 ? 's' : '' }}
                    </p>
                  </div>
                } @else {
                  <button (click)="loadSelectableReports(t.id)"
                          class="text-sm text-primary-600 hover:text-primary-700 flex items-center gap-1.5">
                    <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z"/>
                      <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2"
                            d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z"/>
                    </svg>
                    Voir les comptes rendus à partager
                  </button>
                }
              </div>

              <!-- Actions -->
              <div class="px-5 pb-5 flex items-center gap-3">
                @if (errorByTransfer().get(t.id)) {
                  <p class="text-xs text-red-600 flex-1">{{ errorByTransfer().get(t.id) }}</p>
                }
                <div class="ml-auto flex gap-3">
                  <button (click)="rejectTransfer(t.id)"
                          [disabled]="processingId() === t.id"
                          class="btn-secondary text-sm px-4 text-red-600 border-red-200 hover:border-red-300 disabled:opacity-50">
                    Refuser
                  </button>
                  <button (click)="approveTransfer(t)"
                          [disabled]="processingId() === t.id || selectedCount(t.id) === 0"
                          class="btn-primary text-sm px-5 disabled:opacity-50 disabled:cursor-not-allowed">
                    @if (processingId() === t.id) {
                      <app-syli-spinner size="xs" class="mr-2 inline-block align-middle" />
                    }
                    Partager ({{ selectedCount(t.id) }})
                  </button>
                </div>
              </div>
            </div>
          }
        </div>
      }
    </div>
  `
})
export class TransferApprovalsComponent implements OnInit {
  loading = signal(false);
  loadingReports = signal<number | null>(null);
  processingId = signal<number | null>(null);

  pendingTransfers = signal<TransferResponse[]>([]);
  selectableReports = signal<Map<number, SelectableReport[]>>(new Map());
  errorByTransfer = signal<Map<number, string>>(new Map());

  constructor(private transferService: ReportTransferService) {}

  ngOnInit(): void {
    this.loading.set(true);
    this.transferService.getPendingApprovals().subscribe({
      next: list => { this.pendingTransfers.set(list); this.loading.set(false); },
      error: () => this.loading.set(false),
    });
  }

  loadSelectableReports(transferId: number): void {
    this.loadingReports.set(transferId);
    this.transferService.getSelectableReports(transferId).subscribe({
      next: reports => {
        const selectable: SelectableReport[] = reports.map(r => ({ ...r, selected: true }));
        const map = new Map(this.selectableReports());
        map.set(transferId, selectable);
        this.selectableReports.set(map);
        this.loadingReports.set(null);
      },
      error: () => this.loadingReports.set(null),
    });
  }

  selectedCount(transferId: number): number {
    return this.selectableReports().get(transferId)?.filter(r => r.selected).length ?? 0;
  }

  selectAll(transferId: number): void {
    const map = new Map(this.selectableReports());
    map.get(transferId)?.forEach(r => r.selected = true);
    this.selectableReports.set(new Map(map));
  }

  selectNone(transferId: number): void {
    const map = new Map(this.selectableReports());
    map.get(transferId)?.forEach(r => r.selected = false);
    this.selectableReports.set(new Map(map));
  }

  approveTransfer(transfer: TransferResponse): void {
    const selected = this.selectableReports().get(transfer.id)?.filter(r => r.selected).map(r => r.reportId);
    if (!selected || selected.length === 0) return;

    this.processingId.set(transfer.id);
    this.transferService.approveTransfer(transfer.id, { reportIds: selected }).subscribe({
      next: () => {
        this.processingId.set(null);
        this.pendingTransfers.update(list => list.filter(t => t.id !== transfer.id));
      },
      error: (err) => {
        const errMap = new Map(this.errorByTransfer());
        errMap.set(transfer.id, err?.error?.message ?? 'Erreur lors de l\'approbation');
        this.errorByTransfer.set(errMap);
        this.processingId.set(null);
      },
    });
  }

  rejectTransfer(transferId: number): void {
    this.processingId.set(transferId);
    this.transferService.rejectTransfer(transferId).subscribe({
      next: () => {
        this.processingId.set(null);
        this.pendingTransfers.update(list => list.filter(t => t.id !== transferId));
      },
      error: () => this.processingId.set(null),
    });
  }

  formatDate(s: string): string { return formatLocalDateTime(s); }
}
