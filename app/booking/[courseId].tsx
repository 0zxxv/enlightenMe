import { Ionicons } from '@expo/vector-icons';
import { Image } from 'expo-image';
import * as ImagePicker from 'expo-image-picker';
import { useLocalSearchParams, useRouter } from 'expo-router';
import React, { useEffect, useMemo, useState } from 'react';
import {
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { BackButton } from '@/components/BackButton';
import { Button } from '@/components/Button';
import { ErrorState } from '@/components/ErrorState';
import { LoadingState } from '@/components/LoadingState';
import { useCreateBooking, useMyBookings } from '@/features/bookings/hooks';
import { useCourse } from '@/features/courses/hooks';
import { useLayout } from '@/hooks/useLayout';
import { useTranslation } from '@/i18n';
import { confirmStubPayment, createPaymentIntent } from '@/services/api/payments';
import { analytics } from '@/services/analytics';
import { colors, radius, shadows, spacing, typography } from '@/theme';
import { ApiError } from '@/types/api';
import { resolveCourseImageSource } from '@/utils/courseImages';
import { courseTitle, formatPrice, formatTime } from '@/utils/format';

/** Bahrain VAT */
const VAT_RATE = 0.1;

function formatSessionDate(value: string, locale: string) {
  const date = new Date(value);
  return date.toLocaleDateString(locale === 'ar' ? 'ar-BH' : 'en-GB', {
    weekday: 'short',
    day: 'numeric',
    month: 'short',
    year: 'numeric',
  });
}

function withCount(template: string, count: number) {
  return template.replace('{{count}}', String(count));
}

function formatMoney(amount: number, currency: string) {
  const rounded = Math.round(amount * 1000) / 1000;
  const text = Number.isInteger(rounded)
    ? String(rounded)
    : rounded.toFixed(3).replace(/0+$/, '').replace(/\.$/, '');
  return `${text} ${currency}`;
}

export default function BookingFlowScreen() {
  const { courseId, sessionId: sessionIdParam } = useLocalSearchParams<{
    courseId: string;
    sessionId?: string;
  }>();
  const { t, language, isRTL } = useTranslation();
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const layout = useLayout();
  const courseQuery = useCourse(courseId);
  const myBookings = useMyBookings();
  const createBooking = useCreateBooking();
  const [sessionId, setSessionId] = useState<string | undefined>(sessionIdParam);
  const [receiptUri, setReceiptUri] = useState<string>();
  const [error, setError] = useState<string>();
  const [duplicateBookingId, setDuplicateBookingId] = useState<string>();
  const [submitting, setSubmitting] = useState(false);

  const course = courseQuery.data;

  const bookedSessionIds = useMemo(() => {
    const ids = new Set<string>();
    for (const b of myBookings.data ?? []) {
      if (b.status !== 'Cancelled' && b.status !== 'Refunded') {
        ids.add(b.sessionId);
      }
    }
    return ids;
  }, [myBookings.data]);

  const availableSessions = useMemo(() => {
    const now = Date.now();
    return [...(course?.sessions ?? [])]
      .filter(
        (s) =>
          s.seatsAvailable > 0 &&
          new Date(s.startsAt).getTime() > now &&
          s.status === 'Scheduled' &&
          !bookedSessionIds.has(s.id),
      )
      .sort((a, b) => +new Date(a.startsAt) - +new Date(b.startsAt));
  }, [course?.sessions, bookedSessionIds]);

  useEffect(() => {
    if (!availableSessions.length) {
      setSessionId(undefined);
      return;
    }
    if (sessionId && availableSessions.some((s) => s.id === sessionId)) return;
    if (sessionIdParam && availableSessions.some((s) => s.id === sessionIdParam)) {
      setSessionId(sessionIdParam);
      return;
    }
    setSessionId(availableSessions[0].id);
  }, [availableSessions, sessionId, sessionIdParam]);

  const selectedSession = availableSessions.find((s) => s.id === sessionId);

  if (courseQuery.isLoading) {
    return (
      <View style={styles.root}>
        <BackButton withSafeTop />
        <LoadingState />
      </View>
    );
  }
  if (courseQuery.isError || !course) {
    return (
      <View style={styles.root}>
        <BackButton withSafeTop />
        <ErrorState onRetry={() => courseQuery.refetch()} />
      </View>
    );
  }

  const { source: imageSource, isLocal } = resolveCourseImageSource(course);
  const title = courseTitle(course, language);
  const priceLabel = formatPrice(course.priceDecimal, course.currency);
  const continueIcon = isRTL ? 'arrow-back' : 'arrow-forward';
  const tutorQrUrl = course.tutor?.tutorProfile?.paymentQrUrl?.trim() || null;
  const subtotal = Number(course.priceDecimal) || 0;
  const vatAmount = Math.round(subtotal * VAT_RATE * 1000) / 1000;
  const totalDue = Math.round((subtotal + vatAmount) * 1000) / 1000;
  const canConfirm =
    Boolean(sessionId) && Boolean(receiptUri) && Boolean(tutorQrUrl) && !submitting;

  const pickReceipt = async () => {
    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ['images'],
      quality: 0.85,
    });
    if (result.canceled || !result.assets[0]?.uri) return;
    setReceiptUri(result.assets[0].uri);
    setError(undefined);
  };

  const onConfirm = async () => {
    if (!sessionId) return;
    if (!receiptUri) {
      setError(t('booking.receiptRequired'));
      return;
    }
    setSubmitting(true);
    setError(undefined);
    setDuplicateBookingId(undefined);
    try {
      analytics.track('booking_started', {
        courseId: course.id,
        paymentMethod: 'benefitPay',
      });
      const booking = await createBooking.mutateAsync({
        courseId: course.id,
        sessionId,
      });
      const payment = await createPaymentIntent(booking.id);

      let paymentStatus = payment.payment.status;
      if (payment.intent.stubConfirmAvailable) {
        const confirmed = await confirmStubPayment(booking.id);
        paymentStatus = confirmed.booking?.payment?.status ?? 'Paid';
      }

      analytics.track('booking_completed', {
        bookingId: booking.id,
        paymentMethod: 'benefitPay',
      });
      router.replace({
        pathname: '/booking/confirmation',
        params: {
          bookingId: booking.id,
          paymentStatus,
        },
      });
    } catch (err) {
      if (err instanceof ApiError && err.code === 'ALREADY_BOOKED') {
        const existing = (myBookings.data ?? []).find(
          (b) => b.sessionId === sessionId && b.status !== 'Cancelled',
        );
        setDuplicateBookingId(existing?.id);
        setError(t('booking.alreadyBooked'));
      } else {
        setError(err instanceof ApiError ? err.message : t('common.error'));
      }
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <View style={styles.root}>
      <View style={[styles.topBar, { paddingTop: insets.top + spacing.sm }]}>
        <BackButton />
        <Text style={styles.screenTitle}>{t('booking.title')}</Text>
        <View style={styles.topBarSpacer} />
      </View>

      <ScrollView
        contentContainerStyle={[
          styles.content,
          {
            paddingHorizontal: layout.contentPadding,
            paddingBottom: spacing.xxl + 96,
            maxWidth: layout.contentMaxWidth ?? '100%',
            width: '100%',
            alignSelf: 'center',
          },
        ]}
        showsVerticalScrollIndicator={false}
      >
        <View style={styles.courseCard}>
          <View style={styles.courseDecor} pointerEvents="none" />
          <View style={styles.courseThumbWrap}>
            <Image
              source={imageSource}
              style={styles.courseThumb}
              contentFit={isLocal || course.imageUrl ? 'cover' : 'contain'}
            />
          </View>
          <View style={styles.courseCopy}>
            <Text style={styles.courseTitle} numberOfLines={2}>
              {title}
            </Text>
            <View style={styles.courseMeta}>
              <View style={styles.metaItem}>
                <Ionicons name="videocam-outline" size={14} color={colors.textMuted} />
                <Text style={styles.metaText}>
                  {withCount(t('course.sessionsCount'), course.sessionCount)}
                </Text>
              </View>
              <View style={styles.metaItem}>
                <Ionicons name="cube-outline" size={14} color={colors.textMuted} />
                <Text style={styles.metaText}>{t('course.priceTotal')}</Text>
              </View>
            </View>
            <Text style={styles.coursePrice}>{priceLabel}</Text>
          </View>
        </View>

        <View style={styles.section}>
          <Text style={styles.sectionTitle}>{t('booking.sessionDetails')}</Text>
          <Text style={styles.sectionSubtitle}>{t('booking.sessionDetailsHint')}</Text>

          {!availableSessions.length ? (
            <View style={styles.emptyCard}>
              <Text style={styles.emptyText}>{t('booking.noSlots')}</Text>
            </View>
          ) : (
            <>
              {availableSessions.length > 1 ? (
                <ScrollView
                  horizontal
                  showsHorizontalScrollIndicator={false}
                  contentContainerStyle={styles.sessionChips}
                >
                  {availableSessions.map((session) => {
                    const active = session.id === sessionId;
                    return (
                      <Pressable
                        key={session.id}
                        onPress={() => setSessionId(session.id)}
                        style={[styles.sessionChip, active && styles.sessionChipActive]}
                      >
                        <Text
                          style={[
                            styles.sessionChipText,
                            active && styles.sessionChipTextActive,
                          ]}
                        >
                          {formatSessionDate(session.startsAt, language)}
                        </Text>
                      </Pressable>
                    );
                  })}
                </ScrollView>
              ) : null}

              {selectedSession ? (
                <View style={styles.sessionCard}>
                  <View style={styles.factRow}>
                    <View style={styles.factIcon}>
                      <Ionicons name="calendar-outline" size={18} color={colors.primary} />
                    </View>
                    <View style={styles.factCopy}>
                      <Text style={styles.factLabel}>{t('bookings.date')}</Text>
                      <Text style={styles.factValue}>
                        {formatSessionDate(selectedSession.startsAt, language)}
                      </Text>
                    </View>
                  </View>
                  <View style={styles.factDivider} />
                  <View style={styles.factRow}>
                    <View style={styles.factIcon}>
                      <Ionicons name="time-outline" size={18} color={colors.primary} />
                    </View>
                    <View style={styles.factCopy}>
                      <Text style={styles.factLabel}>{t('bookings.time')}</Text>
                      <Text style={styles.factValue}>
                        {formatTime(selectedSession.startsAt, language)}
                      </Text>
                      <Text style={styles.factHint}>{t('booking.timezone')}</Text>
                    </View>
                  </View>
                </View>
              ) : null}
            </>
          )}
        </View>

        <View style={styles.section}>
          <Text style={styles.sectionTitle}>{t('booking.payment')}</Text>
          <Text style={styles.sectionSubtitle}>{t('booking.paymentFlowHint')}</Text>

          <View style={styles.paymentCard}>
            <View style={styles.stepBlock}>
              <View style={styles.stepHeader}>
                <View style={styles.stepIcon}>
                  <Ionicons name="receipt-outline" size={18} color={colors.primary} />
                </View>
                <View style={styles.stepCopy}>
                  <Text style={styles.stepTitle}>{t('booking.paymentSummary')}</Text>
                  <Text style={styles.stepHint}>{t('booking.paymentSummaryHint')}</Text>
                </View>
              </View>

              <View style={styles.breakdownCard}>
                <View style={styles.breakdownRow}>
                  <Text style={styles.breakdownLabel}>{t('booking.subtotal')}</Text>
                  <Text style={styles.breakdownValue}>
                    {formatMoney(subtotal, course.currency)}
                  </Text>
                </View>
                <View style={styles.breakdownRow}>
                  <Text style={styles.breakdownLabel}>
                    {t('booking.vat').replace('{{rate}}', String(Math.round(VAT_RATE * 100)))}
                  </Text>
                  <Text style={styles.breakdownValue}>
                    {formatMoney(vatAmount, course.currency)}
                  </Text>
                </View>
                <View style={styles.breakdownDivider} />
                <View style={styles.breakdownRow}>
                  <Text style={styles.breakdownTotalLabel}>{t('booking.totalDue')}</Text>
                  <Text style={styles.breakdownTotalValue}>
                    {formatMoney(totalDue, course.currency)}
                  </Text>
                </View>
              </View>
            </View>

            <View style={styles.paymentDivider} />

            <View style={styles.stepBlock}>
              <View style={styles.stepHeader}>
                <View style={styles.stepIcon}>
                  <Ionicons name="qr-code-outline" size={18} color={colors.primary} />
                </View>
                <View style={styles.stepCopy}>
                  <Text style={styles.stepTitle}>{t('booking.benefitPayQr')}</Text>
                  <Text style={styles.stepHint}>{t('booking.benefitPayScanSteps')}</Text>
                </View>
              </View>

              {tutorQrUrl ? (
                <View style={styles.qrPanel}>
                  <View style={styles.qrFrame}>
                    <Image
                      source={{ uri: tutorQrUrl }}
                      style={styles.qrImage}
                      contentFit="contain"
                    />
                  </View>
                  <View style={styles.scanBanner}>
                    <Ionicons name="scan-outline" size={14} color={colors.primary} />
                    <Text style={styles.scanBannerText}>{t('booking.scanBanner')}</Text>
                  </View>
                  <Text style={styles.qrTutorHint}>{t('booking.tutorQrHint')}</Text>
                </View>
              ) : (
                <View style={styles.qrMissing}>
                  <Ionicons name="alert-circle-outline" size={22} color={colors.warning} />
                  <Text style={styles.qrMissingText}>{t('booking.qrUnavailable')}</Text>
                </View>
              )}
            </View>

            <View style={styles.paymentDivider} />

            <View style={styles.stepBlock}>
              <View style={styles.stepHeader}>
                <View style={styles.stepIcon}>
                  <Ionicons name="cloud-upload-outline" size={18} color={colors.primary} />
                </View>
                <View style={styles.stepCopy}>
                  <Text style={styles.stepTitle}>{t('booking.uploadReceipt')}</Text>
                  <Text style={styles.stepHint}>{t('booking.uploadReceiptAfterPay')}</Text>
                </View>
              </View>

              {receiptUri ? (
                <View style={styles.receiptPreviewWrap}>
                  <Image
                    source={{ uri: receiptUri }}
                    style={styles.receiptPreview}
                    contentFit="cover"
                  />
                  <Pressable style={styles.changeReceiptBtn} onPress={pickReceipt}>
                    <Text style={styles.uploadBtnText}>{t('booking.changeImage')}</Text>
                  </Pressable>
                </View>
              ) : (
                <Pressable style={styles.uploadBtn} onPress={pickReceipt}>
                  <Ionicons name="image-outline" size={18} color={colors.primary} />
                  <Text style={styles.uploadBtnText}>{t('booking.uploadImage')}</Text>
                </Pressable>
              )}
            </View>
          </View>
        </View>

        {error ? <Text style={styles.error}>{error}</Text> : null}
        {duplicateBookingId ? (
          <Button
            title={t('booking.viewBooking')}
            variant="secondary"
            onPress={() => router.push(`/booking/detail/${duplicateBookingId}`)}
          />
        ) : null}
      </ScrollView>

      <View style={[styles.footer, { paddingBottom: Math.max(insets.bottom, spacing.md) }]}>
        <Pressable
          style={[styles.continueBtn, !canConfirm && styles.continueBtnDisabled]}
          disabled={!canConfirm}
          onPress={onConfirm}
        >
          <Text style={styles.continueText}>
            {submitting ? t('common.loading') : t('booking.confirm')}
          </Text>
          {!submitting ? (
            <Ionicons name={continueIcon} size={18} color={colors.white} />
          ) : null}
        </Pressable>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1, backgroundColor: colors.background },
  topBar: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: spacing.lg,
    paddingBottom: spacing.md,
    gap: spacing.sm,
  },
  screenTitle: {
    ...typography.heading,
    color: colors.primary,
    fontSize: 22,
    flex: 1,
    textAlign: 'center',
  },
  topBarSpacer: { width: 40 },
  content: {
    gap: spacing.xl,
  },
  courseCard: {
    flexDirection: 'row',
    gap: spacing.md,
    backgroundColor: colors.white,
    borderRadius: radius.xxl,
    padding: spacing.md,
    overflow: 'hidden',
    ...shadows.sm,
  },
  courseDecor: {
    position: 'absolute',
    right: -40,
    top: -40,
    width: 140,
    height: 140,
    borderRadius: 70,
    backgroundColor: colors.lavenderSoft,
    opacity: 0.7,
  },
  courseThumbWrap: {
    width: 88,
    height: 88,
    borderRadius: radius.lg,
    overflow: 'hidden',
    backgroundColor: colors.lavenderSoft,
  },
  courseThumb: {
    width: '100%',
    height: '100%',
  },
  courseCopy: {
    flex: 1,
    gap: 6,
    justifyContent: 'center',
  },
  courseTitle: {
    ...typography.subheading,
    color: colors.primary,
    fontSize: 16,
    lineHeight: 22,
  },
  courseMeta: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: spacing.md,
  },
  metaItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  metaText: {
    ...typography.caption,
    color: colors.textMuted,
    fontWeight: '600',
  },
  coursePrice: {
    ...typography.heading,
    color: colors.primary,
    fontSize: 22,
    marginTop: 2,
  },
  section: {
    gap: spacing.sm,
  },
  sectionTitle: {
    ...typography.heading,
    color: colors.primary,
    fontSize: 20,
  },
  sectionSubtitle: {
    ...typography.caption,
    color: colors.textMuted,
    lineHeight: 18,
    marginBottom: spacing.xs,
  },
  sessionChips: {
    gap: spacing.sm,
    paddingBottom: 2,
  },
  sessionChip: {
    backgroundColor: colors.white,
    borderRadius: radius.full,
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm,
    borderWidth: 1,
    borderColor: colors.border,
  },
  sessionChipActive: {
    backgroundColor: colors.lavenderSoft,
    borderColor: colors.lavender,
  },
  sessionChipText: {
    ...typography.caption,
    color: colors.textSecondary,
    fontWeight: '700',
  },
  sessionChipTextActive: {
    color: colors.primary,
  },
  sessionCard: {
    backgroundColor: colors.white,
    borderRadius: radius.xxl,
    padding: spacing.lg,
    gap: spacing.md,
    ...shadows.sm,
  },
  factRow: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: spacing.md,
  },
  factIcon: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: colors.lavenderSoft,
    alignItems: 'center',
    justifyContent: 'center',
  },
  factCopy: {
    flex: 1,
    gap: 2,
  },
  factLabel: {
    ...typography.caption,
    color: colors.textMuted,
    fontWeight: '600',
  },
  factValue: {
    ...typography.subheading,
    color: colors.text,
    fontSize: 16,
  },
  factHint: {
    ...typography.caption,
    color: colors.textMuted,
    marginTop: 1,
  },
  factDivider: {
    height: StyleSheet.hairlineWidth,
    backgroundColor: colors.border,
    marginLeft: 56,
  },
  emptyCard: {
    backgroundColor: colors.white,
    borderRadius: radius.xl,
    padding: spacing.xl,
    ...shadows.sm,
  },
  emptyText: {
    ...typography.body,
    color: colors.textSecondary,
    textAlign: 'center',
  },
  paymentCard: {
    backgroundColor: colors.white,
    borderRadius: radius.xxl,
    padding: spacing.lg,
    gap: spacing.lg,
    ...shadows.sm,
  },
  stepBlock: {
    gap: spacing.md,
  },
  stepHeader: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: spacing.md,
  },
  stepIcon: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: colors.lavenderSoft,
    alignItems: 'center',
    justifyContent: 'center',
  },
  stepCopy: {
    flex: 1,
    gap: 2,
    paddingTop: 2,
  },
  stepTitle: {
    ...typography.subheading,
    color: colors.text,
    fontSize: 15,
  },
  stepHint: {
    ...typography.caption,
    color: colors.textMuted,
    lineHeight: 17,
  },
  qrPanel: {
    alignItems: 'center',
    gap: spacing.md,
    backgroundColor: colors.lavenderSoft,
    borderRadius: radius.xl,
    padding: spacing.lg,
  },
  qrFrame: {
    width: 196,
    height: 196,
    borderRadius: radius.lg,
    backgroundColor: colors.white,
    alignItems: 'center',
    justifyContent: 'center',
    overflow: 'hidden',
    ...shadows.sm,
  },
  qrImage: {
    width: 176,
    height: 176,
  },
  qrTutorHint: {
    ...typography.caption,
    color: colors.textMuted,
    textAlign: 'center',
  },
  qrMissing: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
    backgroundColor: colors.warningSoft,
    borderRadius: radius.lg,
    padding: spacing.md,
  },
  qrMissingText: {
    ...typography.caption,
    color: colors.warning,
    flex: 1,
    fontWeight: '600',
    lineHeight: 18,
  },
  breakdownCard: {
    backgroundColor: '#F3F1F6',
    borderRadius: radius.lg,
    padding: spacing.md,
    gap: spacing.sm,
  },
  breakdownRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: spacing.md,
  },
  breakdownLabel: {
    ...typography.body,
    color: colors.textSecondary,
    fontSize: 14,
  },
  breakdownValue: {
    ...typography.body,
    color: colors.text,
    fontWeight: '600',
    fontSize: 14,
  },
  breakdownDivider: {
    height: StyleSheet.hairlineWidth,
    backgroundColor: colors.border,
    marginVertical: 2,
  },
  breakdownTotalLabel: {
    ...typography.subheading,
    color: colors.primary,
    fontSize: 15,
  },
  breakdownTotalValue: {
    ...typography.heading,
    color: colors.primary,
    fontSize: 20,
  },
  scanBanner: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
    backgroundColor: colors.white,
    borderRadius: radius.full,
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm,
  },
  scanBannerText: {
    ...typography.caption,
    color: colors.primary,
    fontWeight: '700',
    flexShrink: 1,
  },
  paymentDivider: {
    height: StyleSheet.hairlineWidth,
    backgroundColor: colors.border,
  },
  uploadBtn: {
    minHeight: 48,
    borderRadius: radius.xl,
    borderWidth: 1.5,
    borderColor: colors.lavender,
    backgroundColor: colors.lavenderSoft,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: spacing.sm,
  },
  uploadBtnText: {
    ...typography.button,
    color: colors.primary,
    fontWeight: '700',
    fontSize: 14,
  },
  receiptPreviewWrap: {
    gap: spacing.sm,
  },
  receiptPreview: {
    width: '100%',
    height: 140,
    borderRadius: radius.lg,
    backgroundColor: colors.lavenderSoft,
  },
  changeReceiptBtn: {
    minHeight: 44,
    borderRadius: radius.xl,
    borderWidth: 1.5,
    borderColor: colors.lavender,
    backgroundColor: colors.lavenderSoft,
    alignItems: 'center',
    justifyContent: 'center',
  },
  error: {
    ...typography.caption,
    color: colors.error,
  },
  footer: {
    position: 'absolute',
    left: 0,
    right: 0,
    bottom: 0,
    paddingHorizontal: spacing.lg,
    paddingTop: spacing.md,
    backgroundColor: colors.background,
  },
  continueBtn: {
    minHeight: 54,
    borderRadius: radius.xl,
    backgroundColor: colors.primary,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: spacing.sm,
    ...shadows.md,
  },
  continueBtnDisabled: {
    opacity: 0.45,
  },
  continueText: {
    ...typography.button,
    color: colors.white,
    fontWeight: '700',
  },
});
