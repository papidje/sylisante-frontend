export type SupportMessageSenderType = 'USER' | 'ADMIN';

export interface SupportMessageDto {
  id: number;
  userId: number;
  senderType: SupportMessageSenderType;
  senderLabel: string;
  body: string;
  createdAt: string;
}

export interface SupportAccessDto {
  canSend: boolean;
  canRead: boolean;
  hasConversation: boolean;
}

export interface SupportConversationViewDto {
  messages: SupportMessageDto[];
  canSend: boolean;
  readOnly: boolean;
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
