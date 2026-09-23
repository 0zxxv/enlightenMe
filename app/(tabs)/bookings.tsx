import { Ionicons } from '@expo/vector-icons';
import React, { useEffect, useMemo, useState } from 'react';
import {
  FlatList,
  Linking,
  Pressable,
  RefreshControl,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from 'react-native';
import Animated, {
  useAnimatedStyle,
  useSharedValue,
  withSpring,
} from 'react-native-reanimated';
import { SafeAreaView } from 'react-native-safe-area-context';
import { BookingCard } from '@/components/BookingCard';
import { BottomSheet } from '@/components/BottomSheet';
import { EmptyState } from '@/components/EmptyState';
import { ErrorState } from '@/components/ErrorState';
import { LoadingState } from '@/components/LoadingState';
import { SearchBar } from '@/components/SearchBar';
import { POPULAR_SUBJECTS, SERVICE_CATEGORY_CHIPS } from '@/constants/catalog';
import { useMyBookings } from '@/features/bookings/hooks';
import { useRefresh } from '@/hooks/useRefresh';
import { useTranslation } from '@/i18n';
import { colors, radius, shadows, spacing, typography } from '@/theme';
import type { BookingStatus, Course, CourseFormat, ServiceType } from '@/types/models';
import { courseTitle, fullName } from '@/utils/format';
import { yogaDirection } from '@/utils/rtl';

type Segment = 'upcoming' | 'past';
type StatusFilter = 'all' | BookingStatus;
type FormatFilter = 'all' | CourseFormat;
type SubjectId = (typeof POPULAR_SUBJECTS)[number]['id'];

const PAST_STATUSES = new Set(['Completed', 'Cancelled', 'Refunded']);
const SEGMENT_PAD = 4;

function toggleItem<T extends string>(list: T[], id: T): T[] {
  return list.includes(id) ? list.filter((item) => item !== id) : [...list, id];
}

function courseMatchesSubject(course: Course | undefined, subjectId: SubjectId): boolean {
  if (!course) return false;
  const subject = POPULAR_SUBJECTS.find((item) => item.id === subjectId);
  if (!subject) return true;
  const hay = [
    course.title,
    course.titleAr,
    course.skillCategory,
    course.major,
    course.level,
    course.courseCode,
    course.subject?.nameEn,
    course.subject?.nameAr,
    course.category?.nameEn,
    course.category?.nameAr,
  ]
    .filter(Boolean)
    .join(' ')
    .toLowerCase();
  return (
    hay.includes(subject.en.toLowerCase()) ||
    hay.includes(subject.ar) ||
    hay.includes(subject.id.toLowerCase())
  );
}

export default function BookingsScreen() {
  const { t, language, isRTL } = useTranslation();
  const [segment, setSegment] = useState<Segment>('upcoming');
  const [query, setQuery] = useState('');
  const [trackWidth, setTrackWidth] = useState(0);
  const [filterOpen, setFilterOpen] = useState(false);
  const [statusFilter, setStatusFilter] = useState<StatusFilter>('all');
  const [formatFilter, setFormatFilter] = useState<FormatFilter>('all');
  const [subjectIds, setSubjectIds] = useState<SubjectId[]>([]);
  const [serviceTypes, setServiceTypes] = useState<ServiceType[]>([]);
  const [draftStatus, setDraftStatus] = useState<StatusFilter>('all');
  const [draftFormat, setDraftFormat] = useState<FormatFilter>('all');
  const [draftSubjectIds, setDraftSubjectIds] = useState<SubjectId[]>([]);
  const [draftServiceTypes, setDraftServiceTypes] = useState<ServiceType[]>([]);
  const bookingsQuery = useMyBookings();
  const { refreshing, onRefresh } = useRefresh(async () => {
    await bookingsQuery.refetch();
  });
  const chevron = isRTL ? 'chevron-back' : 'chevron-forward';
  const progress = useSharedValue(0);
  const segmentOrder = isRTL
    ? (['past', 'upcoming'] as const)
    : (['upcoming', 'past'] as const);

  useEffect(() => {
    const order = isRTL ? (['past', 'upcoming'] as const) : (['upcoming', 'past'] as const);
    const index = order.indexOf(segment);
    progress.value = withSpring(index < 0 ? 0 : index, {
      damping: 18,
      stiffness: 220,
      mass: 0.7,
    });
  }, [isRTL, progress, segment]);

  const pillStyle = useAnimatedStyle(() => {
    const inner = Math.max(trackWidth - SEGMENT_PAD * 2, 0);
    const half = inner / 2;
    return {
      width: half || 1,
      transform: [{ translateX: progress.value * half }],
    };
  });

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    return (bookingsQuery.data ?? []).filter((b) => {
      const isPast = PAST_STATUSES.has(b.status);
      if (segment === 'past' ? !isPast : isPast) return false;
      if (statusFilter !== 'all' && b.status !== statusFilter) return false;
      if (formatFilter !== 'all' && b.course?.format !== formatFilter) return false;
      if (serviceTypes.length && (!b.course || !serviceTypes.includes(b.course.serviceType))) {
        return false;
      }
      if (
        subjectIds.length &&
        !subjectIds.some((subjectId) => courseMatchesSubject(b.course, subjectId))
      ) {
        return false;
      }
      if (!q) return true;
      const title = b.course ? courseTitle(b.course, language).toLowerCase() : '';
      const tutor = fullName(b.course?.tutor?.firstName, b.course?.tutor?.lastName).toLowerCase();
      return title.includes(q) || tutor.includes(q) || b.status.toLowerCase().includes(q);
    });
  }, [
    bookingsQuery.data,
    formatFilter,
    language,
    query,
    segment,
    serviceTypes,
    statusFilter,
    subjectIds,
  ]);

  const openFilters = () => {
    setDraftStatus(statusFilter);
    setDraftFormat(formatFilter);
    setDraftSubjectIds(subjectIds);
    setDraftServiceTypes(serviceTypes);
    setFilterOpen(true);
  };

  const applyFilters = () => {
    setStatusFilter(draftStatus);
    setFormatFilter(draftFormat);
    setSubjectIds(draftSubjectIds);
    setServiceTypes(draftServiceTypes);
    setFilterOpen(false);
  };

  const clearFilters = () => {
    setDraftStatus('all');
    setDraftFormat('all');
    setDraftSubjectIds([]);
    setDraftServiceTypes([]);
  };

  const listHeader = (
    <View style={styles.headerBlock}>
      <View style={styles.decorRow}>
        <Text style={styles.decorQuote}>{t('bookings.decorQuote')}</Text>
        <Text style={styles.decorHeart}>💜</Text>
      </View>

      <View style={styles.titleBlock}>
        <Text style={styles.title}>{t('bookings.title')}</Text>
        <Text style={styles.subtitle}>{t('bookings.subtitle')}</Text>
      </View>

      <View
        style={[styles.segments, yogaDirection(false)]}
        onLayout={(e) => setTrackWidth(e.nativeEvent.layout.width)}
      >
        <Animated.View style={[styles.segmentPill, pillStyle]} />
        {segmentOrder.map((id) => {
          const active = segment === id;
          return (
            <Pressable
              key={id}
              onPress={() => setSegment(id)}
              style={styles.segment}
              accessibilityRole="button"
              accessibilityState={{ selected: active }}
            >
              <Text style={[styles.segmentText, active && styles.segmentTextActive]}>
                {id === 'upcoming' ? t('bookings.upcoming') : t('bookings.past')}
              </Text>
            </Pressable>
          );
        })}
      </View>

      <View style={styles.searchRow}>
        <SearchBar
          value={query}
          onChangeText={setQuery}
          placeholder={t('bookings.searchPlaceholder')}
          style={styles.search}
        />
        <Pressable style={styles.filterBtn} hitSlop={4} onPress={openFilters}>
          <Ionicons name="options-outline" size={20} color={colors.primary} />
        </Pressable>
      </View>

      <View style={styles.sectionRow}>
        <Text style={styles.sectionTitle}>
          {segment === 'upcoming' ? t('bookings.upcoming') : t('bookings.past')} ({filtered.length})
        </Text>
        {filtered.length > 0 ? (
          <Pressable style={styles.seeAll} onPress={() => setQuery('')}>
            <Text style={styles.seeAllText}>{t('common.seeAll')}</Text>
            <Ionicons name={chevron} size={14} color={colors.primary} />
          </Pressable>
        ) : null}
      </View>
    </View>
  );

  return (
    <View style={styles.root}>
      <View style={styles.blobA} pointerEvents="none" />
      <View style={styles.blobB} pointerEvents="none" />

      <SafeAreaView style={styles.safe} edges={['top']}>
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
            ListHeaderComponent={listHeader}
            ListEmptyComponent={
              <EmptyState
                title={
                  segment === 'upcoming' ? t('bookings.emptyUpcoming') : t('bookings.emptyPast')
                }
                subtitle={t('bookings.emptyHint')}
              />
            }
            ListFooterComponent={
              <Pressable
                style={styles.helpCard}
                onPress={() => Linking.openURL('mailto:support@dars.app')}
              >
                <View style={styles.helpIcon}>
                  <Ionicons name="help-buoy-outline" size={22} color={colors.primary} />
                </View>
                <View style={styles.helpBody}>
                  <Text style={styles.helpTitle}>{t('bookings.needHelp')}</Text>
                  <Text style={styles.helpSubtitle}>{t('bookings.needHelpHint')}</Text>
                </View>
                <Ionicons name={chevron} size={18} color={colors.textMuted} />
              </Pressable>
            }
            renderItem={({ item }) => <BookingCard booking={item} />}
          />
        ) : null}
      </SafeAreaView>

      <BottomSheet visible={filterOpen} onClose={() => setFilterOpen(false)}>
        <View style={styles.filterHeader}>
          <View style={styles.filterHeaderCopy}>
            <Text style={styles.filterTitle}>{t('bookings.filters')}</Text>
            <Text style={styles.filterSubtitle}>{t('bookings.filtersSubtitle')}</Text>
          </View>
          <Pressable
            style={styles.filterClose}
            onPress={() => setFilterOpen(false)}
            hitSlop={8}
            accessibilityLabel={t('common.cancel')}
          >
            <Ionicons name="close" size={18} color={colors.primary} />
          </Pressable>
        </View>

        <View style={styles.filterBlock}>
          <View style={styles.filterBlockHead}>
            <View style={[styles.filterBlockIcon, { backgroundColor: colors.lavenderSoft }]}>
              <Ionicons name="flag-outline" size={16} color={colors.primary} />
            </View>
            <View style={styles.filterBlockCopy}>
              <Text style={styles.filterBlockTitle}>{t('bookings.filterStatus')}</Text>
              <Text style={styles.filterBlockHint}>{t('bookings.filterStatusHint')}</Text>
            </View>
          </View>
          <ScrollView
            horizontal
            showsHorizontalScrollIndicator={false}
            contentContainerStyle={styles.filterChipRow}
          >
            {(
              [
                { id: 'all' as const, label: t('bookings.statusAll') },
                { id: 'Pending' as const, label: t('bookings.statusPending') },
                { id: 'Confirmed' as const, label: t('bookings.statusConfirmed') },
                { id: 'Completed' as const, label: t('bookings.statusCompleted') },
                { id: 'Cancelled' as const, label: t('bookings.statusCancelled') },
              ] as const
            ).map((item) => {
              const active = draftStatus === item.id;
              return (
                <Pressable
                  key={item.id}
                  onPress={() => setDraftStatus(item.id)}
                  style={[styles.optionChip, active && styles.optionChipActive]}
                >
                  <Text
                    style={[styles.optionChipText, active && styles.optionChipTextActive]}
                  >
                    {item.label}
                  </Text>
                </Pressable>
              );
            })}
          </ScrollView>
        </View>

        <View style={styles.filterBlock}>
          <View style={styles.filterBlockHead}>
            <View style={[styles.filterBlockIcon, { backgroundColor: colors.infoSoft }]}>
              <Ionicons name="desktop-outline" size={16} color={colors.info} />
            </View>
            <View style={styles.filterBlockCopy}>
              <Text style={styles.filterBlockTitle}>{t('bookings.filterFormat')}</Text>
              <Text style={styles.filterBlockHint}>{t('bookings.filterFormatHint')}</Text>
            </View>
          </View>
          <ScrollView
            horizontal
            showsHorizontalScrollIndicator={false}
            contentContainerStyle={styles.filterChipRow}
          >
            {(
              [
                { id: 'all' as const, label: t('explore.all'), icon: 'apps-outline' as const },
                {
                  id: 'Online' as const,
                  label: t('common.online'),
                  icon: 'laptop-outline' as const,
                },
                {
                  id: 'InPerson' as const,
                  label: t('common.inPerson'),
                  icon: 'people-outline' as const,
                },
                {
                  id: 'Hybrid' as const,
                  label: t('common.hybrid'),
                  icon: 'business-outline' as const,
                },
              ] as const
            ).map((item) => {
              const active = draftFormat === item.id;
              return (
                <Pressable
                  key={item.id}
                  onPress={() => setDraftFormat(item.id)}
                  style={[styles.optionChip, active && styles.optionChipActive]}
                >
                  <Ionicons
                    name={item.icon}
                    size={14}
                    color={active ? colors.white : colors.textMuted}
                  />
                  <Text
                    style={[styles.optionChipText, active && styles.optionChipTextActive]}
                  >
                    {item.label}
                  </Text>
                </Pressable>
              );
            })}
          </ScrollView>
        </View>

        <View style={styles.filterBlock}>
          <View style={styles.filterBlockHead}>
            <View style={[styles.filterBlockIcon, { backgroundColor: colors.lavenderSoft }]}>
              <Ionicons name="book-outline" size={16} color={colors.primary} />
            </View>
            <View style={styles.filterBlockCopy}>
              <Text style={styles.filterBlockTitle}>{t('explore.subject')}</Text>
              <Text style={styles.filterBlockHint}>{t('explore.subjectHint')}</Text>
            </View>
          </View>
          <ScrollView
            horizontal
            showsHorizontalScrollIndicator={false}
            contentContainerStyle={styles.filterChipRow}
          >
            <Pressable
              onPress={() => setDraftSubjectIds([])}
              style={[styles.optionChip, draftSubjectIds.length === 0 && styles.optionChipActive]}
            >
              <Text
                style={[
                  styles.optionChipText,
                  draftSubjectIds.length === 0 && styles.optionChipTextActive,
                ]}
              >
                {t('explore.all')}
              </Text>
            </Pressable>
            {POPULAR_SUBJECTS.map((subject) => {
              const active = draftSubjectIds.includes(subject.id);
              return (
                <Pressable
                  key={subject.id}
                  onPress={() => setDraftSubjectIds((prev) => toggleItem(prev, subject.id))}
                  style={[styles.optionChip, active && styles.optionChipActive]}
                >
                  <Ionicons
                    name={subject.icon}
                    size={14}
                    color={active ? colors.white : colors.textMuted}
                  />
                  <Text
                    style={[styles.optionChipText, active && styles.optionChipTextActive]}
                  >
                    {language === 'ar' ? subject.ar : subject.en}
                  </Text>
                </Pressable>
              );
            })}
          </ScrollView>
        </View>

        <View style={styles.filterBlock}>
          <View style={styles.filterBlockHead}>
            <View style={[styles.filterBlockIcon, { backgroundColor: colors.successSoft }]}>
              <Ionicons name="school-outline" size={16} color={colors.success} />
            </View>
            <View style={styles.filterBlockCopy}>
              <Text style={styles.filterBlockTitle}>{t('bookings.filterType')}</Text>
              <Text style={styles.filterBlockHint}>{t('bookings.filterTypeHint')}</Text>
            </View>
          </View>
          <ScrollView
            horizontal
            showsHorizontalScrollIndicator={false}
            contentContainerStyle={styles.filterChipRow}
          >
            <Pressable
              onPress={() => setDraftServiceTypes([])}
              style={[
                styles.optionChip,
                draftServiceTypes.length === 0 && styles.optionChipActive,
              ]}
            >
              <Text
                style={[
                  styles.optionChipText,
                  draftServiceTypes.length === 0 && styles.optionChipTextActive,
                ]}
              >
                {t('explore.all')}
              </Text>
            </Pressable>
            {SERVICE_CATEGORY_CHIPS.map((chip) => {
              const active = draftServiceTypes.includes(chip.id);
              return (
                <Pressable
                  key={chip.id}
                  onPress={() => setDraftServiceTypes((prev) => toggleItem(prev, chip.id))}
                  style={[styles.optionChip, active && styles.optionChipActive]}
                >
                  <Ionicons
                    name={chip.icon}
                    size={14}
                    color={active ? colors.white : colors.textMuted}
                  />
                  <Text
                    style={[styles.optionChipText, active && styles.optionChipTextActive]}
                  >
                    {t(chip.labelKey)}
                  </Text>
                </Pressable>
              );
            })}
          </ScrollView>
        </View>

        <View style={styles.filterFooter}>
          <Pressable style={styles.clearBtn} onPress={clearFilters}>
            <Text style={styles.clearBtnText}>{t('bookings.clearFilters')}</Text>
          </Pressable>
          <Pressable style={styles.applyBtn} onPress={applyFilters}>
            <Text style={styles.applyBtnText}>{t('bookings.applyFilters')}</Text>
            <Ionicons
              name={isRTL ? 'arrow-back' : 'arrow-forward'}
              size={16}
              color={colors.white}
            />
          </Pressable>
        </View>
      </BottomSheet>
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
    top: 20,
    right: 40,
    width: 90,
    height: 80,
    borderRadius: 45,
    backgroundColor: '#F3E8E0',
    opacity: 0.65,
  },
  safe: { flex: 1 },
  headerBlock: {
    gap: spacing.md,
    marginBottom: spacing.sm,
  },
  decorRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'flex-end',
    gap: 4,
  },
  decorQuote: {
    ...typography.caption,
    color: colors.lavender,
    fontStyle: 'italic',
    fontSize: 12,
  },
  decorHeart: { fontSize: 11 },
  titleBlock: { gap: 4 },
  title: {
    ...typography.heading,
    color: colors.primary,
    fontSize: 28,
    lineHeight: 34,
  },
  subtitle: {
    ...typography.body,
    color: colors.textMuted,
    fontSize: 14,
  },
  segments: {
    flexDirection: 'row',
    backgroundColor: colors.beige,
    borderRadius: radius.full,
    padding: SEGMENT_PAD,
    position: 'relative',
    overflow: 'hidden',
  },
  segmentPill: {
    position: 'absolute',
    top: SEGMENT_PAD,
    bottom: SEGMENT_PAD,
    left: SEGMENT_PAD,
    borderRadius: radius.full,
    backgroundColor: colors.primary,
  },
  segment: {
    flex: 1,
    paddingVertical: spacing.sm,
    borderRadius: radius.full,
    alignItems: 'center',
    zIndex: 1,
  },
  segmentText: {
    ...typography.caption,
    color: colors.textSecondary,
    fontWeight: '700',
  },
  segmentTextActive: { color: colors.white },
  searchRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
  },
  search: { flex: 1 },
  filterBtn: {
    width: 48,
    height: 48,
    borderRadius: radius.lg,
    backgroundColor: colors.white,
    borderWidth: 1,
    borderColor: colors.border,
    alignItems: 'center',
    justifyContent: 'center',
    ...shadows.sm,
  },
  sectionRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginTop: spacing.xs,
  },
  sectionTitle: {
    ...typography.subheading,
    color: colors.primary,
    fontSize: 16,
  },
  seeAll: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 2,
  },
  seeAllText: {
    ...typography.caption,
    color: colors.primary,
    fontWeight: '700',
  },
  list: {
    paddingHorizontal: spacing.xl,
    paddingBottom: spacing.massive,
  },
  helpCard: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.md,
    backgroundColor: colors.lavenderSoft,
    borderRadius: radius.xl,
    padding: spacing.lg,
    marginTop: spacing.sm,
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
  filterHeader: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: spacing.md,
    marginBottom: spacing.xs,
  },
  filterHeaderCopy: { flex: 1, gap: 4 },
  filterTitle: {
    ...typography.heading,
    color: colors.primary,
    fontSize: 24,
    lineHeight: 30,
  },
  filterSubtitle: {
    ...typography.caption,
    color: colors.textMuted,
    fontSize: 13,
    lineHeight: 18,
  },
  filterClose: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: colors.beige,
    alignItems: 'center',
    justifyContent: 'center',
  },
  filterBlock: { gap: spacing.md },
  filterBlockHead: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
  },
  filterBlockIcon: {
    width: 36,
    height: 36,
    borderRadius: 18,
    alignItems: 'center',
    justifyContent: 'center',
  },
  filterBlockCopy: { flex: 1, gap: 2 },
  filterBlockTitle: {
    ...typography.body,
    color: colors.text,
    fontWeight: '700',
    fontSize: 15,
  },
  filterBlockHint: {
    ...typography.caption,
    color: colors.textMuted,
    fontSize: 12,
  },
  filterChipRow: {
    flexDirection: 'row',
    gap: spacing.sm,
    paddingVertical: 2,
  },
  optionChip: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm,
    borderRadius: radius.full,
    backgroundColor: colors.white,
    borderWidth: 1.5,
    borderColor: colors.border,
  },
  optionChipActive: {
    backgroundColor: colors.primary,
    borderColor: colors.primary,
  },
  optionChipText: {
    ...typography.caption,
    color: colors.textSecondary,
    fontWeight: '700',
  },
  optionChipTextActive: {
    color: colors.white,
  },
  filterFooter: {
    flexDirection: 'row',
    gap: spacing.sm,
    marginTop: spacing.sm,
  },
  clearBtn: {
    flex: 1,
    minHeight: 52,
    borderRadius: radius.lg,
    borderWidth: 1.5,
    borderColor: colors.border,
    backgroundColor: colors.white,
    alignItems: 'center',
    justifyContent: 'center',
  },
  clearBtnText: {
    ...typography.button,
    color: colors.primary,
    fontWeight: '700',
  },
  applyBtn: {
    flex: 1.2,
    minHeight: 52,
    borderRadius: radius.lg,
    backgroundColor: colors.primary,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: spacing.sm,
    paddingHorizontal: spacing.md,
  },
  applyBtnText: {
    ...typography.button,
    color: colors.white,
    fontWeight: '700',
  },
});
