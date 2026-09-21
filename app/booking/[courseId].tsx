import { useLocalSearchParams, useNavigation, useRouter } from 'expo-router';
import React, { useLayoutEffect, useMemo, useState } from 'react';
import { ScrollView, StyleSheet, Text, View } from 'react-native';
import { Button } from '@/components/Button';
import { Chip } from '@/components/Chip';
import { ErrorState } from '@/components/ErrorState';
import { LoadingState } from '@/components/LoadingState';
import { PriceDisplay } from '@/components/PriceDisplay';
import { ScheduleSelector } from '@/components/ScheduleSelector';
import { useCreateBooking, useMyBookings } from '@/features/bookings/hooks';
import { useCourse } from '@/features/courses/hooks';
import { useTranslation } from '@/i18n';
import { confirmStubPayment, createPaymentIntent } from '@/services/api/payments';
import { analytics } from '@/services/analytics';
import { colors, radius, spacing, typography } from '@/theme';
import { ApiError } from '@/types/api';
import { courseTitle, formatDate, formatTime } from '@/utils/format';

type Step = 'schedule' | 'payment' | 'review';

export default function BookingFlowScreen() {
  const { courseId } = useLocalSearchParams<{ courseId: string }>();
  const { t, language } = useTranslation();
  const navigation = useNavigation();
  const router = useRouter();
  const courseQuery = useCourse(courseId);
  const myBookings = useMyBookings();
  const createBooking = useCreateBooking();
  const [step, setStep] = useState<Step>('schedule');
  const [dateKey, setDateKey] = useState<string>();
  const [sessionId, setSessionId] = useState<string>();
  const [paymentMethod, setPaymentMethod] = useState<'benefitPay' | 'card' | 'applePay'>(
    'benefitPay',
  );
  const [error, setError] = useState<string>();
  const [duplicateBookingId, setDuplicateBookingId] = useState<string>();
  const [submitting, setSubmitting] = useState(false);

  const course = courseQuery.data;

  useLayoutEffect(() => {
    navigation.setOptions({
      title: t('booking.title'),
      headerStyle: { backgroundColor: colors.background },
      headerTintColor: colors.primary,
    });
  }, [navigation, t]);

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
    return (course?.sessions ?? []).filter(
      (s) =>
        s.seatsAvailable > 0 &&
        new Date(s.startsAt).getTime() > now &&
        s.status === 'Scheduled' &&
        !bookedSessionIds.has(s.id),
    );
  }, [course?.sessions, bookedSessionIds]);

  const selectedSession = availableSessions.find((s) => s.id === sessionId);

  if (courseQuery.isLoading) return <LoadingState />;
  if (courseQuery.isError || !course) {
    return <ErrorState onRetry={() => courseQuery.refetch()} />;
  }

  const onConfirm = async () => {
    if (!sessionId) return;
    setSubmitting(true);
    setError(undefined);
    setDuplicateBookingId(undefined);
    try {
      analytics.track('booking_started', { courseId: course.id });
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

      analytics.track('booking_completed', { bookingId: booking.id });
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
    <ScrollView style={styles.root} contentContainerStyle={styles.content}>
      <Text style={styles.title}>{courseTitle(course, language)}</Text>
      <PriceDisplay
        amount={course.priceDecimal}
        currency={course.currency}
        sessionCount={course.sessionCount}
      />

      {step === 'schedule' ? (
        <View style={styles.block}>
          <Text style={styles.heading}>{t('booking.selectSlot')}</Text>
          {availableSessions.length === 0 ? (
            <Text style={styles.body}>{t('booking.noSlots')}</Text>
          ) : (
            <ScheduleSelector
              sessions={availableSessions}
              selectedDateKey={dateKey}
              selectedSessionId={sessionId}
              onSelectDate={(key) => {
                setDateKey(key);
                setSessionId(undefined);
              }}
              onSelectSession={setSessionId}
            />
          )}
          <Button
            title={t('common.continue')}
            disabled={!sessionId}
            onPress={() => setStep('payment')}
          />
        </View>
      ) : null}

      {step === 'payment' ? (
        <View style={styles.block}>
          <Text style={styles.heading}>{t('booking.paymentMethod')}</Text>
          <Text style={styles.hint}>{t('booking.paymentHint')}</Text>
          <View style={styles.chips}>
            {(
              [
                ['benefitPay', t('booking.benefitPay')],
                ['card', t('booking.card')],
                ['applePay', t('booking.applePay')],
              ] as const
            ).map(([id, label]) => (
              <Chip
                key={id}
                label={label}
                selected={paymentMethod === id}
                onPress={() => setPaymentMethod(id)}
              />
            ))}
          </View>
          <Button title={t('common.continue')} onPress={() => setStep('review')} />
          <Button title={t('common.back')} variant="ghost" onPress={() => setStep('schedule')} />
        </View>
      ) : null}

      {step === 'review' ? (
        <View style={styles.block}>
          <Text style={styles.heading}>{t('booking.summary')}</Text>
          {selectedSession ? (
            <View style={styles.summaryCard}>
              <Text style={styles.body}>
                {formatDate(selectedSession.startsAt, language)} ·{' '}
                {formatTime(selectedSession.startsAt, language)}
              </Text>
              <Text style={styles.meta}>{course.format}</Text>
              <PriceDisplay
                amount={course.priceDecimal}
                currency={course.currency}
                sessionCount={course.sessionCount}
              />
            </View>
          ) : null}
          {error ? <Text style={styles.error}>{error}</Text> : null}
          {duplicateBookingId ? (
            <Button
              title={t('booking.viewBooking')}
              variant="secondary"
              onPress={() => router.push(`/booking/detail/${duplicateBookingId}`)}
            />
          ) : null}
          <Button
            title={t('booking.confirm')}
            onPress={onConfirm}
            loading={submitting}
            disabled={!sessionId}
          />
          <Button title={t('common.back')} variant="ghost" onPress={() => setStep('payment')} />
        </View>
      ) : null}
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1, backgroundColor: colors.background },
  content: { padding: spacing.xl, gap: spacing.lg, paddingBottom: spacing.massive },
  title: { ...typography.heading, color: colors.text },
  heading: { ...typography.subheading, color: colors.text },
  body: { ...typography.body, color: colors.textSecondary, lineHeight: 22 },
  meta: { ...typography.caption, color: colors.textMuted },
  hint: { ...typography.caption, color: colors.textMuted },
  block: { gap: spacing.md },
  chips: { flexDirection: 'row', flexWrap: 'wrap', gap: spacing.sm },
  summaryCard: {
    backgroundColor: colors.white,
    borderRadius: radius.xl,
    padding: spacing.lg,
    gap: spacing.sm,
  },
  error: { ...typography.caption, color: colors.error },
});
