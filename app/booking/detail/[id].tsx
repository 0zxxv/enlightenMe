import { useLocalSearchParams, useNavigation, useRouter } from 'expo-router';
import React, { useLayoutEffect } from 'react';
import { ScrollView, StyleSheet, Text, View } from 'react-native';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { Badge } from '@/components/Badge';
import { Button } from '@/components/Button';
import { ErrorState } from '@/components/ErrorState';
import { LoadingState } from '@/components/LoadingState';
import { PriceDisplay } from '@/components/PriceDisplay';
import { useTranslation } from '@/i18n';
import * as bookingsApi from '@/services/api/bookings';
import { colors, radius, shadows, spacing, typography } from '@/theme';
import { ApiError } from '@/types/api';
import { courseTitle, formatDate, formatTime, fullName } from '@/utils/format';

export default function BookingDetailScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const { t, language } = useTranslation();
  const navigation = useNavigation();
  const router = useRouter();
  const qc = useQueryClient();

  const bookingQuery = useQuery({
    queryKey: ['booking', id],
    queryFn: () => bookingsApi.getBooking(id),
    enabled: Boolean(id),
  });

  useLayoutEffect(() => {
    navigation.setOptions({
      title: t('bookings.detail'),
      headerStyle: { backgroundColor: colors.background },
      headerTintColor: colors.primary,
    });
  }, [navigation, t]);

  if (bookingQuery.isLoading) return <LoadingState />;
  if (bookingQuery.isError || !bookingQuery.data) {
    return <ErrorState onRetry={() => bookingQuery.refetch()} />;
  }

  const booking = bookingQuery.data;
  const title = booking.course ? courseTitle(booking.course, language) : booking.courseId;
  const tutorName = fullName(booking.course?.tutor?.firstName, booking.course?.tutor?.lastName);
  const canCancel =
    booking.status === 'Pending' || booking.status === 'Confirmed';

  const onCancel = async () => {
    try {
      await bookingsApi.cancelBooking(booking.id);
      await qc.invalidateQueries({ queryKey: ['bookings'] });
      await bookingQuery.refetch();
    } catch (err) {
      // surface via refetch / leave as-is
      console.warn(err instanceof ApiError ? err.message : err);
    }
  };

  return (
    <ScrollView style={styles.root} contentContainerStyle={styles.content}>
      <View style={styles.card}>
        <View style={styles.row}>
          <Text style={styles.title}>{title}</Text>
          <Badge label={booking.status} tone="primary" />
        </View>
        {tutorName ? <Text style={styles.meta}>{tutorName}</Text> : null}
        {booking.session ? (
          <Text style={styles.meta}>
            {formatDate(booking.session.startsAt, language)} ·{' '}
            {formatTime(booking.session.startsAt, language)}
          </Text>
        ) : null}
        {booking.course?.format ? (
          <Text style={styles.meta}>{booking.course.format}</Text>
        ) : null}
        <PriceDisplay
          amount={booking.priceSnapshot}
          currency={booking.currency}
          sessionCount={booking.course?.sessionCount}
        />
        <Text style={styles.meta}>
          {t('bookings.payment')}: {booking.payment?.status ?? t('bookings.unpaid')}
        </Text>
      </View>

      {booking.courseId ? (
        <Button
          title={t('booking.viewCourse')}
          variant="secondary"
          onPress={() => router.push(`/course/${booking.courseId}`)}
        />
      ) : null}

      {canCancel ? (
        <Button title={t('bookings.cancel')} variant="danger" onPress={onCancel} />
      ) : null}
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1, backgroundColor: colors.background },
  content: { padding: spacing.xl, gap: spacing.lg },
  card: {
    backgroundColor: colors.white,
    borderRadius: radius.xl,
    padding: spacing.xl,
    gap: spacing.sm,
    ...shadows.sm,
  },
  row: { flexDirection: 'row', justifyContent: 'space-between', gap: spacing.md },
  title: { ...typography.heading, color: colors.text, flex: 1, fontSize: 22 },
  meta: { ...typography.body, color: colors.textSecondary },
});
