import { useLocalSearchParams, useNavigation, useRouter } from 'expo-router';
import React, { useLayoutEffect, useState } from 'react';
import { ScrollView, StyleSheet, Text, View } from 'react-native';
import { Button } from '@/components/Button';
import { Chip } from '@/components/Chip';
import { ErrorState } from '@/components/ErrorState';
import { LoadingState } from '@/components/LoadingState';
import { PriceDisplay } from '@/components/PriceDisplay';
import { ScheduleSelector } from '@/components/ScheduleSelector';
import { useCreateBooking } from '@/features/bookings/hooks';
import { useCourse } from '@/features/courses/hooks';
import { useTranslation } from '@/i18n';
import { createPaymentIntent } from '@/services/api/payments';
import { analytics } from '@/services/analytics';
import { colors, spacing, typography } from '@/theme';
import { ApiError } from '@/types/api';
import { courseTitle } from '@/utils/format';

type Step = 1 | 2 | 3 | 4 | 5;

export default function BookingFlowScreen() {
  const { courseId } = useLocalSearchParams<{ courseId: string }>();
  const { t, language } = useTranslation();
  const navigation = useNavigation();
  const router = useRouter();
  const courseQuery = useCourse(courseId);
  const createBooking = useCreateBooking();
  const [step, setStep] = useState<Step>(1);
  const [dateKey, setDateKey] = useState<string>();
  const [sessionId, setSessionId] = useState<string>();
  const [paymentMethod, setPaymentMethod] = useState<'card' | 'applePay' | 'benefitPay'>('card');
  const [error, setError] = useState<string>();
  const [submitting, setSubmitting] = useState(false);

  const course = courseQuery.data;

  useLayoutEffect(() => {
    navigation.setOptions({
      title: t('booking.title'),
      headerStyle: { backgroundColor: colors.background },
      headerTintColor: colors.primary,
    });
  }, [navigation, t]);

  if (courseQuery.isLoading) return <LoadingState />;
  if (courseQuery.isError || !course) {
    return <ErrorState onRetry={() => courseQuery.refetch()} />;
  }

  const availableSessions = (course.sessions ?? []).filter((s) => s.seatsAvailable > 0);

  const onConfirm = async () => {
    if (!sessionId) return;
    setSubmitting(true);
    setError(undefined);
    try {
      analytics.track('booking_started', { courseId: course.id });
      const booking = await createBooking.mutateAsync({
        courseId: course.id,
        sessionId,
      });
      const payment = await createPaymentIntent(booking.id);
      analytics.track('booking_completed', { bookingId: booking.id });
      router.replace({
        pathname: '/booking/confirmation',
        params: {
          bookingId: booking.id,
          paymentStatus: payment.payment.status,
        },
      });
    } catch (err) {
      setError(err instanceof ApiError ? err.message : t('common.error'));
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <ScrollView style={styles.root} contentContainerStyle={styles.content}>
      <Text style={styles.step}>
        {t('booking.summary')} · {step}/5
      </Text>
      <Text style={styles.title}>{courseTitle(course, language)}</Text>
      <PriceDisplay amount={course.priceDecimal} currency={course.currency} />

      {step === 1 ? (
        <View style={styles.block}>
          <Text style={styles.body}>{course.description}</Text>
          <Button title={t('common.continue')} onPress={() => setStep(2)} />
        </View>
      ) : null}

      {step === 2 || step === 3 ? (
        <View style={styles.block}>
          <ScheduleSelector
            sessions={availableSessions}
            selectedDateKey={dateKey}
            selectedSessionId={sessionId}
            onSelectDate={(key) => {
              setDateKey(key);
              setSessionId(undefined);
              setStep(3);
            }}
            onSelectSession={(id) => {
              setSessionId(id);
            }}
          />
          <Button
            title={t('common.continue')}
            disabled={!sessionId}
            onPress={() => setStep(4)}
          />
        </View>
      ) : null}

      {step === 4 ? (
        <View style={styles.block}>
          <Text style={styles.label}>{t('booking.paymentMethod')}</Text>
          <View style={styles.methods}>
            <Chip
              label={t('booking.card')}
              selected={paymentMethod === 'card'}
              onPress={() => setPaymentMethod('card')}
            />
            <Chip
              label={t('booking.applePay')}
              selected={paymentMethod === 'applePay'}
              onPress={() => setPaymentMethod('applePay')}
            />
            <Chip
              label={t('booking.benefitPay')}
              selected={paymentMethod === 'benefitPay'}
              onPress={() => setPaymentMethod('benefitPay')}
            />
          </View>
          <Button title={t('common.continue')} onPress={() => setStep(5)} />
        </View>
      ) : null}

      {step === 5 ? (
        <View style={styles.block}>
          <Text style={styles.body}>{t('booking.confirm')}</Text>
          {error ? <Text style={styles.error}>{error}</Text> : null}
          <Button
            title={t('booking.confirm')}
            onPress={onConfirm}
            loading={submitting}
            disabled={!sessionId}
          />
        </View>
      ) : null}
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1, backgroundColor: colors.background },
  content: { padding: spacing.xl, gap: spacing.lg, paddingBottom: spacing.massive },
  step: { ...typography.caption, color: colors.textMuted },
  title: { ...typography.heading, color: colors.text },
  block: { gap: spacing.lg },
  body: { ...typography.body, color: colors.textSecondary, lineHeight: 22 },
  label: { ...typography.subheading, color: colors.text },
  methods: { flexDirection: 'row', flexWrap: 'wrap', gap: spacing.sm },
  error: { ...typography.caption, color: colors.error },
});
