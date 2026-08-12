import { MerchantType } from './practitioner.model';

export type AppointmentStatus =
  | 'REQUESTED'
  | 'PENDING_PAYMENT_VALIDATION'
  | 'CONFIRMED'
  | 'REFUSED'
  | 'CANCELED'
  | 'COMPLETED'
  | 'NO_SHOW'
  | 'IMPACTED_BY_CHANGE';

export type CancelledBy = 'PATIENT' | 'PRACTITIONER';

export type PaymentStatus = 'PENDING' | 'VALIDATED' | 'REFUNDED';

export interface AppointmentResponse {
  id: number;
  patientId: number;
  patientFirstName: string;
  patientLastName: string;
  practitionerId: number;
  practitionerFirstName: string;
  practitionerLastName: string;
  practitionerSpeciality: string | null;
  merchantNumber: string | null;
  merchantType: MerchantType | null;
  appointmentDateTime: string;
  consultationType: string | null;
  reason: string | null;
  status: AppointmentStatus;
  paymentReference: string | null;
  paymentStatus: PaymentStatus;
  amountPaid: number | null;
  cancellationReason: string | null;
  cancelledBy: CancelledBy | null;
  createdAt: string;
}

export interface CancelAppointmentRequest {
  reason: string;
}

import { GuestPatientInfo } from './patient.model';

export interface CreateAppointmentRequest {
  practitionerId: number;
  appointmentDateTime: string;
  consultationType?: string | null;
  reason?: string | null;
  patientId?: number | null;
  guestPatientInfo?: GuestPatientInfo | null;
}

export interface SubmitPaymentReferenceRequest {
  paymentReference: string;
}

export const APPOINTMENT_STATUS_LABELS: Record<AppointmentStatus, string> = {
  REQUESTED: 'Demande envoyée',
  PENDING_PAYMENT_VALIDATION: 'En attente de validation du paiement',
  CONFIRMED: 'Confirmé',
  REFUSED: 'Refusé',
  CANCELED: 'Annulé',
  COMPLETED: 'Terminé',
  NO_SHOW: 'Absent',
  IMPACTED_BY_CHANGE: 'Impacté par un changement',
};

export const MERCHANT_TYPE_LABELS: Record<string, string> = {
  ORANGE_MONEY: 'Orange Money',
  MTN_MONEY: 'MTN Money',
};
