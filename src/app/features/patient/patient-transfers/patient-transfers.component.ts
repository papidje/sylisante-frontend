import { Component, OnInit, signal, computed } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { RouterLink } from '@angular/router';
import { ReportTransferService } from '../../../core/services/report-transfer.service';
import { AppointmentService } from '../../../core/services/appointment.service';
import { PractitionerService } from '../../../core/services/practitioner.service';
import {
  TransferResponse,
  TRANSFER_STATUS_LABELS,
  TRANSFER_STATUS_COLORS,
  TransferStatus,
} from '../../../core/models/transfer.model';
import { AppointmentResponse } from '../../../core/models/appointment.model';
import { PractitionerProfileDto } from '../../../core/models/practitioner.model';
import { formatLocalDateTime } from '../../../core/utils/date-utils';
import { SyliSpinnerComponent } from '../../../shared/components/syli-spinner/syli-spinner.component';

@Component({
  selector: 'app-patient-transfers',
  standalone: true,
  imports: [  FormsModule, RouterLink, SyliSpinnerComponent],
  template: `
    <div class="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      <div class="mb-6">
        <h1 class="text-2xl font-bold text-gray-900">Transfert de dossier médical</h1>
        <p class="text-sm text-gray-500 mt-1">
          Autorisez un praticien à consulter vos comptes rendus rédigés par un autre médecin.
        </p>
      </div>

      <!-- Tabs -->
      <div class="border-b border-gray-200 mb-6">
        <nav class="flex gap-1">
          @for (tab of tabs; track tab.id) {
            <button (click)="activeTab.set(tab.id)"
                    class="px-4 py-2.5 text-sm font-medium border-b-2 transition-colors"
                    [class]="activeTab() === tab.id
                      ? 'border-primary-600 text-primary-700'
                      : 'border-transparent text-gray-500 hover:text-gray-700'">
              {{ tab.label }}
              @if (tab.id === 'history' && transfers().length > 0) {
                <span class="ml-1.5 inline-flex items-center justify-center w-5 h-5 bg-gray-100 text-gray-600 text-xs rounded-full">
                  {{ transfers().length }}
                </span>
              }
            </button>
          }
        </nav>
      </div>

      <!-- Tab: Nouvelle demande -->
      @if (activeTab() === 'new') {
        <div class="bg-white rounded-xl border border-gray-200 shadow-sm p-6">
          <h2 class="text-lg font-semibold text-gray-900 mb-4">Nouvelle demande de transfert</h2>

          @if (error()) {
            <div class="mb-4 p-3 bg-red-50 border border-red-200 rounded-lg text-sm text-red-700">{{ error() }}</div>
          }
          @if (success()) {
            <div class="mb-4 p-3 bg-sky-50 border border-sky-200 rounded-lg text-sm text-sky-700">{{ success() }}</div>
          }

          <div class="space-y-5">
            <!-- Praticien source -->
            <div>
              <label class="block text-sm font-medium text-gray-700 mb-1.5">
                Praticien source
                <span class="text-red-500">*</span>
              </label>
              <p class="text-xs text-gray-500 mb-2">Le médecin qui a rédigé les comptes rendus à transférer</p>
              <select [(ngModel)]="form.sourcePractitionerId"
                      class="w-full border border-gray-300 rounded-lg px-3 py-2.5 text-sm focus:ring-2 focus:ring-primary-500 focus:border-transparent">
                <option [ngValue]="null">-- Sélectionner un praticien --</option>
                @for (p of sourcePractitioners(); track p.userId) {
                  <option [ngValue]="p.userId">Dr. {{ p.firstName }} {{ p.lastName }}{{ p.speciality ? ' — ' + p.speciality : '' }}</option>
                }
              </select>
              @if (sourcePractitioners().length === 0 && !loadingSource()) {
                <p class="text-xs text-amber-600 mt-1">Vous n'avez aucun rendez-vous avec un praticien enregistré.</p>
              }
            </div>

            <!-- Praticien cible -->
            <div>
              <label class="block text-sm font-medium text-gray-700 mb-1.5">
                Praticien destinataire
                <span class="text-red-500">*</span>
              </label>
              <p class="text-xs text-gray-500 mb-2">Le médecin qui recevra l'accès aux comptes rendus</p>
              <select [(ngModel)]="form.targetPractitionerId"
                      class="w-full border border-gray-300 rounded-lg px-3 py-2.5 text-sm focus:ring-2 focus:ring-primary-500 focus:border-transparent">
                <option [ngValue]="null">-- Sélectionner un praticien --</option>
                @for (p of targetPractitioners(); track p.userId) {
                  <option [ngValue]="p.userId">Dr. {{ p.firstName }} {{ p.lastName }}{{ p.speciality ? ' — ' + p.speciality : '' }}</option>
                }
              </select>
            </div>

            <!-- Note patient (optionnelle) -->
            <div>
              <label class="block text-sm font-medium text-gray-700 mb-1.5">
                Message au praticien source
                <span class="text-xs text-gray-400 font-normal">(optionnel)</span>
              </label>
              <textarea [(ngModel)]="form.patientNote" rows="3"
                        placeholder="Expliquez pourquoi vous souhaitez ce transfert…"
                        class="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-primary-500 resize-none"></textarea>
            </div>

            <div class="bg-blue-50 border border-blue-200 rounded-lg p-3 text-xs text-blue-700">
              <strong>Comment ça marche :</strong> Votre demande sera transmise à Dr. 
              {{ sourcePractitionerName() || '(source)' }} qui choisira quels comptes rendus partager.
              Dr. {{ targetPractitionerName() || '(destinataire)' }} pourra ensuite les consulter.
            </div>

            <button (click)="submitTransfer()"
                    [disabled]="submitting() || !form.sourcePractitionerId || !form.targetPractitionerId"
                    class="w-full btn-primary py-2.5 disabled:opacity-50 disabled:cursor-not-allowed">
              @if (submitting()) {
                <app-syli-spinner size="xs" class="mr-2 inline-block align-middle" />
              }
              Envoyer la demande de transfert
            </button>
          </div>
        </div>
      }

      <!-- Tab: Historique -->
      @if (activeTab() === 'history') {
        <div class="space-y-4">
          @if (loadingTransfers()) {
            <div class="text-center py-8 text-gray-400">Chargement…</div>
          } @else if (transfers().length === 0) {
            <div class="bg-white rounded-xl border border-gray-200 p-8 text-center text-gray-400">
              <svg class="w-10 h-10 mx-auto mb-2 opacity-30" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="1.5"
                      d="M8 7h12m0 0l-4-4m4 4l-4 4m0 6H4m0 0l4 4m-4-4l4-4"/>
              </svg>
              <p class="font-medium">Aucune demande de transfert</p>
            </div>
          } @else {
            @for (t of transfers(); track t.id) {
              <div class="bg-white rounded-xl border border-gray-200 shadow-sm p-5">
                <div class="flex items-start justify-between gap-4">
                  <div class="flex-1 min-w-0">
                    <div class="flex items-center gap-2 mb-1">
                      <span class="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-semibold"
                            [class]="statusColor(t.status)">
                        {{ statusLabel(t.status) }}
                      </span>
                      <span class="text-xs text-gray-400">{{ formatDate(t.createdAt) }}</span>
                    </div>

                    <div class="flex items-center gap-2 text-sm text-gray-700 mt-2">
                      <span class="font-medium">{{ t.sourcePractitionerName }}</span>
                      <svg class="w-4 h-4 text-gray-400 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M17 8l4 4m0 0l-4 4m4-4H3"/>
                      </svg>
                      <span class="font-medium">{{ t.targetPractitionerName }}</span>
                    </div>

                    @if (t.patientNote) {
                      <p class="text-xs text-gray-500 mt-1 italic">{{ t.patientNote }}</p>
                    }

                    @if (t.status === 'APPROVED') {
                      <p class="text-xs text-sky-700 mt-1">
                        {{ t.itemCount }} compte{{ t.itemCount !== 1 ? 's' : '' }} rendu{{ t.itemCount !== 1 ? 's' : '' }} partagé{{ t.itemCount !== 1 ? 's' : '' }}
                      </p>
                    }
                  </div>

                  @if (t.status === 'PENDING_SOURCE_APPROVAL') {
                    <button (click)="cancelTransfer(t.id)"
                            [disabled]="canceling() === t.id"
                            class="flex-shrink-0 text-xs text-red-600 hover:text-red-700 border border-red-200 hover:border-red-300 px-3 py-1.5 rounded-lg transition-colors disabled:opacity-50">
                      Annuler
                    </button>
                  }
                </div>
              </div>
            }
          }
        </div>
      }
    </div>
  `
})
export class PatientTransfersComponent implements OnInit {
  activeTab = signal<'new' | 'history'>('new');
  tabs = [
    { id: 'new' as const, label: 'Nouvelle demande' },
    { id: 'history' as const, label: 'Mes demandes' },
  ];

  transfers = signal<TransferResponse[]>([]);
  allPractitioners = signal<PractitionerProfileDto[]>([]);
  patientAppointments = signal<AppointmentResponse[]>([]);

  loadingSource = signal(false);
  loadingTransfers = signal(false);
  submitting = signal(false);
  canceling = signal<number | null>(null);
  error = signal('');
  success = signal('');

  form: { sourcePractitionerId: number | null; targetPractitionerId: number | null; patientNote: string } = {
    sourcePractitionerId: null,
    targetPractitionerId: null,
    patientNote: '',
  };

  /** Praticiens avec qui le patient a eu un RDV (source potentielle). */
  sourcePractitioners = computed<PractitionerProfileDto[]>(() => {
    const appts = this.patientAppointments();
    const allPract = this.allPractitioners();
    const uniqueIds = new Set(appts.map(a => a.practitionerId));
    return allPract.filter(p => uniqueIds.has(p.userId));
  });

  /** Tous les praticiens sauf celui sélectionné en source. */
  targetPractitioners = computed<PractitionerProfileDto[]>(() => {
    const src = this.form.sourcePractitionerId;
    return this.allPractitioners().filter(p => p.userId !== src);
  });

  sourcePractitionerName = computed(() => {
    const p = this.allPractitioners().find(x => x.userId === this.form.sourcePractitionerId);
    return p ? `Dr. ${p.firstName} ${p.lastName}` : '';
  });

  targetPractitionerName = computed(() => {
    const p = this.allPractitioners().find(x => x.userId === this.form.targetPractitionerId);
    return p ? `Dr. ${p.firstName} ${p.lastName}` : '';
  });

  constructor(
    private transferService: ReportTransferService,
    private appointmentService: AppointmentService,
    private practitionerService: PractitionerService
  ) {}

  ngOnInit(): void {
    this.loadData();
  }

  private loadData(): void {
    this.loadingSource.set(true);
    this.loadingTransfers.set(true);

    this.practitionerService.getAllPractitioners().subscribe(list => {
      this.allPractitioners.set(list);
      this.loadingSource.set(false);
    });

    this.appointmentService.getMyAppointments().subscribe(appts => {
      this.patientAppointments.set(appts);
    });

    this.transferService.getMyTransfers().subscribe({
      next: list => { this.transfers.set(list); this.loadingTransfers.set(false); },
      error: () => this.loadingTransfers.set(false),
    });
  }

  submitTransfer(): void {
    this.error.set('');
    this.success.set('');
    if (!this.form.sourcePractitionerId || !this.form.targetPractitionerId) return;

    this.submitting.set(true);
    this.transferService.initiateTransfer({
      sourcePractitionerId: this.form.sourcePractitionerId,
      targetPractitionerId: this.form.targetPractitionerId,
      patientNote: this.form.patientNote || undefined,
    }).subscribe({
      next: () => {
        this.success.set('Demande envoyée ! Le praticien source sera notifié.');
        this.form = { sourcePractitionerId: null, targetPractitionerId: null, patientNote: '' };
        this.submitting.set(false);
        this.transferService.getMyTransfers().subscribe(list => this.transfers.set(list));
        setTimeout(() => this.activeTab.set('history'), 1500);
      },
      error: (err) => {
        this.error.set(err?.error?.message ?? 'Une erreur est survenue.');
        this.submitting.set(false);
      },
    });
  }

  cancelTransfer(id: number): void {
    this.canceling.set(id);
    this.transferService.cancelTransfer(id).subscribe({
      next: () => {
        this.canceling.set(null);
        this.transferService.getMyTransfers().subscribe(list => this.transfers.set(list));
      },
      error: () => this.canceling.set(null),
    });
  }

  formatDate(s: string): string { return formatLocalDateTime(s); }
  statusLabel(s: TransferStatus): string { return TRANSFER_STATUS_LABELS[s]; }
  statusColor(s: TransferStatus): string { return TRANSFER_STATUS_COLORS[s]; }
}
