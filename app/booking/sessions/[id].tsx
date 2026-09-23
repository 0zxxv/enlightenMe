import { Ionicons } from '@expo/vector-icons';
import { Stack, useLocalSearchParams, useRouter } from 'expo-router';
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
import { useCourse, useCourseSessions } from '@/features/courses/hooks';
import { useMyBookings } from '@/features/bookings/hooks';
import { useLayout } from '@/hooks/useLayout';
import { useRefresh } from '@/hooks/useRefresh';
import { useTranslation } from '@/i18n';
import { colors, radius, shadows, spacing, typography } from '@/theme';
import { courseTitle, formatDate, formatTime } from '@/utils/format';

export default function BookingSessionsScreen() {
  const { id, courseId } = useLocalSearchParams<{ id?: string; courseId?: string }>();
  const { t, language, isRTL } = useTranslation();
  const router = useRouter();
  const layout = useLayout();
  const bookingsQuery = useMyBookings();
  const booking = useMemo(
    () => (bookingsQuery.data ?? []).find((b) => b.id === id),
    [bookingsQuery.data, id],
  );
  const resolvedCourseId = courseId ?? booking?.courseId ?? '';
  const courseQuery = useCourse(resolvedCourseId);
  const sessionsQuery = useCourseSessions(resolvedCourseId);
  const { refreshing, onRefresh } = useRefresh(async () => {
    await Promise.all([sessionsQuery.refetch(), courseQuery.refetch(), bookingsQuery.refetch()]);
  });

  const title = courseQuery.data
    ? courseTitle(courseQuery.data, language)
    : t('bookings.viewSessions');
  const chevron = isRTL ? 'chevron-back' : 'chevron-forward';

  const sessions = useMemo(() => {
    const list = [...(sessionsQuery.data ?? [])];
    list.sort((a, b) => +new Date(a.startsAt) - +new Date(b.startsAt));
    return list;
  }, [sessionsQuery.data]);

  const loading = sessionsQuery.isLoading || courseQuery.isLoading || bookingsQuery.isLoading;
  const error = sessionsQuery.isError || courseQuery.isError;

  return (
    <>
      <Stack.Screen
        options={{
          title: t('bookings.sessionsTitle'),
          headerStyle: { backgroundColor: colors.background },
          headerTintColor: colors.primary,
          headerBackTitle: t('common.back'),
        }}
      />
      {loading ? <LoadingState /> : null}
      {error ? (
        <ErrorState
          onRetry={() => {
            sessionsQuery.refetch();
            courseQuery.refetch();
          }}
        />
      ) : null}
      {!loading && !error ? (
        <FlatList
          style={styles.root}
          data={sessions}
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
          ListHeaderComponent={
            <View style={styles.header}>
              <Text style={styles.courseTitle}>{title}</Text>
              <Text style={styles.subtitle}>
                {sessions.length} {t('course.sessions')}
              </Text>
            </View>
          }
          ListEmptyComponent={<EmptyState title={t('booking.noSessions')} />}
          renderItem={({ item, index }) => {
            const past = new Date(item.endsAt).getTime() < Date.now();
            const isBookedSession = booking?.sessionId === item.id;
            return (
              <Pressable
                style={[styles.card, isBookedSession && styles.cardActive]}
                onPress={() => {
                  if (id) router.push(`/booking/detail/${id}`);
                }}
              >
                <View style={styles.indexBadge}>
                  <Text style={styles.indexText}>{index + 1}</Text>
                </View>
                <View style={styles.body}>
                  <Text style={styles.date}>{formatDate(item.startsAt, language)}</Text>
                  <Text style={styles.time}>
                    {formatTime(item.startsAt, language)} – {formatTime(item.endsAt, language)}
                  </Text>
                  <Text style={styles.status}>
                    {past ? t('bookings.past') : t('bookings.upcoming')}
                    {isBookedSession ? ` · ${t('bookings.yourSession')}` : ''}
                  </Text>
                </View>
                <Ionicons name={chevron} size={18} color={colors.textMuted} />
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
  header: { gap: 4, marginBottom: spacing.sm },
  courseTitle: {
    ...typography.heading,
    color: colors.primary,
    fontSize: 22,
  },
  subtitle: {
    ...typography.caption,
    color: colors.textMuted,
    fontWeight: '600',
  },
  card: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.md,
    backgroundColor: colors.white,
    borderRadius: radius.xl,
    borderWidth: 1,
    borderColor: colors.border,
    padding: spacing.lg,
    ...shadows.sm,
  },
  cardActive: {
    borderColor: colors.lavender,
    backgroundColor: colors.lavenderSoft,
  },
  indexBadge: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: colors.beige,
    alignItems: 'center',
    justifyContent: 'center',
  },
  indexText: {
    ...typography.caption,
    color: colors.primary,
    fontWeight: '800',
  },
  body: { flex: 1, gap: 2 },
  date: {
    ...typography.body,
    color: colors.text,
    fontWeight: '700',
  },
  time: {
    ...typography.caption,
    color: colors.textMuted,
  },
  status: {
    ...typography.caption,
    color: colors.primary,
    fontWeight: '600',
    marginTop: 2,
  },
});
