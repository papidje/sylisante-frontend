export type VaccineCode =
  | 'BCG'
  | 'POLIO'
  | 'PENTA'
  | 'PCV'
  | 'ROTA'
  | 'MEASLES'
  | 'YELLOW_FEVER'
  | 'TT'
  | 'HEP_B'
  | 'COVID'
  | 'HPV'
  | 'MENINGO'
  | 'INFLUENZA'
  | 'OTHER';

export type VaccineSource = 'SELF' | 'PRACTITIONER';

export const VACCINE_LABELS: Record<VaccineCode, string> = {
  BCG: 'BCG (tuberculose)',
  POLIO: 'Polio (VPO/VIP)',
  PENTA: 'Pentavalent (DTP-HepB-Hib)',
  PCV: 'Pneumocoque (PCV)',
  ROTA: 'Rotavirus',
  MEASLES: 'Rougeole',
  YELLOW_FEVER: 'Fièvre jaune',
  TT: 'Tétanos (VAT)',
  HEP_B: 'Hépatite B',
  COVID: 'COVID-19',
  HPV: 'HPV',
  MENINGO: 'Méningocoque',
  INFLUENZA: 'Grippe',
  OTHER: 'Autre',
};

export const VACCINE_OPTIONS: VaccineCode[] = [
  'BCG', 'POLIO', 'PENTA', 'PCV', 'ROTA', 'MEASLES', 'YELLOW_FEVER',
  'TT', 'HEP_B', 'COVID', 'HPV', 'MENINGO', 'INFLUENZA', 'OTHER',
];

export const VACCINE_SOURCE_LABELS: Record<VaccineSource, string> = {
  SELF: 'Auto-déclaré',
  PRACTITIONER: 'Professionnel',
};

export const VACCINE_SOURCE_BADGE: Record<VaccineSource, string> = {
  SELF: 'bg-amber-50 text-amber-800 border-amber-200',
  PRACTITIONER: 'bg-emerald-50 text-emerald-700 border-emerald-200',
};

export const VACCINE_DOSE_OPTIONS = ['1', '2', '3', 'Rappel', 'Dose unique'];

export interface VaccinationRecordDto {
  id: number;
  vaccineCode: VaccineCode;
  vaccineLabel: string;
  customName: string | null;
  displayName: string;
  doseLabel: string | null;
  administeredOn: string;
  source: VaccineSource;
  sourceLabel: string;
  lotNumber: string | null;
  notes: string | null;
  recordedByName: string;
  canDelete: boolean;
  createdAt: string;
}

export interface VaccinationOverviewDto {
  total: number;
  professionalCount: number;
  selfCount: number;
  latest: VaccinationRecordDto | null;
  records: VaccinationRecordDto[];
}

export interface CreateVaccinationRequest {
  vaccineCode: VaccineCode;
  customName?: string | null;
  doseLabel?: string | null;
  administeredOn: string;
  lotNumber?: string | null;
  notes?: string | null;
  appointmentId?: number | null;
}

export interface VaccineGroup {
  key: string;
  name: string;
  doses: VaccinationRecordDto[];
}

export function groupVaccinations(records: VaccinationRecordDto[]): VaccineGroup[] {
  const groups: VaccineGroup[] = [];
  const index = new Map<string, VaccineGroup>();
  for (const record of records) {
    const key = record.vaccineCode === 'OTHER'
      ? `OTHER:${(record.customName ?? record.displayName).toLowerCase()}`
      : record.vaccineCode;
    let group = index.get(key);
    if (!group) {
      group = { key, name: record.displayName, doses: [] };
      index.set(key, group);
      groups.push(group);
    }
    group.doses.push(record);
  }
  return groups;
}

export function validateVaccination(input: {
  vaccineCode: VaccineCode | '';
  customName: string;
  administeredOn: string;
}): string | null {
  if (!input.vaccineCode) return 'Choisissez un vaccin.';
  if (input.vaccineCode === 'OTHER' && input.customName.trim().length < 2) {
    return 'Indiquez le nom du vaccin (2 à 120 caractères).';
  }
  if (!input.administeredOn) return 'Indiquez la date d\'administration.';
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  const administered = new Date(input.administeredOn + 'T00:00:00');
  if (Number.isNaN(administered.getTime())) return 'Date d\'administration invalide.';
  if (administered > today) return 'La date d\'administration ne peut pas être dans le futur.';
  return null;
}
