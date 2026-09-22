import AsyncStorage from '@react-native-async-storage/async-storage';

const KEY = 'dars.conversationPrefs.v1';

export type ConversationPrefs = {
  pinned: string[];
  archived: string[];
  forcedUnread: string[];
  deleted: string[];
};

const EMPTY: ConversationPrefs = {
  pinned: [],
  archived: [],
  forcedUnread: [],
  deleted: [],
};

function uniq(ids: string[]) {
  return Array.from(new Set(ids.filter(Boolean)));
}

export async function loadConversationPrefs(): Promise<ConversationPrefs> {
  try {
    const raw = await AsyncStorage.getItem(KEY);
    if (!raw) return { ...EMPTY };
    const parsed = JSON.parse(raw) as Partial<ConversationPrefs>;
    return {
      pinned: uniq(parsed.pinned ?? []),
      archived: uniq(parsed.archived ?? []),
      forcedUnread: uniq(parsed.forcedUnread ?? []),
      deleted: uniq(parsed.deleted ?? []),
    };
  } catch {
    return { ...EMPTY };
  }
}

export async function saveConversationPrefs(prefs: ConversationPrefs): Promise<void> {
  await AsyncStorage.setItem(
    KEY,
    JSON.stringify({
      pinned: uniq(prefs.pinned),
      archived: uniq(prefs.archived),
      forcedUnread: uniq(prefs.forcedUnread),
      deleted: uniq(prefs.deleted),
    }),
  );
}

export function toggleId(list: string[], id: string, on: boolean) {
  if (on) return uniq([...list, id]);
  return list.filter((item) => item !== id);
}
