import { Stack } from 'expo-router';
import React from 'react';
import { RefreshControl, ScrollView, StyleSheet, Text, View } from 'react-native';
import { useQuery } from '@tanstack/react-query';
import { Badge } from '@/components/Badge';
import { ErrorState } from '@/components/ErrorState';
import { LoadingState } from '@/components/LoadingState';
import { useRefresh } from '@/hooks/useRefresh';
import { useTranslation } from '@/i18n';
import { getTutorVerification } from '@/services/api/tutorDashboard';
import { colors, radius, shadows, spacing, typography } from '@/theme';
import type { VerificationStatus } from '@/types/models';

function verificationTone(
  status: VerificationStatus,
): 'primary' | 'success' | 'warning' | 'neutral' {
  if (status === 'Verified') return 'success';
  if (status === 'Pending') return 'warning';
  if (status === 'Rejected' || status === 'Suspended') return 'warning';
  return 'neutral';
}

export default function TutorVerificationScreen() {
  const { t } = useTranslation();
  const query = useQuery({
    queryKey: ['tutor', 'verification'],
    queryFn: getTutorVerification,
  });
  const { refreshing, onRefresh } = useRefresh(async () => {
    await query.refetch();
  });

  const data = query.data;

  return (
    <>
      <Stack.Screen
        options={{
          title: t('tutorDashboard.verification'),
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
          <View style={styles.card}>
            <Text style={styles.label}>{t('tutorDashboard.verificationStatus')}</Text>
            <Badge
              label={data.verificationStatus}
              tone={verificationTone(data.verificationStatus)}
            />
            <Text style={styles.body}>
              {data.verificationStatus === 'Verified'
                ? t('common.verified')
                : data.verificationStatus === 'Unverified'
                  ? t('tutorDashboard.verificationUnverified')
                  : t('tutorDashboard.verificationHint')}
            </Text>
          </View>

          <View style={styles.card}>
            <Text style={styles.label}>{t('tutorDashboard.bio')}</Text>
            <Text style={styles.body}>{data.bio?.trim() ? data.bio : t('tutorDashboard.noBio')}</Text>
          </View>

          <View style={styles.card}>
            <Text style={styles.label}>{t('tutorDashboard.expertise')}</Text>
            {data.expertise.length === 0 ? (
              <Text style={styles.body}>{t('tutorDashboard.noExpertise')}</Text>
            ) : (
              <View style={styles.chips}>
                {data.expertise.map((item) => (
                  <Badge key={item} label={item} tone="primary" />
                ))}
              </View>
            )}
          </View>

          <View style={styles.stats}>
            <View style={styles.stat}>
              <Text style={styles.statValue}>{Number(data.ratingAvg).toFixed(1)}</Text>
              <Text style={styles.statLabel}>
                {t('tutorDashboard.rating')} ({data.ratingCount})
              </Text>
            </View>
            <View style={styles.stat}>
              <Text style={styles.statValue}>{data.studentCount}</Text>
              <Text style={styles.statLabel}>{t('tutorDashboard.students')}</Text>
            </View>
            <View style={styles.stat}>
              <Text style={styles.statValue}>{data.courseCount}</Text>
              <Text style={styles.statLabel}>{t('tutorDashboard.courses')}</Text>
            </View>
          </View>
        </ScrollView>
      ) : null}
    </>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1, backgroundColor: colors.background },
  content: { padding: spacing.xl, gap: spacing.lg, paddingBottom: spacing.massive },
  card: {
    backgroundColor: colors.white,
    borderRadius: radius.xl,
    padding: spacing.xxl,
    gap: spacing.md,
    ...shadows.sm,
  },
  label: { ...typography.subheading, color: colors.text },
  body: { ...typography.body, color: colors.textSecondary, lineHeight: 22 },
  chips: { flexDirection: 'row', flexWrap: 'wrap', gap: spacing.sm },
  stats: { flexDirection: 'row', gap: spacing.md },
  stat: {
    flex: 1,
    backgroundColor: colors.white,
    borderRadius: radius.lg,
    padding: spacing.lg,
    alignItems: 'center',
    gap: spacing.xs,
    ...shadows.sm,
  },
  statValue: { ...typography.heading, color: colors.primary, fontSize: 22 },
  statLabel: { ...typography.caption, color: colors.textSecondary, textAlign: 'center' },
});
