import type { Conversation } from '@/types/models';
import type { ConversationPrefs } from '@/store/conversationPrefs';

export function isConversationUnread(
  conversation: Conversation,
  userId: string | undefined,
  prefs: Pick<ConversationPrefs, 'forcedUnread' | 'seenMessageId'>,
): boolean {
  if (prefs.forcedUnread.includes(conversation.id)) return true;
  const last = conversation.messages?.[0];
  if (!last || !userId) return false;
  if (last.senderId === userId) return false;
  if (prefs.seenMessageId[conversation.id] === last.id) return false;
  return !last.readAt;
}

export function hasUnreadConversations(
  conversations: Conversation[] | undefined,
  userId: string | undefined,
  prefs: Pick<ConversationPrefs, 'forcedUnread' | 'seenMessageId' | 'deleted' | 'archived'>,
): boolean {
  if (!conversations?.length || !userId) return false;
  return conversations.some((item) => {
    if (prefs.deleted.includes(item.id)) return false;
    if (prefs.archived.includes(item.id)) return false;
    return isConversationUnread(item, userId, prefs);
  });
}
