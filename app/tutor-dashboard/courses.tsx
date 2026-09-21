import { Stack, useRouter } from 'expo-router';
import React, { useMemo, useState } from 'react';
import { FlatList, RefreshControl, StyleSheet, Text, View } from 'react-native';
import { useQuery } from '@tanstack/react-query';
import { Badge } from '@/components/Badge';
import { Button } from '@/components/Button';
import { Chip } from '@/components/Chip';
import { EmptyState } from '@/components/EmptyState';
import { ErrorState } from '@/components/ErrorState';
import { LoadingState } from '@/components/LoadingState';
import { PriceDisplay } from '@/components/PriceDisplay';
import { useRefresh } from '@/hooks/useRefresh';
import { useTranslation } from '@/i18n';
import { getTutorCourses, type TutorCourseRow } from '@/services/api/tutorDashboard';
import { colors, radius, shadows, spacing, typography } from '@/theme';
import type { CourseStatus } from '@/types/models';
import { formatDate, formatTime } from '@/utils/format';

type StatusFilter = 'All' | 'Draft' | 'Published' | 'Paused';

function statusTone(status: CourseStatus): 'primary' | 'success' | 'warning' | 'neutral' {
  if (status === 'Published') return 'success';
  if (status === 'Paused') return 'warning';
  if (status === 'Draft') return 'neutral';
  return 'primary';
}

export default function TutorCoursesScreen() {
  const { t, language } = useTranslation();
  const router = useRouter();
  const [filter, setFilter] = useState<StatusFilter>('All');
  const query = useQuery({ queryKey: ['tutor', 'courses'], queryFn: getTutorCourses });
  const { refreshing, onRefresh } = useRefresh(async () => {
    await query.refetch();
  });

  const filtered = useMemo(() => {
    const rows = query.data ?? [];
    if (filter === 'All') return rows;
    return rows.filter((c) => c.status === filter);
  }, [query.data, filter]);

  const filters: { key: StatusFilter; label: string }[] = [
    { key: 'All', label: t('tutorDashboard.filterAll') },
    { key: 'Draft', label: t('tutorDashboard.filterDraft') },
    { key: 'Published', label: t('tutorDashboard.filterPublished') },
    { key: 'Paused', label: t('tutorDashboard.filterPaused') },
  ];

  const renderItem = ({ item }: { item: TutorCourseRow }) => {
    const next = item.sessions?.[0];
    const bookingCount = item._count?.bookings ?? 0;

    return (
      <View style={styles.card}>
        <View style={styles.cardTop}>
          <Text style={styles.title} numberOfLines={2}>
            {item.title}
          </Text>
          <Badge label={item.status} tone={statusTone(item.status)} />
        </View>
        <Text style={styles.meta}>{item.format}</Text>
        <View style={styles.priceRow}>
          <Text style={styles.meta}>
            {bookingCount} {t('tutorDashboard.bookingsCount')}
          </Text>
          <PriceDisplay
            amount={item.priceDecimal}
            currency={item.currency}
            sessionCount={item.sessionCount}
            compact
          />
        </View>
        <Text style={styles.nextSession}>
          {next
            ? `${t('tutorDashboard.nextSession')}: ${formatDate(next.startsAt, language)} · ${formatTime(next.startsAt, language)}`
            : t('tutorDashboard.noNextSession')}
        </Text>
        <Button
          title={t('tutorDashboard.manage')}
          variant="secondary"
          size="sm"
          onPress={() =>
            router.push({
              pathname: '/tutor-dashboard/create',
              params: { courseId: item.id },
            })
          }
        />
      </View>
    );
  };

  return (
    <>
      <Stack.Screen
        options={{
          title: t('tutorDashboard.courses'),
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
          data={filtered}
          keyExtractor={(item) => item.id}
          refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} />}
          ListHeaderComponent={
            <View style={styles.header}>
              <View style={styles.filters}>
                {filters.map((f) => (
                  <Chip
                    key={f.key}
                    label={f.label}
                    selected={filter === f.key}
                    onPress={() => setFilter(f.key)}
                  />
                ))}
              </View>
              <Button
                title={t('tutorDashboard.createCourse')}
                onPress={() => router.push('/tutor-dashboard/create')}
              />
            </View>
          }
          ListEmptyComponent={
            <EmptyState
              title={t('tutorDashboard.emptyCourses')}
              subtitle={t('tutorDashboard.emptyCoursesHint')}
              icon="book-outline"
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
  content: { padding: spacing.xl, paddingBottom: spacing.massive, gap: spacing.md },
  header: { gap: spacing.lg, marginBottom: spacing.sm },
  filters: { flexDirection: 'row', flexWrap: 'wrap', gap: spacing.sm },
  card: {
    backgroundColor: colors.white,
    borderRadius: radius.lg,
    padding: spacing.lg,
    gap: spacing.sm,
    marginBottom: spacing.md,
    ...shadows.sm,
  },
  cardTop: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    justifyContent: 'space-between',
    gap: spacing.md,
  },
  title: { ...typography.subheading, color: colors.text, flex: 1 },
  meta: { ...typography.caption, color: colors.textSecondary },
  priceRow: {
    flexDirection: 'row',
    alignItems: 'flex-end',
    justifyContent: 'space-between',
    gap: spacing.md,
  },
  nextSession: { ...typography.caption, color: colors.textMuted },
});
