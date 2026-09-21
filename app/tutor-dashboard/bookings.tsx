import { Stack } from 'expo-router';
import React from 'react';
import { FlatList, RefreshControl, StyleSheet, Text, View } from 'react-native';
import { useQuery } from '@tanstack/react-query';
import { Badge } from '@/components/Badge';
import { EmptyState } from '@/components/EmptyState';
import { ErrorState } from '@/components/ErrorState';
import { LoadingState } from '@/components/LoadingState';
import { useRefresh } from '@/hooks/useRefresh';
import { useTranslation } from '@/i18n';
import {
  getTutorUpcoming,
  type TutorUpcomingSession,
} from '@/services/api/tutorDashboard';
import { colors, radius, shadows, spacing, typography } from '@/theme';
import { formatDate, formatTime } from '@/utils/format';

export default function TutorBookingsScreen() {
  const { t, language } = useTranslation();
  const query = useQuery({ queryKey: ['tutor', 'upcoming'], queryFn: getTutorUpcoming });
  const { refreshing, onRefresh } = useRefresh(async () => {
    await query.refetch();
  });

  const renderItem = ({ item }: { item: TutorUpcomingSession }) => (
    <View style={styles.card}>
      <View style={styles.top}>
        <Text style={styles.title} numberOfLines={2}>
          {item.course.title}
        </Text>
        <Badge
          label={`${item.bookings.length} ${t('tutorDashboard.studentsCount')}`}
          tone="primary"
        />
      </View>
      <Text style={styles.meta}>
        {formatDate(item.startsAt, language)} · {formatTime(item.startsAt, language)}
      </Text>
      {item.course.format ? <Text style={styles.meta}>{item.course.format}</Text> : null}
    </View>
  );

  return (
    <>
      <Stack.Screen
        options={{
          title: t('tutorDashboard.bookings'),
          headerStyle: { backgroundColor: colors.background },
          headerTintColor: colors.primary,
        }}
      />
      {query.isLoading ? <LoadingState /> : null}
      {query.isError ? <ErrorState onRetry={() => query.refetch()} /> : null}
      {!query.isLoading && !query.isError ? (
        <FlatList
          style={styles.root}
          contentContainerStyle={styles.content}
          data={query.data ?? []}
          keyExtractor={(item) => item.id}
          refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} />}
          ListEmptyComponent={
            <EmptyState
              title={t('tutorDashboard.emptyBookings')}
              subtitle={t('tutorDashboard.emptyBookingsHint')}
              icon="calendar-outline"
            />
          }
          renderItem={renderItem}
        />
      ) : null}
    </>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1, backgroundColor: colors.background },
  content: { padding: spacing.xl, paddingBottom: spacing.massive },
  card: {
    backgroundColor: colors.white,
    borderRadius: radius.lg,
    padding: spacing.lg,
    marginBottom: spacing.md,
    gap: spacing.sm,
    ...shadows.sm,
  },
  top: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    justifyContent: 'space-between',
    gap: spacing.md,
  },
  title: { ...typography.subheading, color: colors.text, flex: 1 },
  meta: { ...typography.caption, color: colors.textSecondary },
});
