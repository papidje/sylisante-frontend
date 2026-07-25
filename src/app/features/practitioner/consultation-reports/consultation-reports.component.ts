import { Component, OnInit, signal, computed } from '@angular/core';
import { ActivatedRoute } from '@angular/router';
import { CommonModule } from '@angular/common';
import { FormsModule, ReactiveFormsModule, FormBuilder, FormGroup, Validators } from '@angular/forms';
import { HttpErrorResponse } from '@angular/common/http';
import { ConsultationReportService, ConsultationReportDto } from '../../../core/services/consultation-report.service';
import { AppointmentService } from '../../../core/services/appointment.service';
import { AppointmentResponse, APPOINTMENT_STATUS_LABELS } from '../../../core/models/appointment.model';
import { formatLocalDateTime, parseLocalDateTime } from '../../../core/utils/date-utils';
import { SyliSpinnerComponent } from '../../../shared/components/syli-spinner/syli-spinner.component';

interface PatientGroup {
  patientId: number;
  patientName: string;
  reports: ConsultationReportDto[];
}

type ViewMode = 'list' | 'patient-history' | 'new-report';

@Component({
  selector: 'app-consultation-reports',
  standalone: true,
  imports: [  CommonModule, FormsModule, ReactiveFormsModule, SyliSpinnerComponent],
  template: `
    <div class="max-w-5xl mx-auto px-4 py-8">

      <!-- En-tête -->
      <div class="mb-6">
        <h1 class="text-2xl font-bold text-gray-900">Dossiers médicaux & Comptes rendus</h1>
        <p class="text-gray-500 mt-1 text-sm">
          Vos notes de consultation, regroupées par patient.
          <span class="text-amber-700 font-medium ml-1">
            🔒 Cloisonnement strict — vous ne voyez que vos propres comptes rendus.
          </span>
        </p>
      </div>

      @if (successMessage()) {
        <div class="bg-sky-50 border border-sky-200 rounded-lg p-4 mb-5 flex items-center gap-2">
          <svg class="w-5 h-5 text-sky-600 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M5 13l4 4L19 7"/>
          </svg>
          <p class="text-sm text-sky-700">{{ successMessage() }}</p>
        </div>
      }
      @if (errorMessage()) {
        <div class="bg-red-50 border border-red-200 rounded-lg p-4 mb-5">
          <p class="text-sm text-red-700">{{ errorMessage() }}</p>
        </div>
      }

      <!-- Navigation -->
      <div class="flex flex-wrap gap-2 mb-6">
        <button (click)="setView('list')"
                class="px-4 py-2 rounded-xl text-sm font-medium border transition-all"
                [class.bg-primary-600]="viewMode() === 'list'"
                [class.text-white]="viewMode() === 'list'"
                [class.border-primary-600]="viewMode() === 'list'"
                [class.bg-white]="viewMode() !== 'list'"
                [class.text-gray-700]="viewMode() !== 'list'"
                [class.border-gray-200]="viewMode() !== 'list'">
          Mes patients
          @if (patientGroups().length > 0) {
            <span class="ml-1.5 bg-white/30 text-current rounded-full px-1.5 py-0.5 text-xs">
              {{ patientGroups().length }}
            </span>
          }
        </button>

        <button (click)="setView('new-report')"
                class="px-4 py-2 rounded-xl text-sm font-medium border transition-all"
                [class.bg-primary-600]="viewMode() === 'new-report'"
                [class.text-white]="viewMode() === 'new-report'"
                [class.border-primary-600]="viewMode() === 'new-report'"
                [class.bg-white]="viewMode() !== 'new-report'"
                [class.text-gray-700]="viewMode() !== 'new-report'"
                [class.border-gray-200]="viewMode() !== 'new-report'">
          + Nouveau compte rendu
          @if (appointmentsWithoutReport().length > 0) {
            <span class="ml-1.5 bg-white/30 text-current rounded-full px-1.5 py-0.5 text-xs">
              {{ appointmentsWithoutReport().length }}
            </span>
          }
        </button>

        @if (viewMode() === 'patient-history') {
          <span class="px-4 py-2 rounded-xl text-sm font-medium bg-blue-100 text-blue-800 border border-blue-200">
            Historique : {{ selectedPatientName() }}
          </span>
        }
      </div>

      <!-- ════════════ VUE : Mes patients (regroupés) ════════════ -->
      @if (viewMode() === 'list') {
        @if (loadingReports()) {
          <app-syli-spinner size="md" [showLabel]="true" [centered]="true" />
        } @else if (patientGroups().length === 0) {
          <div class="card text-center py-12 text-gray-400">
            <svg class="w-10 h-10 mx-auto mb-2 text-gray-300" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="1.5"
                    d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"/>
            </svg>
            <p class="font-medium">Aucun compte rendu rédigé</p>
            <p class="text-sm mt-1">Créez votre premier compte rendu via le bouton ci-dessus.</p>
          </div>
        } @else {
          <div class="space-y-4">
            @for (group of patientGroups(); track group.patientId) {
              <div class="card hover:shadow-md transition-shadow cursor-pointer"
                   (click)="viewPatientHistory(group.patientId, group.patientName)">
                <div class="flex items-center justify-between gap-4">
                  <div class="flex items-center gap-3">
                    <div class="w-10 h-10 rounded-full bg-primary-100 flex items-center justify-center
                                text-primary-700 font-bold text-sm flex-shrink-0">
                      {{ group.patientName.charAt(0) }}
                    </div>
                    <div>
                      <p class="font-semibold text-gray-900">{{ group.patientName }}</p>
                      <p class="text-xs text-gray-500 mt-0.5">
                        {{ group.reports.length }} consultation{{ group.reports.length > 1 ? 's' : '' }} ·
                        Dernière : {{ formatDate(group.reports[0].appointmentDateTime) }}
                      </p>
                    </div>
                  </div>
                  <div class="flex items-center gap-2 flex-shrink-0">
                    <span class="text-xs bg-primary-100 text-primary-700 font-semibold
                                 px-2.5 py-1 rounded-full">
                      {{ group.reports.length }} CR
                    </span>
                    <svg class="w-4 h-4 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 5l7 7-7 7"/>
                    </svg>
                  </div>
                </div>
                <!-- Aperçu du dernier compte rendu -->
                <p class="text-sm text-gray-500 mt-3 line-clamp-2 leading-relaxed pl-13">
                  {{ group.reports[0].content }}
                </p>
              </div>
            }
          </div>
        }
      }

      <!-- ════════════ VUE : Historique d'un patient ════════════ -->
      @if (viewMode() === 'patient-history') {
        <div>
          <div class="mb-6 flex items-center justify-between">
            <div>
              <h3 class="text-lg font-semibold text-gray-900">{{ selectedPatientName() }}</h3>
              <p class="text-sm text-gray-500 mt-0.5">
                {{ patientReports().length }} consultation{{ patientReports().length > 1 ? 's' : '' }},
                dans l'ordre chronologique
              </p>
            </div>
            <button (click)="setView('list')" class="btn-secondary text-sm py-1.5">← Retour</button>
          </div>

          @if (loadingPatientHistory()) {
            <app-syli-spinner size="sm" [showLabel]="true" [centered]="true" />
          } @else if (patientReports().length === 0) {
            <div class="card text-center py-8 text-gray-400">Aucun compte rendu pour ce patient.</div>
          } @else {
            <div class="relative">
              <!-- Ligne verticale de timeline -->
              <div class="absolute left-4 top-0 bottom-0 w-0.5 bg-gray-200"></div>
              <div class="space-y-6">
                @for (report of patientReports(); track report.id; let i = $index) {
                  <div class="relative pl-12">
                    <!-- Numéro de consultation sur la timeline -->
                    <div class="absolute left-0 w-8 h-8 rounded-full bg-primary-600 text-white
                                flex items-center justify-center text-xs font-bold z-10">
                      {{ i + 1 }}
                    </div>

                    <div class="card">
                      <div class="flex items-start justify-between gap-3 mb-3">
                        <div>
                          <p class="text-sm font-semibold text-gray-900">
                            Consultation #{{ i + 1 }}
                          </p>
                          <p class="text-xs text-gray-400 mt-0.5">
                            {{ formatDate(report.appointmentDateTime) }} · rédigé le {{ formatDate(report.createdAt) }}
                          </p>
                        </div>
                        @if (editingReportId() !== report.id) {
                          <button (click)="startEdit(report)"
                                  class="text-xs text-primary-600 font-medium hover:text-primary-700
                                         flex items-center gap-1 flex-shrink-0">
                            <svg class="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2"
                                    d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z"/>
                            </svg>
                            Modifier
                          </button>
                        }
                      </div>

                      @if (editingReportId() === report.id) {
                        <!-- Mode édition -->
                        <textarea [(ngModel)]="editContent"
                                  rows="8"
                                  class="input-field resize-y w-full min-h-[160px] text-sm"
                                  placeholder="Contenu du compte rendu..."></textarea>
                        <div class="flex items-center gap-2 mt-3">
                          <button (click)="saveEdit(report.id)"
                                  [disabled]="editContent.trim().length < 10 || savingEdit()"
                                  class="btn-success text-sm px-4 py-1.5">
                            @if (savingEdit()) { Enregistrement... } @else { Enregistrer }
                          </button>
                          <button (click)="cancelEdit()" class="btn-secondary text-sm px-4 py-1.5">
                            Annuler
                          </button>
                          <span class="text-xs text-gray-400 ml-auto">{{ editContent.length }} / 10 000</span>
                        </div>
                      } @else {
                        <!-- Mode lecture -->
                        <p class="text-sm text-gray-800 leading-relaxed whitespace-pre-line">
                          {{ report.content }}
                        </p>
                      }
                    </div>
                  </div>
                }
              </div>
            </div>
          }
        </div>
      }

      <!-- ════════════ VUE : Nouveau compte rendu ════════════ -->
      @if (viewMode() === 'new-report') {
        <div class="grid md:grid-cols-2 gap-6 items-start">

          <!-- Sélection du RDV (sans compte rendu existant) -->
          <div class="card">
            <h3 class="text-base font-semibold text-gray-900 mb-1">Choisir le rendez-vous</h3>
            <p class="text-xs text-gray-400 mb-4">
              Seuls les RDV sans compte rendu sont affichés.
              Les autres sont consultables dans l'historique patient.
            </p>

            @if (loadingAppointments()) {
              <app-syli-spinner size="sm" [showLabel]="true" [centered]="true" />
            } @else if (appointmentsWithoutReport().length === 0) {
              <div class="text-center py-6 text-sm text-gray-400">
                <svg class="w-8 h-8 mx-auto mb-2 text-gray-300" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path stroke-linecap="round" stroke-linejoin="round" stroke-width="1.5" d="M5 13l4 4L19 7"/>
                </svg>
                Tous les rendez-vous ont déjà un compte rendu.
              </div>
            } @else {
              <div class="space-y-2 overflow-y-auto max-h-96">
                @for (appt of appointmentsWithoutReport(); track appt.id) {
                  <button (click)="selectAppointment(appt)"
                          class="w-full text-left p-3 rounded-xl border-2 transition-all text-sm"
                          [class.border-primary-500]="selectedAppointment()?.id === appt.id"
                          [class.bg-primary-50]="selectedAppointment()?.id === appt.id"
                          [class.border-gray-100]="selectedAppointment()?.id !== appt.id"
                          [class.hover:border-gray-300]="selectedAppointment()?.id !== appt.id">
                    <p class="font-semibold text-gray-900">
                      {{ appt.patientFirstName }} {{ appt.patientLastName }}
                    </p>
                    <p class="text-gray-500 text-xs mt-0.5">{{ formatDate(appt.appointmentDateTime) }}</p>
                    <span class="inline-block mt-1 px-2 py-0.5 rounded-full text-xs font-medium"
                          [class.bg-primary-100]="appt.status === 'CONFIRMED'"
                          [class.text-sky-800]="appt.status === 'CONFIRMED'"
                          [class.bg-blue-100]="appt.status === 'COMPLETED'"
                          [class.text-blue-800]="appt.status === 'COMPLETED'">
                      {{ statusLabels[appt.status] ?? appt.status }}
                    </span>
                  </button>
                }
              </div>
            }
          </div>

          <!-- Éditeur -->
          <div class="card">
            <h3 class="text-base font-semibold text-gray-900 mb-4">Compte rendu clinique</h3>
            @if (!selectedAppointment()) {
              <div class="text-center py-8 text-sm text-gray-400">
                Sélectionnez un rendez-vous pour rédiger le compte rendu.
              </div>
            } @else {
              <div class="mb-4 p-3 bg-blue-50 rounded-xl border border-blue-100">
                <p class="text-sm font-semibold text-blue-900">
                  {{ selectedAppointment()!.patientFirstName }} {{ selectedAppointment()!.patientLastName }}
                </p>
                <p class="text-xs text-blue-600 mt-0.5">
                  {{ formatDate(selectedAppointment()!.appointmentDateTime) }}
                </p>
              </div>
              <form [formGroup]="reportForm" (ngSubmit)="submitReport()">
                <label for="content" class="block text-sm font-medium text-gray-700 mb-1">
                  Contenu <span class="text-red-500">*</span>
                </label>
                <textarea id="content" formControlName="content" rows="10"
                          class="input-field resize-y min-h-[200px]"
                          placeholder="Motif de consultation, examen clinique, diagnostic, traitement prescrit, suivi préconisé..."></textarea>
                <div class="flex items-center justify-between mt-1">
                  @if (reportForm.get('content')?.invalid && reportForm.get('content')?.touched) {
                    <p class="text-xs text-red-600">Min. 10 caractères requis.</p>
                  } @else { <span></span> }
                  <span class="text-xs text-gray-400">
                    {{ (reportForm.get('content')?.value || '').length }} / 10 000
                  </span>
                </div>
                <button type="submit" [disabled]="reportForm.invalid || saving()" class="btn-success w-full mt-4">
                  @if (saving()) { Enregistrement... } @else { Enregistrer le compte rendu }
                </button>
              </form>
            }
          </div>
        </div>
      }
    </div>
  `,
})
export class ConsultationReportsComponent implements OnInit {
  viewMode = signal<ViewMode>('list');

  // Tous mes comptes rendus (pour la vue liste)
  reports = signal<ConsultationReportDto[]>([]);
  loadingReports = signal(true);

  // Historique d'un patient
  patientReports = signal<ConsultationReportDto[]>([]);
  loadingPatientHistory = signal(false);
  selectedPatientName = signal('');
  selectedPatientId = signal<number | null>(null);

  // Édition inline
  editingReportId = signal<number | null>(null);
  editContent = '';
  savingEdit = signal(false);

  // Nouveau compte rendu
  eligibleAppointments = signal<AppointmentResponse[]>([]);
  loadingAppointments = signal(false);
  selectedAppointment = signal<AppointmentResponse | null>(null);
  saving = signal(false);

  successMessage = signal('');
  errorMessage = signal('');

  readonly statusLabels = APPOINTMENT_STATUS_LABELS;
  reportForm: FormGroup;

  /** IDs des RDV qui possèdent déjà un compte rendu (calculé depuis reports()) */
  readonly appointmentIdsWithReport = computed<Set<number>>(() =>
    new Set(this.reports().map(r => r.appointmentId))
  );

  /** Groupement des comptes rendus par patient, triés par dernière consultation DESC */
  readonly patientGroups = computed<PatientGroup[]>(() => {
    const map = new Map<number, PatientGroup>();
    for (const r of this.reports()) {
      if (!map.has(r.patientId)) {
        map.set(r.patientId, { patientId: r.patientId, patientName: r.patientName, reports: [] });
      }
      map.get(r.patientId)!.reports.push(r);
    }
    for (const group of map.values()) {
      group.reports.sort((a, b) =>
        parseLocalDateTime(b.appointmentDateTime).getTime() -
        parseLocalDateTime(a.appointmentDateTime).getTime()
      );
    }
    return Array.from(map.values())
      .sort((a, b) =>
        parseLocalDateTime(b.reports[0].appointmentDateTime).getTime() -
        parseLocalDateTime(a.reports[0].appointmentDateTime).getTime()
      );
  });

  /** RDV éligibles sans compte rendu existant */
  readonly appointmentsWithoutReport = computed<AppointmentResponse[]>(() =>
    this.eligibleAppointments().filter(a => !this.appointmentIdsWithReport().has(a.id))
  );

  constructor(
    private fb: FormBuilder,
    private route: ActivatedRoute,
    private reportService: ConsultationReportService,
    private appointmentService: AppointmentService
  ) {
    this.reportForm = this.fb.group({
      content: ['', [Validators.required, Validators.minLength(10), Validators.maxLength(10000)]],
    });
  }

  ngOnInit(): void {
    // Charger simultanément rapports et rendez-vous éligibles
    Promise.all([this.doLoadReports(), this.doLoadEligibleAppointments()]).then(() => {
      // Traiter le deep-link ?appointmentId=X une fois les données disponibles
      const id = Number(this.route.snapshot.queryParams['appointmentId']);
      if (id) { this.handleDeepLink(id); }
    });
  }

  private handleDeepLink(appointmentId: number): void {
    // Chercher si un rapport existe déjà pour ce RDV
    const existingReport = this.reports().find(r => r.appointmentId === appointmentId);
    if (existingReport) {
      // Rediriger vers l'historique du patient concerné
      this.viewPatientHistory(existingReport.patientId, existingReport.patientName);
    } else {
      // Pré-sélectionner le RDV dans le formulaire de création
      this.setView('new-report');
      const appt = this.eligibleAppointments().find(a => a.id === appointmentId);
      if (appt) { this.selectAppointment(appt); }
    }
  }

  setView(view: ViewMode): void {
    this.viewMode.set(view);
    this.errorMessage.set('');
    this.successMessage.set('');
    this.editingReportId.set(null);
  }

  viewPatientHistory(patientId: number, patientName: string): void {
    this.selectedPatientName.set(patientName);
    this.selectedPatientId.set(patientId);
    this.viewMode.set('patient-history');
    this.loadingPatientHistory.set(true);
    this.reportService.getReportsForPatient(patientId).subscribe({
      next: (data) => {
        this.patientReports.set(data);
        this.loadingPatientHistory.set(false);
      },
      error: () => this.loadingPatientHistory.set(false),
    });
  }

  selectAppointment(appt: AppointmentResponse): void {
    this.selectedAppointment.set(appt);
    this.reportForm.reset({ content: '' });
    this.errorMessage.set('');
  }

  startEdit(report: ConsultationReportDto): void {
    this.editingReportId.set(report.id);
    this.editContent = report.content;
    this.errorMessage.set('');
  }

  cancelEdit(): void {
    this.editingReportId.set(null);
    this.editContent = '';
  }

  saveEdit(reportId: number): void {
    if (this.editContent.trim().length < 10 || this.savingEdit()) return;
    this.savingEdit.set(true);
    this.reportService.updateReport(reportId, this.editContent.trim()).subscribe({
      next: (updated) => {
        // Mettre à jour dans la liste globale et dans l'historique patient
        this.reports.update(list =>
          list.map(r => r.id === updated.id ? updated : r)
        );
        this.patientReports.update(list =>
          list.map(r => r.id === updated.id ? updated : r)
        );
        this.editingReportId.set(null);
        this.editContent = '';
        this.savingEdit.set(false);
        this.successMessage.set('Compte rendu mis à jour.');
        setTimeout(() => this.successMessage.set(''), 3500);
      },
      error: (err: HttpErrorResponse) => {
        this.savingEdit.set(false);
        this.errorMessage.set(err.error?.detail || 'Erreur lors de la mise à jour.');
      },
    });
  }

  submitReport(): void {
    const appt = this.selectedAppointment();
    if (!appt || this.reportForm.invalid) return;
    this.saving.set(true);
    this.errorMessage.set('');

    this.reportService.createReport({
      appointmentId: appt.id,
      content: this.reportForm.value.content,
    }).subscribe({
      next: (created) => {
        this.saving.set(false);
        this.reports.update(list => [created, ...list]);
        // Retirer le RDV de la liste des éligibles (il a maintenant un rapport)
        this.eligibleAppointments.update(list => list.filter(a => a.id !== appt.id));
        this.reportForm.reset({ content: '' });
        this.selectedAppointment.set(null);
        this.successMessage.set('Compte rendu enregistré.');
        this.setView('list');
        setTimeout(() => this.successMessage.set(''), 4000);
      },
      error: (err: HttpErrorResponse) => {
        this.saving.set(false);
        this.errorMessage.set(err.error?.detail || err.error?.message || 'Erreur lors de l\'enregistrement.');
      },
    });
  }

  private doLoadReports(): Promise<void> {
    this.loadingReports.set(true);
    return new Promise(resolve => {
      this.reportService.getMyReports().subscribe({
        next: (data) => { this.reports.set(data); this.loadingReports.set(false); resolve(); },
        error: () => { this.loadingReports.set(false); resolve(); },
      });
    });
  }

  private doLoadEligibleAppointments(): Promise<void> {
    this.loadingAppointments.set(true);
    return new Promise(resolve => {
      this.appointmentService.getMyAppointments().subscribe({
        next: (all) => {
          this.eligibleAppointments.set(
            all.filter(a => a.status === 'CONFIRMED' || a.status === 'COMPLETED')
               .sort((a, b) =>
                 parseLocalDateTime(b.appointmentDateTime).getTime() -
                 parseLocalDateTime(a.appointmentDateTime).getTime()
               )
          );
          this.loadingAppointments.set(false);
          resolve();
        },
        error: () => { this.loadingAppointments.set(false); resolve(); },
      });
    });
  }

  formatDate(d: string): string {
    return formatLocalDateTime(d);
  }
}
