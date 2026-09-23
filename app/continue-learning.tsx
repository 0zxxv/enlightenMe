import { Ionicons } from '@expo/vector-icons';
import { Image } from 'expo-image';
import { Stack, useRouter } from 'expo-router';
import React, { useMemo } from 'react';
import {
  FlatList,
  Pressable,
  RefreshControl,
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
import { courseTitle } from '@/utils/format';
import { resolveCourseImageSource } from '@/utils/courseImages';

const PAST_STATUSES = new Set(['Completed', 'Cancelled', 'Refunded']);

function progressForBooking(booking: Booking) {
  const total = Math.max(booking.course?.sessionCount ?? booking.course?.curriculum?.length ?? 8, 1);
  const done = Math.min(Math.max(Math.round(total * 0.6), 1), total);
  return { done, total, pct: Math.round((done / total) * 100) };
}

export default function ContinueLearningScreen() {
  const { t, language, isRTL } = useTranslation();
  const router = useRouter();
  const layout = useLayout();
  const bookingsQuery = useMyBookings();
  const { refreshing, onRefresh } = useRefresh(async () => {
    await bookingsQuery.refetch();
  });
  const chevron = isRTL ? 'chevron-back' : 'chevron-forward';

  const items = useMemo(
    () => (bookingsQuery.data ?? []).filter((b) => !PAST_STATUSES.has(b.status) && b.course),
    [bookingsQuery.data],
  );

  return (
    <>
      <Stack.Screen
        options={{
          title: t('home.continueLearning'),
          headerStyle: { backgroundColor: colors.background },
          headerTintColor: colors.primary,
          headerBackTitle: t('common.back'),
        }}
      />
      {bookingsQuery.isLoading ? <LoadingState /> : null}
      {bookingsQuery.isError ? (
        <ErrorState onRetry={() => bookingsQuery.refetch()} />
      ) : null}
      {!bookingsQuery.isLoading && !bookingsQuery.isError ? (
        <FlatList
          style={styles.root}
          data={items}
          keyExtractor={(item) => item.id}
          contentContainerStyle={[
            styles.content,
            {
              paddingHorizontal: layout.contentPadding,
              maxWidth: layout.contentMaxWidth ?? '100%',
              alignSelf: 'center',
              width: '100%',
            },
          ]}
          refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} />}
          ListEmptyComponent={
            <EmptyState
              title={t('common.empty')}
              subtitle={t('home.emptyCoursesHint')}
              actionLabel={t('tabs.explore')}
              onAction={() => router.push('/(tabs)/explore')}
            />
          }
          renderItem={({ item }) => {
            const progress = progressForBooking(item);
            const image = resolveCourseImageSource(item.course!);
            return (
              <Pressable
                style={styles.card}
                onPress={() => router.push(`/course/${item.courseId}`)}
              >
                <View style={styles.thumb}>
                  <Image source={image.source} style={styles.image} contentFit="cover" />
                  <View style={styles.playMark}>
                    <Ionicons name="play" size={16} color={colors.white} />
                  </View>
                </View>
                <View style={styles.body}>
                  <Text style={styles.title} numberOfLines={2}>
                    {courseTitle(item.course!, language)}
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
                <View style={styles.arrow}>
                  <Ionicons name={chevron} size={18} color={colors.primary} />
                </View>
              </Pressable>
            );
          }}
        />
      ) : null}
    </>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1, backgroundColor: colors.background },
  content: {
    paddingTop: spacing.md,
    paddingBottom: spacing.massive,
    gap: spacing.md,
  },
  card: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.md,
    backgroundColor: colors.white,
    borderRadius: radius.xxl,
    borderWidth: 1,
    borderColor: colors.border,
    padding: spacing.md,
    ...shadows.sm,
  },
  thumb: {
    width: 80,
    height: 80,
    borderRadius: radius.lg,
    overflow: 'hidden',
  },
  image: { width: '100%', height: '100%' },
  playMark: {
    ...StyleSheet.absoluteFill,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: 'rgba(44,36,92,0.35)',
  },
  body: { flex: 1, gap: spacing.sm },
  title: {
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
  arrow: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: colors.lavenderSoft,
    alignItems: 'center',
    justifyContent: 'center',
  },
});
