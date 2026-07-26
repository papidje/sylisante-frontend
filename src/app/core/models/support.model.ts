export type SupportMessageSenderType = 'USER' | 'ADMIN';

export interface SupportMessageDto {
  id: number;
  userId: number;
  senderType: SupportMessageSenderType;
  senderLabel: string;
  body: string;
  createdAt: string;
}

export interface SupportConversationSummaryDto {
  userId: number;
  userEmail: string;
  userFirstName: string;
  userLastName: string;
  userRole: string;
  userStatus: string;
  lastMessagePreview: string;
  lastMessageSenderType: SupportMessageSenderType;
  lastMessageAt: string;
}
