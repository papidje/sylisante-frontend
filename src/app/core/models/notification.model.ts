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
  | 'SUBSCRIPTION_EXPIRING_SOON';

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
};

/** Route cible pour la navigation au clic sur la notification. */
export function notificationRoute(n: NotificationDto): string | null {
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
