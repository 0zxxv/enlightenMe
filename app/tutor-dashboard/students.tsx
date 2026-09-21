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
  getTutorStudents,
  type TutorStudentGroup,
} from '@/services/api/tutorDashboard';
import { colors, radius, shadows, spacing, typography } from '@/theme';
import { formatDate, formatTime, fullName } from '@/utils/format';

export default function TutorStudentsScreen() {
  const { t, language } = useTranslation();
  const query = useQuery({ queryKey: ['tutor', 'students'], queryFn: getTutorStudents });
  const { refreshing, onRefresh } = useRefresh(async () => {
    await query.refetch();
  });

  const renderItem = ({ item }: { item: TutorStudentGroup }) => (
    <View style={styles.card}>
      <View style={styles.top}>
        <Text style={styles.title} numberOfLines={1}>
          {fullName(item.user.firstName, item.user.lastName)}
        </Text>
        <Badge
          label={`${item.bookingCount} ${t('tutorDashboard.bookingsCount')}`}
          tone="neutral"
        />
      </View>
      <Text style={styles.meta}>{item.user.email}</Text>
      {item.upcomingSession ? (
        <Text style={styles.upcoming}>
          {t('tutorDashboard.nextSession')}:{' '}
          {formatDate(item.upcomingSession.startsAt, language)} ·{' '}
          {formatTime(item.upcomingSession.startsAt, language)}
        </Text>
      ) : (
        <Text style={styles.upcoming}>{t('tutorDashboard.noNextSession')}</Text>
      )}
    </View>
  );

  return (
    <>
      <Stack.Screen
        options={{
          title: t('tutorDashboard.students'),
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
          keyExtractor={(item) => item.user.id}
          refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} />}
          ListEmptyComponent={
            <EmptyState
              title={t('tutorDashboard.emptyStudents')}
              subtitle={t('tutorDashboard.emptyStudentsHint')}
              icon="people-outline"
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
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: spacing.md,
  },
  title: { ...typography.subheading, color: colors.text, flex: 1 },
  meta: { ...typography.caption, color: colors.textSecondary },
  upcoming: { ...typography.caption, color: colors.textMuted },
});
