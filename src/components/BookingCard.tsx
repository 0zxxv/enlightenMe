import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import React, { useState } from 'react';
import { Alert, Linking, Pressable, StyleSheet, Text, View } from 'react-native';
import { useQueryClient } from '@tanstack/react-query';
import { useOpenConversation } from '@/features/messages/hooks';
import { useTranslation } from '@/i18n';
import * as bookingsApi from '@/services/api/bookings';
import { colors, radius, shadows, spacing, typography } from '@/theme';
import { ApiError } from '@/types/api';
import type { Booking, BookingStatus, CourseFormat } from '@/types/models';
import { courseTitle, formatDate, formatPrice, formatTime, fullName } from '@/utils/format';

type Props = {
  booking: Booking;
};

function toneFor(status: BookingStatus) {
  if (status === 'Confirmed' || status === 'Completed') {
    return { bg: colors.successSoft, fg: colors.success };
  }
  if (status === 'Cancelled' || status === 'Refunded') {
    return { bg: colors.errorSoft, fg: colors.error };
  }
  return { bg: colors.lavenderSoft, fg: colors.primary };
}

function subjectVisual(title: string, format?: CourseFormat | null) {
  const lower = title.toLowerCase();
  if (lower.includes('python') || lower.includes('بايثون') || lower.includes('code')) {
    return { icon: 'logo-python' as const, bg: '#F3E0D0', fg: '#C45C26' };
  }
  if (lower.includes('ielts') || lower.includes('آيلتس') || lower.includes('english')) {
    return { icon: 'chatbubbles' as const, bg: colors.lavenderSoft, fg: colors.primary };
  }
  if (lower.includes('phys') || lower.includes('فيز')) {
    return { icon: 'planet' as const, bg: colors.infoSoft, fg: colors.info };
  }
  if (format === 'InPerson') {
    return { icon: 'location' as const, bg: colors.beige, fg: colors.primary };
  }
  if (format === 'Hybrid') {
    return { icon: 'git-merge' as const, bg: colors.infoSoft, fg: colors.info };
  }
  return { icon: 'school' as const, bg: colors.lavenderSoft, fg: colors.primary };
}

function formatLabel(format: CourseFormat | undefined | null, t: (k: string) => string) {
  if (!format) return null;
  if (format === 'Online') return t('common.online');
  if (format === 'InPerson') return t('common.inPerson');
  if (format === 'Hybrid') return t('common.hybrid');
  return format;
}

export function BookingCard({ booking }: Props) {
  const router = useRouter();
  const { t, language } = useTranslation();
  const qc = useQueryClient();
  const openConversation = useOpenConversation();
  const [busy, setBusy] = useState(false);

  const title = booking.course ? courseTitle(booking.course, language) : booking.courseId;
  const tutorName = fullName(booking.course?.tutor?.firstName, booking.course?.tutor?.lastName);
  const tutorId = booking.course?.tutorId ?? booking.course?.tutor?.id;
  const format = booking.course?.format;
  const visual = subjectVisual(title, format);
  const statusTone = toneFor(booking.status);
  const startsAt = booking.session?.startsAt;
  const endsAt = booking.session?.endsAt;
  const timeLabel =
    startsAt && endsAt
      ? `${formatTime(startsAt, language)} – ${formatTime(endsAt, language)}`
      : startsAt
        ? formatTime(startsAt, language)
        : null;
  const formatText = formatLabel(format, t);
  const past = ['Completed', 'Cancelled', 'Refunded'].includes(booking.status);

  const openDetail = () => router.push(`/booking/detail/${booking.id}`);

  const onAddToCalendar = async () => {
    if (!startsAt) return;
    const start = new Date(startsAt);
    const end = endsAt ? new Date(endsAt) : new Date(start.getTime() + 90 * 60 * 1000);
    const stamp = (d: Date) =>
      d.toISOString().replace(/[-:]/g, '').replace(/\.\d{3}/, '');
    const url =
      `https://calendar.google.com/calendar/render?action=TEMPLATE` +
      `&text=${encodeURIComponent(title)}` +
      `&dates=${stamp(start)}/${stamp(end)}` +
      `&details=${encodeURIComponent(tutorName || 'Dars')}`;
    try {
      await Linking.openURL(url);
    } catch {
      Alert.alert(t('bookings.title'), t('bookings.calendarFailed'));
    }
  };

  const onJoin = () => {
    Alert.alert(t('bookings.joinSession'), t('bookings.joinSessionHint'));
  };

  const onCancel = () => {
    Alert.alert(t('bookings.cancel'), t('bookings.cancelConfirm'), [
      { text: t('common.cancel'), style: 'cancel' },
      {
        text: t('bookings.cancel'),
        style: 'destructive',
        onPress: async () => {
          setBusy(true);
          try {
            await bookingsApi.cancelBooking(booking.id);
            await qc.invalidateQueries({ queryKey: ['bookings'] });
          } catch (err) {
            Alert.alert(
              t('bookings.title'),
              err instanceof ApiError ? err.message : t('common.error'),
            );
          } finally {
            setBusy(false);
          }
        },
      },
    ]);
  };

  const onMessage = async () => {
    if (!tutorId) return;
    setBusy(true);
    try {
      const result = await openConversation.mutateAsync(tutorId);
      router.push(`/conversation/${result.conversationId}`);
    } catch (err) {
      Alert.alert(
        t('messages.title'),
        err instanceof ApiError ? err.message : t('messages.openFailed'),
      );
    } finally {
      setBusy(false);
    }
  };

  const primary =
    booking.status === 'Confirmed' && !past
      ? {
          label: t('bookings.joinSession'),
          icon: 'videocam-outline' as const,
          onPress: onJoin,
        }
      : booking.status === 'Pending'
        ? {
            label: t('bookings.messageTutor'),
            icon: 'chatbubble-outline' as const,
            onPress: onMessage,
            disabled: !tutorId || busy,
          }
        : {
            label: t('bookings.viewDetails'),
            icon: 'document-text-outline' as const,
            onPress: openDetail,
          };

  const secondary =
    booking.status === 'Confirmed' && !past
      ? {
          label: t('bookings.addToCalendar'),
          icon: 'calendar-outline' as const,
          onPress: onAddToCalendar,
        }
      : booking.status === 'Pending'
        ? {
            label: t('bookings.cancel'),
            icon: 'close-outline' as const,
            onPress: onCancel,
            disabled: busy,
          }
        : past
          ? null
          : {
              label: t('bookings.reschedule'),
              icon: 'refresh-outline' as const,
              onPress: openDetail,
            };

  return (
    <Pressable style={styles.card} onPress={openDetail}>
      <View style={styles.topRow}>
        <View style={[styles.subjectIcon, { backgroundColor: visual.bg }]}>
          <Ionicons name={visual.icon} size={22} color={visual.fg} />
        </View>
        <View style={styles.topMeta}>
          <View style={styles.titleRow}>
            <View style={[styles.statusPill, { backgroundColor: statusTone.bg }]}>
              <Text style={[styles.statusText, { color: statusTone.fg }]}>{booking.status}</Text>
            </View>
            <Text style={styles.price}>
              {formatPrice(booking.priceSnapshot, booking.currency || t('common.currency'))}
            </Text>
          </View>
          <Text style={styles.title} numberOfLines={2}>
            {title}
          </Text>
          {tutorName ? (
            <Text style={styles.tutor} numberOfLines={1}>
              {tutorName}
            </Text>
          ) : null}
        </View>
      </View>

      <View style={styles.metaRow}>
        {startsAt ? (
          <View style={styles.metaItem}>
            <Ionicons name="calendar-outline" size={14} color={colors.textMuted} />
            <Text style={styles.metaText}>{formatDate(startsAt, language)}</Text>
          </View>
        ) : null}
        {timeLabel ? (
          <View style={styles.metaItem}>
            <Ionicons name="time-outline" size={14} color={colors.textMuted} />
            <Text style={styles.metaText}>{timeLabel}</Text>
          </View>
        ) : null}
        {formatText ? (
          <View style={styles.metaItem}>
            <Ionicons
              name={format === 'InPerson' ? 'location-outline' : 'videocam-outline'}
              size={14}
              color={colors.textMuted}
            />
            <Text style={styles.metaText}>{formatText}</Text>
          </View>
        ) : null}
      </View>

      <View style={styles.actions}>
        {secondary ? (
          <Pressable
            style={[styles.secondaryBtn, secondary.disabled && styles.btnDisabled]}
            onPress={(e) => {
              e.stopPropagation?.();
              secondary.onPress();
            }}
            disabled={secondary.disabled}
          >
            <Ionicons name={secondary.icon} size={16} color={colors.primary} />
            <Text style={styles.secondaryBtnText} numberOfLines={1}>
              {secondary.label}
            </Text>
          </Pressable>
        ) : null}
        <Pressable
          style={[
            styles.primaryBtn,
            !secondary && styles.primaryBtnFull,
            primary.disabled && styles.btnDisabled,
          ]}
          onPress={(e) => {
            e.stopPropagation?.();
            primary.onPress();
          }}
          disabled={primary.disabled}
        >
          <Ionicons name={primary.icon} size={16} color={colors.white} />
          <Text style={styles.primaryBtnText} numberOfLines={1}>
            {primary.label}
          </Text>
        </Pressable>
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
    gap: spacing.md,
    ...shadows.sm,
  },
  topRow: {
    flexDirection: 'row',
    gap: spacing.md,
  },
  subjectIcon: {
    width: 48,
    height: 48,
    borderRadius: radius.lg,
    alignItems: 'center',
    justifyContent: 'center',
  },
  topMeta: { flex: 1, gap: 4 },
  titleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: spacing.sm,
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
  price: {
    ...typography.caption,
    color: colors.primary,
    fontWeight: '800',
    fontSize: 13,
  },
  title: {
    ...typography.subheading,
    color: colors.text,
    fontSize: 16,
    lineHeight: 22,
  },
  tutor: {
    ...typography.caption,
    color: colors.textSecondary,
  },
  metaRow: {
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
    fontSize: 12,
  },
  actions: {
    flexDirection: 'row',
    gap: spacing.sm,
  },
  secondaryBtn: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
    minHeight: 44,
    borderRadius: radius.lg,
    backgroundColor: colors.lavenderSoft,
    paddingHorizontal: spacing.sm,
  },
  secondaryBtnText: {
    ...typography.caption,
    color: colors.primary,
    fontWeight: '700',
    flexShrink: 1,
  },
  primaryBtn: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
    minHeight: 44,
    borderRadius: radius.lg,
    backgroundColor: colors.primary,
    paddingHorizontal: spacing.sm,
  },
  primaryBtnFull: { flex: 1 },
  primaryBtnText: {
    ...typography.caption,
    color: colors.white,
    fontWeight: '700',
    flexShrink: 1,
  },
  btnDisabled: { opacity: 0.55 },
});
