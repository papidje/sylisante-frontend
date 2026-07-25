export type MerchantType = 'ORANGE_MONEY' | 'MTN_MOMO';

export interface PractitionerSpecialtyDto {
  id: number;
  specialtyId: number;
  specialtyName: string;
  consultationDurationMinutes: number;
}

export interface PractitionerProfileDto {
  id: number;
  userId: number;
  firstName: string;
  lastName: string;
  email: string;
  cityId: number | null;
  cityName: string | null;
  address: string | null;
  speciality: string | null;
  bio: string | null;
  appointmentInstructions: string | null;
  consultationFee: number | null;
  merchantNumber: string | null;
  merchantType: MerchantType | null;
  practitionerSpecialties: PractitionerSpecialtyDto[];
}

export interface PractitionerSearchResult {
  userId: number;
  profileId: number;
  firstName: string;
  lastName: string;
  cityName: string | null;
  address: string | null;
  bio: string | null;
  appointmentInstructions: string | null;
  specialtyName: string | null;
  consultationDurationMinutes: number;
  merchantNumber: string | null;
  firstAvailableDate: string;
}

export interface UpdatePractitionerProfileRequest {
  cityId?: number;
  address?: string;
  bio?: string;
  appointmentInstructions?: string;
  consultationFee?: number;
  merchantNumber?: string;
  merchantType?: MerchantType;
  specialties?: SpecialtyWithDurationRequest[];
}

export interface SpecialtyWithDurationRequest {
  specialtyId: number;
  consultationDurationMinutes: number;
}

// Créneaux générés par AppointmentSlotGenerator
export interface TimeSlotDto {
  time: string;
  available: boolean;
  replaced: boolean;
  substituteName: string | null;
}

export interface DayScheduleResponse {
  date: string;
  practitionerId: number;
  practitionerName: string;
  specialtyId: number;
  specialtyName: string;
  consultationDurationMinutes: number;
  morningSlots: TimeSlotDto[];
  afternoonSlots: TimeSlotDto[];
}
