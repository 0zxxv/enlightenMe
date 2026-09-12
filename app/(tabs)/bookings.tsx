import React, { useMemo, useState } from 'react';
import {
  FlatList,
  Pressable,
  RefreshControl,
  StyleSheet,
  Text,
  View,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { BookingCard } from '@/components/BookingCard';
import { EmptyState } from '@/components/EmptyState';
import { ErrorState } from '@/components/ErrorState';
import { LoadingState } from '@/components/LoadingState';
import { useMyBookings } from '@/features/bookings/hooks';
import { useRefresh } from '@/hooks/useRefresh';
import { useTranslation } from '@/i18n';
import { colors, radius, spacing, typography } from '@/theme';

type Segment = 'upcoming' | 'past';

const PAST_STATUSES = new Set(['Completed', 'Cancelled', 'Refunded']);

export default function BookingsScreen() {
  const { t } = useTranslation();
  const [segment, setSegment] = useState<Segment>('upcoming');
  const bookingsQuery = useMyBookings();
  const { refreshing, onRefresh } = useRefresh(async () => {
    await bookingsQuery.refetch();
  });

  const filtered = useMemo(() => {
    const list = bookingsQuery.data ?? [];
    if (segment === 'past') {
      return list.filter((b) => PAST_STATUSES.has(b.status));
    }
    return list.filter((b) => !PAST_STATUSES.has(b.status));
  }, [bookingsQuery.data, segment]);

  return (
    <SafeAreaView style={styles.safe} edges={['top']}>
      <Text style={styles.title}>{t('bookings.title')}</Text>
      <View style={styles.segments}>
        {(['upcoming', 'past'] as Segment[]).map((id) => (
          <Pressable
            key={id}
            onPress={() => setSegment(id)}
            style={[styles.segment, segment === id && styles.segmentActive]}
          >
            <Text style={[styles.segmentText, segment === id && styles.segmentTextActive]}>
              {id === 'upcoming' ? t('bookings.upcoming') : t('bookings.past')}
            </Text>
          </Pressable>
        ))}
      </View>

      {bookingsQuery.isLoading ? <LoadingState /> : null}
      {bookingsQuery.isError ? (
        <ErrorState onRetry={() => bookingsQuery.refetch()} />
      ) : null}

      {!bookingsQuery.isLoading && !bookingsQuery.isError ? (
        <FlatList
          data={filtered}
          keyExtractor={(item) => item.id}
          contentContainerStyle={styles.list}
          refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} />}
          ListEmptyComponent={
            <EmptyState
              title={
                segment === 'upcoming' ? t('bookings.emptyUpcoming') : t('bookings.emptyPast')
              }
            />
          }
          renderItem={({ item }) => <BookingCard booking={item} />}
        />
      ) : null}
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: colors.background },
  title: {
    ...typography.heading,
    color: colors.text,
    paddingHorizontal: spacing.xl,
    paddingTop: spacing.xl,
  },
  segments: {
    flexDirection: 'row',
    gap: spacing.sm,
    paddingHorizontal: spacing.xl,
    paddingVertical: spacing.lg,
  },
  segment: {
    flex: 1,
    paddingVertical: spacing.sm,
    borderRadius: radius.full,
    backgroundColor: colors.beige,
    alignItems: 'center',
  },
  segmentActive: { backgroundColor: colors.primary },
  segmentText: { ...typography.caption, color: colors.text, fontWeight: '600' },
  segmentTextActive: { color: colors.white },
  list: { paddingHorizontal: spacing.xl, paddingBottom: spacing.massive },
});
