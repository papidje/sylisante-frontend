export type Role = 'ROLE_PATIENT' | 'ROLE_PRATICIEN' | 'ROLE_ADMIN';
export type UserStatus = 'ACTIVE' | 'INACTIVE' | 'SUSPENDED';

export interface AuthResponse {
  token: string | null;
  refreshToken: string | null;
  userId: number;
  email: string;
  firstName: string;
  lastName: string;
  role: Role;
  status: UserStatus;
}

export interface AdminUserDto {
  id: number;
  email: string;
  firstName: string;
  lastName: string;
  role: Role;
  status: UserStatus;
  createdAt: string;
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
};

export const ROLE_LABELS: Record<Role, string> = {
  ROLE_PATIENT: 'Patient',
  ROLE_PRATICIEN: 'Praticien',
  ROLE_ADMIN: 'Administrateur',
};
