import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import * as messagesApi from '@/services/api/messages';

export function useConversations() {
  return useQuery({
    queryKey: ['conversations'],
    queryFn: () => messagesApi.listConversations(),
  });
}

export function useConversationMessages(id: string) {
  return useQuery({
    queryKey: ['conversation', id],
    queryFn: () => messagesApi.getConversationMessages(id),
    enabled: Boolean(id),
  });
}

export function useConversationMeta(id: string) {
  return useQuery({
    queryKey: ['conversation-meta', id],
    queryFn: () => messagesApi.getConversationMeta(id),
    enabled: Boolean(id),
  });
}

export function useReplyInConversation(conversationId: string, recipientId?: string) {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (body: string) =>
      messagesApi.replyInConversation(conversationId, body, recipientId),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['conversation', conversationId] });
      qc.invalidateQueries({ queryKey: ['conversations'] });
    },
  });
}

export function useOpenConversation() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (recipientId: string) => messagesApi.openConversation(recipientId),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['conversations'] });
    },
  });
}

export function useStartConversation() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (input: { recipientId: string; body: string }) => messagesApi.sendMessage(input),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['conversations'] });
    },
  });
}
