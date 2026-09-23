import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import React, { useMemo, useState } from 'react';
import {
  FlatList,
  Modal,
  Pressable,
  RefreshControl,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Avatar } from '@/components/Avatar';
import { EmptyState } from '@/components/EmptyState';
import { ErrorState } from '@/components/ErrorState';
import { LoadingState } from '@/components/LoadingState';
import { SearchBar } from '@/components/SearchBar';
import { useAuth } from '@/features/auth/useAuth';
import { useConversations } from '@/features/messages/hooks';
import { isConversationUnread } from '@/features/messages/unread';
import { useConversationPrefs } from '@/features/messages/useConversationPrefs';
import { useRefresh } from '@/hooks/useRefresh';
import { useTranslation } from '@/i18n';
import { colors, radius, shadows, spacing, typography } from '@/theme';
import type { Conversation, Role } from '@/types/models';
import { formatDate, formatTime, fullName } from '@/utils/format';

type FilterId = 'all' | 'unread' | 'teachers' | 'students' | 'admins' | 'groups' | 'courses';
type ListMode = 'inbox' | 'archived';

type Props = {
  emptyHintKey?: 'messages.emptyHint' | 'messages.emptyHintTutor';
};

function otherParticipant(conversation: Conversation, userId?: string) {
  return conversation.participants.find((p) => p.userId !== userId)?.user;
}

function matchesFilter(
  conversation: Conversation,
  filter: FilterId,
  userId: string | undefined,
  prefs: { forcedUnread: string[]; seenMessageId: Record<string, string> },
): boolean {
  if (filter === 'all') return true;
  if (filter === 'unread') return isConversationUnread(conversation, userId, prefs);
  if (filter === 'courses') return Boolean(conversation.courseId);
  if (filter === 'groups') {
    return conversation.participants.length > 2 || Boolean(conversation.courseId);
  }
  const other = otherParticipant(conversation, userId);
  const role = other?.role as Role | undefined;
  if (filter === 'teachers') return role === 'Tutor';
  if (filter === 'students') return role === 'Student' || role === 'Parent';
  if (filter === 'admins') return role === 'Admin' || role === 'InstituteAdmin';
  return true;
}

function previewTime(iso: string | undefined, language: string) {
  if (!iso) return '';
  const date = new Date(iso);
  const now = new Date();
  const sameDay =
    date.getFullYear() === now.getFullYear() &&
    date.getMonth() === now.getMonth() &&
    date.getDate() === now.getDate();
  return sameDay ? formatTime(iso, language) : formatDate(iso, language);
}

type RowItem =
  | { kind: 'section'; id: string; title: string; count?: number }
  | { kind: 'chat'; id: string; conversation: Conversation; pinned: boolean };

export function MessagesInbox({ emptyHintKey = 'messages.emptyHint' }: Props) {
  const { t, language, isRTL } = useTranslation();
  const { user } = useAuth();
  const router = useRouter();
  const [query, setQuery] = useState('');
  const [filter, setFilter] = useState<FilterId>('all');
  const [mode, setMode] = useState<ListMode>('inbox');
  const [menuId, setMenuId] = useState<string | null>(null);
  const conversationsQuery = useConversations();
  const {
    prefs,
    togglePinned,
    toggleArchived,
    markUnread,
    markRead,
    deleteChat,
  } = useConversationPrefs();
  const { refreshing, onRefresh } = useRefresh(async () => {
    await conversationsQuery.refetch();
  });

  const filters: { id: FilterId; label: string }[] = [
    { id: 'all', label: t('messages.filterAll') },
    { id: 'unread', label: t('messages.filterUnread') },
    { id: 'courses', label: t('messages.filterCourses') },
    { id: 'teachers', label: t('messages.filterTeachers') },
    { id: 'students', label: t('messages.filterStudents') },
    { id: 'admins', label: t('messages.filterAdmins') },
    { id: 'groups', label: t('messages.filterGroups') },
  ];

  const visible = useMemo(() => {
    const q = query.trim().toLowerCase();
    return (conversationsQuery.data ?? []).filter((item) => {
      if (prefs.deleted.includes(item.id)) return false;
      const archived = prefs.archived.includes(item.id);
      if (mode === 'archived' ? !archived : archived) return false;
      if (mode === 'inbox' && !matchesFilter(item, filter, user?.id, prefs)) {
        return false;
      }
      if (!q) return true;
      const other = otherParticipant(item, user?.id);
      const name = fullName(other?.firstName, other?.lastName).toLowerCase();
      const courseTitle = (item.title ?? '').toLowerCase();
      const preview = (item.messages?.[0]?.body ?? '').toLowerCase();
      return name.includes(q) || courseTitle.includes(q) || preview.includes(q);
    });
  }, [
    conversationsQuery.data,
    filter,
    mode,
    prefs.archived,
    prefs.deleted,
    prefs.forcedUnread,
    prefs.seenMessageId,
    query,
    user?.id,
  ]);

  const rows = useMemo(() => {
    if (mode === 'archived') {
      return visible.map(
        (conversation): RowItem => ({
          kind: 'chat',
          id: conversation.id,
          conversation,
          pinned: false,
        }),
      );
    }

    const pinned = visible.filter((item) => prefs.pinned.includes(item.id));
    const rest = visible.filter((item) => !prefs.pinned.includes(item.id));
    const next: RowItem[] = [];
    if (pinned.length) {
      next.push({
        kind: 'section',
        id: 'section-pinned',
        title: t('messages.pinned'),
        count: pinned.length,
      });
      pinned.forEach((conversation) => {
        next.push({ kind: 'chat', id: conversation.id, conversation, pinned: true });
      });
    }
    if (rest.length) {
      next.push({
        kind: 'section',
        id: 'section-chats',
        title: t('messages.chats'),
        count: rest.length,
      });
      rest.forEach((conversation) => {
        next.push({ kind: 'chat', id: conversation.id, conversation, pinned: false });
      });
    }
    return next;
  }, [mode, prefs.pinned, t, visible]);

  const menuConversation = menuId
    ? (conversationsQuery.data ?? []).find((item) => item.id === menuId)
    : undefined;
  const menuPinned = menuId ? prefs.pinned.includes(menuId) : false;
  const menuArchived = menuId ? prefs.archived.includes(menuId) : false;
  const chevron = isRTL ? 'chevron-back' : 'chevron-forward';

  const openChat = (id: string) => {
    const conversation = (conversationsQuery.data ?? []).find((item) => item.id === id);
    markRead(id, conversation?.messages?.[0]?.id);
    setMenuId(null);
    router.push(`/conversation/${id}`);
  };

  const listHeader = (
    <View style={styles.headerBlock}>
      <View style={styles.topRow}>
        <View style={styles.titleBlock}>
          <Text style={styles.title}>
            {mode === 'archived' ? t('messages.archivedTitle') : t('messages.title')}
          </Text>
          <Text style={styles.subtitle}>
            {mode === 'archived' ? t('messages.archivedSubtitle') : t('messages.subtitle')}
          </Text>
        </View>
        <View style={styles.headerActions}>
          {mode === 'archived' ? (
            <Pressable
              style={styles.headerIconBtn}
              onPress={() => setMode('inbox')}
              accessibilityLabel={t('common.back')}
            >
              <Ionicons name={isRTL ? 'arrow-forward' : 'arrow-back'} size={20} color={colors.primary} />
            </Pressable>
          ) : (
            <>
              <Pressable
                style={styles.headerIconBtn}
                onPress={() => setMode('archived')}
                accessibilityLabel={t('messages.archivedTitle')}
              >
                <Ionicons name="archive-outline" size={20} color={colors.primary} />
              </Pressable>
              <Pressable
                style={styles.headerIconBtn}
                onPress={() => router.push('/settings')}
                accessibilityLabel={t('profile.settings')}
              >
                <Ionicons name="settings-outline" size={20} color={colors.primary} />
              </Pressable>
            </>
          )}
        </View>
      </View>

      {mode === 'inbox' ? (
        <>
          <View style={styles.decorRow}>
            <Text style={styles.decorQuote}>{t('messages.decorQuote')}</Text>
            <Ionicons name="heart" size={12} color={colors.lavender} />
          </View>

          <View style={styles.searchRow}>
            <SearchBar
              value={query}
              onChangeText={setQuery}
              placeholder={t('messages.searchPlaceholder')}
              style={styles.search}
            />
          </View>

          <ScrollView
            horizontal
            showsHorizontalScrollIndicator={false}
            contentContainerStyle={styles.chips}
          >
            {filters.map((item) => {
              const active = filter === item.id;
              return (
                <Pressable
                  key={item.id}
                  onPress={() => setFilter(item.id)}
                  style={[styles.chip, active && styles.chipActive]}
                >
                  <Text style={[styles.chipText, active && styles.chipTextActive]}>
                    {item.label}
                  </Text>
                </Pressable>
              );
            })}
          </ScrollView>
        </>
      ) : (
        <SearchBar
          value={query}
          onChangeText={setQuery}
          placeholder={t('messages.searchPlaceholder')}
        />
      )}
    </View>
  );

  const renderChat = (conversation: Conversation, pinned: boolean) => {
    const other = otherParticipant(conversation, user?.id);
    const name = conversation.courseId
      ? conversation.title || t('messages.courseGroup')
      : fullName(other?.firstName, other?.lastName) || t('messages.title');
    const last = conversation.messages?.[0];
    const preview = last?.body;
    const unread = isConversationUnread(conversation, user?.id, prefs);
    const when = previewTime(last?.createdAt ?? conversation.updatedAt, language);

    return (
      <Pressable
        style={styles.card}
        onPress={() => openChat(conversation.id)}
        onLongPress={() => setMenuId(conversation.id)}
        delayLongPress={350}
      >
        <View style={styles.avatarCol}>
          {pinned ? (
            <Ionicons name="pin" size={12} color={colors.lavender} style={styles.pinMark} />
          ) : null}
          <View style={styles.avatarWrap}>
            <Avatar name={name} size={52} />
            {conversation.courseId ? (
              <View style={styles.courseMark}>
                <Ionicons name="school" size={10} color={colors.white} />
              </View>
            ) : (
              <View style={styles.onlineDot} />
            )}
          </View>
        </View>
        <View style={styles.body}>
          <View style={styles.rowTop}>
            <Text style={styles.name} numberOfLines={1}>
              {name}
            </Text>
            {when ? <Text style={styles.time}>{when}</Text> : null}
          </View>
          <View style={styles.rowBottom}>
            {preview ? (
              <Text
                style={[styles.preview, unread && styles.previewUnread]}
                numberOfLines={1}
              >
                {preview}
              </Text>
            ) : (
              <View style={{ flex: 1 }} />
            )}
            {unread ? (
              <View style={styles.unreadBadge}>
                <Text style={styles.unreadText}>1</Text>
              </View>
            ) : null}
            <Ionicons name={chevron} size={16} color={colors.textMuted} />
          </View>
        </View>
      </Pressable>
    );
  };

  return (
    <View style={styles.root}>
      <View style={styles.blobA} pointerEvents="none" />
      <View style={styles.blobB} pointerEvents="none" />

      <SafeAreaView style={styles.safe} edges={['top']}>
        {conversationsQuery.isLoading ? <LoadingState /> : null}
        {conversationsQuery.isError ? (
          <ErrorState onRetry={() => conversationsQuery.refetch()} />
        ) : null}

        {!conversationsQuery.isLoading && !conversationsQuery.isError ? (
          <View style={styles.flex}>
            <FlatList
              data={rows}
              keyExtractor={(item) => item.id}
              contentContainerStyle={styles.list}
              refreshControl={
                <RefreshControl refreshing={refreshing} onRefresh={onRefresh} />
              }
              ListHeaderComponent={listHeader}
              ListEmptyComponent={
                <EmptyState
                  title={
                    mode === 'archived' ? t('messages.archivedEmpty') : t('messages.empty')
                  }
                  subtitle={
                    mode === 'archived' ? t('messages.archivedEmptyHint') : t(emptyHintKey)
                  }
                />
              }
              renderItem={({ item }) => {
                if (item.kind === 'section') {
                  return (
                    <View style={styles.sectionRow}>
                      <Text style={styles.sectionTitle}>{item.title}</Text>
                      {typeof item.count === 'number' ? (
                        <Text style={styles.sectionCount}>{item.count}</Text>
                      ) : null}
                    </View>
                  );
                }
                return renderChat(item.conversation, item.pinned);
              }}
            />

            {mode === 'inbox' ? (
              <Pressable
                style={styles.fab}
                onPress={() =>
                  router.push({
                    pathname: '/(tabs)/explore',
                    params: { result: 'providers' },
                  })
                }
                accessibilityRole="button"
                accessibilityLabel={t('messages.compose')}
              >
                <Ionicons name="create-outline" size={24} color={colors.white} />
              </Pressable>
            ) : null}
          </View>
        ) : null}
      </SafeAreaView>

      <Modal
        visible={Boolean(menuId)}
        transparent
        animationType="fade"
        onRequestClose={() => setMenuId(null)}
      >
        <Pressable style={styles.menuBackdrop} onPress={() => setMenuId(null)}>
          <Pressable style={styles.menuCard} onPress={(e) => e.stopPropagation()}>
            {menuConversation ? (
              <Text style={styles.menuHeading} numberOfLines={1}>
                {fullName(
                  otherParticipant(menuConversation, user?.id)?.firstName,
                  otherParticipant(menuConversation, user?.id)?.lastName,
                )}
              </Text>
            ) : null}

            {mode === 'inbox' ? (
              <Pressable
                style={styles.menuItem}
                onPress={() => {
                  if (menuId) togglePinned(menuId);
                  setMenuId(null);
                }}
              >
                <Ionicons name="pin-outline" size={20} color={colors.primary} />
                <Text style={styles.menuItemText}>
                  {menuPinned ? t('messages.unpinChat') : t('messages.pinChat')}
                </Text>
              </Pressable>
            ) : null}

            <Pressable
              style={styles.menuItem}
              onPress={() => {
                if (menuId) markUnread(menuId);
                setMenuId(null);
              }}
            >
              <Ionicons name="notifications-outline" size={20} color={colors.primary} />
              <Text style={styles.menuItemText}>{t('messages.markUnread')}</Text>
            </Pressable>

            <Pressable
              style={styles.menuItem}
              onPress={() => {
                if (menuId) toggleArchived(menuId);
                setMenuId(null);
              }}
            >
              <Ionicons name="archive-outline" size={20} color={colors.primary} />
              <Text style={styles.menuItemText}>
                {menuArchived ? t('messages.unarchiveChat') : t('messages.archiveChat')}
              </Text>
            </Pressable>

            <Pressable
              style={styles.menuItem}
              onPress={() => {
                if (menuId) deleteChat(menuId);
                setMenuId(null);
              }}
            >
              <Ionicons name="trash-outline" size={20} color={colors.error} />
              <Text style={[styles.menuItemText, styles.menuDanger]}>
                {t('messages.deleteChat')}
              </Text>
            </Pressable>
          </Pressable>
        </Pressable>
      </Modal>
    </View>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1, backgroundColor: colors.background, overflow: 'hidden' },
  blobA: {
    position: 'absolute',
    top: -30,
    right: -40,
    width: 160,
    height: 140,
    borderRadius: 80,
    backgroundColor: colors.lavenderSoft,
    opacity: 0.7,
  },
  blobB: {
    position: 'absolute',
    top: 20,
    right: 40,
    width: 90,
    height: 80,
    borderRadius: 45,
    backgroundColor: '#F3E8E0',
    opacity: 0.65,
  },
  safe: { flex: 1 },
  flex: { flex: 1 },
  headerBlock: {
    gap: spacing.md,
    marginBottom: spacing.md,
  },
  topRow: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: spacing.md,
  },
  titleBlock: { flex: 1, gap: 4 },
  title: {
    ...typography.heading,
    color: colors.primary,
    fontSize: 28,
    lineHeight: 34,
  },
  subtitle: {
    ...typography.body,
    color: colors.textMuted,
    fontSize: 14,
  },
  headerActions: {
    flexDirection: 'row',
    gap: spacing.sm,
    paddingTop: 4,
  },
  headerIconBtn: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: colors.white,
    borderWidth: 1,
    borderColor: colors.border,
    alignItems: 'center',
    justifyContent: 'center',
    ...shadows.sm,
  },
  decorRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'flex-end',
    gap: 4,
    marginTop: -spacing.sm,
  },
  decorQuote: {
    ...typography.caption,
    color: colors.lavender,
    fontStyle: 'italic',
    fontSize: 12,
  },
  searchRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
  },
  search: { flex: 1 },
  chips: { gap: spacing.sm, paddingVertical: 2 },
  chip: {
    paddingHorizontal: spacing.lg,
    paddingVertical: spacing.sm,
    borderRadius: radius.full,
    backgroundColor: colors.beige,
  },
  chipActive: {
    backgroundColor: colors.primary,
  },
  chipText: {
    ...typography.caption,
    color: colors.textSecondary,
    fontWeight: '700',
  },
  chipTextActive: { color: colors.white },
  list: {
    paddingHorizontal: spacing.xl,
    paddingBottom: spacing.massive + 24,
  },
  sectionRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
    marginBottom: spacing.sm,
    marginTop: spacing.xs,
  },
  sectionTitle: {
    ...typography.subheading,
    color: colors.primary,
    fontSize: 16,
  },
  sectionCount: {
    ...typography.caption,
    color: colors.textMuted,
    fontWeight: '700',
  },
  card: {
    flexDirection: 'row',
    gap: spacing.md,
    backgroundColor: colors.white,
    borderRadius: radius.xl,
    padding: spacing.lg,
    marginBottom: spacing.md,
    ...shadows.sm,
  },
  avatarCol: {
    alignItems: 'center',
    gap: 2,
  },
  pinMark: { marginBottom: -2 },
  avatarWrap: { position: 'relative' },
  onlineDot: {
    position: 'absolute',
    right: 1,
    bottom: 1,
    width: 12,
    height: 12,
    borderRadius: 6,
    backgroundColor: colors.success,
    borderWidth: 2,
    borderColor: colors.white,
  },
  courseMark: {
    position: 'absolute',
    right: 0,
    bottom: 0,
    width: 18,
    height: 18,
    borderRadius: 9,
    backgroundColor: colors.primary,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 2,
    borderColor: colors.white,
  },
  body: { flex: 1, justifyContent: 'center', gap: 4 },
  rowTop: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: spacing.sm,
  },
  rowBottom: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
  },
  name: {
    ...typography.subheading,
    color: colors.text,
    flex: 1,
    fontSize: 16,
  },
  time: {
    ...typography.caption,
    color: colors.textMuted,
    fontSize: 12,
  },
  preview: {
    ...typography.caption,
    color: colors.textSecondary,
    flex: 1,
  },
  previewUnread: {
    color: colors.text,
    fontWeight: '600',
  },
  unreadBadge: {
    minWidth: 20,
    height: 20,
    borderRadius: 10,
    backgroundColor: colors.lavender,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 5,
  },
  unreadText: {
    ...typography.caption,
    color: colors.white,
    fontWeight: '800',
    fontSize: 11,
    lineHeight: 14,
  },
  fab: {
    position: 'absolute',
    right: spacing.xl,
    bottom: spacing.xl,
    width: 56,
    height: 56,
    borderRadius: 28,
    backgroundColor: colors.primary,
    alignItems: 'center',
    justifyContent: 'center',
    ...shadows.md,
  },
  menuBackdrop: {
    flex: 1,
    backgroundColor: colors.overlay,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: spacing.xl,
  },
  menuCard: {
    width: '100%',
    maxWidth: 340,
    backgroundColor: colors.white,
    borderRadius: radius.xl,
    paddingVertical: spacing.sm,
    paddingHorizontal: spacing.sm,
    ...shadows.md,
  },
  menuHeading: {
    ...typography.caption,
    color: colors.textMuted,
    fontWeight: '700',
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm,
  },
  menuItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.md,
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.md,
    borderRadius: radius.lg,
  },
  menuItemText: {
    ...typography.body,
    color: colors.text,
    fontWeight: '600',
  },
  menuDanger: {
    color: colors.error,
  },
});
