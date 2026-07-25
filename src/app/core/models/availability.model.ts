export interface AvailabilityDto {
  id: number;
  practitionerId: number;
  practitionerName: string;
  recurring: boolean;
  dayOfWeek: number | null;
  dayOfWeekLabel: string | null;
  startTime: string | null;
  endTime: string | null;
  effectiveFrom: string | null;
  effectiveTo: string | null;
  startDateTime: string | null;
  endDateTime: string | null;
  replaced: boolean;
  substituteName: string | null;
  createdAt: string;
}

export interface CreateAvailabilityRequest {
  recurring: boolean;
  dayOfWeek?: number;
  startTime?: string;
  endTime?: string;
  effectiveFrom?: string;
  effectiveTo?: string;
  startDateTime?: string;
  endDateTime?: string;
  replaced: boolean;
  substituteName?: string;
}

export interface UpdateAvailabilityRequest {
  startTime?: string;
  endTime?: string;
  effectiveFrom?: string;
  effectiveTo?: string;
  startDateTime?: string;
  endDateTime?: string;
  replaced?: boolean;
  substituteName?: string;
}

export const DAY_OF_WEEK_OPTIONS = [
  { value: 1, label: 'Lundi' },
  { value: 2, label: 'Mardi' },
  { value: 3, label: 'Mercredi' },
  { value: 4, label: 'Jeudi' },
  { value: 5, label: 'Vendredi' },
  { value: 6, label: 'Samedi' },
  { value: 7, label: 'Dimanche' },
];
