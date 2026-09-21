import { Stack, useRouter } from 'expo-router';
import React from 'react';
import { Pressable, RefreshControl, ScrollView, StyleSheet, Text, View } from 'react-native';
import { useQuery } from '@tanstack/react-query';
import { Badge } from '@/components/Badge';
import { EmptyState } from '@/components/EmptyState';
import { ErrorState } from '@/components/ErrorState';
import { LoadingState } from '@/components/LoadingState';
import { PriceDisplay } from '@/components/PriceDisplay';
import { useRefresh } from '@/hooks/useRefresh';
import { useTranslation } from '@/i18n';
import {
  getTutorCourses,
  getTutorEarnings,
  getTutorUpcoming,
  type TutorCourseRow,
  type TutorUpcomingSession,
} from '@/services/api/tutorDashboard';
import { colors, radius, shadows, spacing, typography } from '@/theme';
import type { CourseStatus } from '@/types/models';
import { formatDate, formatTime } from '@/utils/format';

function statusTone(status: CourseStatus): 'primary' | 'success' | 'warning' | 'neutral' {
  if (status === 'Published') return 'success';
  if (status === 'Paused') return 'warning';
  if (status === 'Draft') return 'neutral';
  return 'primary';
}

export default function TutorDashboardHome() {
  const { t, language } = useTranslation();
  const router = useRouter();

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

  const currency = earningsQuery.data?.currency ?? 'BHD';
  const upcoming = (upcomingQuery.data ?? []).slice(0, 5);
  const courses = (coursesQuery.data ?? []).slice(0, 5);

  const quickLinks = [
    { label: t('tutorDashboard.courses'), href: '/tutor-dashboard/courses' as const },
    { label: t('tutorDashboard.createCourse'), href: '/tutor-dashboard/create' as const },
    { label: t('tutorDashboard.bookings'), href: '/tutor-dashboard/bookings' as const },
    { label: t('tutorDashboard.students'), href: '/tutor-dashboard/students' as const },
    { label: t('tutorDashboard.earnings'), href: '/tutor-dashboard/earnings' as const },
  ];

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
              <PriceDisplay
                amount={earningsQuery.data?.paidTotal ?? 0}
                currency={currency}
                compact
              />
            </View>
            <View style={styles.card}>
              <Text style={styles.cardLabel}>{t('tutorDashboard.pendingPayment')}</Text>
              <PriceDisplay
                amount={earningsQuery.data?.pendingPaymentAmount ?? 0}
                currency={currency}
                compact
              />
            </View>
            <View style={styles.card}>
              <Text style={styles.cardLabel}>{t('tutorDashboard.pendingPayout')}</Text>
              <PriceDisplay
                amount={earningsQuery.data?.pendingPayoutAmount ?? 0}
                currency={currency}
                compact
              />
            </View>
          </View>

          <Text style={styles.heading}>{t('tutorDashboard.quickActions')}</Text>
          <View style={styles.links}>
            {quickLinks.map((link) => (
              <Pressable key={link.href} style={styles.link} onPress={() => router.push(link.href)}>
                <Text style={styles.linkText}>{link.label}</Text>
              </Pressable>
            ))}
          </View>

          <View style={styles.sectionHeader}>
            <Text style={styles.heading}>{t('tutorDashboard.bookings')}</Text>
            <Pressable onPress={() => router.push('/tutor-dashboard/bookings')} hitSlop={8}>
              <Text style={styles.seeAll}>{t('common.seeAll')}</Text>
            </Pressable>
          </View>
          {upcoming.length === 0 ? (
            <EmptyState
              title={t('tutorDashboard.emptyBookings')}
              subtitle={t('tutorDashboard.emptyBookingsHint')}
              icon="calendar-outline"
            />
          ) : (
            upcoming.map((item: TutorUpcomingSession) => (
              <View key={item.id} style={styles.row}>
                <View style={styles.rowTop}>
                  <Text style={styles.rowTitle} numberOfLines={2}>
                    {item.course.title}
                  </Text>
                  <Badge
                    label={`${item.bookings.length} ${t('tutorDashboard.studentsCount')}`}
                    tone="primary"
                  />
                </View>
                <Text style={styles.rowMeta}>
                  {formatDate(item.startsAt, language)} · {formatTime(item.startsAt, language)}
                </Text>
              </View>
            ))
          )}

          <View style={styles.sectionHeader}>
            <Text style={styles.heading}>{t('tutorDashboard.myCoursesPreview')}</Text>
            <Pressable onPress={() => router.push('/tutor-dashboard/courses')} hitSlop={8}>
              <Text style={styles.seeAll}>{t('common.seeAll')}</Text>
            </Pressable>
          </View>
          {courses.length === 0 ? (
            <EmptyState
              title={t('tutorDashboard.emptyCourses')}
              subtitle={t('tutorDashboard.emptyCoursesHint')}
              icon="book-outline"
            />
          ) : (
            courses.map((course: TutorCourseRow) => (
              <Pressable
                key={course.id}
                style={styles.row}
                onPress={() =>
                  router.push({
                    pathname: '/tutor-dashboard/create',
                    params: { courseId: course.id },
                  })
                }
              >
                <View style={styles.rowTop}>
                  <Text style={styles.rowTitle} numberOfLines={2}>
                    {course.title}
                  </Text>
                  <Badge label={course.status} tone={statusTone(course.status)} />
                </View>
                <View style={styles.rowBottom}>
                  <Text style={styles.rowMeta}>
                    {course._count?.bookings ?? 0} {t('tutorDashboard.studentsCount')}
                  </Text>
                  <PriceDisplay
                    amount={course.priceDecimal}
                    currency={course.currency}
                    sessionCount={course.sessionCount}
                    compact
                  />
                </View>
              </Pressable>
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
  sectionHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  seeAll: { ...typography.caption, color: colors.primary, fontWeight: '700' },
  cards: { flexDirection: 'row', flexWrap: 'wrap', gap: spacing.md },
  card: {
    flexGrow: 1,
    flexBasis: '30%',
    minWidth: 100,
    backgroundColor: colors.white,
    borderRadius: radius.lg,
    padding: spacing.lg,
    gap: spacing.xs,
    ...shadows.sm,
  },
  cardLabel: { ...typography.caption, color: colors.textSecondary },
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
    gap: spacing.sm,
    ...shadows.sm,
  },
  rowTop: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    justifyContent: 'space-between',
    gap: spacing.md,
  },
  rowBottom: {
    flexDirection: 'row',
    alignItems: 'flex-end',
    justifyContent: 'space-between',
    gap: spacing.md,
  },
  rowTitle: { ...typography.body, color: colors.text, fontWeight: '600', flex: 1 },
  rowMeta: { ...typography.caption, color: colors.textMuted },
});
