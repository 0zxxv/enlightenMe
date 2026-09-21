import { Stack } from 'expo-router';
import React from 'react';
import { RefreshControl, ScrollView, StyleSheet, Text, View } from 'react-native';
import { useQuery } from '@tanstack/react-query';
import { Badge } from '@/components/Badge';
import { EmptyState } from '@/components/EmptyState';
import { ErrorState } from '@/components/ErrorState';
import { LoadingState } from '@/components/LoadingState';
import { PriceDisplay } from '@/components/PriceDisplay';
import { useRefresh } from '@/hooks/useRefresh';
import { useTranslation } from '@/i18n';
import { getTutorEarnings } from '@/services/api/tutorDashboard';
import { colors, radius, shadows, spacing, typography } from '@/theme';
import { formatDate } from '@/utils/format';

export default function TutorEarningsScreen() {
  const { t, language } = useTranslation();
  const query = useQuery({ queryKey: ['tutor', 'earnings'], queryFn: getTutorEarnings });
  const { refreshing, onRefresh } = useRefresh(async () => {
    await query.refetch();
  });

  const data = query.data;
  const hasAny =
    data &&
    (data.paidTotal > 0 ||
      data.pendingPaymentAmount > 0 ||
      data.pendingPayoutAmount > 0 ||
      data.recent.length > 0);

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
      {!query.isLoading && !query.isError && data ? (
        <ScrollView
          style={styles.root}
          contentContainerStyle={styles.content}
          refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} />}
        >
          {!hasAny ? (
            <EmptyState
              title={t('tutorDashboard.emptyEarnings')}
              subtitle={t('tutorDashboard.emptyEarningsHint')}
              icon="wallet-outline"
            />
          ) : null}

          <View style={styles.card}>
            <Text style={styles.label}>{t('tutorDashboard.paidTotal')}</Text>
            <PriceDisplay amount={data.paidTotal} currency={data.currency} />
            <Text style={styles.meta}>
              {data.paidCount} {t('tutorDashboard.paidCount')}
            </Text>
          </View>

          <View style={styles.rowCards}>
            <View style={[styles.card, styles.half]}>
              <Text style={styles.label}>{t('tutorDashboard.pendingPayment')}</Text>
              <PriceDisplay
                amount={data.pendingPaymentAmount}
                currency={data.currency}
                compact
              />
            </View>
            <View style={[styles.card, styles.half]}>
              <Text style={styles.label}>{t('tutorDashboard.pendingPayout')}</Text>
              <PriceDisplay
                amount={data.pendingPayoutAmount}
                currency={data.currency}
                compact
              />
            </View>
          </View>

          <Text style={styles.heading}>{t('tutorDashboard.earnings')}</Text>
          {data.recent.length === 0 ? (
            <EmptyState title={t('tutorDashboard.emptyRecent')} icon="receipt-outline" />
          ) : (
            data.recent.map((item) => (
              <View key={item.bookingId} style={styles.recentRow}>
                <View style={styles.recentInfo}>
                  <Text style={styles.recentTitle} numberOfLines={1}>
                    {item.courseTitle}
                  </Text>
                  <Text style={styles.meta}>
                    {item.studentName}
                    {item.paidAt ? ` · ${formatDate(item.paidAt, language)}` : ''}
                  </Text>
                </View>
                <View style={styles.recentRight}>
                  <Badge label={item.status} tone="success" />
                  <PriceDisplay amount={item.amount} currency={item.currency} compact />
                </View>
              </View>
            ))
          )}
        </ScrollView>
      ) : null}
    </>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1, backgroundColor: colors.background },
  content: { padding: spacing.xl, gap: spacing.lg, paddingBottom: spacing.massive },
  heading: { ...typography.subheading, color: colors.text },
  card: {
    backgroundColor: colors.white,
    borderRadius: radius.xl,
    padding: spacing.xxl,
    gap: spacing.sm,
    ...shadows.sm,
  },
  rowCards: { flexDirection: 'row', gap: spacing.md },
  half: { flex: 1, padding: spacing.lg },
  label: { ...typography.caption, color: colors.textSecondary },
  meta: { ...typography.caption, color: colors.textMuted },
  recentRow: {
    backgroundColor: colors.white,
    borderRadius: radius.lg,
    padding: spacing.lg,
    flexDirection: 'row',
    gap: spacing.md,
    alignItems: 'center',
    ...shadows.sm,
  },
  recentInfo: { flex: 1, gap: spacing.xxs },
  recentTitle: { ...typography.body, color: colors.text, fontWeight: '600' },
  recentRight: { alignItems: 'flex-end', gap: spacing.xs },
});
