import type { ApiSuccess } from '@/types/api';
import type { Conversation, Message } from '@/types/models';
import { apiRequest } from './client';

export async function listConversations() {
  const result = await apiRequest<ApiSuccess<Conversation[]>>('/messages/conversations', {
    auth: true,
  });
  return result.data;
}

export async function getConversationMessages(id: string) {
  const result = await apiRequest<ApiSuccess<Message[]>>(`/messages/conversations/${id}`, {
    auth: true,
  });
  return result.data;
}

export async function sendMessage(input: { recipientId: string; body: string }) {
  const result = await apiRequest<
    ApiSuccess<{ conversationId: string; message: Message }>
  >('/messages/send', {
    method: 'POST',
    body: input,
    auth: true,
  });
  return result.data;
}
