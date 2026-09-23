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
import { SearchBar } from '@/components/SearchBar';
import { SectionHeader } from '@/components/SectionHeader';
import { TutorCard } from '@/components/TutorCard';
import { SERVICE_CATEGORY_CHIPS } from '@/constants/catalog';
import {
  PROVIDER_TYPE_LABEL_KEYS,
  normalizeServiceType,
  providersForService,
  type ProviderType,
  type ServiceType,
} from '@/domain/marketplace';
import { useCourses } from '@/features/courses/hooks';
import { useInstitutes } from '@/features/institutes/hooks';
import { useTutors } from '@/features/tutors/hooks';
import { useLayout } from '@/hooks/useLayout';
import { useRefresh } from '@/hooks/useRefresh';
import { useTranslation } from '@/i18n';
import { colors, radius, spacing, typography } from '@/theme';
import type { Course, Institute, Tutor } from '@/types/models';
import { yogaDirection } from '@/utils/rtl';

type ResultTab = 'services' | 'providers';
type ListRow =
  | { kind: 'course'; item: Course }
  | { kind: 'tutor'; item: Tutor }
  | { kind: 'institute'; item: Institute };

const SEGMENT_PAD = 4;

export default function ExploreScreen() {
  const { t, isRTL } = useTranslation();
  const layout = useLayout();
  const params = useLocalSearchParams<{
    q?: string;
    serviceType?: string;
    type?: string;
    result?: string;
    tab?: string;
  }>();

  const [query, setQuery] = useState(params.q ?? '');
  const [serviceType, setServiceType] = useState<ServiceType | undefined>(() => {
    const raw = params.serviceType ?? params.type;
    return raw ? normalizeServiceType(String(raw)) ?? undefined : undefined;
  });
  const [providerType, setProviderType] = useState<ProviderType | 'all'>('all');
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
    if (typeof params.q === 'string') setQuery(params.q);
    const raw = params.serviceType ?? params.type;
    if (raw) {
      const next = normalizeServiceType(String(raw));
      if (next) setServiceType(next);
    }
    if (params.result === 'providers' || params.tab === 'tutors' || params.tab === 'institutes') {
      setResultTab('providers');
    }
  }, [params.q, params.serviceType, params.type, params.result, params.tab]);

  useEffect(() => {
    setProviderType('all');
  }, [serviceType]);

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

  const allowedProviders = serviceType ? providersForService(serviceType) : [];

  const coursesQuery = useCourses({
    q: query || undefined,
    serviceType,
    providerType: providerType === 'all' ? undefined : providerType,
    pageSize: layout.courseColumns * 4,
  });

  const tutorProviderFilter =
    providerType === 'Teacher' || providerType === 'Trainer' ? providerType : undefined;
  const tutorsQuery = useTutors({
    q: query || undefined,
    providerType: tutorProviderFilter,
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

  const courses = coursesQuery.data?.data ?? [];
  const tutors = tutorsQuery.data?.data ?? [];
  const institutes = institutesQuery.data?.data ?? [];

  const listData = useMemo((): ListRow[] => {
    if (resultTab === 'services') {
      return courses.map((item) => ({ kind: 'course' as const, item }));
    }
    const rows: ListRow[] = [];
    const showTeachers =
      !serviceType ||
      allowedProviders.includes('Teacher') ||
      allowedProviders.includes('Trainer');
    const showInstitutes = !serviceType || allowedProviders.includes('Institute');

    if (providerType === 'all' || providerType === 'Teacher' || providerType === 'Trainer') {
      if (showTeachers) {
        tutors.forEach((item) => {
          const pt = item.tutorProfile?.providerType;
          if (
            providerType === 'all' ||
            pt === providerType ||
            (!pt && providerType === 'Teacher')
          ) {
            rows.push({ kind: 'tutor', item });
          }
        });
      }
    }
    if ((providerType === 'all' || providerType === 'Institute') && showInstitutes) {
      institutes.forEach((item) => rows.push({ kind: 'institute', item }));
    }
    return rows;
  }, [
    allowedProviders,
    courses,
    institutes,
    providerType,
    resultTab,
    serviceType,
    tutors,
  ]);

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

      <SearchBar
        value={query}
        onChangeText={setQuery}
        placeholder={t('home.searchPlaceholder')}
        trailingIcon="scan-outline"
        onSubmit={refetchAll}
        onTrailingPress={refetchAll}
      />

      <Text style={[styles.sectionLabel, writing]}>{t('home.whatToLearn')}</Text>
      <View style={styles.categoryRow}>
        {SERVICE_CATEGORY_CHIPS.map((chip) => {
          const selected = serviceType === chip.id;
          return (
            <Pressable
              key={chip.id}
              style={styles.categoryItem}
              onPress={() => {
                setServiceType((prev) => (prev === chip.id ? undefined : chip.id));
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

      {serviceType ? (
        <View style={styles.providerBlock}>
          <Text style={[styles.sectionLabel, writing]}>{t('marketplace.providerFilter')}</Text>
          <ScrollView
            horizontal
            showsHorizontalScrollIndicator={false}
            contentContainerStyle={styles.providerChips}
          >
            <Pressable
              onPress={() => setProviderType('all')}
              style={[styles.chip, providerType === 'all' && styles.chipActive]}
            >
              <Text style={[styles.chipText, providerType === 'all' && styles.chipTextActive]}>
                {t('marketplace.allProviders')}
              </Text>
            </Pressable>
            {allowedProviders.map((pt) => (
              <Pressable
                key={pt}
                onPress={() => setProviderType(pt)}
                style={[styles.chip, providerType === pt && styles.chipActive]}
              >
                <Text style={[styles.chipText, providerType === pt && styles.chipTextActive]}>
                  {t(PROVIDER_TYPE_LABEL_KEYS[pt])}
                </Text>
              </Pressable>
            ))}
          </ScrollView>
        </View>
      ) : null}

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
  providerBlock: { gap: spacing.sm },
  providerChips: { gap: spacing.sm, paddingVertical: 2 },
  chip: {
    paddingHorizontal: spacing.lg,
    paddingVertical: spacing.sm,
    borderRadius: radius.full,
    backgroundColor: colors.white,
    borderWidth: 1.5,
    borderColor: colors.border,
  },
  chipActive: {
    backgroundColor: colors.lavenderSoft,
    borderColor: colors.lavender,
  },
  chipText: {
    ...typography.caption,
    color: colors.textSecondary,
    fontWeight: '600',
  },
  chipTextActive: {
    color: colors.primary,
    fontWeight: '800',
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
