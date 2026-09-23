import { Ionicons } from '@expo/vector-icons';
import { Stack, useRouter } from 'expo-router';
import React, { useMemo, useState } from 'react';
import {
  Pressable,
  RefreshControl,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from 'react-native';
import { EmptyState } from '@/components/EmptyState';
import { ErrorState } from '@/components/ErrorState';
import { LoadingState } from '@/components/LoadingState';
import { useMyBookings } from '@/features/bookings/hooks';
import { useLayout } from '@/hooks/useLayout';
import { useRefresh } from '@/hooks/useRefresh';
import { useTranslation } from '@/i18n';
import { colors, radius, shadows, spacing, typography } from '@/theme';
import type { Booking } from '@/types/models';
import { formatTime } from '@/utils/format';

const PAST_STATUSES = new Set(['Completed', 'Cancelled', 'Refunded']);

/** Bahrain / university week columns matching the schedule mockup. */
const WEEK_DAYS = [
  { key: 0, letterEn: 'U', letterAr: 'ح', nameEn: 'Sunday', nameAr: 'الأحد' },
  { key: 1, letterEn: 'M', letterAr: 'ن', nameEn: 'Monday', nameAr: 'الإثنين' },
  { key: 2, letterEn: 'T', letterAr: 'ث', nameEn: 'Tuesday', nameAr: 'الثلاثاء' },
  { key: 3, letterEn: 'W', letterAr: 'ر', nameEn: 'Wednesday', nameAr: 'الأربعاء' },
  { key: 4, letterEn: 'H', letterAr: 'خ', nameEn: 'Thursday', nameAr: 'الخميس' },
] as const;

const CARD_PALETTES = [
  { bg: '#D8F0E4', blob: 'rgba(120, 180, 150, 0.28)' },
  { bg: '#D9E8F8', blob: 'rgba(110, 150, 200, 0.28)' },
  { bg: '#F5EECF', blob: 'rgba(200, 180, 100, 0.28)' },
  { bg: '#E6DFF0', blob: 'rgba(150, 130, 190, 0.28)' },
] as const;

function startOfWeekSunday(date: Date) {
  const d = new Date(date);
  d.setHours(0, 0, 0, 0);
  d.setDate(d.getDate() - d.getDay());
  return d;
}

function addDays(date: Date, days: number) {
  const d = new Date(date);
  d.setDate(d.getDate() + days);
  return d;
}

function paletteFor(id: string) {
  let hash = 0;
  for (let i = 0; i < id.length; i += 1) hash = (hash + id.charCodeAt(i) * (i + 1)) % 997;
  return CARD_PALETTES[hash % CARD_PALETTES.length];
}

function courseLabel(booking: Booking) {
  const code = booking.course?.courseCode?.trim();
  if (code) return code;
  const title = booking.course?.title ?? 'Class';
  return title.length > 10 ? `${title.slice(0, 9)}…` : title;
}

function locationLabel(booking: Booking, online: string, hybrid: string) {
  if (booking.course?.location?.trim()) return booking.course.location.trim();
  if (booking.course?.format === 'Online') return online;
  if (booking.course?.format === 'Hybrid') return hybrid;
  return '—';
}

export default function WeekScheduleScreen() {
  const { t, language, isRTL } = useTranslation();
  const router = useRouter();
  const layout = useLayout();
  const bookingsQuery = useMyBookings();
  const { refreshing, onRefresh } = useRefresh(async () => {
    await bookingsQuery.refetch();
  });
  const [weekOffset, setWeekOffset] = useState(0);
  const chevron = isRTL ? 'chevron-back' : 'chevron-forward';

  const weekStart = useMemo(() => {
    const base = startOfWeekSunday(new Date());
    return addDays(base, weekOffset * 7);
  }, [weekOffset]);

  const weekEnd = useMemo(() => addDays(weekStart, 5), [weekStart]);

  const weekLabel = useMemo(() => {
    const locale = language === 'ar' ? 'ar-BH' : 'en-GB';
    const start = weekStart.toLocaleDateString(locale, { day: 'numeric', month: 'short' });
    const end = addDays(weekStart, 4).toLocaleDateString(locale, {
      day: 'numeric',
      month: 'short',
      year: 'numeric',
    });
    return `${start} – ${end}`;
  }, [language, weekStart]);

  const byDay = useMemo(() => {
    const map = new Map<number, Booking[]>();
    for (const day of WEEK_DAYS) map.set(day.key, []);

    for (const booking of bookingsQuery.data ?? []) {
      if (PAST_STATUSES.has(booking.status) || !booking.session?.startsAt || !booking.course) {
        continue;
      }
      const starts = new Date(booking.session.startsAt);
      if (starts < weekStart || starts >= weekEnd) continue;
      const dow = starts.getDay();
      if (!map.has(dow)) continue;
      map.get(dow)!.push(booking);
    }

    for (const list of map.values()) {
      list.sort(
        (a, b) =>
          new Date(a.session!.startsAt).getTime() - new Date(b.session!.startsAt).getTime(),
      );
    }
    return map;
  }, [bookingsQuery.data, weekEnd, weekStart]);

  const hasAny = WEEK_DAYS.some((day) => (byDay.get(day.key) ?? []).length > 0);
  const columnWidth = Math.max(
    118,
    Math.min(148, Math.floor((layout.width - layout.contentPadding * 2 - spacing.sm * 4) / 5)),
  );

  return (
    <>
      <Stack.Screen
        options={{
          title: t('schedule.weekTitle'),
          headerStyle: { backgroundColor: colors.lavenderSoft },
          headerTintColor: colors.primary,
          headerBackTitle: t('common.back'),
        }}
      />
      <View style={styles.root}>
        {bookingsQuery.isLoading ? <LoadingState /> : null}
        {bookingsQuery.isError ? (
          <ErrorState onRetry={() => bookingsQuery.refetch()} />
        ) : null}

        {!bookingsQuery.isLoading && !bookingsQuery.isError ? (
          <ScrollView
            style={styles.scroll}
            contentContainerStyle={[
              styles.content,
              {
                paddingHorizontal: layout.contentPadding,
                paddingBottom: spacing.massive,
              },
            ]}
            refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} />}
            showsVerticalScrollIndicator={false}
          >
            <View style={styles.weekNav}>
              <Pressable
                style={styles.navBtn}
                onPress={() => setWeekOffset((v) => v - 1)}
                hitSlop={8}
              >
                <Ionicons
                  name={isRTL ? 'chevron-forward' : 'chevron-back'}
                  size={18}
                  color={colors.primary}
                />
              </Pressable>
              <View style={styles.weekNavCopy}>
                <Text style={styles.weekLabel}>{weekLabel}</Text>
                {weekOffset !== 0 ? (
                  <Pressable onPress={() => setWeekOffset(0)} hitSlop={6}>
                    <Text style={styles.thisWeek}>{t('schedule.thisWeek')}</Text>
                  </Pressable>
                ) : null}
              </View>
              <Pressable
                style={styles.navBtn}
                onPress={() => setWeekOffset((v) => v + 1)}
                hitSlop={8}
              >
                <Ionicons
                  name={isRTL ? 'chevron-back' : 'chevron-forward'}
                  size={18}
                  color={colors.primary}
                />
              </Pressable>
            </View>

            {!hasAny ? (
              <EmptyState
                title={t('schedule.empty')}
                subtitle={t('schedule.emptyHint')}
                actionLabel={t('tabs.explore')}
                onAction={() => router.push('/(tabs)/explore')}
              />
            ) : (
              <ScrollView
                horizontal
                showsHorizontalScrollIndicator={false}
                contentContainerStyle={[
                  styles.columns,
                  { flexDirection: isRTL ? 'row-reverse' : 'row' },
                ]}
              >
                {WEEK_DAYS.map((day) => {
                  const sessions = byDay.get(day.key) ?? [];
                  const letter = language === 'ar' ? day.letterAr : day.letterEn;
                  const name = language === 'ar' ? day.nameAr : day.nameEn;
                  const dateLabel = addDays(weekStart, day.key).toLocaleDateString(
                    language === 'ar' ? 'ar-BH' : 'en-GB',
                    { day: 'numeric', month: 'short' },
                  );
                  return (
                    <View key={day.key} style={[styles.column, { width: columnWidth }]}>
                      <View style={styles.dayHeader}>
                        <Text style={styles.dayLetter}>{letter}</Text>
                        <Text style={styles.dayName}>{name}</Text>
                        <Text style={styles.dayDate}>{dateLabel}</Text>
                      </View>

                      <View style={styles.cards}>
                        {sessions.map((booking) => {
                          const tone = paletteFor(booking.courseId);
                          return (
                            <Pressable
                              key={booking.id}
                              style={[styles.sessionCard, { backgroundColor: tone.bg }]}
                              onPress={() => router.push(`/booking/detail/${booking.id}`)}
                            >
                              <View
                                style={[styles.sessionBlob, { backgroundColor: tone.blob }]}
                                pointerEvents="none"
                              />
                              <View style={styles.sessionTop}>
                                <Text style={styles.sessionCode} numberOfLines={1}>
                                  {courseLabel(booking)}
                                </Text>
                                <Ionicons name={chevron} size={14} color={colors.primary} />
                              </View>
                              <View style={styles.sessionMeta}>
                                <Ionicons name="time-outline" size={12} color={colors.textMuted} />
                                <View>
                                  <Text style={styles.sessionTime}>
                                    {formatTime(booking.session!.startsAt, language)}
                                  </Text>
                                  <Text style={styles.sessionTime}>
                                    {formatTime(booking.session!.endsAt, language)}
                                  </Text>
                                </View>
                              </View>
                              <View style={styles.sessionMeta}>
                                <Ionicons
                                  name="location-outline"
                                  size={12}
                                  color={colors.textMuted}
                                />
                                <Text style={styles.sessionLocation} numberOfLines={2}>
                                  {locationLabel(
                                    booking,
                                    t('common.online'),
                                    t('common.hybrid'),
                                  )}
                                </Text>
                              </View>
                            </Pressable>
                          );
                        })}
                      </View>
                    </View>
                  );
                })}
              </ScrollView>
            )}
          </ScrollView>
        ) : null}
      </View>
    </>
  );
}

const styles = StyleSheet.create({
  root: {
    flex: 1,
    backgroundColor: colors.lavenderSoft,
  },
  scroll: { flex: 1 },
  content: {
    paddingTop: spacing.md,
    gap: spacing.lg,
  },
  weekNav: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: colors.white,
    borderRadius: radius.xl,
    paddingHorizontal: spacing.sm,
    paddingVertical: spacing.sm,
    ...shadows.sm,
  },
  navBtn: {
    width: 36,
    height: 36,
    borderRadius: 18,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: colors.lavenderSoft,
  },
  weekNavCopy: {
    alignItems: 'center',
    gap: 2,
  },
  weekLabel: {
    ...typography.subheading,
    color: colors.primary,
    fontSize: 15,
  },
  thisWeek: {
    ...typography.caption,
    color: colors.primary,
    fontWeight: '700',
  },
  columns: {
    gap: spacing.sm,
    paddingBottom: spacing.lg,
    minHeight: 420,
  },
  column: {
    gap: spacing.sm,
  },
  dayHeader: {
    backgroundColor: colors.white,
    borderRadius: radius.lg,
    paddingVertical: spacing.md,
    paddingHorizontal: spacing.sm,
    alignItems: 'center',
    gap: 2,
    ...shadows.sm,
  },
  dayLetter: {
    ...typography.heading,
    color: colors.primary,
    fontSize: 26,
    lineHeight: 30,
    fontWeight: '800',
  },
  dayName: {
    ...typography.caption,
    color: colors.textMuted,
    fontWeight: '600',
    fontSize: 11,
  },
  dayDate: {
    ...typography.caption,
    color: colors.textSecondary,
    fontSize: 10,
    fontWeight: '600',
  },
  cards: {
    gap: spacing.sm,
    minHeight: 40,
  },
  sessionCard: {
    borderRadius: radius.lg,
    padding: spacing.sm,
    gap: 6,
    overflow: 'hidden',
    minHeight: 96,
  },
  sessionBlob: {
    position: 'absolute',
    width: 56,
    height: 56,
    borderRadius: 28,
    right: -12,
    bottom: -14,
  },
  sessionTop: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: 4,
  },
  sessionCode: {
    ...typography.caption,
    color: colors.primary,
    fontWeight: '800',
    fontSize: 12,
    flex: 1,
  },
  sessionMeta: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: 4,
  },
  sessionTime: {
    ...typography.caption,
    color: colors.textSecondary,
    fontSize: 11,
    fontWeight: '600',
    lineHeight: 14,
  },
  sessionLocation: {
    ...typography.caption,
    color: colors.textMuted,
    fontSize: 11,
    flex: 1,
    fontWeight: '600',
  },
});
