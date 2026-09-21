import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import React from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import { Badge } from '@/components/Badge';
import { PriceDisplay } from '@/components/PriceDisplay';
import { useTranslation } from '@/i18n';
import { colors, radius, shadows, spacing, typography } from '@/theme';
import type { Booking, BookingStatus } from '@/types/models';
import { courseTitle, formatDate, formatTime, fullName } from '@/utils/format';

type Props = {
  booking: Booking;
};

function toneFor(status: BookingStatus): 'primary' | 'success' | 'warning' | 'neutral' {
  if (status === 'Confirmed' || status === 'Completed') return 'success';
  if (status === 'Cancelled' || status === 'Refunded') return 'warning';
  return 'primary';
}

export function BookingCard({ booking }: Props) {
  const router = useRouter();
  const { t, language } = useTranslation();
  const title = booking.course ? courseTitle(booking.course, language) : booking.courseId;
  const tutorName = fullName(booking.course?.tutor?.firstName, booking.course?.tutor?.lastName);

  return (
    <Pressable
      style={styles.card}
      onPress={() => router.push(`/booking/detail/${booking.id}`)}
    >
      <View style={styles.row}>
        <Text style={styles.title} numberOfLines={2}>
          {title}
        </Text>
        <Badge label={booking.status} tone={toneFor(booking.status)} />
      </View>
      {tutorName ? (
        <Text style={styles.meta} numberOfLines={1}>
          {tutorName}
        </Text>
      ) : null}
      {booking.session ? (
        <Text style={styles.meta}>
          {formatDate(booking.session.startsAt, language)} ·{' '}
          {formatTime(booking.session.startsAt, language)}
          {booking.course?.format ? ` · ${booking.course.format}` : ''}
        </Text>
      ) : null}
      <View style={styles.footer}>
        <PriceDisplay amount={booking.priceSnapshot} currency={booking.currency} compact />
        <Ionicons name="chevron-forward" size={18} color={colors.textMuted} />
      </View>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  card: {
    backgroundColor: colors.white,
    borderRadius: radius.xl,
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
    marginTop: spacing.xs,
  },
});
