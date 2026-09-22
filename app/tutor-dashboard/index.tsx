import { Ionicons } from '@expo/vector-icons';
import { Image } from 'expo-image';
import { useRouter } from 'expo-router';
import React, { useMemo } from 'react';
import {
  Pressable,
  RefreshControl,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from 'react-native';
import { useQuery } from '@tanstack/react-query';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Avatar } from '@/components/Avatar';
import { EmptyState } from '@/components/EmptyState';
import { ErrorState } from '@/components/ErrorState';
import { IconButton } from '@/components/IconButton';
import { LoadingState } from '@/components/LoadingState';
import { SectionHeader } from '@/components/SectionHeader';
import { useAuth } from '@/features/auth/useAuth';
import { useLayout } from '@/hooks/useLayout';
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
import { resolveCourseImageSource } from '@/utils/courseImages';
import {
  courseTitle,
  formatDate,
  formatPrice,
  formatTime,
  greetingKey,
} from '@/utils/format';

function relativeSessionLabel(startsAt: string, t: (key: string) => string, language: string) {
  const start = new Date(startsAt);
  const now = new Date();
  const startDay = new Date(start.getFullYear(), start.getMonth(), start.getDate());
  const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());
  const diffDays = Math.round((startDay.getTime() - today.getTime()) / 86_400_000);

  if (diffDays <= 0) return t('tutorDashboard.today');
  if (diffDays === 1) return t('tutorDashboard.tomorrow');
  if (diffDays < 7) {
    return t('tutorDashboard.inDays').replace('{{count}}', String(diffDays));
  }
  if (diffDays < 14) return t('tutorDashboard.inOneWeek');
  return formatDate(startsAt, language);
}

function statusTone(status: CourseStatus): { bg: string; text: string } {
  if (status === 'Published') return { bg: colors.successSoft, text: colors.success };
  if (status === 'Paused') return { bg: colors.warningSoft, text: colors.warning };
  if (status === 'Draft') return { bg: colors.beige, text: colors.textSecondary };
  return { bg: colors.lavenderSoft, text: colors.primary };
}

export default function TutorDashboardHome() {
  const { t, language, isRTL } = useTranslation();
  const router = useRouter();
  const layout = useLayout();
  const { user } = useAuth();

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
  const courses = (coursesQuery.data ?? []).slice(0, 4);
  const firstName = user?.firstName ?? t('brand.name');

  const pendingCourseCount = useMemo(() => {
    const ids = new Set<string>();
    (upcomingQuery.data ?? []).forEach((session) => {
      session.bookings.forEach((booking) => {
        if (
          booking.status === 'Pending' ||
          booking.payment?.status === 'Pending' ||
          booking.payment?.status === 'Processing'
        ) {
          ids.add(session.course.id);
        }
      });
    });
    return ids.size;
  }, [upcomingQuery.data]);

  const quickActions = [
    {
      id: 'courses',
      label: t('tutorDashboard.courses'),
      icon: 'book-outline' as const,
      soft: colors.lavenderSoft,
      href: '/tutor-dashboard/courses' as const,
    },
    {
      id: 'create',
      label: t('tutorDashboard.createCourse'),
      icon: 'add-circle-outline' as const,
      soft: '#F3E6D8',
      href: '/tutor-dashboard/create' as const,
    },
    {
      id: 'upcoming',
      label: t('tutorDashboard.bookings'),
      icon: 'calendar-outline' as const,
      soft: colors.lavenderSoft,
      href: '/tutor-dashboard/bookings' as const,
    },
    {
      id: 'students',
      label: t('tutorDashboard.students'),
      icon: 'people-outline' as const,
      soft: '#F3E6D8',
      href: '/tutor-dashboard/students' as const,
    },
    {
      id: 'earnings',
      label: t('tutorDashboard.earnings'),
      icon: 'bar-chart-outline' as const,
      soft: colors.lavenderSoft,
      href: '/tutor-dashboard/earnings' as const,
    },
  ];

  return (
    <SafeAreaView style={styles.safe} edges={['top']}>
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
            showsVerticalScrollIndicator={false}
          >
            <View style={styles.header}>
              <View style={styles.headerLeft}>
                <Avatar name={firstName} size={48} />
                <View style={styles.headerCopy}>
                  <Text style={styles.greeting} numberOfLines={1}>
                    {t(greetingKey())}, <Text style={styles.greetingName}>{firstName}</Text>{' '}
                    <Text style={styles.wave}>👋</Text>
                  </Text>
                  <Text style={styles.subtitle}>{t('tutorDashboard.title')}</Text>
                </View>
              </View>
              <View style={styles.bellWrap}>
                <IconButton
                  name="notifications-outline"
                  onPress={() => router.push('/notifications')}
                  background={colors.white}
                />
                <View style={styles.bellDot} />
              </View>
            </View>

            <Pressable
              style={styles.promoWrap}
              onPress={() => router.push('/tutor-dashboard/create')}
            >
              <Image
                source={require('../../assets/images/bg2.png')}
                style={styles.promoBg}
                contentFit="cover"
              />
              <View style={styles.promo}>
                <View style={styles.promoCopy}>
                  <Text style={styles.promoTitle}>{t('tutorDashboard.promoTitle')}</Text>
                  <Text style={styles.promoSubtitle}>{t('tutorDashboard.promoSubtitle')}</Text>
                </View>
                <View style={styles.promoArrow}>
                  <Ionicons name="arrow-forward" size={20} color={colors.primary} />
                </View>
              </View>
            </Pressable>

            <ScrollView
              horizontal
              showsHorizontalScrollIndicator={false}
              contentContainerStyle={styles.statsRow}
            >
              <View style={styles.statCard}>
                <View style={[styles.statIcon, { backgroundColor: colors.lavenderSoft }]}>
                  <Ionicons name="wallet-outline" size={20} color={colors.primary} />
                </View>
                <Text style={styles.statLabel}>{t('tutorDashboard.paidTotal')}</Text>
                <Text style={styles.statValue}>
                  {formatPrice(earningsQuery.data?.paidTotal ?? 0, currency)}
                </Text>
                <Text style={styles.statHintPositive}>
                  ↑ {t('tutorDashboard.thisMonth')}
                </Text>
              </View>

              <View style={styles.statCard}>
                <View style={[styles.statIcon, { backgroundColor: '#F3E6D8' }]}>
                  <Ionicons name="time-outline" size={20} color="#C47A3A" />
                </View>
                <Text style={styles.statLabel}>{t('tutorDashboard.pendingPayment')}</Text>
                <Text style={styles.statValue}>
                  {formatPrice(earningsQuery.data?.pendingPaymentAmount ?? 0, currency)}
                </Text>
                <Text style={styles.statHintWarn}>
                  ●{' '}
                  {pendingCourseCount > 0
                    ? t('tutorDashboard.coursesPending').replace(
                        '{{count}}',
                        String(pendingCourseCount),
                      )
                    : t('tutorDashboard.noPendingCourses')}
                </Text>
              </View>

              <View style={styles.statCard}>
                <View style={[styles.statIcon, { backgroundColor: colors.lavenderSoft }]}>
                  <Ionicons name="card-outline" size={20} color={colors.primary} />
                </View>
                <Text style={styles.statLabel}>{t('tutorDashboard.pendingPayout')}</Text>
                <Text style={styles.statValue}>
                  {formatPrice(earningsQuery.data?.pendingPayoutAmount ?? 0, currency)}
                </Text>
                <Text style={styles.statHintMuted}>
                  ●{' '}
                  {(earningsQuery.data?.pendingPayoutAmount ?? 0) > 0
                    ? t('tutorDashboard.payoutWaiting')
                    : t('tutorDashboard.noPendingPayouts')}
                </Text>
              </View>
            </ScrollView>

            <SectionHeader
              title={t('tutorDashboard.quickActions')}
              actionLabel={t('common.seeAll')}
              onAction={() => router.push('/tutor-dashboard/courses')}
            />
            <ScrollView
              horizontal
              showsHorizontalScrollIndicator={false}
              contentContainerStyle={styles.actionsRow}
            >
              {quickActions.map((action) => (
                <Pressable
                  key={action.id}
                  style={styles.actionTile}
                  onPress={() => router.push(action.href)}
                >
                  <View style={[styles.actionIcon, { backgroundColor: action.soft }]}>
                    <Ionicons name={action.icon} size={22} color={colors.primary} />
                  </View>
                  <Text style={styles.actionLabel} numberOfLines={2}>
                    {action.label}
                  </Text>
                </Pressable>
              ))}
            </ScrollView>

            <SectionHeader
              title={t('tutorDashboard.bookings')}
              actionLabel={t('common.seeAll')}
              onAction={() => router.push('/tutor-dashboard/bookings')}
            />
            {upcoming.length === 0 ? (
              <EmptyState
                title={t('tutorDashboard.emptyBookings')}
                subtitle={t('tutorDashboard.emptyBookingsHint')}
                icon="calendar-outline"
              />
            ) : (
              <View style={styles.list}>
                {upcoming.map((item: TutorUpcomingSession) => {
                  const { source } = resolveCourseImageSource(item.course);
                  const students = item.bookings.length;
                  return (
                    <Pressable
                      key={item.id}
                      style={styles.sessionCard}
                      onPress={() => router.push('/tutor-dashboard/bookings')}
                    >
                      <Image source={source} style={styles.sessionThumb} contentFit="cover" />
                      <View style={styles.sessionBody}>
                        <Text style={styles.sessionTitle} numberOfLines={1}>
                          {courseTitle(item.course, language)}
                        </Text>
                        <Text style={styles.sessionMeta}>
                          {formatDate(item.startsAt, language)} · {formatTime(item.startsAt, language)}
                          {' – '}
                          {formatTime(item.endsAt, language)}
                        </Text>
                        <Text style={styles.sessionStudents}>
                          👥 {students}{' '}
                          {students === 1
                            ? t('tutorDashboard.studentSingular')
                            : t('tutorDashboard.studentsCount')}
                        </Text>
                      </View>
                      <View style={styles.sessionRight}>
                        <View style={styles.whenPill}>
                          <Text style={styles.whenText}>
                            {relativeSessionLabel(item.startsAt, t, language)}
                          </Text>
                        </View>
                        <Ionicons
                          name={isRTL ? 'chevron-back' : 'chevron-forward'}
                          size={18}
                          color={colors.textMuted}
                        />
                      </View>
                    </Pressable>
                  );
                })}
              </View>
            )}

            <SectionHeader
              title={t('tutorDashboard.myCoursesPreview')}
              actionLabel={t('common.seeAll')}
              onAction={() => router.push('/tutor-dashboard/courses')}
            />
            {courses.length === 0 ? (
              <EmptyState
                title={t('tutorDashboard.emptyCourses')}
                subtitle={t('tutorDashboard.emptyCoursesHint')}
                icon="book-outline"
              />
            ) : (
              <View style={styles.list}>
                {courses.map((course: TutorCourseRow) => {
                  const { source } = resolveCourseImageSource(course);
                  const tone = statusTone(course.status);
                  const students = course._count?.bookings ?? 0;
                  return (
                    <Pressable
                      key={course.id}
                      style={styles.courseCard}
                      onPress={() =>
                        router.push({
                          pathname: '/tutor-dashboard/create',
                          params: { courseId: course.id },
                        })
                      }
                    >
                      <Image source={source} style={styles.courseThumb} contentFit="cover" />
                      <View style={styles.courseBody}>
                        <Text style={styles.courseTitle} numberOfLines={2}>
                          {courseTitle(course, language)}
                        </Text>
                        <Text style={styles.courseMeta}>
                          {students} {t('tutorDashboard.studentsCount')} · {course.sessionCount}{' '}
                          {t('course.sessions').toLowerCase()} · {t('course.priceTotal')}
                        </Text>
                      </View>
                      <View style={styles.courseRight}>
                        <View style={[styles.statusPill, { backgroundColor: tone.bg }]}>
                          <Text style={[styles.statusText, { color: tone.text }]}>
                            {course.status}
                          </Text>
                        </View>
                        <Text style={styles.coursePrice}>
                          {formatPrice(course.priceDecimal, course.currency)}
                        </Text>
                        <Ionicons
                          name={isRTL ? 'chevron-back' : 'chevron-forward'}
                          size={18}
                          color={colors.textMuted}
                        />
                      </View>
                    </Pressable>
                  );
                })}
              </View>
            )}
          </ScrollView>
        ) : null}
      </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: colors.background },
  content: {
    gap: spacing.lg,
    paddingTop: spacing.md,
    paddingBottom: spacing.massive,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: spacing.md,
  },
  headerLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.md,
    flex: 1,
  },
  headerCopy: { flex: 1, gap: 2 },
  greeting: {
    ...typography.heading,
    color: colors.text,
    fontSize: 22,
    lineHeight: 28,
  },
  greetingName: { fontWeight: '800' },
  wave: { fontSize: 20 },
  subtitle: {
    ...typography.caption,
    color: colors.textMuted,
    fontWeight: '600',
  },
  bellWrap: { position: 'relative' },
  bellDot: {
    position: 'absolute',
    top: 10,
    ...( { end: 12 } as object ),
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: colors.lavender,
  },
  promoWrap: {
    borderRadius: radius.xxl,
    overflow: 'hidden',
    width: '100%',
    aspectRatio: 2.35,
    ...shadows.sm,
  },
  promoBg: {
    ...StyleSheet.absoluteFill,
    width: '100%',
    height: '100%',
  },
  promo: {
    ...StyleSheet.absoluteFill,
    paddingHorizontal: spacing.xl,
    paddingVertical: spacing.lg,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: spacing.lg,
    backgroundColor: 'rgba(247, 243, 238, 0.22)',
  },
  promoCopy: { flex: 1, gap: spacing.xs },
  promoTitle: {
    ...typography.heading,
    color: colors.primary,
    fontSize: 20,
    lineHeight: 26,
  },
  promoSubtitle: {
    ...typography.body,
    color: colors.primaryMuted,
    fontStyle: 'italic',
  },
  promoArrow: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: colors.white,
    alignItems: 'center',
    justifyContent: 'center',
    ...shadows.sm,
  },
  statsRow: {
    gap: spacing.md,
    paddingVertical: spacing.xs,
  },
  statCard: {
    width: 168,
    backgroundColor: colors.white,
    borderRadius: radius.xl,
    padding: spacing.lg,
    gap: spacing.xs,
    ...shadows.sm,
  },
  statIcon: {
    width: 40,
    height: 40,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: spacing.xs,
  },
  statLabel: {
    ...typography.caption,
    color: colors.textSecondary,
    fontWeight: '600',
  },
  statValue: {
    ...typography.subheading,
    color: colors.primary,
    fontSize: 16,
    fontWeight: '800',
  },
  statHintPositive: {
    ...typography.caption,
    color: colors.success,
    fontWeight: '600',
    marginTop: 2,
  },
  statHintWarn: {
    ...typography.caption,
    color: '#C47A3A',
    fontWeight: '600',
    marginTop: 2,
  },
  statHintMuted: {
    ...typography.caption,
    color: colors.textMuted,
    fontWeight: '600',
    marginTop: 2,
  },
  actionsRow: {
    gap: spacing.sm,
  },
  actionTile: {
    width: 88,
    backgroundColor: colors.white,
    borderRadius: radius.xl,
    paddingVertical: spacing.md,
    paddingHorizontal: spacing.sm,
    alignItems: 'center',
    gap: spacing.sm,
    ...shadows.sm,
  },
  actionIcon: {
    width: 44,
    height: 44,
    borderRadius: 14,
    alignItems: 'center',
    justifyContent: 'center',
  },
  actionLabel: {
    ...typography.caption,
    color: colors.text,
    fontWeight: '600',
    textAlign: 'center',
    fontSize: 11,
    lineHeight: 14,
  },
  list: { gap: spacing.md },
  sessionCard: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.md,
    backgroundColor: colors.white,
    borderRadius: radius.xl,
    padding: spacing.md,
    ...shadows.sm,
  },
  sessionThumb: {
    width: 56,
    height: 56,
    borderRadius: 14,
    backgroundColor: colors.lavenderSoft,
  },
  sessionBody: { flex: 1, gap: 2 },
  sessionTitle: {
    ...typography.body,
    color: colors.text,
    fontWeight: '700',
  },
  sessionMeta: {
    ...typography.caption,
    color: colors.textMuted,
  },
  sessionStudents: {
    ...typography.caption,
    color: colors.textSecondary,
    fontWeight: '600',
    marginTop: 2,
  },
  sessionRight: {
    alignItems: 'flex-end',
    gap: spacing.sm,
  },
  whenPill: {
    backgroundColor: colors.lavenderSoft,
    paddingHorizontal: spacing.sm,
    paddingVertical: 4,
    borderRadius: radius.full,
  },
  whenText: {
    ...typography.caption,
    color: colors.primary,
    fontWeight: '700',
    fontSize: 11,
  },
  courseCard: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.md,
    backgroundColor: colors.white,
    borderRadius: radius.xl,
    padding: spacing.md,
    ...shadows.sm,
  },
  courseThumb: {
    width: 64,
    height: 64,
    borderRadius: 14,
    backgroundColor: colors.lavenderSoft,
  },
  courseBody: { flex: 1, gap: 4 },
  courseTitle: {
    ...typography.body,
    color: colors.text,
    fontWeight: '700',
  },
  courseMeta: {
    ...typography.caption,
    color: colors.textMuted,
  },
  courseRight: {
    alignItems: 'flex-end',
    gap: 6,
  },
  statusPill: {
    paddingHorizontal: spacing.sm,
    paddingVertical: 3,
    borderRadius: radius.full,
  },
  statusText: {
    ...typography.caption,
    fontWeight: '700',
    fontSize: 11,
  },
  coursePrice: {
    ...typography.caption,
    color: colors.primary,
    fontWeight: '800',
  },
});
