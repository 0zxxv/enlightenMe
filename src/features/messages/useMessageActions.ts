import { useCallback, useEffect, useState, useSyncExternalStore } from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';

type MessageActionsState = {
  starred: string[];
  pinned: string[];
  deleted: string[];
};

const EMPTY: MessageActionsState = { starred: [], pinned: [], deleted: [] };
const listeners = new Set<() => void>();
const cache = new Map<string, MessageActionsState>();

function keyFor(conversationId: string) {
  return `dars.messageActions.v1.${conversationId}`;
}

function emit() {
  listeners.forEach((listener) => listener());
}

function subscribe(listener: () => void) {
  listeners.add(listener);
  return () => listeners.delete(listener);
}

async function load(conversationId: string) {
  try {
    const raw = await AsyncStorage.getItem(keyFor(conversationId));
    if (!raw) {
      cache.set(conversationId, { ...EMPTY });
      emit();
      return;
    }
    const parsed = JSON.parse(raw) as Partial<MessageActionsState>;
    cache.set(conversationId, {
      starred: parsed.starred ?? [],
      pinned: parsed.pinned ?? [],
      deleted: parsed.deleted ?? [],
    });
    emit();
  } catch {
    cache.set(conversationId, { ...EMPTY });
    emit();
  }
}

async function save(conversationId: string, next: MessageActionsState) {
  cache.set(conversationId, next);
  emit();
  await AsyncStorage.setItem(keyFor(conversationId), JSON.stringify(next));
}

function toggle(list: string[], id: string) {
  return list.includes(id) ? list.filter((item) => item !== id) : [...list, id];
}

export function useMessageActions(conversationId: string | undefined) {
  const snapshot = useSyncExternalStore(
    subscribe,
    () => (conversationId ? cache.get(conversationId) ?? EMPTY : EMPTY),
    () => EMPTY,
  );

  useEffect(() => {
    if (!conversationId) return;
    if (!cache.has(conversationId)) {
      void load(conversationId);
    }
  }, [conversationId]);

  const toggleStar = useCallback(
    (messageId: string) => {
      if (!conversationId) return;
      const current = cache.get(conversationId) ?? EMPTY;
      void save(conversationId, {
        ...current,
        starred: toggle(current.starred, messageId),
      });
    },
    [conversationId],
  );

  const togglePin = useCallback(
    (messageId: string) => {
      if (!conversationId) return;
      const current = cache.get(conversationId) ?? EMPTY;
      void save(conversationId, {
        ...current,
        pinned: toggle(current.pinned, messageId),
      });
    },
    [conversationId],
  );

  const deleteMessage = useCallback(
    (messageId: string) => {
      if (!conversationId) return;
      const current = cache.get(conversationId) ?? EMPTY;
      void save(conversationId, {
        ...current,
        deleted: [...new Set([...current.deleted, messageId])],
        starred: current.starred.filter((id) => id !== messageId),
        pinned: current.pinned.filter((id) => id !== messageId),
      });
    },
    [conversationId],
  );

  return {
    starred: snapshot.starred,
    pinned: snapshot.pinned,
    deleted: snapshot.deleted,
    toggleStar,
    togglePin,
    deleteMessage,
  };
}
