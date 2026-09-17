export type PregnancyStatus = 'ACTIVE' | 'CLOSED';
export type PregnancyCloseReason = 'DELIVERY' | 'MISCARRIAGE' | 'TERMINATION' | 'OTHER';

export const PREGNANCY_CLOSE_LABELS: Record<PregnancyCloseReason, string> = {
  DELIVERY: 'Accouchement',
  MISCARRIAGE: 'Fausse couche',
  TERMINATION: 'Interruption',
  OTHER: 'Autre',
};

export const PREGNANCY_CLOSE_OPTIONS: PregnancyCloseReason[] = [
  'DELIVERY', 'MISCARRIAGE', 'TERMINATION', 'OTHER',
];

export interface PregnancyEpisodeDto {
  id: number;
  status: PregnancyStatus;
  lastMenstrualPeriod: string;
  dueDate: string;
  gestationalWeeks: number;
  gestationalDays: number;
  gestationalLabel: string;
  daysRemaining: number;
  startedAt: string;
  startedByName: string;
  closedAt: string | null;
  closedReason: PregnancyCloseReason | null;
  closedReasonLabel: string | null;
}

export interface PregnancyVisitDto {
  id: number;
  visitDate: string;
  gestationalWeeks: number;
  gestationalLabel: string;
  weightKg: number | null;
  fundalHeightCm: number | null;
  fetalHeartRate: number | null;
  notes: string | null;
  recordedByName: string;
  ownVisit: boolean;
}

export interface PregnancyOverviewDto {
  eligible: boolean;
  episode: PregnancyEpisodeDto | null;
  visitCount: number;
  visits: PregnancyVisitDto[];
}

export interface StartPregnancyRequest {
  lastMenstrualPeriod: string;
  dueDate?: string | null;
}

export interface ClosePregnancyRequest {
  reason: PregnancyCloseReason;
}

export interface CreatePregnancyVisitRequest {
  visitDate: string;
  weightKg?: number | null;
  fundalHeightCm?: number | null;
  fetalHeartRate?: number | null;
  notes?: string | null;
  appointmentId?: number | null;
}

export function pregnancyProgressPercent(weeks: number): number {
  const pct = (weeks / 40) * 100;
  return Math.max(0, Math.min(100, Math.round(pct)));
}
