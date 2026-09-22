import React from 'react';
import { MessagesInbox } from '@/features/messages/MessagesInbox';

export default function MessagesScreen() {
  return <MessagesInbox emptyHintKey="messages.emptyHint" />;
}
