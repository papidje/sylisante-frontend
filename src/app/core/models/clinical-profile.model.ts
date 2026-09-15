export type BloodType = 'A_POS' | 'A_NEG' | 'B_POS' | 'B_NEG' | 'AB_POS' | 'AB_NEG' | 'O_POS' | 'O_NEG';

export type AllergySeverity = 'MILD' | 'MODERATE' | 'SEVERE';

export const BLOOD_TYPE_LABELS: Record<BloodType, string> = {
  A_POS: 'A+',
  A_NEG: 'A-',
  B_POS: 'B+',
  B_NEG: 'B-',
  AB_POS: 'AB+',
  AB_NEG: 'AB-',
  O_POS: 'O+',
  O_NEG: 'O-',
};

export const BLOOD_TYPE_OPTIONS: BloodType[] = [
  'A_POS', 'A_NEG', 'B_POS', 'B_NEG', 'AB_POS', 'AB_NEG', 'O_POS', 'O_NEG',
];

export const ALLERGY_SEVERITY_LABELS: Record<AllergySeverity, string> = {
  MILD: 'Légère',
  MODERATE: 'Modérée',
  SEVERE: 'Sévère',
};

export interface AllergyDto {
  id: number;
  substance: string;
  severity: AllergySeverity | null;
  notedByName: string;
  createdAt: string;
}

export interface ClinicalProfileDto {
  patientUserId: number;
  bloodType: BloodType | null;
  bloodTypeLabel: string | null;
  bloodTypeLocked: boolean;
  nationalId: string | null;
  nationalIdMasked: string | null;
  allergies: AllergyDto[];
  updatedAt: string | null;
}

export interface UpdateClinicalProfileRequest {
  bloodType?: BloodType | null;
  nationalId?: string | null;
}

export interface CreateAllergyRequest {
  substance: string;
  severity?: AllergySeverity | null;
}
