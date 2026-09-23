import { useCallback, useSyncExternalStore } from 'react';
import {
  loadConversationPrefs,
  saveConversationPrefs,
  toggleId,
  type ConversationPrefs,
} from '@/store/conversationPrefs';

const EMPTY: ConversationPrefs = {
  pinned: [],
  archived: [],
  forcedUnread: [],
  deleted: [],
  seenMessageId: {},
};

let prefsState: ConversationPrefs = EMPTY;
let readyState = false;
let loadStarted = false;
const listeners = new Set<() => void>();

function emit() {
  listeners.forEach((listener) => listener());
}

function subscribe(listener: () => void) {
  listeners.add(listener);
  return () => listeners.delete(listener);
}

function getSnapshot() {
  return prefsState;
}

function getReadySnapshot() {
  return readyState;
}

function ensureLoaded() {
  if (loadStarted) return;
  loadStarted = true;
  void loadConversationPrefs().then((next) => {
    prefsState = next;
    readyState = true;
    emit();
  });
}

function commit(next: ConversationPrefs) {
  prefsState = next;
  emit();
  void saveConversationPrefs(next);
}

export function useConversationPrefs() {
  ensureLoaded();
  const prefs = useSyncExternalStore(subscribe, getSnapshot, getSnapshot);
  const ready = useSyncExternalStore(subscribe, getReadySnapshot, getReadySnapshot);

  const togglePinned = useCallback((id: string) => {
    const current = prefsState;
    const on = !current.pinned.includes(id);
    commit({
      ...current,
      pinned: toggleId(current.pinned, id, on),
      archived: on ? current.archived.filter((item) => item !== id) : current.archived,
    });
  }, []);

  const toggleArchived = useCallback((id: string) => {
    const current = prefsState;
    const on = !current.archived.includes(id);
    commit({
      ...current,
      archived: toggleId(current.archived, id, on),
      pinned: on ? current.pinned.filter((item) => item !== id) : current.pinned,
    });
  }, []);

  const markUnread = useCallback((id: string) => {
    const current = prefsState;
    const nextSeen = { ...current.seenMessageId };
    delete nextSeen[id];
    commit({
      ...current,
      forcedUnread: toggleId(current.forcedUnread, id, true),
      seenMessageId: nextSeen,
    });
  }, []);

  const clearForcedUnread = useCallback((id: string) => {
    const current = prefsState;
    if (!current.forcedUnread.includes(id)) return;
    commit({
      ...current,
      forcedUnread: current.forcedUnread.filter((item) => item !== id),
    });
  }, []);

  const markRead = useCallback((id: string, lastMessageId?: string | null) => {
    const current = prefsState;
    const nextSeen = { ...current.seenMessageId };
    if (lastMessageId) nextSeen[id] = lastMessageId;
    commit({
      ...current,
      forcedUnread: current.forcedUnread.filter((item) => item !== id),
      seenMessageId: nextSeen,
    });
  }, []);

  const deleteChat = useCallback((id: string) => {
    const current = prefsState;
    const nextSeen = { ...current.seenMessageId };
    delete nextSeen[id];
    commit({
      pinned: current.pinned.filter((item) => item !== id),
      archived: current.archived.filter((item) => item !== id),
      forcedUnread: current.forcedUnread.filter((item) => item !== id),
      deleted: toggleId(current.deleted, id, true),
      seenMessageId: nextSeen,
    });
  }, []);

  return {
    prefs,
    ready,
    togglePinned,
    toggleArchived,
    markUnread,
    markRead,
    clearForcedUnread,
    deleteChat,
  };
}
