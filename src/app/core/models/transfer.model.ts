export type TransferStatus =
  | 'PENDING_SOURCE_APPROVAL'
  | 'APPROVED'
  | 'REJECTED'
  | 'CANCELED';

export interface SharedReportDto {
  reportId: number;
  appointmentId: number;
  appointmentDateTime: string;
  sourcePractitionerId: number;
  sourcePractitionerName: string;
  patientId: number;
  patientName: string;
  content: string;
  createdAt: string;
}

export interface TransferResponse {
  id: number;
  patientId: number;
  patientName: string;
  sourcePractitionerId: number;
  sourcePractitionerName: string;
  targetPractitionerId: number;
  targetPractitionerName: string;
  status: TransferStatus;
  patientNote: string | null;
  itemCount: number;
  sharedReports: SharedReportDto[];
  createdAt: string;
  updatedAt: string | null;
}

export interface InitiateTransferRequest {
  sourcePractitionerId: number;
  targetPractitionerId: number;
  patientNote?: string;
}

export interface ApproveTransferRequest {
  reportIds: number[];
}

export const TRANSFER_STATUS_LABELS: Record<TransferStatus, string> = {
  PENDING_SOURCE_APPROVAL: 'En attente',
  APPROVED: 'Approuvé',
  REJECTED: 'Refusé',
  CANCELED: 'Annulé',
};

export const TRANSFER_STATUS_COLORS: Record<TransferStatus, string> = {
  PENDING_SOURCE_APPROVAL: 'bg-yellow-100 text-yellow-800',
  APPROVED: 'bg-primary-100 text-sky-800',
  REJECTED: 'bg-red-100 text-red-700',
  CANCELED: 'bg-gray-100 text-gray-500',
};
