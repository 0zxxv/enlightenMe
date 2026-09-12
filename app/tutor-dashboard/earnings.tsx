import { Stack } from 'expo-router';
import React from 'react';
import { RefreshControl, ScrollView, StyleSheet, Text, View } from 'react-native';
import { ErrorState } from '@/components/ErrorState';
import { LoadingState } from '@/components/LoadingState';
import { useQuery } from '@tanstack/react-query';
import { useRefresh } from '@/hooks/useRefresh';
import { useTranslation } from '@/i18n';
import { getTutorEarnings } from '@/services/api/tutorDashboard';
import { colors, radius, shadows, spacing, typography } from '@/theme';

export default function TutorEarningsScreen() {
  const { t } = useTranslation();
  const query = useQuery({ queryKey: ['tutor', 'earnings'], queryFn: getTutorEarnings });
  const { refreshing, onRefresh } = useRefresh(async () => {
    await query.refetch();
  });

  return (
    <>
      <Stack.Screen
        options={{
          title: t('tutorDashboard.earnings'),
          headerStyle: { backgroundColor: colors.background },
          headerTintColor: colors.primary,
        }}
      />
      {query.isLoading ? <LoadingState /> : null}
      {query.isError ? <ErrorState onRetry={() => query.refetch()} /> : null}
      {!query.isLoading && !query.isError && query.data ? (
        <ScrollView
          style={styles.root}
          contentContainerStyle={styles.content}
          refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} />}
        >
          <View style={styles.card}>
            <Text style={styles.label}>{t('tutorDashboard.paidTotal')}</Text>
            <Text style={styles.value}>
              {query.data.currency} {Number(query.data.paidTotal).toFixed(3)}
            </Text>
            <Text style={styles.meta}>{query.data.paidCount} paid bookings</Text>
          </View>
          <View style={styles.card}>
            <Text style={styles.label}>{t('tutorDashboard.pendingPayout')}</Text>
            <Text style={styles.value}>
              {query.data.currency} {Number(query.data.pendingPayoutAmount).toFixed(3)}
            </Text>
          </View>
        </ScrollView>
      ) : null}
    </>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1, backgroundColor: colors.background },
  content: { padding: spacing.xl, gap: spacing.lg },
  card: {
    backgroundColor: colors.white,
    borderRadius: radius.xl,
    padding: spacing.xxl,
    ...shadows.sm,
  },
  label: { ...typography.caption, color: colors.textSecondary },
  value: { ...typography.heading, color: colors.primary, marginTop: spacing.sm },
  meta: { ...typography.caption, color: colors.textMuted, marginTop: spacing.sm },
});
