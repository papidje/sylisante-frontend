export type AuditAction =
  | 'LOGIN' | 'LOGOUT' | 'REGISTER' | 'ACCOUNT_VALIDATED'
  | 'APPOINTMENT_CREATED' | 'APPOINTMENT_CANCELED' | 'APPOINTMENT_REFUSED' | 'APPOINTMENT_COMPLETED'
  | 'PAYMENT_VALIDATED'
  | 'PLANNING_MODIFIED' | 'PLANNING_DELETED'
  | 'CONSULTATION_REPORT_CREATED' | 'CONSULTATION_REPORT_UPDATED'
  | 'ACCOUNT_SUSPENDED' | 'ACCOUNT_ACTIVATED' | 'ACCOUNT_UNLOCKED'
  | 'PASSWORD_CHANGED';

export interface AuditLogResponse {
  id: number;
  userEmail: string;
  action: AuditAction;
  details: string | null;
  ipAddress: string | null;
  createdAt: string;
}

export interface AuditLogPage {
  content: AuditLogResponse[];
  totalElements: number;
  totalPages: number;
  page: number;
}

export const AUDIT_ACTION_LABELS: Record<AuditAction, string> = {
  LOGIN: 'Connexion',
  LOGOUT: 'Déconnexion',
  REGISTER: 'Inscription',
  ACCOUNT_VALIDATED: 'Compte validé',
  APPOINTMENT_CREATED: 'RDV créé',
  APPOINTMENT_CANCELED: 'RDV annulé',
  APPOINTMENT_REFUSED: 'RDV refusé',
  APPOINTMENT_COMPLETED: 'RDV terminé',
  PAYMENT_VALIDATED: 'Paiement validé',
  PLANNING_MODIFIED: 'Planning modifié',
  PLANNING_DELETED: 'Planning supprimé',
  CONSULTATION_REPORT_CREATED: 'CR créé',
  CONSULTATION_REPORT_UPDATED: 'CR modifié',
  ACCOUNT_SUSPENDED: 'Compte suspendu',
  ACCOUNT_ACTIVATED: 'Compte activé',
  ACCOUNT_UNLOCKED: 'Compte débloqué',
  PASSWORD_CHANGED: 'Mot de passe modifié',
};

export const AUDIT_ACTION_COLORS: Record<AuditAction, string> = {
  LOGIN: 'bg-primary-100 text-sky-800',
  LOGOUT: 'bg-gray-100 text-gray-700',
  REGISTER: 'bg-blue-100 text-blue-800',
  ACCOUNT_VALIDATED: 'bg-blue-100 text-blue-700',
  APPOINTMENT_CREATED: 'bg-teal-100 text-teal-800',
  APPOINTMENT_CANCELED: 'bg-orange-100 text-orange-800',
  APPOINTMENT_REFUSED: 'bg-red-100 text-red-800',
  APPOINTMENT_COMPLETED: 'bg-teal-100 text-teal-700',
  PAYMENT_VALIDATED: 'bg-primary-100 text-sky-800',
  PLANNING_MODIFIED: 'bg-yellow-100 text-yellow-800',
  PLANNING_DELETED: 'bg-red-100 text-red-700',
  CONSULTATION_REPORT_CREATED: 'bg-purple-100 text-purple-800',
  CONSULTATION_REPORT_UPDATED: 'bg-purple-100 text-purple-700',
  ACCOUNT_SUSPENDED: 'bg-red-100 text-red-800',
  ACCOUNT_ACTIVATED: 'bg-primary-100 text-sky-700',
  ACCOUNT_UNLOCKED: 'bg-primary-100 text-sky-600',
  PASSWORD_CHANGED: 'bg-sky-100 text-sky-800',
};
