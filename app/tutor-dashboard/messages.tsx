import React from 'react';
import { MessagesInbox } from '@/features/messages/MessagesInbox';

export default function TutorMessagesScreen() {
  return <MessagesInbox emptyHintKey="messages.emptyHintTutor" />;
}
