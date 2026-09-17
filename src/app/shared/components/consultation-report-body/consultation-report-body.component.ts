import { Component, Input } from '@angular/core';

export interface StructuredReportBody {
  content?: string | null;
  diagnosis?: string | null;
  treatment?: string | null;
  exams?: string | null;
  instructions?: string | null;
  internalNotes?: string | null;
}

@Component({
  selector: 'app-consultation-report-body',
  standalone: true,
  template: `
    <div class="space-y-3">
      @if (narrative(); as text) {
        <p class="text-sm text-gray-800 leading-relaxed whitespace-pre-line">{{ text }}</p>
      }
      @if (report.diagnosis) {
        <div>
          <p class="text-[11px] uppercase tracking-wide text-gray-400 font-medium">Diagnostic</p>
          <p class="text-sm text-gray-800 whitespace-pre-line mt-0.5">{{ report.diagnosis }}</p>
        </div>
      }
      @if (report.treatment) {
        <div>
          <p class="text-[11px] uppercase tracking-wide text-gray-400 font-medium">Traitement</p>
          <p class="text-sm text-gray-800 whitespace-pre-line mt-0.5">{{ report.treatment }}</p>
        </div>
      }
      @if (report.exams) {
        <div>
          <p class="text-[11px] uppercase tracking-wide text-gray-400 font-medium">Examens</p>
          <p class="text-sm text-gray-800 whitespace-pre-line mt-0.5">{{ report.exams }}</p>
        </div>
      }
      @if (report.instructions) {
        <div>
          <p class="text-[11px] uppercase tracking-wide text-gray-400 font-medium">Consignes</p>
          <p class="text-sm text-gray-800 whitespace-pre-line mt-0.5">{{ report.instructions }}</p>
        </div>
      }
      @if (showInternal && report.internalNotes) {
        <div class="rounded-lg border border-amber-100 bg-amber-50/60 p-3">
          <p class="text-[11px] uppercase tracking-wide text-amber-800 font-medium">Notes internes (auteur seulement)</p>
          <p class="text-sm text-amber-950 whitespace-pre-line mt-0.5">{{ report.internalNotes }}</p>
        </div>
      }
    </div>
  `,
})
export class ConsultationReportBodyComponent {
  @Input({ required: true }) report!: StructuredReportBody;
  @Input() showInternal = false;

  narrative(): string | null {
    const content = this.report.content?.trim();
    if (!content) return null;
    const composed = composeStructuredSummary(this.report);
    if (composed && content === composed) return null;
    return content;
  }
}

export function composeStructuredSummary(report: StructuredReportBody): string {
  const parts: string[] = [];
  if (report.diagnosis?.trim()) parts.push('Diagnostic : ' + report.diagnosis.trim());
  if (report.treatment?.trim()) parts.push('Traitement : ' + report.treatment.trim());
  if (report.exams?.trim()) parts.push('Examens : ' + report.exams.trim());
  if (report.instructions?.trim()) parts.push('Consignes : ' + report.instructions.trim());
  return parts.join('\n\n');
}

export function reportPreview(report: StructuredReportBody): string {
  return (report.diagnosis || report.content || report.treatment || report.instructions || report.exams || '').trim();
}
