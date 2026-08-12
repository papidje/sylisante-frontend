export type InvitationStatus = 'PENDING' | 'ACCEPTED' | 'SUSPENDED' | 'REVOKED';

export interface SecretaryRelation {
  id: number;
  secretaryId: number;
  secretaryEmail: string;
  secretaryFirstName: string;
  secretaryLastName: string;
  status: InvitationStatus;
  invitedAt: string;
  acceptedAt: string | null;
}

export interface SecretaryInvitation {
  id: number;
  doctorId: number;
  doctorFirstName: string;
  doctorLastName: string;
  doctorEmail: string;
  doctorSpeciality: string | null;
  invitedAt: string;
}

export interface LinkedPractitioner {
  practitionerId: number;
  firstName: string;
  lastName: string;
  email: string;
  speciality: string | null;
}

export interface InviteSecretaryRequest {
  email: string;
}

export const INVITATION_STATUS_LABELS: Record<InvitationStatus, string> = {
  PENDING: 'En attente',
  ACCEPTED: 'Active',
  SUSPENDED: 'Suspendue',
  REVOKED: 'Refusée / révoquée',
};
