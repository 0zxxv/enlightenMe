import { Stack, useRouter } from 'expo-router';
import React from 'react';
import { Pressable, RefreshControl, ScrollView, StyleSheet, Text, View } from 'react-native';
import { useQuery } from '@tanstack/react-query';
import { Button } from '@/components/Button';
import { EmptyState } from '@/components/EmptyState';
import { ErrorState } from '@/components/ErrorState';
import { LoadingState } from '@/components/LoadingState';
import { useAuth } from '@/features/auth/useAuth';
import { useRefresh } from '@/hooks/useRefresh';
import { useTranslation } from '@/i18n';
import {
  getTutorCourses,
  getTutorEarnings,
  getTutorUpcoming,
} from '@/services/api/tutorDashboard';
import { colors, radius, shadows, spacing, typography } from '@/theme';

export default function TutorDashboardHome() {
  const { t } = useTranslation();
  const router = useRouter();
  const { logout } = useAuth();
  const upcomingQuery = useQuery({
    queryKey: ['tutor', 'upcoming'],
    queryFn: getTutorUpcoming,
  });
  const earningsQuery = useQuery({
    queryKey: ['tutor', 'earnings'],
    queryFn: getTutorEarnings,
  });
  const coursesQuery = useQuery({
    queryKey: ['tutor', 'courses'],
    queryFn: getTutorCourses,
  });

  const { refreshing, onRefresh } = useRefresh(async () => {
    await Promise.all([
      upcomingQuery.refetch(),
      earningsQuery.refetch(),
      coursesQuery.refetch(),
    ]);
  });

  const loading =
    upcomingQuery.isLoading || earningsQuery.isLoading || coursesQuery.isLoading;
  const error = upcomingQuery.isError || earningsQuery.isError || coursesQuery.isError;

  const onLogout = async () => {
    await logout();
    router.replace('/(auth)/login');
  };

  return (
    <>
      <Stack.Screen
        options={{
          title: t('tutorDashboard.title'),
          headerStyle: { backgroundColor: colors.background },
          headerTintColor: colors.primary,
        }}
      />
      {loading ? <LoadingState /> : null}
      {error ? (
        <ErrorState
          onRetry={() => {
            upcomingQuery.refetch();
            earningsQuery.refetch();
            coursesQuery.refetch();
          }}
        />
      ) : null}
      {!loading && !error ? (
        <ScrollView
          style={styles.root}
          contentContainerStyle={styles.content}
          refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} />}
        >
          <Text style={styles.heading}>{t('tutorDashboard.overview')}</Text>
          <View style={styles.cards}>
            <View style={styles.card}>
              <Text style={styles.cardLabel}>{t('tutorDashboard.paidTotal')}</Text>
              <Text style={styles.cardValue}>
                {earningsQuery.data?.currency}{' '}
                {Number(earningsQuery.data?.paidTotal ?? 0).toFixed(3)}
              </Text>
            </View>
            <View style={styles.card}>
              <Text style={styles.cardLabel}>{t('tutorDashboard.pendingPayout')}</Text>
              <Text style={styles.cardValue}>
                {earningsQuery.data?.currency}{' '}
                {Number(earningsQuery.data?.pendingPayoutAmount ?? 0).toFixed(3)}
              </Text>
            </View>
          </View>

          <View style={styles.links}>
            {[
              { label: t('tutorDashboard.courses'), href: '/tutor-dashboard/courses' as const },
              {
                label: t('tutorDashboard.createCourse'),
                href: '/tutor-dashboard/create' as const,
              },
              { label: t('tutorDashboard.bookings'), href: '/tutor-dashboard/bookings' as const },
              { label: t('tutorDashboard.students'), href: '/tutor-dashboard/students' as const },
              { label: t('tutorDashboard.earnings'), href: '/tutor-dashboard/earnings' as const },
              {
                label: t('tutorDashboard.verification'),
                href: '/tutor-dashboard/verification' as const,
              },
            ].map((link) => (
              <Pressable key={link.href} style={styles.link} onPress={() => router.push(link.href)}>
                <Text style={styles.linkText}>{link.label}</Text>
              </Pressable>
            ))}
          </View>

          <Text style={styles.heading}>{t('tutorDashboard.bookings')}</Text>
          {(upcomingQuery.data?.length ?? 0) === 0 ? (
            <EmptyState title={t('tutorDashboard.emptyBookings')} />
          ) : (
            upcomingQuery.data?.slice(0, 5).map((item: any) => (
              <View key={item.id} style={styles.row}>
                <Text style={styles.rowTitle}>
                  {item.course?.title ?? item.courseId ?? item.id}
                </Text>
                <Text style={styles.rowMeta}>{item.status}</Text>
              </View>
            ))
          )}

          <Text style={styles.heading}>{t('tutorDashboard.courses')}</Text>
          {(coursesQuery.data?.length ?? 0) === 0 ? (
            <EmptyState title={t('tutorDashboard.emptyCourses')} />
          ) : (
            coursesQuery.data?.map((course) => (
              <View key={course.id} style={styles.row}>
                <Text style={styles.rowTitle}>{course.title}</Text>
                <Text style={styles.rowMeta}>{course.status}</Text>
              </View>
            ))
          )}

          <View style={styles.accountActions}>
            <Button
              title={t('tutorDashboard.openApp')}
              variant="secondary"
              onPress={() => router.push('/(tabs)/profile')}
            />
            <Button title={t('auth.devMode')} variant="ghost" onPress={() => router.push('/dev-mode')} />
            <Button title={t('common.logout')} variant="danger" onPress={onLogout} />
          </View>
        </ScrollView>
      ) : null}
    </>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1, backgroundColor: colors.background },
  content: { padding: spacing.xl, gap: spacing.lg, paddingBottom: spacing.massive },
  heading: { ...typography.subheading, color: colors.text },
  cards: { flexDirection: 'row', gap: spacing.md },
  card: {
    flex: 1,
    backgroundColor: colors.white,
    borderRadius: radius.lg,
    padding: spacing.lg,
    ...shadows.sm,
  },
  cardLabel: { ...typography.caption, color: colors.textSecondary },
  cardValue: { ...typography.heading, color: colors.primary, fontSize: 18, marginTop: spacing.sm },
  links: { gap: spacing.sm },
  link: {
    backgroundColor: colors.white,
    borderRadius: radius.lg,
    padding: spacing.lg,
    ...shadows.sm,
  },
  linkText: { ...typography.body, color: colors.text, fontWeight: '600' },
  row: {
    backgroundColor: colors.white,
    borderRadius: radius.lg,
    padding: spacing.lg,
    marginBottom: spacing.sm,
  },
  rowTitle: { ...typography.body, color: colors.text, fontWeight: '600' },
  rowMeta: { ...typography.caption, color: colors.textMuted, marginTop: spacing.xs },
  accountActions: { gap: spacing.sm, marginTop: spacing.xl },
});
