import { Component, OnInit, signal, computed } from '@angular/core';
import { ReportTransferService } from '../../../core/services/report-transfer.service';
import {
  TransferResponse,
  SharedReportDto,
} from '../../../core/models/transfer.model';
import { formatLocalDateTime } from '../../../core/utils/date-utils';

@Component({
  selector: 'app-shared-records',
  standalone: true,
  imports: [],
  template: `
    <div class="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      <div class="mb-6">
        <h1 class="text-2xl font-bold text-gray-900">Dossiers partagés</h1>
        <p class="text-sm text-gray-500 mt-1">
          Comptes rendus de confrères transmis par leurs patients via transfert sécurisé.
        </p>
      </div>

      <!-- Avertissement légal -->
      <div class="mb-6 flex gap-3 p-3 bg-blue-50 border border-blue-200 rounded-lg text-xs text-blue-700">
        <svg class="w-4 h-4 flex-shrink-0 mt-0.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2"
                d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z"/>
        </svg>
        Ces comptes rendus vous ont été transmis avec le consentement explicite du patient.
        Ils sont accessibles en lecture seule et ne peuvent pas être modifiés.
      </div>

      @if (loading()) {
        <div class="text-center py-12 text-gray-400">Chargement…</div>
      } @else if (transfers().length === 0) {
        <div class="bg-white rounded-xl border border-gray-200 p-10 text-center text-gray-400">
          <svg class="w-12 h-12 mx-auto mb-3 opacity-30" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="1.5"
                  d="M8 7h12m0 0l-4-4m4 4l-4 4m0 6H4m0 0l4 4m-4-4l4-4"/>
          </svg>
          <p class="font-medium text-gray-500">Aucun dossier partagé pour le moment</p>
          <p class="text-xs mt-1">Les transferts approuvés par vos confrères apparaîtront ici.</p>
        </div>
      } @else {
        <div class="space-y-6">
          @for (t of transfers(); track t.id) {
            <div class="bg-white rounded-xl border border-gray-200 shadow-sm overflow-hidden">

              <!-- En-tête du transfert -->
              <div class="px-5 py-4 border-b border-gray-100 flex items-center justify-between bg-gray-50">
                <div>
                  <div class="flex items-center gap-3">
                    <div class="w-9 h-9 rounded-full bg-primary-100 flex items-center justify-center text-primary-700 font-bold text-sm">
                      {{ t.patientName[0] }}
                    </div>
                    <div>
                      <p class="font-semibold text-gray-900">{{ t.patientName }}</p>
                      <p class="text-xs text-gray-500">Transmis par {{ t.sourcePractitionerName }}</p>
                    </div>
                  </div>
                </div>
                <div class="text-right">
                  <p class="text-xs text-gray-400">{{ formatDate(t.createdAt) }}</p>
                  <p class="text-xs text-sky-700 font-medium mt-0.5">
                    {{ t.itemCount }} CR partagé{{ t.itemCount !== 1 ? 's' : '' }}
                  </p>
                </div>
              </div>

              <!-- Liste des CR -->
              @if (loadingDetails() === t.id) {
                <div class="p-4 text-center text-gray-400 text-sm">Chargement…</div>
              } @else if (reportsByTransfer().has(t.id)) {
                <div class="divide-y divide-gray-50">
                  @for (cr of reportsByTransfer().get(t.id)!; track cr.reportId) {
                    <div class="px-5 py-4">
                      <div class="flex items-start gap-3">
                        <div class="flex-shrink-0 mt-1 w-2 h-2 rounded-full bg-primary-400"></div>
                        <div class="flex-1 min-w-0">
                          <div class="flex items-center gap-3 mb-1.5">
                            <span class="text-sm font-medium text-gray-800">
                              Consultation du {{ formatDate(cr.appointmentDateTime) }}
                            </span>
                            <span class="text-xs text-gray-400 bg-gray-100 px-2 py-0.5 rounded-full">
                              {{ cr.sourcePractitionerName }}
                            </span>
                          </div>
                          <p class="text-sm text-gray-700 whitespace-pre-wrap">{{ cr.content }}</p>
                          <p class="text-xs text-gray-400 mt-1.5">Rédigé le {{ formatDateShort(cr.createdAt) }}</p>
                        </div>
                      </div>
                    </div>
                  }
                </div>
              } @else {
                <div class="px-5 py-3">
                  <button (click)="loadDetails(t.id)"
                          class="text-sm text-primary-600 hover:text-primary-700 flex items-center gap-1.5">
                    <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2"
                            d="M19 9l-7 7-7-7"/>
                    </svg>
                    Afficher les {{ t.itemCount }} compte{{ t.itemCount !== 1 ? 's' : '' }} rendu{{ t.itemCount !== 1 ? 's' : '' }}
                  </button>
                </div>
              }
            </div>
          }
        </div>
      }
    </div>
  `
})
export class SharedRecordsComponent implements OnInit {
  loading = signal(false);
  loadingDetails = signal<number | null>(null);

  transfers = signal<TransferResponse[]>([]);
  reportsByTransfer = signal<Map<number, SharedReportDto[]>>(new Map());

  constructor(private transferService: ReportTransferService) {}

  ngOnInit(): void {
    this.loading.set(true);
    this.transferService.getReceivedTransfers().subscribe({
      next: list => { this.transfers.set(list); this.loading.set(false); },
      error: () => this.loading.set(false),
    });
  }

  loadDetails(transferId: number): void {
    this.loadingDetails.set(transferId);
    this.transferService.getTransferDetails(transferId).subscribe({
      next: t => {
        const map = new Map(this.reportsByTransfer());
        map.set(transferId, t.sharedReports);
        this.reportsByTransfer.set(map);
        this.loadingDetails.set(null);
      },
      error: () => this.loadingDetails.set(null),
    });
  }

  formatDate(s: string): string { return formatLocalDateTime(s); }
  formatDateShort(s: string | null | undefined): string {
    if (!s) return '';
    return s.split('T')[0].split('-').reverse().join('/');
  }
}
