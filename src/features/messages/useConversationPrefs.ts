import { useCallback, useEffect, useState } from 'react';
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
};

export function useConversationPrefs() {
  const [prefs, setPrefs] = useState<ConversationPrefs>(EMPTY);
  const [ready, setReady] = useState(false);

  useEffect(() => {
    let alive = true;
    loadConversationPrefs().then((next) => {
      if (!alive) return;
      setPrefs(next);
      setReady(true);
    });
    return () => {
      alive = false;
    };
  }, []);

  const commit = useCallback((next: ConversationPrefs) => {
    setPrefs(next);
    void saveConversationPrefs(next);
  }, []);

  const togglePinned = useCallback(
    (id: string) => {
      const on = !prefs.pinned.includes(id);
      commit({
        ...prefs,
        pinned: toggleId(prefs.pinned, id, on),
        archived: on ? prefs.archived.filter((item) => item !== id) : prefs.archived,
      });
    },
    [commit, prefs],
  );

  const toggleArchived = useCallback(
    (id: string) => {
      const on = !prefs.archived.includes(id);
      commit({
        ...prefs,
        archived: toggleId(prefs.archived, id, on),
        pinned: on ? prefs.pinned.filter((item) => item !== id) : prefs.pinned,
      });
    },
    [commit, prefs],
  );

  const markUnread = useCallback(
    (id: string) => {
      commit({
        ...prefs,
        forcedUnread: toggleId(prefs.forcedUnread, id, true),
      });
    },
    [commit, prefs],
  );

  const clearForcedUnread = useCallback(
    (id: string) => {
      if (!prefs.forcedUnread.includes(id)) return;
      commit({
        ...prefs,
        forcedUnread: prefs.forcedUnread.filter((item) => item !== id),
      });
    },
    [commit, prefs],
  );

  const deleteChat = useCallback(
    (id: string) => {
      commit({
        pinned: prefs.pinned.filter((item) => item !== id),
        archived: prefs.archived.filter((item) => item !== id),
        forcedUnread: prefs.forcedUnread.filter((item) => item !== id),
        deleted: toggleId(prefs.deleted, id, true),
      });
    },
    [commit, prefs],
  );

  return {
    prefs,
    ready,
    togglePinned,
    toggleArchived,
    markUnread,
    clearForcedUnread,
    deleteChat,
  };
}
