import { useMemo } from 'react';
import { useAuth } from '@/features/auth/useAuth';
import { useConversations } from '@/features/messages/hooks';
import { hasUnreadConversations } from '@/features/messages/unread';
import { useConversationPrefs } from '@/features/messages/useConversationPrefs';

export function useHasUnreadMessages() {
  const { user } = useAuth();
  const conversationsQuery = useConversations();
  const { prefs, ready } = useConversationPrefs();

  return useMemo(
    () =>
      ready
        ? hasUnreadConversations(conversationsQuery.data, user?.id, prefs)
        : false,
    [conversationsQuery.data, prefs, ready, user?.id],
  );
}
