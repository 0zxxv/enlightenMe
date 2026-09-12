import { useRouter } from 'expo-router';
import React from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import { Badge } from '@/components/Badge';
import { PriceDisplay } from '@/components/PriceDisplay';
import { useTranslation } from '@/i18n';
import { colors, radius, shadows, spacing, typography } from '@/theme';
import type { Booking } from '@/types/models';
import { courseTitle, formatDate, formatTime } from '@/utils/format';

type Props = {
  booking: Booking;
};

export function BookingCard({ booking }: Props) {
  const router = useRouter();
  const { t, language } = useTranslation();
  const title = booking.course
    ? courseTitle(booking.course, language)
    : booking.courseId;

  return (
    <Pressable style={styles.card} onPress={() => router.push(`/booking/confirmation?bookingId=${booking.id}`)}>
      <View style={styles.row}>
        <Text style={styles.title} numberOfLines={2}>
          {title}
        </Text>
        <Badge label={booking.status} tone={booking.status === 'Cancelled' ? 'warning' : 'primary'} />
      </View>
      {booking.session ? (
        <Text style={styles.meta}>
          {formatDate(booking.session.startsAt, language)} ·{' '}
          {formatTime(booking.session.startsAt, language)}
        </Text>
      ) : null}
      <View style={styles.footer}>
        <Text style={styles.status}>{t('bookings.status')}</Text>
        <PriceDisplay amount={booking.priceSnapshot} currency={booking.currency} />
      </View>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  card: {
    backgroundColor: colors.white,
    borderRadius: radius.lg,
    padding: spacing.lg,
    marginBottom: spacing.md,
    gap: spacing.sm,
    ...shadows.sm,
  },
  row: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    gap: spacing.md,
  },
  title: {
    ...typography.subheading,
    color: colors.text,
    flex: 1,
  },
  meta: {
    ...typography.caption,
    color: colors.textSecondary,
  },
  footer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  status: {
    ...typography.caption,
    color: colors.textMuted,
  },
});
