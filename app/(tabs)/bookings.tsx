import { Ionicons } from '@expo/vector-icons';
import React, { useEffect, useMemo, useState } from 'react';
import {
  FlatList,
  Linking,
  Pressable,
  RefreshControl,
  StyleSheet,
  Text,
  View,
} from 'react-native';
import Animated, {
  useAnimatedStyle,
  useSharedValue,
  withSpring,
} from 'react-native-reanimated';
import { SafeAreaView } from 'react-native-safe-area-context';
import { BookingCard } from '@/components/BookingCard';
import { EmptyState } from '@/components/EmptyState';
import { ErrorState } from '@/components/ErrorState';
import { LoadingState } from '@/components/LoadingState';
import { SearchBar } from '@/components/SearchBar';
import { useMyBookings } from '@/features/bookings/hooks';
import { useRefresh } from '@/hooks/useRefresh';
import { useTranslation } from '@/i18n';
import { colors, radius, shadows, spacing, typography } from '@/theme';
import { courseTitle, fullName } from '@/utils/format';
import { yogaDirection } from '@/utils/rtl';

type Segment = 'upcoming' | 'past';

const PAST_STATUSES = new Set(['Completed', 'Cancelled', 'Refunded']);
const SEGMENT_PAD = 4;

export default function BookingsScreen() {
  const { t, language, isRTL } = useTranslation();
  const [segment, setSegment] = useState<Segment>('upcoming');
  const [query, setQuery] = useState('');
  const [trackWidth, setTrackWidth] = useState(0);
  const bookingsQuery = useMyBookings();
  const { refreshing, onRefresh } = useRefresh(async () => {
    await bookingsQuery.refetch();
  });
  const chevron = isRTL ? 'chevron-back' : 'chevron-forward';
  const progress = useSharedValue(0);
  const segmentOrder = isRTL
    ? (['past', 'upcoming'] as const)
    : (['upcoming', 'past'] as const);

  useEffect(() => {
    const order = isRTL ? (['past', 'upcoming'] as const) : (['upcoming', 'past'] as const);
    const index = order.indexOf(segment);
    progress.value = withSpring(index < 0 ? 0 : index, {
      damping: 18,
      stiffness: 220,
      mass: 0.7,
    });
  }, [isRTL, progress, segment]);

  const pillStyle = useAnimatedStyle(() => {
    const inner = Math.max(trackWidth - SEGMENT_PAD * 2, 0);
    const half = inner / 2;
    return {
      width: half || 1,
      transform: [{ translateX: progress.value * half }],
    };
  });

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    const list = (bookingsQuery.data ?? []).filter((b) => {
      const isPast = PAST_STATUSES.has(b.status);
      if (segment === 'past' ? !isPast : isPast) return false;
      if (!q) return true;
      const title = b.course ? courseTitle(b.course, language).toLowerCase() : '';
      const tutor = fullName(b.course?.tutor?.firstName, b.course?.tutor?.lastName).toLowerCase();
      return title.includes(q) || tutor.includes(q) || b.status.toLowerCase().includes(q);
    });
    return list;
  }, [bookingsQuery.data, language, query, segment]);

  const listHeader = (
    <View style={styles.headerBlock}>
      <View style={styles.decorRow}>
        <Text style={styles.decorQuote}>{t('bookings.decorQuote')}</Text>
        <Text style={styles.decorHeart}>💜</Text>
      </View>

      <View style={styles.titleBlock}>
        <Text style={styles.title}>{t('bookings.title')}</Text>
        <Text style={styles.subtitle}>{t('bookings.subtitle')}</Text>
      </View>

      <View
        style={[styles.segments, yogaDirection(false)]}
        onLayout={(e) => setTrackWidth(e.nativeEvent.layout.width)}
      >
        <Animated.View style={[styles.segmentPill, pillStyle]} />
        {segmentOrder.map((id) => {
          const active = segment === id;
          return (
            <Pressable
              key={id}
              onPress={() => setSegment(id)}
              style={styles.segment}
              accessibilityRole="button"
              accessibilityState={{ selected: active }}
            >
              <Text style={[styles.segmentText, active && styles.segmentTextActive]}>
                {id === 'upcoming' ? t('bookings.upcoming') : t('bookings.past')}
              </Text>
            </Pressable>
          );
        })}
      </View>

      <View style={styles.searchRow}>
        <SearchBar
          value={query}
          onChangeText={setQuery}
          placeholder={t('bookings.searchPlaceholder')}
          style={styles.search}
        />
        <Pressable style={styles.filterBtn} hitSlop={4}>
          <Ionicons name="options-outline" size={20} color={colors.primary} />
        </Pressable>
      </View>

      <View style={styles.sectionRow}>
        <Text style={styles.sectionTitle}>
          {segment === 'upcoming' ? t('bookings.upcoming') : t('bookings.past')} ({filtered.length})
        </Text>
        {filtered.length > 0 ? (
          <Pressable style={styles.seeAll} onPress={() => setQuery('')}>
            <Text style={styles.seeAllText}>{t('common.seeAll')}</Text>
            <Ionicons name={chevron} size={14} color={colors.primary} />
          </Pressable>
        ) : null}
      </View>
    </View>
  );

  return (
    <View style={styles.root}>
      <View style={styles.blobA} pointerEvents="none" />
      <View style={styles.blobB} pointerEvents="none" />

      <SafeAreaView style={styles.safe} edges={['top']}>
        {bookingsQuery.isLoading ? <LoadingState /> : null}
        {bookingsQuery.isError ? (
          <ErrorState onRetry={() => bookingsQuery.refetch()} />
        ) : null}

        {!bookingsQuery.isLoading && !bookingsQuery.isError ? (
          <FlatList
            data={filtered}
            keyExtractor={(item) => item.id}
            contentContainerStyle={styles.list}
            refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} />}
            ListHeaderComponent={listHeader}
            ListEmptyComponent={
              <EmptyState
                title={
                  segment === 'upcoming' ? t('bookings.emptyUpcoming') : t('bookings.emptyPast')
                }
                subtitle={t('bookings.emptyHint')}
              />
            }
            ListFooterComponent={
              <Pressable
                style={styles.helpCard}
                onPress={() => Linking.openURL('mailto:support@dars.app')}
              >
                <View style={styles.helpIcon}>
                  <Ionicons name="help-buoy-outline" size={22} color={colors.primary} />
                </View>
                <View style={styles.helpBody}>
                  <Text style={styles.helpTitle}>{t('bookings.needHelp')}</Text>
                  <Text style={styles.helpSubtitle}>{t('bookings.needHelpHint')}</Text>
                </View>
                <Ionicons name={chevron} size={18} color={colors.textMuted} />
              </Pressable>
            }
            renderItem={({ item }) => <BookingCard booking={item} />}
          />
        ) : null}
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
    top: 20,
    right: 40,
    width: 90,
    height: 80,
    borderRadius: 45,
    backgroundColor: '#F3E8E0',
    opacity: 0.65,
  },
  safe: { flex: 1 },
  headerBlock: {
    gap: spacing.md,
    marginBottom: spacing.sm,
  },
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
  decorHeart: { fontSize: 11 },
  titleBlock: { gap: 4 },
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
  segments: {
    flexDirection: 'row',
    backgroundColor: colors.beige,
    borderRadius: radius.full,
    padding: SEGMENT_PAD,
    position: 'relative',
    overflow: 'hidden',
  },
  segmentPill: {
    position: 'absolute',
    top: SEGMENT_PAD,
    bottom: SEGMENT_PAD,
    left: SEGMENT_PAD,
    borderRadius: radius.full,
    backgroundColor: colors.primary,
  },
  segment: {
    flex: 1,
    paddingVertical: spacing.sm,
    borderRadius: radius.full,
    alignItems: 'center',
    zIndex: 1,
  },
  segmentText: {
    ...typography.caption,
    color: colors.textSecondary,
    fontWeight: '700',
  },
  segmentTextActive: { color: colors.white },
  searchRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
  },
  search: { flex: 1 },
  filterBtn: {
    width: 48,
    height: 48,
    borderRadius: radius.lg,
    backgroundColor: colors.white,
    borderWidth: 1,
    borderColor: colors.border,
    alignItems: 'center',
    justifyContent: 'center',
    ...shadows.sm,
  },
  sectionRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginTop: spacing.xs,
  },
  sectionTitle: {
    ...typography.subheading,
    color: colors.primary,
    fontSize: 16,
  },
  seeAll: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 2,
  },
  seeAllText: {
    ...typography.caption,
    color: colors.primary,
    fontWeight: '700',
  },
  list: {
    paddingHorizontal: spacing.xl,
    paddingBottom: spacing.massive,
  },
  helpCard: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.md,
    backgroundColor: colors.lavenderSoft,
    borderRadius: radius.xl,
    padding: spacing.lg,
    marginTop: spacing.sm,
  },
  helpIcon: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: colors.white,
    alignItems: 'center',
    justifyContent: 'center',
  },
  helpBody: { flex: 1, gap: 2 },
  helpTitle: {
    ...typography.subheading,
    color: colors.primary,
    fontSize: 15,
  },
  helpSubtitle: {
    ...typography.caption,
    color: colors.textSecondary,
  },
});
