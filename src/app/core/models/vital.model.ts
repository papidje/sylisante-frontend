import { formatLocalDateTime } from '../utils/date-utils';

export type VitalSource = 'SELF' | 'PRACTITIONER' | 'LAB';
export type BloodPressureClass = 'NORMAL' | 'ELEVATED' | 'HYPERTENSION' | 'CRISIS';
export type GlucoseClass = 'NORMAL' | 'PREDIABETES' | 'HIGH';

export const VITAL_SOURCE_LABELS: Record<VitalSource, string> = {
  SELF: 'Domicile',
  PRACTITIONER: 'Cabinet',
  LAB: 'Laboratoire',
};

export const BP_CLASS_BADGE: Record<BloodPressureClass, string> = {
  NORMAL: 'bg-emerald-50 text-emerald-700 border-emerald-200',
  ELEVATED: 'bg-amber-50 text-amber-800 border-amber-200',
  HYPERTENSION: 'bg-orange-50 text-orange-800 border-orange-200',
  CRISIS: 'bg-red-50 text-red-700 border-red-200',
};

export const GLUCOSE_CLASS_BADGE: Record<GlucoseClass, string> = {
  NORMAL: 'bg-emerald-50 text-emerald-700 border-emerald-200',
  PREDIABETES: 'bg-amber-50 text-amber-800 border-amber-200',
  HIGH: 'bg-red-50 text-red-700 border-red-200',
};

export const SOURCE_BADGE: Record<VitalSource, string> = {
  SELF: 'bg-sky-50 text-sky-700 border-sky-200',
  PRACTITIONER: 'bg-emerald-50 text-emerald-700 border-emerald-200',
  LAB: 'bg-violet-50 text-violet-700 border-violet-200',
};

export interface BloodPressureReadingDto {
  groupId: string;
  systolic: number;
  diastolic: number;
  heartRate: number | null;
  measuredAt: string;
  source: VitalSource;
  recordedByName: string;
  classification: BloodPressureClass;
  classificationLabel: string;
  crisis: boolean;
}

export interface GlucoseReadingDto {
  groupId: string;
  fasting: number | null;
  postprandial: number | null;
  measuredAt: string;
  source: VitalSource;
  recordedByName: string;
  classification: GlucoseClass | null;
  classificationLabel: string | null;
}

export interface Hba1cReadingDto {
  groupId: string;
  value: number;
  measuredAt: string;
  source: VitalSource;
  recordedByName: string;
  onTarget: boolean;
  classificationLabel: string;
}

export interface VitalSummaryDto {
  latestBloodPressure: BloodPressureReadingDto | null;
  averageSystolic: number | null;
  averageDiastolic: number | null;
  bloodPressureCount: number;
  latestGlucose: GlucoseReadingDto | null;
  averageFasting: number | null;
  latestHba1c: Hba1cReadingDto | null;
  glucoseCount: number;
  recentBloodPressure: BloodPressureReadingDto[];
  recentGlucose: GlucoseReadingDto[];
}

export interface CreateBloodPressureRequest {
  systolic: number;
  diastolic: number;
  heartRate?: number | null;
  measuredAt?: string | null;
  appointmentId?: number | null;
}

export interface CreateGlucoseRequest {
  fasting?: number | null;
  postprandial?: number | null;
  measuredAt?: string | null;
  appointmentId?: number | null;
}

export interface CreateHba1cRequest {
  value: number;
  labResult: boolean;
  measuredAt?: string | null;
  appointmentId?: number | null;
}

/** Affiche une TIMESTAMPTZ ISO sans conversion de fuseau (Guinée = UTC). */
export function formatVitalDate(s: string | null | undefined): string {
  if (!s) return '';
  const normalized = s.replace(/Z$/, '').replace(/[+-]\d{2}:\d{2}$/, '').split('.')[0];
  return formatLocalDateTime(normalized);
}

export function formatBp(reading: BloodPressureReadingDto | null | undefined): string {
  if (!reading) return '—';
  return `${reading.systolic}/${reading.diastolic}`;
}

export function formatGlucoseValue(value: number | null | undefined): string {
  if (value == null) return '—';
  return `${value} mmol/L`;
}

export function parseOptionalNumber(raw: string | number | null | undefined): number | null {
  if (raw === null || raw === undefined || raw === '') return null;
  const n = typeof raw === 'number' ? raw : Number(String(raw).replace(',', '.'));
  return Number.isFinite(n) ? n : null;
}
