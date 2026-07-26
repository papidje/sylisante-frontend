import { PractitionerProfileDto } from './practitioner.model';
import { UserProfileDto } from './user-profile.model';

export type Role = 'ROLE_PATIENT' | 'ROLE_PRATICIEN' | 'ROLE_ADMIN';
export type UserStatus =
  | 'ACTIVE'
  | 'INACTIVE'
  | 'SUSPENDED'
  | 'PENDING_ADMIN_VALIDATION'
  | 'SUBSCRIPTION_EXPIRED';

export interface AuthResponse {
  token: string | null;
  refreshToken: string | null;
  userId: number;
  email: string;
  firstName: string;
  lastName: string;
  role: Role;
  status: UserStatus;
  subscriptionExpiresAt: string | null;
}

export interface AdminUserDto {
  id: number;
  email: string;
  firstName: string;
  lastName: string;
  role: Role;
  status: UserStatus;
  subscriptionExpiresAt: string | null;
  createdAt: string;
}

export interface AdminUserDetailDto {
  profile: UserProfileDto;
  practitionerProfile: PractitionerProfileDto | null;
}

export interface AdminSupportRequestDto {
  id: number;
  userId: number;
  userEmail: string;
  userFirstName: string;
  userLastName: string;
  userRole: Role;
  userStatus: UserStatus;
  message: string;
  status: 'OPEN' | 'RESOLVED';
  adminResponse: string | null;
  createdAt: string;
  resolvedAt: string | null;
}

export interface RegisterRequest {
  email: string;
  password: string;
  firstName: string;
  lastName: string;
  role: Role;
}

export interface LoginRequest {
  email: string;
  password: string;
}

export interface ValidateAccountRequest {
  email: string;
  code: string;
}

export interface ResendCodeRequest {
  email: string;
}

export const USER_STATUS_LABELS: Record<UserStatus, string> = {
  ACTIVE: 'Actif',
  INACTIVE: 'Inactif',
  SUSPENDED: 'Suspendu',
  PENDING_ADMIN_VALIDATION: 'En attente de validation',
  SUBSCRIPTION_EXPIRED: 'Abonnement expiré',
};

export const ROLE_LABELS: Record<Role, string> = {
  ROLE_PATIENT: 'Patient',
  ROLE_PRATICIEN: 'Praticien',
  ROLE_ADMIN: 'Administrateur',
};

export function isAccountRestricted(status: UserStatus | undefined): boolean {
  return status === 'SUSPENDED' || status === 'SUBSCRIPTION_EXPIRED';
}

export function isPendingAdminValidation(status: UserStatus | undefined): boolean {
  return status === 'PENDING_ADMIN_VALIDATION';
}

/** Bandeau d'avertissement + contact admin (praticien en attente ou compte restreint). */
export function needsAccountDisclaimer(status: UserStatus | undefined, role: Role | undefined): boolean {
  if (!status || role === 'ROLE_ADMIN') return false;
  return isPendingAdminValidation(status) || isAccountRestricted(status);
}

export function getAccountRestrictionMessage(status: UserStatus | undefined, role: Role | undefined): string {
  if (status === 'SUSPENDED') {
    return 'Votre compte a été suspendu par l\'administrateur. Vous ne pouvez pas accéder aux fonctionnalités de la plateforme pour le moment.';
  }
  if (status === 'SUBSCRIPTION_EXPIRED') {
    return 'Votre abonnement praticien a expiré. Votre profil n\'est plus visible par les patients. Renouvelez votre abonnement en contactant l\'administrateur.';
  }
  if (status === 'PENDING_ADMIN_VALIDATION' && role === 'ROLE_PRATICIEN') {
    return 'Votre compte praticien est en cours de validation par l\'administrateur. Vous pouvez configurer votre profil et vos disponibilités, mais vous n\'êtes pas encore visible par les patients.';
  }
  return '';
}
