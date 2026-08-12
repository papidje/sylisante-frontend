export type AccountStatus = 'GUEST' | 'REGISTERED';

export interface PatientSearchResult {
  patientId: number;
  firstName: string;
  lastName: string;
  phone: string | null;
  email: string | null;
  accountStatus: AccountStatus;
}

export interface GuestPatientInfo {
  firstName: string;
  lastName: string;
  phone: string;
  email?: string | null;
}
