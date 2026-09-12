import { useLocalSearchParams, useNavigation, useRouter } from 'expo-router';
import React, { useLayoutEffect } from 'react';
import { StyleSheet, Text, View } from 'react-native';
import { Button } from '@/components/Button';
import { ErrorState } from '@/components/ErrorState';
import { LoadingState } from '@/components/LoadingState';
import { useQuery } from '@tanstack/react-query';
import { getBooking } from '@/services/api/bookings';
import { useTranslation } from '@/i18n';
import { colors, radius, spacing, typography } from '@/theme';
import { courseTitle, formatDate, formatTime } from '@/utils/format';

export default function BookingConfirmationScreen() {
  const { bookingId, paymentStatus } = useLocalSearchParams<{
    bookingId?: string;
    paymentStatus?: string;
  }>();
  const { t, language } = useTranslation();
  const navigation = useNavigation();
  const router = useRouter();
  const bookingQuery = useQuery({
    queryKey: ['booking', bookingId],
    queryFn: () => getBooking(bookingId!),
    enabled: Boolean(bookingId),
  });

  useLayoutEffect(() => {
    navigation.setOptions({
      title: t('booking.successTitle'),
      headerStyle: { backgroundColor: colors.background },
      headerTintColor: colors.primary,
    });
  }, [navigation, t]);

  if (!bookingId) {
    return <ErrorState message={t('common.error')} />;
  }
  if (bookingQuery.isLoading) return <LoadingState />;
  if (bookingQuery.isError || !bookingQuery.data) {
    return <ErrorState onRetry={() => bookingQuery.refetch()} />;
  }

  const booking = bookingQuery.data;
  const status = paymentStatus || booking.payment?.status || 'Pending';

  return (
    <View style={styles.root}>
      <View style={styles.card}>
        <Text style={styles.title}>{t('booking.successTitle')}</Text>
        <Text style={styles.subtitle}>{t('booking.successSubtitle')}</Text>
        <Text style={styles.course}>
          {booking.course ? courseTitle(booking.course, language) : booking.courseId}
        </Text>
        {booking.session ? (
          <Text style={styles.meta}>
            {formatDate(booking.session.startsAt, language)} ·{' '}
            {formatTime(booking.session.startsAt, language)}
          </Text>
        ) : null}
        <Text style={styles.meta}>
          {t('bookings.status')}: {booking.status}
        </Text>
        <Text style={styles.pending}>
          {status !== 'Paid' ? t('booking.pendingPayment') : status}
        </Text>
      </View>
      <Button title={t('booking.viewBookings')} onPress={() => router.replace('/(tabs)/bookings')} />
    </View>
  );
}

const styles = StyleSheet.create({
  root: {
    flex: 1,
    backgroundColor: colors.background,
    padding: spacing.xl,
    gap: spacing.xl,
    justifyContent: 'center',
  },
  card: {
    backgroundColor: colors.white,
    borderRadius: radius.xl,
    padding: spacing.xxl,
    gap: spacing.md,
  },
  title: { ...typography.heading, color: colors.text },
  subtitle: { ...typography.body, color: colors.textSecondary },
  course: { ...typography.subheading, color: colors.primary },
  meta: { ...typography.caption, color: colors.textSecondary },
  pending: { ...typography.caption, color: colors.warning, fontWeight: '700' },
});
