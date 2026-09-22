import { Ionicons } from '@expo/vector-icons';
import { useNavigation, useRouter } from 'expo-router';
import React, { useLayoutEffect, useMemo, useState } from 'react';
import {
  FlatList,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useTranslation } from '@/i18n';
import { colors, radius, shadows, spacing, typography } from '@/theme';

type NotifFilter = 'all' | 'courses' | 'messages' | 'alerts';
type NotifKind = 'booking' | 'message' | 'reminder' | 'announcement' | 'rating' | 'group';

type AppNotification = {
  id: string;
  kind: NotifKind;
  filter: Exclude<NotifFilter, 'all'>;
  titleKey: string;
  bodyKey: string;
  relativeKey: string;
  day: 'today' | 'yesterday';
  unread: boolean;
  href?: string;
  snippet?: string;
  metaDate?: string;
  metaTime?: string;
  rating?: number;
};

const SEED: AppNotification[] = [
  {
    id: 'n1',
    kind: 'booking',
    filter: 'courses',
    titleKey: 'notifications.bookingConfirmedTitle',
    bodyKey: 'notifications.bookingConfirmedBody',
    relativeKey: 'notifications.minsAgo',
    day: 'today',
    unread: true,
    href: '/(tabs)/bookings',
  },
  {
    id: 'n2',
    kind: 'message',
    filter: 'messages',
    titleKey: 'notifications.newMessageTitle',
    bodyKey: 'notifications.newMessageBody',
    relativeKey: 'notifications.minsAgo',
    day: 'today',
    unread: true,
    href: '/(tabs)/messages',
    snippet: 'Perfect, thank you!',
  },
  {
    id: 'n3',
    kind: 'reminder',
    filter: 'alerts',
    titleKey: 'notifications.sessionReminderTitle',
    bodyKey: 'notifications.sessionReminderBody',
    relativeKey: 'notifications.hoursAgo',
    day: 'today',
    unread: true,
    href: '/(tabs)/bookings',
    metaDate: 'notifications.sampleDate',
    metaTime: 'notifications.sampleTime',
  },
  {
    id: 'n4',
    kind: 'announcement',
    filter: 'courses',
    titleKey: 'notifications.announcementTitle',
    bodyKey: 'notifications.announcementBody',
    relativeKey: 'notifications.yesterdayTime',
    day: 'yesterday',
    unread: false,
    href: '/(tabs)/explore',
  },
  {
    id: 'n5',
    kind: 'rating',
    filter: 'alerts',
    titleKey: 'notifications.ratingTitle',
    bodyKey: 'notifications.ratingBody',
    relativeKey: 'notifications.yesterdayTime',
    day: 'yesterday',
    unread: false,
    rating: 5,
  },
  {
    id: 'n6',
    kind: 'group',
    filter: 'alerts',
    titleKey: 'notifications.groupAcceptedTitle',
    bodyKey: 'notifications.groupAcceptedBody',
    relativeKey: 'notifications.yesterdayTime',
    day: 'yesterday',
    unread: false,
  },
];

function iconFor(kind: NotifKind): {
  name: keyof typeof Ionicons.glyphMap;
  bg: string;
  fg: string;
} {
  switch (kind) {
    case 'booking':
      return { name: 'people', bg: colors.lavenderSoft, fg: colors.primary };
    case 'message':
      return { name: 'chatbubble', bg: colors.infoSoft, fg: colors.info };
    case 'reminder':
      return { name: 'calendar', bg: colors.warningSoft, fg: colors.warning };
    case 'announcement':
      return { name: 'megaphone', bg: colors.successSoft, fg: colors.success };
    case 'rating':
      return { name: 'star', bg: '#F7EED9', fg: colors.star };
    case 'group':
      return { name: 'document-text', bg: colors.beige, fg: colors.primary };
  }
}

type Row =
  | { kind: 'section'; id: string; title: string; showMarkAll?: boolean }
  | { kind: 'item'; id: string; notification: AppNotification };

export default function NotificationsScreen() {
  const { t, isRTL } = useTranslation();
  const navigation = useNavigation();
  const router = useRouter();
  const [filter, setFilter] = useState<NotifFilter>('all');
  const [items, setItems] = useState(SEED);
  const chevron = isRTL ? 'chevron-back' : 'chevron-forward';

  useLayoutEffect(() => {
    navigation.setOptions({ headerShown: false });
  }, [navigation]);

  const filters: { id: NotifFilter; label: string }[] = [
    { id: 'all', label: t('notifications.filterAll') },
    { id: 'courses', label: t('notifications.filterCourses') },
    { id: 'messages', label: t('notifications.filterMessages') },
    { id: 'alerts', label: t('notifications.filterAlerts') },
  ];

  const rows = useMemo(() => {
    const visible = items.filter((item) => filter === 'all' || item.filter === filter);
    const today = visible.filter((item) => item.day === 'today');
    const yesterday = visible.filter((item) => item.day === 'yesterday');
    const next: Row[] = [];
    if (today.length) {
      next.push({
        kind: 'section',
        id: 'today',
        title: t('notifications.today'),
        showMarkAll: today.some((item) => item.unread),
      });
      today.forEach((notification) => {
        next.push({ kind: 'item', id: notification.id, notification });
      });
    }
    if (yesterday.length) {
      next.push({
        kind: 'section',
        id: 'yesterday',
        title: t('notifications.yesterday'),
      });
      yesterday.forEach((notification) => {
        next.push({ kind: 'item', id: notification.id, notification });
      });
    }
    return next;
  }, [filter, items, t]);

  const markAllRead = () => {
    setItems((prev) => prev.map((item) => ({ ...item, unread: false })));
  };

  const openItem = (notification: AppNotification) => {
    setItems((prev) =>
      prev.map((item) => (item.id === notification.id ? { ...item, unread: false } : item)),
    );
    if (notification.href) {
      router.push(notification.href as never);
    }
  };

  return (
    <View style={styles.root}>
      <View style={styles.blobA} pointerEvents="none" />
      <View style={styles.blobB} pointerEvents="none" />

      <SafeAreaView style={styles.safe} edges={['top']}>
        <View style={styles.topBar}>
          <Pressable
            style={styles.backBtn}
            onPress={() => router.back()}
            accessibilityLabel={t('common.back')}
          >
            <Ionicons
              name={isRTL ? 'arrow-forward' : 'arrow-back'}
              size={20}
              color={colors.primary}
            />
          </Pressable>
        </View>

        <FlatList
          data={rows}
          keyExtractor={(item) => item.id}
          contentContainerStyle={styles.list}
          ListHeaderComponent={
            <View style={styles.headerBlock}>
              <View style={styles.decorRow}>
                <Text style={styles.decorQuote}>{t('notifications.decorQuote')}</Text>
                <Ionicons name="heart" size={12} color={colors.lavender} />
              </View>
              <Text style={styles.title}>{t('notifications.title')}</Text>
              <Text style={styles.subtitle}>{t('notifications.subtitle')}</Text>

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
            </View>
          }
          ListEmptyComponent={
            <View style={styles.empty}>
              <Text style={styles.emptyTitle}>{t('notifications.empty')}</Text>
              <Text style={styles.emptyHint}>{t('notifications.emptyHint')}</Text>
            </View>
          }
          renderItem={({ item }) => {
            if (item.kind === 'section') {
              return (
                <View style={styles.sectionRow}>
                  <Text style={styles.sectionTitle}>{item.title}</Text>
                  {item.showMarkAll ? (
                    <Pressable style={styles.markAll} onPress={markAllRead}>
                      <Ionicons name="checkmark-done-outline" size={16} color={colors.primary} />
                      <Text style={styles.markAllText}>{t('notifications.markAllRead')}</Text>
                    </Pressable>
                  ) : null}
                </View>
              );
            }

            const notification = item.notification;
            const icon = iconFor(notification.kind);

            return (
              <Pressable style={styles.card} onPress={() => openItem(notification)}>
                {notification.unread ? <View style={styles.unreadDot} /> : <View style={styles.dotSpacer} />}
                <View style={[styles.iconWrap, { backgroundColor: icon.bg }]}>
                  <Ionicons name={icon.name} size={18} color={icon.fg} />
                </View>
                <View style={styles.cardBody}>
                  <View style={styles.cardTop}>
                    <Text style={styles.cardTitle} numberOfLines={1}>
                      {t(notification.titleKey)}
                    </Text>
                    <Text style={styles.relative}>{t(notification.relativeKey)}</Text>
                  </View>
                  <Text style={styles.cardBodyText} numberOfLines={2}>
                    {t(notification.bodyKey)}
                  </Text>
                  {notification.snippet ? (
                    <View style={styles.snippet}>
                      <Text style={styles.snippetText} numberOfLines={1}>
                        {notification.snippet}
                      </Text>
                    </View>
                  ) : null}
                  {notification.metaDate && notification.metaTime ? (
                    <View style={styles.metaBox}>
                      <Ionicons name="calendar-outline" size={14} color={colors.primary} />
                      <Text style={styles.metaText}>{t(notification.metaDate)}</Text>
                      <Text style={styles.metaDot}>·</Text>
                      <Text style={styles.metaText}>{t(notification.metaTime)}</Text>
                    </View>
                  ) : null}
                  {notification.rating ? (
                    <View style={styles.stars}>
                      {Array.from({ length: notification.rating }).map((_, index) => (
                        <Ionicons key={index} name="star" size={14} color={colors.star} />
                      ))}
                    </View>
                  ) : null}
                </View>
                <Ionicons name={chevron} size={16} color={colors.textMuted} />
              </Pressable>
            );
          }}
        />
      </SafeAreaView>
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
    top: 24,
    right: 48,
    width: 90,
    height: 80,
    borderRadius: 45,
    backgroundColor: '#F3E8E0',
    opacity: 0.65,
  },
  safe: { flex: 1 },
  topBar: {
    paddingHorizontal: spacing.xl,
    paddingTop: spacing.sm,
  },
  backBtn: {
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
  list: {
    paddingHorizontal: spacing.xl,
    paddingBottom: spacing.massive,
  },
  headerBlock: { gap: spacing.md, marginBottom: spacing.md },
  decorRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'flex-end',
    gap: 4,
  },
  decorQuote: {
    ...typography.caption,
    color: colors.lavender,
    fontStyle: 'italic',
    fontSize: 12,
  },
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
  chips: { gap: spacing.sm, paddingVertical: 2 },
  chip: {
    paddingHorizontal: spacing.lg,
    paddingVertical: spacing.sm,
    borderRadius: radius.full,
    backgroundColor: colors.beige,
  },
  chipActive: { backgroundColor: colors.primary },
  chipText: {
    ...typography.caption,
    color: colors.textSecondary,
    fontWeight: '700',
  },
  chipTextActive: { color: colors.white },
  sectionRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: spacing.sm,
    marginTop: spacing.xs,
  },
  sectionTitle: {
    ...typography.subheading,
    color: colors.primary,
    fontSize: 16,
  },
  markAll: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  markAllText: {
    ...typography.caption,
    color: colors.primary,
    fontWeight: '700',
  },
  card: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: spacing.sm,
    backgroundColor: colors.white,
    borderRadius: radius.xl,
    padding: spacing.lg,
    marginBottom: spacing.md,
    ...shadows.sm,
  },
  unreadDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: colors.lavender,
    marginTop: 18,
  },
  dotSpacer: { width: 8, marginTop: 18 },
  iconWrap: {
    width: 40,
    height: 40,
    borderRadius: 20,
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: 2,
  },
  cardBody: { flex: 1, gap: 4 },
  cardTop: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: spacing.sm,
  },
  cardTitle: {
    ...typography.body,
    color: colors.text,
    fontWeight: '700',
    flex: 1,
    fontSize: 15,
  },
  relative: {
    ...typography.caption,
    color: colors.textMuted,
    fontSize: 11,
  },
  cardBodyText: {
    ...typography.caption,
    color: colors.textSecondary,
    lineHeight: 18,
  },
  snippet: {
    marginTop: 4,
    alignSelf: 'flex-start',
    backgroundColor: colors.lavenderSoft,
    borderRadius: radius.lg,
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm,
  },
  snippetText: {
    ...typography.caption,
    color: colors.primary,
    fontStyle: 'italic',
  },
  metaBox: {
    marginTop: 6,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    backgroundColor: colors.lavenderSoft,
    borderRadius: radius.lg,
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm,
    alignSelf: 'flex-start',
  },
  metaText: {
    ...typography.caption,
    color: colors.primary,
    fontWeight: '600',
    fontSize: 12,
  },
  metaDot: { color: colors.textMuted },
  stars: { flexDirection: 'row', gap: 2, marginTop: 4 },
  empty: { paddingVertical: spacing.xxl, alignItems: 'center', gap: spacing.sm },
  emptyTitle: { ...typography.subheading, color: colors.text },
  emptyHint: { ...typography.caption, color: colors.textMuted, textAlign: 'center' },
});
