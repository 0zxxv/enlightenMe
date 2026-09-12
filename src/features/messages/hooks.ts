import { useQuery } from '@tanstack/react-query';
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
