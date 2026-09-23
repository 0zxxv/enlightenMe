import { Ionicons } from '@expo/vector-icons';
import { useLocalSearchParams } from 'expo-router';
import React, { useEffect, useMemo, useState } from 'react';
import {
  FlatList,
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
import { CourseCard } from '@/components/CourseCard';
import { EmptyState } from '@/components/EmptyState';
import { ErrorState } from '@/components/ErrorState';
import { InstituteCard } from '@/components/InstituteCard';
import { LoadingState } from '@/components/LoadingState';
import { BottomSheet } from '@/components/BottomSheet';
import { SearchBar } from '@/components/SearchBar';
import { SectionHeader } from '@/components/SectionHeader';
import { TutorCard } from '@/components/TutorCard';
import { POPULAR_SUBJECTS, SERVICE_CATEGORY_CHIPS } from '@/constants/catalog';
import { normalizeServiceType, providersForService, type ServiceType } from '@/domain/marketplace';
import { useCourses } from '@/features/courses/hooks';
import { useInstitutes } from '@/features/institutes/hooks';
import { useTutors } from '@/features/tutors/hooks';
import { useLayout } from '@/hooks/useLayout';
import { useRefresh } from '@/hooks/useRefresh';
import { useTranslation } from '@/i18n';
import { colors, radius, shadows, spacing, typography } from '@/theme';
import type { Course, CourseFormat, Institute, Tutor } from '@/types/models';
import { yogaDirection } from '@/utils/rtl';
import { useRouter } from 'expo-router';

type ResultTab = 'services' | 'providers';
type ListRow =
  | { kind: 'course'; item: Course }
  | { kind: 'tutor'; item: Tutor }
  | { kind: 'institute'; item: Institute };

const SEGMENT_PAD = 4;

type FormatFilter = 'all' | CourseFormat;
type SortOption = 'default' | 'priceAsc' | 'priceDesc' | 'rating';
type SubjectId = (typeof POPULAR_SUBJECTS)[number]['id'];

function coursePrice(course: Course): number {
  const raw = course.priceDecimal;
  return typeof raw === 'number' ? raw : Number.parseFloat(String(raw)) || 0;
}

function courseMatchesSubject(course: Course, subjectId: SubjectId): boolean {
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

function toggleItem<T extends string>(list: T[], id: T): T[] {
  return list.includes(id) ? list.filter((item) => item !== id) : [...list, id];
}

export default function ExploreScreen() {
  const { t, isRTL, language } = useTranslation();
  const router = useRouter();
  const layout = useLayout();
  const params = useLocalSearchParams<{
    q?: string;
    subject?: string;
    serviceType?: string;
    type?: string;
    result?: string;
    tab?: string;
  }>();

  const [query, setQuery] = useState(params.q ?? '');
  const [serviceTypes, setServiceTypes] = useState<ServiceType[]>(() => {
    const raw = params.serviceType ?? params.type;
    const next = raw ? normalizeServiceType(String(raw)) : null;
    return next ? [next] : [];
  });
  const [formatFilter, setFormatFilter] = useState<FormatFilter>('all');
  const [sortBy, setSortBy] = useState<SortOption>('default');
  const [subjectIds, setSubjectIds] = useState<SubjectId[]>([]);
  const [filterOpen, setFilterOpen] = useState(false);
  const [draftFormat, setDraftFormat] = useState<FormatFilter>('all');
  const [draftSort, setDraftSort] = useState<SortOption>('default');
  const [draftSubjectIds, setDraftSubjectIds] = useState<SubjectId[]>([]);
  const [resultTab, setResultTab] = useState<ResultTab>(() => {
    if (params.result === 'providers' || params.tab === 'tutors' || params.tab === 'institutes') {
      return 'providers';
    }
    return 'services';
  });
  const [trackWidth, setTrackWidth] = useState(0);
  const progress = useSharedValue(0);

  const tabOrder = isRTL
    ? (['providers', 'services'] as const)
    : (['services', 'providers'] as const);

  useEffect(() => {
    if (typeof params.q === 'string') {
      setQuery(params.q);
      const match = POPULAR_SUBJECTS.find(
        (s) =>
          s.en.toLowerCase() === params.q!.toLowerCase() ||
          s.ar === params.q ||
          s.id === params.q!.toLowerCase(),
      );
      if (match) {
        setSubjectIds((prev) => (prev.includes(match.id) ? prev : [...prev, match.id]));
      }
    }
    if (typeof params.subject === 'string') {
      const match = POPULAR_SUBJECTS.find((s) => s.id === params.subject);
      if (match) {
        setSubjectIds((prev) => (prev.includes(match.id) ? prev : [...prev, match.id]));
      }
    }
    const raw = params.serviceType ?? params.type;
    if (raw) {
      const next = normalizeServiceType(String(raw));
      if (next) {
        setServiceTypes((prev) => (prev.includes(next) ? prev : [...prev, next]));
      }
    }
    if (params.result === 'providers' || params.tab === 'tutors' || params.tab === 'institutes') {
      setResultTab('providers');
    }
  }, [params.q, params.subject, params.serviceType, params.type, params.result, params.tab]);

  useEffect(() => {
    const order = isRTL
      ? (['providers', 'services'] as const)
      : (['services', 'providers'] as const);
    const index = order.indexOf(resultTab);
    progress.value = withSpring(index < 0 ? 0 : index, {
      damping: 18,
      stiffness: 220,
      mass: 0.7,
    });
  }, [isRTL, progress, resultTab]);

  const pillStyle = useAnimatedStyle(() => {
    const inner = Math.max(trackWidth - SEGMENT_PAD * 2, 0);
    const half = inner / 2;
    return {
      width: half || 1,
      transform: [{ translateX: progress.value * half }],
    };
  });

  const allowedProviders = useMemo(() => {
    if (!serviceTypes.length) return [];
    const set = new Set<ReturnType<typeof providersForService>[number]>();
    serviceTypes.forEach((id) => {
      providersForService(id).forEach((p) => set.add(p));
    });
    return Array.from(set);
  }, [serviceTypes]);

  const coursesQuery = useCourses({
    q: query || undefined,
    serviceType: serviceTypes.length === 1 ? serviceTypes[0] : undefined,
    pageSize: layout.courseColumns * 4,
  });

  const tutorsQuery = useTutors({
    q: query || undefined,
    pageSize: 20,
  });
  const institutesQuery = useInstitutes({
    q: query || undefined,
    pageSize: 20,
  });

  const { refreshing, onRefresh } = useRefresh(async () => {
    await Promise.all([
      coursesQuery.refetch(),
      tutorsQuery.refetch(),
      institutesQuery.refetch(),
    ]);
  });

  const isLoading =
    resultTab === 'services'
      ? coursesQuery.isLoading
      : tutorsQuery.isLoading || institutesQuery.isLoading;
  const isError =
    resultTab === 'services'
      ? coursesQuery.isError
      : tutorsQuery.isError || institutesQuery.isError;

  const coursesRaw = coursesQuery.data?.data ?? [];
  const courses = useMemo(() => {
    let list = [...coursesRaw];
    if (serviceTypes.length) {
      list = list.filter((c) => serviceTypes.includes(c.serviceType));
    }
    if (formatFilter !== 'all') {
      list = list.filter((c) => c.format === formatFilter);
    }
    if (subjectIds.length) {
      list = list.filter((c) => subjectIds.some((id) => courseMatchesSubject(c, id)));
    }
    if (sortBy === 'priceAsc') {
      list.sort((a, b) => coursePrice(a) - coursePrice(b));
    } else if (sortBy === 'priceDesc') {
      list.sort((a, b) => coursePrice(b) - coursePrice(a));
    } else if (sortBy === 'rating') {
      list.sort((a, b) => (b.ratingAvg ?? 0) - (a.ratingAvg ?? 0));
    }
    return list;
  }, [coursesRaw, formatFilter, serviceTypes, sortBy, subjectIds]);
  const tutors = tutorsQuery.data?.data ?? [];
  const institutes = institutesQuery.data?.data ?? [];

  const listData = useMemo((): ListRow[] => {
    if (resultTab === 'services') {
      return courses.map((item) => ({ kind: 'course' as const, item }));
    }
    const rows: ListRow[] = [];
    const showTeachers =
      !serviceTypes.length ||
      allowedProviders.includes('Teacher') ||
      allowedProviders.includes('Trainer');
    const showInstitutes = !serviceTypes.length || allowedProviders.includes('Institute');

    if (showTeachers) {
      tutors.forEach((item) => rows.push({ kind: 'tutor', item }));
    }
    if (showInstitutes) {
      institutes.forEach((item) => rows.push({ kind: 'institute', item }));
    }
    return rows;
  }, [allowedProviders, courses, institutes, resultTab, serviceTypes, tutors]);

  const openFilters = () => {
    setDraftFormat(formatFilter);
    setDraftSort(sortBy);
    setDraftSubjectIds(subjectIds);
    setFilterOpen(true);
  };

  const applyFilters = () => {
    setFormatFilter(draftFormat);
    setSortBy(draftSort);
    setSubjectIds(draftSubjectIds);
    setFilterOpen(false);
  };

  const clearFilters = () => {
    setDraftFormat('all');
    setDraftSort('default');
    setDraftSubjectIds([]);
  };

  const courseGap = spacing.md;
  const columns = resultTab === 'services' ? layout.courseColumns : 1;
  const writing = {
    textAlign: (isRTL ? 'right' : 'left') as 'left' | 'right',
    writingDirection: (isRTL ? 'rtl' : 'ltr') as 'rtl' | 'ltr',
  };

  const refetchAll = () => {
    coursesQuery.refetch();
    tutorsQuery.refetch();
    institutesQuery.refetch();
  };

  const listHeader = (
    <View style={styles.headerBlock}>
      <Text style={[styles.title, writing]}>{t('explore.title')}</Text>

      <View style={styles.searchRow}>
        <SearchBar
          value={query}
          onChangeText={setQuery}
          placeholder={t('home.searchPlaceholder')}
          trailingIcon="scan-outline"
          onSubmit={refetchAll}
          onTrailingPress={refetchAll}
          style={styles.search}
        />
        <Pressable style={styles.filterBtn} hitSlop={4} onPress={openFilters}>
          <Ionicons name="options-outline" size={20} color={colors.primary} />
        </Pressable>
      </View>

      <Text style={[styles.sectionLabel, writing]}>{t('home.whatToLearn')}</Text>
      <View style={styles.categoryRow}>
        {SERVICE_CATEGORY_CHIPS.map((chip) => {
          const selected = serviceTypes.includes(chip.id);
          return (
            <Pressable
              key={chip.id}
              style={styles.categoryItem}
              onPress={() => {
                setServiceTypes((prev) => toggleItem(prev, chip.id));
                setResultTab('services');
              }}
            >
              <View
                style={[
                  styles.categoryIcon,
                  { backgroundColor: chip.soft },
                  selected && styles.categoryIconSelected,
                ]}
              >
                <Ionicons name={chip.icon} size={26} color={chip.tint} />
              </View>
              <Text style={[styles.categoryLabel, selected && styles.categoryLabelSelected]}>
                {t(chip.labelKey)}
              </Text>
            </Pressable>
          );
        })}
      </View>

      <SectionHeader
        title={t('home.popularSubjects')}
        actionLabel={t('common.seeAll')}
        onAction={() => router.push('/subjects')}
      />
      <ScrollView
        horizontal
        showsHorizontalScrollIndicator={false}
        contentContainerStyle={styles.subjectStrip}
      >
        {POPULAR_SUBJECTS.map((subject) => {
          const selected = subjectIds.includes(subject.id);
          return (
            <Pressable
              key={subject.id}
              style={styles.subjectItem}
              onPress={() => setSubjectIds((prev) => toggleItem(prev, subject.id))}
            >
              <View
                style={[
                  styles.subjectIcon,
                  { backgroundColor: subject.soft },
                  selected && styles.subjectIconSelected,
                ]}
              >
                <Ionicons name={subject.icon} size={22} color={subject.tint} />
              </View>
              <Text
                style={[styles.subjectLabel, selected && styles.subjectLabelSelected]}
                numberOfLines={1}
              >
                {language === 'ar' ? subject.ar : subject.en}
              </Text>
            </Pressable>
          );
        })}
      </ScrollView>

      <View
        style={[styles.segments, yogaDirection(false)]}
        onLayout={(e) => setTrackWidth(e.nativeEvent.layout.width)}
      >
        <Animated.View style={[styles.segmentPill, pillStyle]} />
        {tabOrder.map((id) => {
          const active = resultTab === id;
          return (
            <Pressable
              key={id}
              onPress={() => setResultTab(id)}
              style={styles.segment}
              accessibilityRole="button"
              accessibilityState={{ selected: active }}
            >
              <Text style={[styles.segmentText, active && styles.segmentTextActive]}>
                {id === 'services' ? t('marketplace.services') : t('marketplace.providers')}
              </Text>
            </Pressable>
          );
        })}
      </View>

      {isError && !isLoading ? <ErrorState onRetry={refetchAll} /> : null}
      {isLoading ? <LoadingState /> : null}

      {!isLoading && !isError ? (
        <SectionHeader
          title={
            resultTab === 'services'
              ? t('marketplace.services')
              : t('marketplace.serviceProviders')
          }
        />
      ) : null}
    </View>
  );

  return (
    <SafeAreaView style={styles.safe} edges={['top']}>
      <View
        style={[
          styles.shell,
          {
            paddingHorizontal: layout.contentPadding,
            maxWidth: layout.contentMaxWidth ?? '100%',
            alignSelf: 'center',
            width: '100%',
            flex: 1,
          },
        ]}
      >
        <FlatList
          key={`${resultTab}-${columns}`}
          data={isLoading || isError ? [] : listData}
          keyExtractor={(row) =>
            row.kind === 'course'
              ? `course-${row.item.id}`
              : row.kind === 'tutor'
                ? `tutor-${row.item.id}`
                : `institute-${row.item.id}`
          }
          numColumns={columns}
          ListHeaderComponent={listHeader}
          contentContainerStyle={styles.list}
          columnWrapperStyle={columns > 1 ? styles.columnWrap : undefined}
          refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} />}
          ListEmptyComponent={
            !isLoading && !isError ? (
              <EmptyState
                title={t('common.empty')}
                subtitle={
                  resultTab === 'services' ? t('home.emptyCoursesHint') : undefined
                }
              />
            ) : null
          }
          showsVerticalScrollIndicator={false}
          renderItem={({ item: row }) => {
            if (row.kind === 'course') {
              return (
                <View
                  style={{
                    width: `${100 / columns}%` as `${number}%`,
                    paddingHorizontal: courseGap / 2,
                    marginBottom: courseGap,
                  }}
                >
                  <CourseCard course={row.item} variant="featured" />
                </View>
              );
            }
            return (
              <View style={styles.listItem}>
                {row.kind === 'tutor' ? (
                  <TutorCard tutor={row.item} />
                ) : (
                  <InstituteCard institute={row.item} />
                )}
              </View>
            );
          }}
        />
      </View>

      <BottomSheet visible={filterOpen} onClose={() => setFilterOpen(false)}>
        <View style={styles.filterHeader}>
          <View style={styles.filterHeaderCopy}>
            <Text style={styles.filterTitle}>{t('explore.filters')}</Text>
            <Text style={styles.filterSubtitle}>{t('explore.filtersSubtitle')}</Text>
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
              <Ionicons name="book-outline" size={16} color={colors.primary} />
            </View>
            <View style={styles.filterBlockCopy}>
              <Text style={styles.filterBlockTitle}>{t('explore.subject')}</Text>
              <Text style={styles.filterBlockHint}>{t('explore.subjectHint')}</Text>
            </View>
            <Pressable
              style={styles.seeAllLink}
              onPress={() => {
                setFilterOpen(false);
                router.push('/subjects');
              }}
            >
              <Text style={styles.seeAllText}>{t('common.seeAll')}</Text>
              <Ionicons
                name={isRTL ? 'chevron-back' : 'chevron-forward'}
                size={14}
                color={colors.primary}
              />
            </Pressable>
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
            <View style={[styles.filterBlockIcon, { backgroundColor: colors.infoSoft }]}>
              <Ionicons name="desktop-outline" size={16} color={colors.info} />
            </View>
            <View style={styles.filterBlockCopy}>
              <Text style={styles.filterBlockTitle}>{t('explore.format')}</Text>
              <Text style={styles.filterBlockHint}>{t('explore.formatHint')}</Text>
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
            <View style={[styles.filterBlockIcon, { backgroundColor: '#F7E8EE' }]}>
              <Ionicons name="swap-vertical-outline" size={16} color="#A34A6A" />
            </View>
            <View style={styles.filterBlockCopy}>
              <Text style={styles.filterBlockTitle}>{t('explore.sort')}</Text>
              <Text style={styles.filterBlockHint}>{t('explore.sortHint')}</Text>
            </View>
          </View>
          <View style={styles.sortGrid}>
            {(
              [
                {
                  id: 'default' as const,
                  label: t('explore.sortDefault'),
                  icon: 'bar-chart-outline' as const,
                },
                {
                  id: 'priceAsc' as const,
                  label: t('explore.sortPriceLow'),
                  icon: 'pricetag-outline' as const,
                },
                {
                  id: 'priceDesc' as const,
                  label: t('explore.sortPriceHigh'),
                  icon: 'pricetag-outline' as const,
                },
                {
                  id: 'rating' as const,
                  label: t('explore.sortRating'),
                  icon: 'star-outline' as const,
                },
              ] as const
            ).map((item) => {
              const active = draftSort === item.id;
              return (
                <Pressable
                  key={item.id}
                  onPress={() => setDraftSort(item.id)}
                  style={[styles.sortCard, active && styles.sortCardActive]}
                >
                  <View style={styles.sortCardLeft}>
                    <Ionicons
                      name={item.icon}
                      size={18}
                      color={active ? colors.primary : colors.textMuted}
                    />
                    <Text
                      style={[styles.sortCardText, active && styles.sortCardTextActive]}
                      numberOfLines={2}
                    >
                      {item.label}
                    </Text>
                  </View>
                  <View style={[styles.radio, active && styles.radioActive]}>
                    {active ? <View style={styles.radioDot} /> : null}
                  </View>
                </Pressable>
              );
            })}
          </View>
        </View>

        <View style={styles.filterFooter}>
          <Pressable style={styles.clearBtn} onPress={clearFilters}>
            <Text style={styles.clearBtnText}>{t('explore.clearFilters')}</Text>
          </Pressable>
          <Pressable style={styles.applyBtn} onPress={applyFilters}>
            <Text style={styles.applyBtnText}>{t('explore.applyFilters')}</Text>
            <Ionicons
              name={isRTL ? 'arrow-back' : 'arrow-forward'}
              size={16}
              color={colors.white}
            />
          </Pressable>
        </View>
      </BottomSheet>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: colors.background },
  shell: {
    paddingTop: spacing.md,
  },
  headerBlock: {
    gap: spacing.lg,
    marginBottom: spacing.md,
  },
  title: {
    ...typography.heading,
    color: colors.text,
    fontSize: 26,
    lineHeight: 32,
  },
  sectionLabel: {
    ...typography.subheading,
    color: colors.text,
    fontSize: 16,
  },
  categoryRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    gap: spacing.sm,
  },
  categoryItem: {
    flex: 1,
    alignItems: 'center',
    gap: spacing.sm,
  },
  categoryIcon: {
    width: 64,
    height: 64,
    borderRadius: 20,
    alignItems: 'center',
    justifyContent: 'center',
  },
  categoryIconSelected: {
    borderWidth: 2,
    borderColor: colors.primary,
  },
  categoryLabel: {
    ...typography.caption,
    color: colors.text,
    fontWeight: '600',
    textAlign: 'center',
  },
  categoryLabelSelected: {
    color: colors.primary,
    fontWeight: '800',
  },
  subjectStrip: {
    flexDirection: 'row',
    gap: spacing.md,
    paddingVertical: spacing.xs,
  },
  subjectItem: {
    alignItems: 'center',
    gap: spacing.sm,
    width: 76,
  },
  subjectIcon: {
    width: 56,
    height: 56,
    borderRadius: 16,
    alignItems: 'center',
    justifyContent: 'center',
  },
  subjectIconSelected: {
    borderWidth: 2.5,
    borderColor: colors.primary,
  },
  subjectLabel: {
    ...typography.caption,
    color: colors.text,
    fontWeight: '600',
    fontSize: 11,
    textAlign: 'center',
  },
  subjectLabelSelected: {
    color: colors.primary,
    fontWeight: '800',
  },
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
  seeAllLink: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 2,
  },
  seeAllText: {
    ...typography.caption,
    color: colors.primary,
    fontWeight: '700',
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
  sortGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: spacing.sm,
  },
  sortCard: {
    width: '48%',
    flexGrow: 1,
    minWidth: '46%',
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: spacing.sm,
    backgroundColor: colors.white,
    borderWidth: 1.5,
    borderColor: colors.border,
    borderRadius: radius.xl,
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.md,
    minHeight: 64,
  },
  sortCardActive: {
    backgroundColor: colors.lavenderSoft,
    borderColor: colors.lavender,
  },
  sortCardLeft: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
  },
  sortCardText: {
    ...typography.caption,
    color: colors.textSecondary,
    fontWeight: '600',
    flex: 1,
    fontSize: 12,
  },
  sortCardTextActive: {
    color: colors.primary,
    fontWeight: '700',
  },
  radio: {
    width: 18,
    height: 18,
    borderRadius: 9,
    borderWidth: 1.5,
    borderColor: colors.borderStrong,
    alignItems: 'center',
    justifyContent: 'center',
  },
  radioActive: {
    borderColor: colors.primary,
  },
  radioDot: {
    width: 10,
    height: 10,
    borderRadius: 5,
    backgroundColor: colors.primary,
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
    justifyContent: 'center',
    zIndex: 1,
    minHeight: 40,
  },
  segmentText: {
    ...typography.caption,
    color: colors.textSecondary,
    fontWeight: '700',
    fontSize: 13,
    textAlign: 'center',
  },
  segmentTextActive: {
    color: colors.white,
  },
  list: {
    paddingBottom: spacing.massive,
    flexGrow: 1,
  },
  columnWrap: {
    marginHorizontal: -spacing.md / 2,
  },
  listItem: {
    marginBottom: spacing.md,
    width: '100%',
  },
});
