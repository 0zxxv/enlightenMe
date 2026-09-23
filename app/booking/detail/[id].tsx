import { Ionicons } from '@expo/vector-icons';
import { Image } from 'expo-image';
import { useLocalSearchParams, useNavigation, useRouter } from 'expo-router';
import React, { useLayoutEffect, useState } from 'react';
import {
  Alert,
  Linking,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from 'react-native';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Avatar } from '@/components/Avatar';
import { ErrorState } from '@/components/ErrorState';
import { LoadingState } from '@/components/LoadingState';
import { useAuth } from '@/features/auth/useAuth';
import { useOpenConversation } from '@/features/messages/hooks';
import { useTranslation } from '@/i18n';
import * as bookingsApi from '@/services/api/bookings';
import { colors, radius, shadows, spacing, typography } from '@/theme';
import { ApiError } from '@/types/api';
import type { BookingStatus, CourseFormat, PaymentStatus } from '@/types/models';
import { courseTitle, formatDate, formatPrice, formatTime, fullName } from '@/utils/format';

function statusTone(status: BookingStatus) {
  if (status === 'Confirmed' || status === 'Completed') {
    return { bg: colors.successSoft, fg: colors.success };
  }
  if (status === 'Cancelled' || status === 'Refunded') {
    return { bg: colors.errorSoft, fg: colors.error };
  }
  return { bg: colors.lavenderSoft, fg: colors.primary };
}

function paymentTone(status?: PaymentStatus | null) {
  if (status === 'Paid') return { bg: colors.successSoft, fg: colors.success };
  if (status === 'Failed' || status === 'Cancelled' || status === 'Refunded') {
    return { bg: colors.errorSoft, fg: colors.error };
  }
  return { bg: colors.warningSoft, fg: colors.warning };
}

function formatLabel(format: CourseFormat | undefined | null, t: (k: string) => string) {
  if (!format) return '—';
  if (format === 'Online') return t('common.online');
  if (format === 'InPerson') return t('common.inPerson');
  if (format === 'Hybrid') return t('common.hybrid');
  return format;
}

function courseDescription(
  course: { description: string; descriptionAr?: string | null } | undefined,
  language: string,
) {
  if (!course) return '';
  if (language === 'ar' && course.descriptionAr) return course.descriptionAr;
  return course.description;
}

export default function BookingDetailScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const { t, language, isRTL } = useTranslation();
  const { user } = useAuth();
  const navigation = useNavigation();
  const router = useRouter();
  const qc = useQueryClient();
  const openConversation = useOpenConversation();
  const [messaging, setMessaging] = useState(false);
  const chevron = isRTL ? 'chevron-back' : 'chevron-forward';

  const bookingQuery = useQuery({
    queryKey: ['booking', id],
    queryFn: () => bookingsApi.getBooking(id),
    enabled: Boolean(id),
  });

  useLayoutEffect(() => {
    navigation.setOptions({ headerShown: false });
  }, [navigation]);

  if (bookingQuery.isLoading) {
    return (
      <View style={styles.root}>
        <LoadingState />
      </View>
    );
  }
  if (bookingQuery.isError || !bookingQuery.data) {
    return (
      <View style={styles.root}>
        <ErrorState onRetry={() => bookingQuery.refetch()} />
      </View>
    );
  }

  const booking = bookingQuery.data;
  const course = booking.course;
  const title = course ? courseTitle(course, language) : booking.courseId;
  const description = courseDescription(course, language);
  const tutorName = fullName(course?.tutor?.firstName, course?.tutor?.lastName);
  const tutorId = course?.tutorId ?? course?.tutor?.id;
  const verified = course?.tutor?.tutorProfile?.verificationStatus === 'Verified';
  const ratingAvg = course?.tutor?.tutorProfile?.ratingAvg ?? course?.ratingAvg ?? 0;
  const ratingCount = course?.tutor?.tutorProfile?.ratingCount ?? course?.ratingCount ?? 0;
  const sessionCount = course?.sessionCount ?? 1;
  const completed = booking.status === 'Completed';
  const doneSessions = completed ? sessionCount : booking.status === 'Confirmed' ? 1 : 0;
  const progress = Math.min(1, sessionCount > 0 ? doneSessions / sessionCount : 0);
  const canCancel = booking.status === 'Pending' || booking.status === 'Confirmed';
  const canMessage = Boolean(tutorId) && (user?.role === 'Student' || user?.role === 'Parent');
  const canJoin = booking.status === 'Confirmed' && course?.format !== 'InPerson';
  const paid = booking.payment?.status === 'Paid';
  const statusColors = statusTone(booking.status);
  const payColors = paymentTone(booking.payment?.status);
  const startsAt = booking.session?.startsAt;
  const endsAt = booking.session?.endsAt;

  const onCancel = () => {
    Alert.alert(t('bookings.cancel'), t('bookings.cancelConfirm'), [
      { text: t('common.cancel'), style: 'cancel' },
      {
        text: t('bookings.cancel'),
        style: 'destructive',
        onPress: async () => {
          try {
            await bookingsApi.cancelBooking(booking.id);
            await qc.invalidateQueries({ queryKey: ['bookings'] });
            await bookingQuery.refetch();
          } catch (err) {
            Alert.alert(
              t('bookings.detail'),
              err instanceof ApiError ? err.message : t('common.error'),
            );
          }
        },
      },
    ]);
  };

  const onMessage = async () => {
    if (!tutorId) return;
    setMessaging(true);
    try {
      const result = await openConversation.mutateAsync(tutorId);
      router.push(`/conversation/${result.conversationId}`);
    } catch (err) {
      Alert.alert(
        t('messages.title'),
        err instanceof ApiError ? err.message : t('messages.openFailed'),
      );
    } finally {
      setMessaging(false);
    }
  };

  const onAddToCalendar = async () => {
    if (!startsAt) {
      Alert.alert(t('bookings.detail'), t('bookings.calendarFailed'));
      return;
    }
    const start = new Date(startsAt);
    const end = endsAt ? new Date(endsAt) : new Date(start.getTime() + 90 * 60 * 1000);
    const stamp = (d: Date) => d.toISOString().replace(/[-:]/g, '').replace(/\.\d{3}/, '');
    const url =
      `https://calendar.google.com/calendar/render?action=TEMPLATE` +
      `&text=${encodeURIComponent(title)}` +
      `&dates=${stamp(start)}/${stamp(end)}` +
      `&details=${encodeURIComponent(tutorName || 'Dars')}`;
    try {
      await Linking.openURL(url);
    } catch {
      Alert.alert(t('bookings.detail'), t('bookings.calendarFailed'));
    }
  };

  const onMore = () => {
    const buttons: {
      text: string;
      style?: 'cancel' | 'destructive' | 'default';
      onPress?: () => void;
    }[] = [];
    if (canCancel) {
      buttons.push({
        text: t('bookings.cancel'),
        style: 'destructive',
        onPress: onCancel,
      });
    }
    buttons.push({
      text: t('bookings.needHelp'),
      onPress: () => Linking.openURL('mailto:support@dars.app'),
    });
    buttons.push({ text: t('common.cancel'), style: 'cancel' });
    Alert.alert(t('bookings.detail'), undefined, buttons);
  };

  const menuItems = [
    {
      key: 'course',
      icon: 'document-text-outline' as const,
      title: t('bookings.courseDetails'),
      subtitle: t('bookings.courseDetailsHint'),
      onPress: () => router.push(`/course/${booking.courseId}`),
    },
    {
      key: 'notes',
      icon: 'create-outline' as const,
      title: t('bookings.myNotes'),
      subtitle: t('bookings.myNotesHint'),
      onPress: () => Alert.alert(t('bookings.myNotes'), t('bookings.comingSoon')),
    },
    {
      key: 'rate',
      icon: 'star' as const,
      iconColor: colors.star,
      title: t('bookings.rateExperience'),
      subtitle: t('bookings.rateExperienceHint'),
      onPress: () => Alert.alert(t('bookings.rateExperience'), t('bookings.comingSoon')),
    },
    ...(completed
      ? [
          {
            key: 'cert',
            icon: 'download-outline' as const,
            title: t('bookings.certificate'),
            subtitle: t('bookings.certificateHint'),
            onPress: () => Alert.alert(t('bookings.certificate'), t('bookings.comingSoon')),
          },
        ]
      : []),
  ];

  return (
    <View style={styles.root}>
      <View style={styles.blobA} pointerEvents="none" />
      <View style={styles.blobB} pointerEvents="none" />

      <SafeAreaView style={styles.safe} edges={['top']}>
        <View style={styles.topBar}>
          <Pressable
            style={styles.iconBtn}
            onPress={() => router.back()}
            accessibilityLabel={t('common.back')}
          >
            <Ionicons
              name={isRTL ? 'chevron-forward' : 'chevron-back'}
              size={22}
              color={colors.primary}
            />
          </Pressable>
          <View style={styles.topTitles}>
            <Text style={styles.pageTitle}>{t('bookings.detail')}</Text>
            <Text style={styles.pageSubtitle}>{t('bookings.detailSubtitle')}</Text>
          </View>
          <Pressable
            style={styles.iconBtn}
            onPress={onMore}
            accessibilityLabel={t('bookings.detail')}
          >
            <Ionicons name="ellipsis-vertical" size={18} color={colors.primary} />
          </Pressable>
        </View>

        <ScrollView
          contentContainerStyle={styles.content}
          showsVerticalScrollIndicator={false}
        >
          <View style={styles.heroCard}>
            <View style={styles.heroTop}>
              {course?.imageUrl ? (
                <Image
                  source={{ uri: course.imageUrl }}
                  style={styles.heroImage}
                  contentFit="cover"
                />
              ) : (
                <View style={[styles.heroImage, styles.heroImageFallback]}>
                  <Ionicons name="school" size={28} color={colors.primary} />
                </View>
              )}
              <View style={styles.heroCopy}>
                <View style={styles.heroTitleRow}>
                  <Text style={styles.heroTitle} numberOfLines={2}>
                    {title}
                  </Text>
                  <View style={[styles.statusPill, { backgroundColor: statusColors.bg }]}>
                    <Text style={[styles.statusText, { color: statusColors.fg }]}>
                      {booking.status}
                    </Text>
                  </View>
                </View>
                {description ? (
                  <Text style={styles.heroDesc} numberOfLines={2}>
                    {description}
                  </Text>
                ) : null}
              </View>
            </View>

            {tutorName ? (
              <Pressable
                style={styles.tutorRow}
                onPress={() => (tutorId ? router.push(`/tutor/${tutorId}`) : undefined)}
              >
                <Avatar name={tutorName} size={36} />
                <View style={styles.tutorMeta}>
                  <View style={styles.tutorNameRow}>
                    <Text style={styles.tutorName}>{tutorName}</Text>
                    {verified ? (
                      <Ionicons name="checkmark-circle" size={16} color={colors.lavender} />
                    ) : null}
                  </View>
                  {ratingCount > 0 ? (
                    <View style={styles.ratingRow}>
                      <Ionicons name="star" size={13} color={colors.star} />
                      <Text style={styles.ratingText}>
                        {ratingAvg.toFixed(1)} ({ratingCount})
                      </Text>
                    </View>
                  ) : null}
                </View>
              </Pressable>
            ) : null}
          </View>

          <View style={styles.metaCard}>
            <View style={styles.metaCol}>
              <Ionicons name="calendar-outline" size={18} color={colors.primary} />
              <Text style={styles.metaLabel}>{t('bookings.date')}</Text>
              <Text style={styles.metaValue}>
                {startsAt ? formatDate(startsAt, language) : '—'}
              </Text>
            </View>
            <View style={styles.metaDivider} />
            <View style={styles.metaCol}>
              <Ionicons name="time-outline" size={18} color={colors.primary} />
              <Text style={styles.metaLabel}>{t('bookings.time')}</Text>
              <Text style={styles.metaValue}>
                {startsAt ? formatTime(startsAt, language) : '—'}
              </Text>
            </View>
            <View style={styles.metaDivider} />
            <View style={styles.metaCol}>
              <Ionicons
                name={course?.format === 'InPerson' ? 'location-outline' : 'videocam-outline'}
                size={18}
                color={colors.primary}
              />
              <Text style={styles.metaLabel}>{t('bookings.mode')}</Text>
              <Text style={styles.metaValue}>{formatLabel(course?.format, t)}</Text>
            </View>
          </View>

          <Pressable style={styles.paymentCard}>
            <View style={styles.payIcon}>
              <Ionicons name="wallet-outline" size={22} color={colors.primary} />
            </View>
            <View style={styles.payBody}>
              <Text style={styles.payLabel}>
                {paid ? t('bookings.totalPaid') : t('bookings.payment')}
              </Text>
              <Text style={styles.payAmount}>
                {formatPrice(booking.priceSnapshot, booking.currency || t('common.currency'))}
              </Text>
              <Text style={styles.payMeta}>
                {sessionCount} {t('course.sessions')} · {t('course.priceTotal')}
              </Text>
            </View>
            <View style={styles.payRight}>
              <View style={[styles.payPill, { backgroundColor: payColors.bg }]}>
                <Ionicons
                  name={paid ? 'checkmark-circle' : 'time-outline'}
                  size={14}
                  color={payColors.fg}
                />
                <Text style={[styles.payPillText, { color: payColors.fg }]}>
                  {booking.payment?.status ?? t('bookings.unpaid')}
                </Text>
              </View>
              {booking.payment?.paidAt ? (
                <Text style={styles.paidOn}>
                  {t('bookings.paidOn')} {formatDate(booking.payment.paidAt, language)}
                </Text>
              ) : null}
            </View>
            <Ionicons name={chevron} size={16} color={colors.textMuted} />
          </Pressable>

          <View style={styles.actions}>
            <Pressable
              style={[styles.actionBtn, styles.actionPrimary, (!canMessage || messaging) && styles.disabled]}
              onPress={onMessage}
              disabled={!canMessage || messaging}
            >
              <Ionicons name="chatbubble-outline" size={20} color={colors.white} />
              <Text style={styles.actionPrimaryText}>{t('bookings.messageTutor')}</Text>
            </Pressable>
            <Pressable
              style={[styles.actionBtn, styles.actionSecondary, !canJoin && styles.disabled]}
              onPress={() => Alert.alert(t('bookings.joinSession'), t('bookings.joinSessionHint'))}
              disabled={!canJoin}
            >
              <Ionicons name="videocam-outline" size={20} color={colors.primary} />
              <Text style={styles.actionSecondaryText}>{t('bookings.joinSession')}</Text>
            </Pressable>
            <Pressable style={[styles.actionBtn, styles.actionSecondary]} onPress={onAddToCalendar}>
              <Ionicons name="calendar-outline" size={20} color={colors.primary} />
              <Text style={styles.actionSecondaryText}>{t('bookings.addToCalendar')}</Text>
            </Pressable>
            <Pressable
              style={[styles.actionBtn, styles.actionSecondary]}
              onPress={() => router.push(`/course/${booking.courseId}`)}
            >
              <Ionicons name="document-text-outline" size={20} color={colors.primary} />
              <Text style={styles.actionSecondaryText}>{t('booking.viewCourse')}</Text>
            </Pressable>
          </View>

          <View style={styles.progressCard}>
            <View style={styles.progressRing}>
              <View
                style={[
                  styles.progressTrack,
                  {
                    borderColor: progress >= 1 ? colors.success : colors.lavender,
                  },
                ]}
              />
              <Text style={styles.progressCount}>
                {doneSessions}/{sessionCount}
              </Text>
            </View>
            <View style={styles.progressBody}>
              <Text style={styles.progressTitle}>
                {completed ? t('bookings.sessionsCompleted') : t('bookings.sessionsProgress')}
              </Text>
              <Text style={styles.progressHint}>
                {completed ? t('bookings.sessionsCompletedHint') : t('bookings.sessionsProgressHint')}
              </Text>
            </View>
            <Pressable
              style={styles.viewSessions}
              onPress={() => router.push(`/course/${booking.courseId}`)}
            >
              <Text style={styles.viewSessionsText}>{t('bookings.viewSessions')}</Text>
              <Ionicons name={chevron} size={14} color={colors.primary} />
            </Pressable>
          </View>

          <View style={styles.menuCard}>
            {menuItems.map((item, index) => (
              <Pressable
                key={item.key}
                style={[styles.menuRow, index > 0 && styles.menuRowBorder]}
                onPress={item.onPress}
              >
                <View style={styles.menuIcon}>
                  <Ionicons
                    name={item.icon}
                    size={18}
                    color={item.iconColor ?? colors.primary}
                  />
                </View>
                <View style={styles.menuText}>
                  <Text style={styles.menuTitle}>{item.title}</Text>
                  <Text style={styles.menuSubtitle}>{item.subtitle}</Text>
                </View>
                <Ionicons name={chevron} size={16} color={colors.textMuted} />
              </Pressable>
            ))}
          </View>

          <Pressable
            style={styles.helpCard}
            onPress={() => Linking.openURL('mailto:support@dars.app')}
          >
            <View style={styles.helpIcon}>
              <Ionicons name="help-buoy-outline" size={22} color={colors.primary} />
            </View>
            <View style={styles.helpBody}>
              <Text style={styles.helpTitle}>{t('bookings.needHelp')}</Text>
              <Text style={styles.helpSubtitle}>{t('bookings.needHelpDetail')}</Text>
            </View>
            <Ionicons name={chevron} size={18} color={colors.textMuted} />
          </Pressable>
        </ScrollView>
      </SafeAreaView>
    </View>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1, backgroundColor: colors.background, overflow: 'hidden' },
  blobA: {
    position: 'absolute',
    top: -30,
    right: -40,
    width: 160,
    height: 140,
    borderRadius: 80,
    backgroundColor: colors.lavenderSoft,
    opacity: 0.7,
  },
  blobB: {
    position: 'absolute',
    top: 24,
    right: 48,
    width: 90,
    height: 80,
    borderRadius: 45,
    backgroundColor: '#F3E8E0',
    opacity: 0.65,
  },
  safe: { flex: 1 },
  topBar: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.md,
    paddingHorizontal: spacing.xl,
    paddingTop: spacing.sm,
    paddingBottom: spacing.md,
  },
  iconBtn: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: colors.white,
    borderWidth: 1,
    borderColor: colors.border,
    alignItems: 'center',
    justifyContent: 'center',
    ...shadows.sm,
  },
  topTitles: { flex: 1, alignItems: 'center', gap: 2 },
  pageTitle: {
    ...typography.subheading,
    color: colors.primary,
    fontWeight: '800',
    fontSize: 18,
  },
  pageSubtitle: {
    ...typography.caption,
    color: colors.textMuted,
  },
  content: {
    paddingHorizontal: spacing.xl,
    paddingBottom: spacing.massive,
    gap: spacing.md,
  },
  heroCard: {
    backgroundColor: colors.white,
    borderRadius: radius.xl,
    padding: spacing.lg,
    gap: spacing.md,
    ...shadows.sm,
  },
  heroTop: { flexDirection: 'row', gap: spacing.md },
  heroImage: {
    width: 88,
    height: 88,
    borderRadius: radius.lg,
    backgroundColor: colors.lavenderSoft,
  },
  heroImageFallback: {
    alignItems: 'center',
    justifyContent: 'center',
  },
  heroCopy: { flex: 1, gap: 6 },
  heroTitleRow: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: spacing.sm,
  },
  heroTitle: {
    ...typography.subheading,
    color: colors.text,
    flex: 1,
    fontSize: 17,
    lineHeight: 22,
  },
  statusPill: {
    borderRadius: radius.full,
    paddingHorizontal: spacing.sm,
    paddingVertical: 3,
  },
  statusText: {
    ...typography.caption,
    fontWeight: '700',
    fontSize: 11,
  },
  heroDesc: {
    ...typography.caption,
    color: colors.textSecondary,
    lineHeight: 18,
  },
  tutorRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
  },
  tutorMeta: { flex: 1, gap: 2 },
  tutorNameRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  tutorName: {
    ...typography.body,
    color: colors.text,
    fontWeight: '700',
    fontSize: 14,
  },
  ratingRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  ratingText: {
    ...typography.caption,
    color: colors.textSecondary,
  },
  metaCard: {
    flexDirection: 'row',
    backgroundColor: colors.white,
    borderRadius: radius.xl,
    paddingVertical: spacing.lg,
    paddingHorizontal: spacing.sm,
    ...shadows.sm,
  },
  metaCol: {
    flex: 1,
    alignItems: 'center',
    gap: 4,
    paddingHorizontal: spacing.xs,
  },
  metaDivider: {
    width: StyleSheet.hairlineWidth,
    backgroundColor: colors.border,
    marginVertical: 4,
  },
  metaLabel: {
    ...typography.caption,
    color: colors.textMuted,
    fontSize: 11,
  },
  metaValue: {
    ...typography.caption,
    color: colors.text,
    fontWeight: '700',
    textAlign: 'center',
    fontSize: 12,
  },
  paymentCard: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
    backgroundColor: colors.white,
    borderRadius: radius.xl,
    padding: spacing.lg,
    ...shadows.sm,
  },
  payIcon: {
    width: 44,
    height: 44,
    borderRadius: radius.lg,
    backgroundColor: colors.lavenderSoft,
    alignItems: 'center',
    justifyContent: 'center',
  },
  payBody: { flex: 1, gap: 2 },
  payLabel: {
    ...typography.caption,
    color: colors.textMuted,
  },
  payAmount: {
    ...typography.subheading,
    color: colors.primary,
    fontSize: 18,
  },
  payMeta: {
    ...typography.caption,
    color: colors.textSecondary,
    fontSize: 12,
  },
  payRight: { alignItems: 'flex-end', gap: 4 },
  payPill: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    borderRadius: radius.full,
    paddingHorizontal: spacing.sm,
    paddingVertical: 4,
  },
  payPillText: {
    ...typography.caption,
    fontWeight: '700',
    fontSize: 11,
  },
  paidOn: {
    ...typography.caption,
    color: colors.textMuted,
    fontSize: 10,
  },
  actions: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: spacing.sm,
  },
  actionBtn: {
    width: '48%',
    flexGrow: 1,
    minHeight: 72,
    borderRadius: radius.xl,
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
    paddingHorizontal: spacing.sm,
    paddingVertical: spacing.md,
  },
  actionPrimary: {
    backgroundColor: colors.primary,
  },
  actionSecondary: {
    backgroundColor: colors.lavenderSoft,
  },
  actionPrimaryText: {
    ...typography.caption,
    color: colors.white,
    fontWeight: '700',
    textAlign: 'center',
  },
  actionSecondaryText: {
    ...typography.caption,
    color: colors.primary,
    fontWeight: '700',
    textAlign: 'center',
  },
  disabled: { opacity: 0.5 },
  progressCard: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.md,
    backgroundColor: colors.white,
    borderRadius: radius.xl,
    padding: spacing.lg,
    ...shadows.sm,
  },
  progressRing: {
    width: 56,
    height: 56,
    alignItems: 'center',
    justifyContent: 'center',
  },
  progressTrack: {
    ...StyleSheet.absoluteFill,
    borderRadius: 28,
    borderWidth: 5,
  },
  progressCount: {
    ...typography.caption,
    color: colors.text,
    fontWeight: '800',
    fontSize: 13,
  },
  progressBody: { flex: 1, gap: 2 },
  progressTitle: {
    ...typography.body,
    color: colors.text,
    fontWeight: '700',
    fontSize: 14,
  },
  progressHint: {
    ...typography.caption,
    color: colors.textSecondary,
  },
  viewSessions: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 2,
    backgroundColor: colors.lavenderSoft,
    borderRadius: radius.full,
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm,
  },
  viewSessionsText: {
    ...typography.caption,
    color: colors.primary,
    fontWeight: '700',
    fontSize: 11,
  },
  menuCard: {
    backgroundColor: colors.white,
    borderRadius: radius.xl,
    overflow: 'hidden',
    ...shadows.sm,
  },
  menuRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.md,
    paddingHorizontal: spacing.lg,
    paddingVertical: spacing.md,
  },
  menuRowBorder: {
    borderTopWidth: StyleSheet.hairlineWidth,
    borderTopColor: colors.border,
  },
  menuIcon: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: colors.lavenderSoft,
    alignItems: 'center',
    justifyContent: 'center',
  },
  menuText: { flex: 1, gap: 2 },
  menuTitle: {
    ...typography.body,
    color: colors.text,
    fontWeight: '700',
    fontSize: 15,
  },
  menuSubtitle: {
    ...typography.caption,
    color: colors.textMuted,
  },
  helpCard: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.md,
    backgroundColor: colors.lavenderSoft,
    borderRadius: radius.xl,
    padding: spacing.lg,
  },
  helpIcon: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: colors.white,
    alignItems: 'center',
    justifyContent: 'center',
  },
  helpBody: { flex: 1, gap: 2 },
  helpTitle: {
    ...typography.subheading,
    color: colors.primary,
    fontSize: 15,
  },
  helpSubtitle: {
    ...typography.caption,
    color: colors.textSecondary,
  },
});
