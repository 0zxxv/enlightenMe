import { Stack, useRouter } from 'expo-router';
import React, { useMemo, useState } from 'react';
import { Alert, FlatList, RefreshControl, StyleSheet, Text, View } from 'react-native';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { Badge } from '@/components/Badge';
import { Button } from '@/components/Button';
import { Chip } from '@/components/Chip';
import { EmptyState } from '@/components/EmptyState';
import { ErrorState } from '@/components/ErrorState';
import { LoadingState } from '@/components/LoadingState';
import { PriceDisplay } from '@/components/PriceDisplay';
import { useRefresh } from '@/hooks/useRefresh';
import { useTranslation } from '@/i18n';
import { archiveCourse, publishCourse, restoreCourse } from '@/services/api/courses';
import { getTutorCourses, type TutorCourseRow } from '@/services/api/tutorDashboard';
import { colors, radius, shadows, spacing, typography } from '@/theme';
import { ApiError } from '@/types/api';
import type { CourseStatus } from '@/types/models';
import { formatDate, formatTime } from '@/utils/format';

type StatusFilter = 'All' | 'Draft' | 'Published' | 'Paused' | 'Archived';

function statusTone(status: CourseStatus): 'primary' | 'success' | 'warning' | 'neutral' {
  if (status === 'Published') return 'success';
  if (status === 'Paused') return 'warning';
  if (status === 'Draft') return 'neutral';
  if (status === 'Archived') return 'warning';
  return 'primary';
}

export default function TutorCoursesScreen() {
  const { t, language, isRTL } = useTranslation();
  const router = useRouter();
  const queryClient = useQueryClient();
  const [filter, setFilter] = useState<StatusFilter>('All');
  const [busyId, setBusyId] = useState<string | null>(null);

  const query = useQuery({ queryKey: ['tutor', 'courses'], queryFn: getTutorCourses });
  const { refreshing, onRefresh } = useRefresh(async () => {
    await query.refetch();
  });

  const invalidate = async () => {
    await queryClient.invalidateQueries({ queryKey: ['tutor', 'courses'] });
  };

  const archiveMutation = useMutation({
    mutationFn: archiveCourse,
    onSuccess: invalidate,
  });
  const restoreMutation = useMutation({
    mutationFn: restoreCourse,
    onSuccess: invalidate,
  });
  const republishMutation = useMutation({
    mutationFn: publishCourse,
    onSuccess: invalidate,
  });

  const filtered = useMemo(() => {
    const rows = query.data ?? [];
    if (filter === 'All') return rows.filter((c) => c.status !== 'Archived');
    return rows.filter((c) => c.status === filter);
  }, [query.data, filter]);

  const filters: { key: StatusFilter; label: string }[] = [
    { key: 'All', label: t('tutorDashboard.filterAll') },
    { key: 'Draft', label: t('tutorDashboard.filterDraft') },
    { key: 'Published', label: t('tutorDashboard.filterPublished') },
    { key: 'Paused', label: t('tutorDashboard.filterPaused') },
    { key: 'Archived', label: t('tutorDashboard.filterArchived') },
  ];

  const runAction = async (id: string, action: () => Promise<unknown>, failKey: string) => {
    setBusyId(id);
    try {
      await action();
    } catch (err) {
      const message = err instanceof ApiError ? err.message : t(failKey);
      Alert.alert(t('common.error'), message);
    } finally {
      setBusyId(null);
    }
  };

  const onDelete = (item: TutorCourseRow) => {
    Alert.alert(t('tutorDashboard.deleteCourse'), t('tutorDashboard.deleteCourseConfirm'), [
      { text: t('common.cancel'), style: 'cancel' },
      {
        text: t('tutorDashboard.deleteCourse'),
        style: 'destructive',
        onPress: () =>
          runAction(item.id, () => archiveMutation.mutateAsync(item.id), 'tutorDashboard.deleteFailed'),
      },
    ]);
  };

  const renderItem = ({ item }: { item: TutorCourseRow }) => {
    const next = item.sessions?.[0];
    const bookingCount = item._count?.bookings ?? 0;
    const archived = item.status === 'Archived';
    const busy = busyId === item.id;

    return (
      <View style={styles.card}>
        <View style={[styles.cardTop, isRTL && styles.cardTopRtl]}>
          <Text
            style={[
              styles.title,
              { textAlign: isRTL ? 'right' : 'left', writingDirection: isRTL ? 'rtl' : 'ltr' },
            ]}
            numberOfLines={2}
          >
            {item.title}
          </Text>
          <Badge
            label={archived ? t('tutorDashboard.filterArchived') : item.status}
            tone={statusTone(item.status)}
          />
        </View>
        <Text style={[styles.meta, { textAlign: isRTL ? 'right' : 'left' }]}>{item.format}</Text>
        <View style={[styles.priceRow, isRTL && styles.priceRowRtl]}>
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
        <Text style={[styles.nextSession, { textAlign: isRTL ? 'right' : 'left' }]}>
          {next
            ? `${t('tutorDashboard.nextSession')}: ${formatDate(next.startsAt, language)} · ${formatTime(next.startsAt, language)}`
            : t('tutorDashboard.noNextSession')}
        </Text>
        <View style={styles.actions}>
          {archived ? (
            <>
              <Button
                title={t('tutorDashboard.republish')}
                size="sm"
                loading={busy && republishMutation.isPending}
                disabled={busy}
                onPress={() =>
                  runAction(
                    item.id,
                    () => republishMutation.mutateAsync(item.id),
                    'tutorDashboard.republishFailed',
                  )
                }
              />
              <Button
                title={t('tutorDashboard.restoreDraft')}
                variant="secondary"
                size="sm"
                loading={busy && restoreMutation.isPending}
                disabled={busy}
                onPress={() =>
                  runAction(
                    item.id,
                    () => restoreMutation.mutateAsync(item.id),
                    'tutorDashboard.restoreFailed',
                  )
                }
              />
            </>
          ) : (
            <>
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
              <Button
                title={t('tutorDashboard.deleteCourse')}
                variant="danger"
                size="sm"
                loading={busy && archiveMutation.isPending}
                disabled={busy}
                onPress={() => onDelete(item)}
              />
            </>
          )}
        </View>
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
  cardTopRtl: {
    flexDirection: 'row-reverse',
  },
  title: { ...typography.subheading, color: colors.text, flex: 1 },
  meta: { ...typography.caption, color: colors.textSecondary },
  priceRow: {
    flexDirection: 'row',
    alignItems: 'flex-end',
    justifyContent: 'space-between',
    gap: spacing.md,
  },
  priceRowRtl: {
    flexDirection: 'row-reverse',
  },
  nextSession: { ...typography.caption, color: colors.textMuted },
  actions: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: spacing.sm,
    marginTop: spacing.xs,
  },
});
