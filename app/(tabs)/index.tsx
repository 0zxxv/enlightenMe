import { Ionicons } from '@expo/vector-icons';
import { Image } from 'expo-image';
import { useRouter } from 'expo-router';
import React, { useMemo, useState } from 'react';
import {
  Pressable,
  RefreshControl,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Avatar } from '@/components/Avatar';
import { CourseCard } from '@/components/CourseCard';
import { EmptyState } from '@/components/EmptyState';
import { ErrorState } from '@/components/ErrorState';
import { IconButton } from '@/components/IconButton';
import { LoadingState } from '@/components/LoadingState';
import { SearchBar } from '@/components/SearchBar';
import { SectionHeader } from '@/components/SectionHeader';
import { SERVICE_CATEGORY_CHIPS } from '@/constants/catalog';
import { useAuth } from '@/features/auth/useAuth';
import { useMyBookings } from '@/features/bookings/hooks';
import { useCourses } from '@/features/courses/hooks';
import { useFavorites } from '@/features/favorites/hooks';
import { useHasUnreadMessages } from '@/features/messages/useHasUnreadMessages';
import { useLayout } from '@/hooks/useLayout';
import { useRefresh } from '@/hooks/useRefresh';
import { useTranslation } from '@/i18n';
import { colors, radius, shadows, spacing, typography } from '@/theme';
import type { Booking, CourseFormat } from '@/types/models';
import { courseTitle, formatTime, fullName } from '@/utils/format';
import { resolveCourseImageSource } from '@/utils/courseImages';

const PAST_STATUSES = new Set(['Completed', 'Cancelled', 'Refunded']);

function formatClassDay(iso: string | undefined, language: string) {
  if (!iso) return { weekday: '—', day: '', month: '' };
  const date = new Date(iso);
  const weekday = date.toLocaleDateString(language === 'ar' ? 'ar' : 'en', { weekday: 'short' });
  const day = String(date.getDate());
  const month = date.toLocaleDateString(language === 'ar' ? 'ar' : 'en', { month: 'short' });
  return { weekday, day, month };
}

function formatLabel(format: CourseFormat | undefined, t: (key: string) => string) {
  if (format === 'Online') return t('home.onlineClass');
  if (format === 'InPerson') return t('home.inPersonClass');
  if (format === 'Hybrid') return t('home.hybridClass');
  return t('home.onlineClass');
}

function progressForBooking(booking: Booking) {
  const total = Math.max(booking.course?.sessionCount ?? booking.course?.curriculum?.length ?? 8, 1);
  const done = Math.min(Math.max(Math.round(total * 0.6), 1), total);
  return { done, total, pct: Math.round((done / total) * 100) };
}

export default function HomeScreen() {
  const { t, language, isRTL } = useTranslation();
  const { user } = useAuth();
  const router = useRouter();
  const layout = useLayout();
  const [query, setQuery] = useState('');
  const hasUnreadMessages = useHasUnreadMessages();

  const coursesQuery = useCourses({ pageSize: layout.courseColumns * 2 });
  const bookingsQuery = useMyBookings();
  const favoritesQuery = useFavorites();

  const { refreshing, onRefresh } = useRefresh(async () => {
    await Promise.all([
      coursesQuery.refetch(),
      bookingsQuery.refetch(),
      favoritesQuery.refetch(),
    ]);
  });

  const firstName = user?.firstName ?? t('brand.name');
  const displayName = fullName(user?.firstName, user?.lastName) || firstName;
  const chevron = isRTL ? 'chevron-back' : 'chevron-forward';
  const rowDir = isRTL ? ('row-reverse' as const) : ('row' as const);

  const upcomingBooking = useMemo(() => {
    const now = Date.now();
    return (bookingsQuery.data ?? [])
      .filter((b) => !PAST_STATUSES.has(b.status) && b.session?.startsAt)
      .filter((b) => new Date(b.session!.startsAt).getTime() >= now - 60 * 60 * 1000)
      .sort(
        (a, b) =>
          new Date(a.session!.startsAt).getTime() - new Date(b.session!.startsAt).getTime(),
      )[0];
  }, [bookingsQuery.data]);

  const continueBookings = useMemo(() => {
    return (bookingsQuery.data ?? []).filter((b) => !PAST_STATUSES.has(b.status) && b.course);
  }, [bookingsQuery.data]);

  const activeCourses = useMemo(() => continueBookings.length, [continueBookings]);
  const hoursLearned = useMemo(() => {
    return (bookingsQuery.data ?? []).reduce((sum, b) => {
      const mins = b.course?.durationMinutes ?? 60;
      return sum + mins / 60;
    }, 0);
  }, [bookingsQuery.data]);
  const favoritesCount = favoritesQuery.data?.length ?? 0;

  const onSearch = () => {
    router.push({ pathname: '/(tabs)/explore', params: { q: query } });
  };

  const courseGap = spacing.md;
  const courseWidthPct = `${100 / Math.min(layout.courseColumns, 2)}%` as `${number}%`;

  const dayBits = formatClassDay(upcomingBooking?.session?.startsAt, language);
  const continueCardWidth = Math.min(layout.width - layout.contentPadding * 2 - 28, 340);

  return (
    <SafeAreaView style={styles.safe} edges={['top']}>
      <ScrollView
        contentContainerStyle={[
          styles.content,
          {
            paddingHorizontal: layout.contentPadding,
            paddingBottom: spacing.massive,
            maxWidth: layout.contentMaxWidth ?? '100%',
            alignSelf: 'center',
            width: '100%',
          },
        ]}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} />}
        showsVerticalScrollIndicator={false}
      >
        <View style={[styles.header, { flexDirection: rowDir }]}>
          <View style={styles.brandBlock}>
            <Text style={styles.logoWord}>
              {t('brand.name').toLowerCase()}
              <Text style={styles.logoDot}>.</Text>
            </Text>
            <Text style={styles.brandTagline}>{t('brand.tagline')}</Text>
          </View>
          <View style={[styles.headerRight, { flexDirection: rowDir }]}>
            <View>
              <IconButton
                name="notifications-outline"
                onPress={() => router.push('/notifications')}
              />
            </View>
            <Pressable
              style={[styles.profileChip, { flexDirection: rowDir }]}
              onPress={() => router.push('/(tabs)/profile')}
            >
              <Avatar name={displayName} size={40} />
              <Text style={styles.helloText} numberOfLines={1}>
                {t('home.hello').replace('{{name}}', firstName)}
              </Text>
            </Pressable>
          </View>
        </View>

        <View style={styles.searchRow}>
          <SearchBar
            value={query}
            onChangeText={setQuery}
            placeholder={t('home.searchPlaceholder')}
            onSubmit={onSearch}
            trailingIcon="scan-outline"
            onTrailingPress={onSearch}
            style={styles.search}
          />
          <Pressable
            style={styles.filterBtn}
            onPress={() => router.push('/(tabs)/explore')}
            hitSlop={4}
          >
            <Ionicons name="options-outline" size={20} color={colors.primary} />
          </Pressable>
        </View>

        <View style={[styles.categoryCards, { flexDirection: rowDir }]}>
          {SERVICE_CATEGORY_CHIPS.map((chip) => (
            <Pressable
              key={chip.id}
              style={[styles.categoryCard, { backgroundColor: chip.soft }]}
              onPress={() =>
                router.push({
                  pathname: '/(tabs)/explore',
                  params: { serviceType: chip.id, result: 'services' },
                })
              }
            >
              <View style={styles.categoryCardTop}>
                <Ionicons name={chip.icon} size={22} color={chip.tint} />
                <Ionicons name={chevron} size={16} color={chip.tint} />
              </View>
              <Text style={[styles.categoryCardTitle, { color: chip.tint }]}>
                {t(chip.labelKey)}
              </Text>
              <Text style={styles.categoryCardHint}>{t(chip.hintKey)}</Text>
            </Pressable>
          ))}
        </View>

        <SectionHeader
          title={t('home.upcomingClass')}
          actionLabel={t('common.seeAll')}
          onAction={() => router.push('/(tabs)/bookings')}
        />
        {upcomingBooking?.course ? (
          <View style={styles.upcomingCard}>
            <View style={styles.upcomingDecorA} pointerEvents="none" />
            <View style={styles.upcomingDecorB} pointerEvents="none" />
            <View style={[styles.upcomingInner, { flexDirection: rowDir }]}>
              <View style={styles.dateBlock}>
                <Text style={styles.dateWeekday}>{dayBits.weekday}</Text>
                <Text style={styles.dateDay}>{dayBits.day}</Text>
                <Text style={styles.dateMonth}>{dayBits.month}</Text>
              </View>
              <View style={styles.upcomingBody}>
                <View style={[styles.upcomingTitleRow, { flexDirection: rowDir }]}>
                  <View style={styles.upcomingCopy}>
                    {upcomingBooking.course.courseCode ? (
                      <Text style={styles.courseCode}>{upcomingBooking.course.courseCode}</Text>
                    ) : null}
                    <Text style={styles.upcomingTitle} numberOfLines={2}>
                      {courseTitle(upcomingBooking.course, language)}
                    </Text>
                  </View>
                  <Pressable hitSlop={8} style={styles.moreBtn}>
                    <Ionicons name="ellipsis-horizontal" size={18} color={colors.textMuted} />
                  </Pressable>
                </View>
                <View style={[styles.metaRow, { flexDirection: rowDir }]}>
                  <Ionicons
                    name={
                      upcomingBooking.course.format === 'InPerson'
                        ? 'people-outline'
                        : 'videocam-outline'
                    }
                    size={14}
                    color={colors.textMuted}
                  />
                  <Text style={styles.metaText}>
                    {formatLabel(upcomingBooking.course.format, t)}
                  </Text>
                </View>
                <View style={[styles.metaRow, { flexDirection: rowDir }]}>
                  <Ionicons name="time-outline" size={14} color={colors.textMuted} />
                  <Text style={styles.metaText}>
                    {formatTime(upcomingBooking.session!.startsAt, language)}
                    {' – '}
                    {formatTime(upcomingBooking.session!.endsAt, language)}
                  </Text>
                </View>
                <Pressable
                  style={styles.joinBtn}
                  onPress={() => router.push(`/booking/detail/${upcomingBooking.id}`)}
                >
                  <Text style={styles.joinBtnText}>{t('home.joinClass')}</Text>
                </Pressable>
              </View>
            </View>
          </View>
        ) : (
          <View style={styles.emptyCard}>
            <Text style={styles.emptyTitle}>{t('home.noUpcomingClass')}</Text>
            <Text style={styles.emptyHint}>{t('home.noUpcomingClassHint')}</Text>
          </View>
        )}

        <SectionHeader title={t('home.quickActions')} />
        <ScrollView
          horizontal
          showsHorizontalScrollIndicator={false}
          contentContainerStyle={[styles.quickRow, { flexDirection: rowDir }]}
        >
          {(
            [
              {
                id: 'courses',
                label: t('home.actionCourses'),
                icon: 'book-outline' as const,
                badge: activeCourses || undefined,
                onPress: () => router.push('/(tabs)/bookings'),
              },
              {
                id: 'homework',
                label: t('home.actionHomework'),
                icon: 'document-text-outline' as const,
                onPress: () => router.push('/notifications'),
              },
              {
                id: 'messages',
                label: t('home.actionMessages'),
                icon: 'chatbubble-ellipses-outline' as const,
                badge: hasUnreadMessages ? 1 : undefined,
                onPress: () => router.push('/(tabs)/messages'),
              },
              {
                id: 'favorites',
                label: t('home.actionFavorites'),
                icon: 'heart-outline' as const,
                onPress: () => router.push('/favorites'),
              },
              {
                id: 'calendar',
                label: t('home.actionCalendar'),
                icon: 'calendar-outline' as const,
                onPress: () => router.push('/(tabs)/bookings'),
              },
              {
                id: 'browse',
                label: t('home.actionBrowse'),
                icon: 'compass-outline' as const,
                onPress: () => router.push('/(tabs)/explore'),
              },
            ] as const
          ).map((action) => (
            <Pressable key={action.id} style={styles.quickItem} onPress={action.onPress}>
              <View style={styles.quickIcon}>
                <Ionicons name={action.icon} size={22} color={colors.primary} />
                {'badge' in action && action.badge ? (
                  <View style={styles.quickBadge}>
                    <Text style={styles.quickBadgeText}>{action.badge}</Text>
                  </View>
                ) : null}
              </View>
              <Text style={styles.quickLabel} numberOfLines={1}>
                {action.label}
              </Text>
            </Pressable>
          ))}
        </ScrollView>

        <SectionHeader
          title={t('home.continueLearning')}
          actionLabel={t('common.seeAll')}
          onAction={() => router.push('/continue-learning')}
        />
        {continueBookings.length ? (
          <ScrollView
            horizontal
            showsHorizontalScrollIndicator={false}
            contentContainerStyle={[styles.continueStrip, { flexDirection: rowDir }]}
            decelerationRate="fast"
            snapToInterval={continueCardWidth + spacing.md}
          >
            {continueBookings.map((booking) => {
              const progress = progressForBooking(booking);
              const image = resolveCourseImageSource(booking.course!);
              return (
                <Pressable
                  key={booking.id}
                  style={[
                    styles.continueCard,
                    { width: continueCardWidth, flexDirection: rowDir },
                  ]}
                  onPress={() => router.push(`/course/${booking.courseId}`)}
                >
                  <View style={styles.continueThumb}>
                    <Image
                      source={image.source}
                      style={styles.continueImage}
                      contentFit="cover"
                    />
                    <View style={styles.playMark}>
                      <Ionicons name="play" size={14} color={colors.white} />
                    </View>
                  </View>
                  <View style={styles.continueBody}>
                    <Text style={styles.continueTitle} numberOfLines={2}>
                      {courseTitle(booking.course!, language)}
                    </Text>
                    <View style={styles.progressTrack}>
                      <View style={[styles.progressFill, { width: `${progress.pct}%` }]} />
                    </View>
                    <Text style={styles.progressText}>
                      {progress.pct}% ·{' '}
                      {t('home.lessonsProgress')
                        .replace('{{done}}', String(progress.done))
                        .replace('{{total}}', String(progress.total))}
                    </Text>
                  </View>
                  <View style={styles.continueArrow}>
                    <Ionicons name={chevron} size={18} color={colors.primary} />
                  </View>
                </Pressable>
              );
            })}
          </ScrollView>
        ) : (
          <View style={styles.emptyCard}>
            <Text style={styles.emptyHint}>{t('home.emptyCoursesHint')}</Text>
          </View>
        )}

        <SectionHeader
          title={t('home.recommended')}
          actionLabel={t('common.seeAll')}
          onAction={() => router.push('/(tabs)/explore')}
        />

        {coursesQuery.isLoading ? <LoadingState /> : null}
        {coursesQuery.isError ? (
          <ErrorState onRetry={() => coursesQuery.refetch()} />
        ) : null}
        {!coursesQuery.isLoading && !coursesQuery.isError && !coursesQuery.data?.data.length ? (
          <EmptyState
            title={t('common.empty')}
            subtitle={t('home.emptyCoursesHint')}
            actionLabel={t('tabs.explore')}
            onAction={() => router.push('/(tabs)/explore')}
          />
        ) : null}

        <View style={[styles.courseGrid, { marginHorizontal: -courseGap / 2 }]}>
          {coursesQuery.data?.data.slice(0, layout.courseColumns * 2).map((course) => (
            <View
              key={course.id}
              style={{
                width: courseWidthPct,
                paddingHorizontal: courseGap / 2,
                marginBottom: courseGap,
              }}
            >
              <CourseCard course={course} variant="featured" />
            </View>
          ))}
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: colors.background },
  content: {
    gap: spacing.lg,
    paddingTop: spacing.md,
  },
  header: {
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: spacing.md,
  },
  brandBlock: { flex: 1, gap: 2 },
  logoWord: {
    fontSize: 28,
    lineHeight: 34,
    fontWeight: '800',
    color: colors.primary,
    letterSpacing: -0.5,
  },
  logoDot: { color: colors.lavender, fontWeight: '800' },
  brandTagline: {
    ...typography.caption,
    color: colors.textMuted,
    fontWeight: '600',
  },
  headerRight: {
    alignItems: 'center',
    gap: spacing.sm,
  },
  profileChip: {
    alignItems: 'center',
    gap: spacing.sm,
  },
  helloText: {
    ...typography.caption,
    color: colors.text,
    fontWeight: '700',
    maxWidth: 110,
  },
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
  categoryCards: {
    gap: spacing.sm,
  },
  categoryCard: {
    flex: 1,
    borderRadius: radius.xl,
    padding: spacing.md,
    gap: spacing.xs,
    minHeight: 108,
  },
  categoryCardTop: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  categoryCardTitle: {
    ...typography.caption,
    fontWeight: '800',
    fontSize: 13,
  },
  categoryCardHint: {
    ...typography.caption,
    color: colors.textMuted,
    fontSize: 11,
  },
  upcomingCard: {
    backgroundColor: colors.lavenderSoft,
    borderRadius: radius.xxl,
    padding: spacing.lg,
    overflow: 'hidden',
    position: 'relative',
  },
  upcomingDecorA: {
    position: 'absolute',
    width: 140,
    height: 140,
    borderRadius: 70,
    backgroundColor: 'rgba(255,255,255,0.35)',
    right: -36,
    top: -28,
  },
  upcomingDecorB: {
    position: 'absolute',
    width: 100,
    height: 100,
    borderRadius: 50,
    backgroundColor: 'rgba(255,255,255,0.28)',
    right: 18,
    bottom: -30,
  },
  upcomingInner: {
    gap: spacing.md,
    alignItems: 'stretch',
  },
  dateBlock: {
    backgroundColor: colors.white,
    borderRadius: radius.xl,
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.md,
    alignItems: 'center',
    justifyContent: 'center',
    minWidth: 68,
    gap: 2,
  },
  dateWeekday: {
    ...typography.caption,
    color: colors.textMuted,
    fontWeight: '600',
    fontSize: 12,
  },
  dateDay: {
    ...typography.heading,
    color: colors.primary,
    fontWeight: '800',
    fontSize: 28,
    lineHeight: 32,
  },
  dateMonth: {
    ...typography.caption,
    color: colors.textMuted,
    fontWeight: '600',
    fontSize: 12,
  },
  upcomingBody: { flex: 1, gap: 6, minWidth: 0 },
  upcomingTitleRow: {
    alignItems: 'flex-start',
    gap: spacing.sm,
  },
  upcomingCopy: { flex: 1, gap: 2, minWidth: 0 },
  moreBtn: { paddingTop: 2 },
  courseCode: {
    ...typography.body,
    color: colors.primary,
    fontWeight: '800',
    fontSize: 15,
  },
  upcomingTitle: {
    ...typography.body,
    color: colors.textSecondary,
    fontWeight: '500',
    fontSize: 14,
    lineHeight: 20,
  },
  metaRow: {
    alignItems: 'center',
    gap: 6,
  },
  metaText: {
    ...typography.caption,
    color: colors.textMuted,
  },
  joinBtn: {
    alignSelf: 'flex-end',
    backgroundColor: colors.primary,
    borderRadius: radius.full,
    paddingHorizontal: spacing.lg,
    paddingVertical: spacing.sm + 2,
    marginTop: spacing.xs,
  },
  joinBtnText: {
    ...typography.button,
    color: colors.white,
    fontWeight: '700',
    fontSize: 13,
  },
  emptyCard: {
    backgroundColor: colors.white,
    borderRadius: radius.xl,
    borderWidth: 1,
    borderColor: colors.border,
    padding: spacing.lg,
    gap: spacing.xs,
  },
  emptyTitle: {
    ...typography.body,
    color: colors.text,
    fontWeight: '700',
  },
  emptyHint: {
    ...typography.caption,
    color: colors.textMuted,
  },
  quickRow: {
    gap: spacing.md,
    paddingVertical: spacing.xs,
  },
  quickItem: {
    width: 72,
    alignItems: 'center',
    gap: spacing.sm,
  },
  quickIcon: {
    width: 56,
    height: 56,
    borderRadius: radius.lg,
    backgroundColor: colors.beige,
    alignItems: 'center',
    justifyContent: 'center',
  },
  quickBadge: {
    position: 'absolute',
    top: -4,
    right: -4,
    minWidth: 18,
    height: 18,
    borderRadius: 9,
    backgroundColor: colors.error,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 4,
  },
  quickBadgeText: {
    color: colors.white,
    fontSize: 10,
    fontWeight: '800',
  },
  quickLabel: {
    ...typography.caption,
    color: colors.text,
    fontWeight: '600',
    fontSize: 11,
    textAlign: 'center',
  },
  continueStrip: {
    gap: spacing.md,
    paddingVertical: spacing.xs,
  },
  continueCard: {
    backgroundColor: colors.white,
    borderRadius: radius.xxl,
    borderWidth: 1,
    borderColor: colors.border,
    padding: spacing.md,
    alignItems: 'center',
    gap: spacing.md,
    ...shadows.sm,
  },
  continueThumb: {
    width: 72,
    height: 72,
    borderRadius: radius.lg,
    overflow: 'hidden',
  },
  continueImage: { width: '100%', height: '100%' },
  playMark: {
    ...StyleSheet.absoluteFill,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: 'rgba(44,36,92,0.35)',
  },
  continueBody: { flex: 1, gap: spacing.sm },
  continueTitle: {
    ...typography.body,
    color: colors.text,
    fontWeight: '700',
  },
  progressTrack: {
    height: 6,
    borderRadius: 3,
    backgroundColor: colors.beige,
    overflow: 'hidden',
  },
  progressFill: {
    height: '100%',
    backgroundColor: colors.primary,
    borderRadius: 3,
  },
  progressText: {
    ...typography.caption,
    color: colors.textMuted,
    fontWeight: '600',
  },
  continueArrow: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: colors.lavenderSoft,
    alignItems: 'center',
    justifyContent: 'center',
  },
  courseGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
  },
});
