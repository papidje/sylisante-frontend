import { Component, OnInit, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterLink } from '@angular/router';
import { ConsultationReportService, ConsultationReportDto } from '../../../core/services/consultation-report.service';
import { formatLocalDateTime } from '../../../core/utils/date-utils';
import { SyliSpinnerComponent } from '../../../shared/components/syli-spinner/syli-spinner.component';

@Component({
  selector: 'app-patient-dossier',
  standalone: true,
  imports: [CommonModule, RouterLink, SyliSpinnerComponent],
  template: `
    <div class="max-w-3xl mx-auto px-4 py-8">
      <div class="mb-8">
        <h1 class="text-2xl font-bold text-gray-900">Mon dossier</h1>
        <p class="text-gray-500 mt-1 text-sm">
          Comptes rendus que vos praticiens ont choisi de partager avec vous.
        </p>
      </div>

      @if (loading()) {
        <app-syli-spinner size="md" [showLabel]="true" [centered]="true" />
      } @else if (reports().length === 0) {
        <div class="card text-center py-12">
          <p class="text-gray-500 font-medium">Aucun compte rendu partagé pour le moment</p>
          <p class="text-sm text-gray-400 mt-2 max-w-md mx-auto">
            Vos médecins peuvent rendre un compte rendu visible depuis leur dossier.
            Les notes internes ne figurent pas ici.
          </p>
          <a routerLink="/appointments" class="btn-primary mt-5 inline-block text-sm">Voir mes rendez-vous</a>
        </div>
      } @else {
        <div class="relative">
          <div class="absolute left-4 top-0 bottom-0 w-0.5 bg-gray-200"></div>
          <div class="space-y-6">
            @for (report of reports(); track report.id; let i = $index) {
              <div class="relative pl-12">
                <div class="absolute left-0 w-8 h-8 rounded-full bg-primary-600 text-white
                            flex items-center justify-center text-xs font-bold z-10">
                  {{ i + 1 }}
                </div>
                <div class="card">
                  <div class="flex items-start justify-between gap-3 mb-3">
                    <div>
                      <p class="text-sm font-semibold text-gray-900">{{ report.practitionerName }}</p>
                      <p class="text-xs text-gray-400 mt-0.5">
                        Consultation du {{ formatDate(report.appointmentDateTime) }}
                      </p>
                    </div>
                  </div>
                  <p class="text-sm text-gray-800 leading-relaxed whitespace-pre-line">{{ report.content }}</p>
                </div>
              </div>
            }
          </div>
        </div>
      }
    </div>
  `,
})
export class PatientDossierComponent implements OnInit {
  reports = signal<ConsultationReportDto[]>([]);
  loading = signal(true);

  constructor(private reportService: ConsultationReportService) {}

  ngOnInit(): void {
    this.reportService.getMyDossier().subscribe({
      next: (data) => {
        this.reports.set(data);
        this.loading.set(false);
      },
      error: () => this.loading.set(false),
    });
  }

  formatDate(d: string): string {
    return formatLocalDateTime(d);
  }
}
