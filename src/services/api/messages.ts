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

export async function getConversationMeta(id: string) {
  try {
    const result = await apiRequest<ApiSuccess<Conversation>>(
      `/messages/conversations/${id}/meta`,
      { auth: true },
    );
    return result.data;
  } catch {
    const conversations = await listConversations();
    const found = conversations.find((c) => c.id === id);
    if (!found) throw new Error('Conversation not found');
    return found;
  }
}

export async function replyInConversation(
  conversationId: string,
  body: string,
  recipientId?: string,
) {
  // Prefer recipient send — works on current live API and reuses the conversation.
  if (recipientId) {
    const result = await sendMessage({ recipientId, body });
    return result.message;
  }

  const result = await apiRequest<ApiSuccess<Message>>(
    `/messages/conversations/${conversationId}/messages`,
    {
      method: 'POST',
      body: { body },
      auth: true,
    },
  );
  return result.data;
}

export async function openConversation(recipientId: string) {
  const conversations = await listConversations();
  const existing = conversations.find((c) =>
    c.participants.some((p) => p.userId === recipientId),
  );
  if (existing) return { conversationId: existing.id };

  try {
    const result = await apiRequest<ApiSuccess<{ conversationId: string }>>('/messages/open', {
      method: 'POST',
      body: { recipientId },
      auth: true,
    });
    return result.data;
  } catch {
    const created = await sendMessage({
      recipientId,
      body: '👋',
    });
    return { conversationId: created.conversationId };
  }
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
