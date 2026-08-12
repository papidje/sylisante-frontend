export type NotificationType =
  | 'NEW_APPOINTMENT'
  | 'APPOINTMENT_CONFIRMED'
  | 'APPOINTMENT_REFUSED'
  | 'APPOINTMENT_CANCELED'
  | 'APPOINTMENT_COMPLETED'
  | 'PAYMENT_RECEIVED'
  | 'PLANNING_ALERT'
  | 'TRANSFER_REQUEST'
  | 'TRANSFER_APPROVED'
  | 'TRANSFER_REJECTED'
  | 'TRANSFER_RECEIVED'
  | 'ACCOUNT_SUSPENDED'
  | 'ACCOUNT_ACTIVATED'
  | 'SUBSCRIPTION_EXPIRED'
  | 'SUBSCRIPTION_EXPIRING_SOON'
  | 'ADMIN_SUPPORT_REQUEST'
  | 'PRACTITIONER_PENDING_VALIDATION'
  | 'SECRETARY_INVITATION'
  | 'SECRETARY_ACCESS_SUSPENDED'
  | 'SECRETARY_ACCESS_REACTIVATED';

export interface NotificationDto {
  id: number;
  type: NotificationType;
  title: string;
  message: string;
  referenceId: number | null;
  referenceType: string | null;
  isRead: boolean;
  createdAt: string;
}

export interface NotificationPage {
  content: NotificationDto[];
  totalElements: number;
  totalPages: number;
  unreadCount: number;
}

export const NOTIFICATION_ICONS: Record<NotificationType, string> = {
  NEW_APPOINTMENT:        '📅',
  APPOINTMENT_CONFIRMED:  '✅',
  APPOINTMENT_REFUSED:    '🚫',
  APPOINTMENT_CANCELED:   '❌',
  APPOINTMENT_COMPLETED:  '🏁',
  PAYMENT_RECEIVED:       '💳',
  PLANNING_ALERT:         '⚠️',
  TRANSFER_REQUEST:       '📤',
  TRANSFER_APPROVED:      '🔓',
  TRANSFER_REJECTED:      '🔒',
  TRANSFER_RECEIVED:      '📥',
  ACCOUNT_SUSPENDED:      '🚫',
  ACCOUNT_ACTIVATED:      '🎉',
  SUBSCRIPTION_EXPIRED:   '⏳',
  SUBSCRIPTION_EXPIRING_SOON: '⚠️',
  ADMIN_SUPPORT_REQUEST:  '💬',
  PRACTITIONER_PENDING_VALIDATION: '⏳',
  SECRETARY_INVITATION: '📨',
  SECRETARY_ACCESS_SUSPENDED: '🚫',
  SECRETARY_ACCESS_REACTIVATED: '✅',
};

const USER_MESSAGING_NOTIFICATION_TYPES: NotificationType[] = [
  'ADMIN_SUPPORT_REQUEST',
  'ACCOUNT_ACTIVATED',
  'ACCOUNT_SUSPENDED',
  'SUBSCRIPTION_EXPIRED',
  'SUBSCRIPTION_EXPIRING_SOON',
];

/** Route cible pour la navigation au clic sur la notification. */
export function notificationRoute(n: NotificationDto, isAdmin: boolean): string | null {
  if (n.referenceType === 'SUPPORT_CONVERSATION') {
    if (isAdmin && n.referenceId) {
      return `/admin/support-requests/${n.referenceId}`;
    }
    return '/contact-admin';
  }

  if (n.type === 'ADMIN_SUPPORT_REQUEST') {
    if (isAdmin && n.referenceId) {
      return `/admin/support-requests/${n.referenceId}`;
    }
    return '/contact-admin';
  }

  if (!isAdmin && USER_MESSAGING_NOTIFICATION_TYPES.includes(n.type)) {
    return '/contact-admin';
  }

  if (n.referenceType === 'SECRETARY_RELATION') {
    return '/dashboard/secretary';
  }

  if (!n.referenceId) return null;
  if (n.referenceType === 'APPOINTMENT') return '/appointments';
  if (n.referenceType === 'TRANSFER') {
    if (n.type === 'TRANSFER_REQUEST') return '/transfer-approvals';
    if (n.type === 'TRANSFER_RECEIVED') return '/shared-records';
    if (n.type === 'TRANSFER_APPROVED' || n.type === 'TRANSFER_REJECTED') return '/my-transfers';
    return '/my-transfers';
  }
  return null;
}
