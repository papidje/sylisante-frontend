import { Role, UserStatus } from './user.model';

export interface UserProfileDto {
  id: number;
  email: string;
  firstName: string;
  lastName: string;
  phone: string | null;
  address: string | null;
  birthDate: string | null;
  gender: string | null;
  description: string | null;
  role: Role;
  status: UserStatus;
  createdAt: string;
}

export interface UpdateUserProfileRequest {
  firstName: string;
  lastName: string;
  phone?: string | null;
  address?: string | null;
  birthDate?: string | null;
  gender?: string | null;
  description?: string | null;
}

export interface ChangePasswordRequest {
  newPassword: string;
  confirmPassword: string;
}

export const GENDER_LABELS: Record<string, string> = {
  MALE: 'Homme',
  FEMALE: 'Femme',
  OTHER: 'Autre',
};
