import { Ionicons } from '@expo/vector-icons';
import { useLocalSearchParams } from 'expo-router';
import React, { useEffect, useMemo, useState } from 'react';
import {
  FlatList,
  Pressable,
  RefreshControl,
  StyleSheet,
  Text,
  View,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { CourseCard } from '@/components/CourseCard';
import { EmptyState } from '@/components/EmptyState';
import { ErrorState } from '@/components/ErrorState';
import { InstituteCard } from '@/components/InstituteCard';
import { LoadingState } from '@/components/LoadingState';
import { SearchBar } from '@/components/SearchBar';
import { SectionHeader } from '@/components/SectionHeader';
import { TutorCard } from '@/components/TutorCard';
import { CATEGORY_CHIPS } from '@/constants/catalog';
import { useCourses } from '@/features/courses/hooks';
import { useInstitutes } from '@/features/institutes/hooks';
import { useTutors } from '@/features/tutors/hooks';
import { useLayout } from '@/hooks/useLayout';
import { useRefresh } from '@/hooks/useRefresh';
import { useTranslation } from '@/i18n';
import { colors, radius, spacing, typography } from '@/theme';
import type { CourseType } from '@/types/models';

type ExploreTab = 'all' | 'courses' | 'tutors' | 'institutes';

export default function ExploreScreen() {
  const { t } = useTranslation();
  const layout = useLayout();
  const params = useLocalSearchParams<{ q?: string; tab?: string; type?: string }>();
  const [tab, setTab] = useState<ExploreTab>((params.tab as ExploreTab) || 'courses');
  const [query, setQuery] = useState(params.q ?? '');
  const [courseType, setCourseType] = useState<CourseType | undefined>(() => {
    if (!params.type) return undefined;
    const next = (params.type.charAt(0).toUpperCase() + params.type.slice(1)) as CourseType;
    return ['School', 'University', 'Skills'].includes(next) ? next : undefined;
  });

  useEffect(() => {
    if (typeof params.q === 'string') setQuery(params.q);
    if (params.tab) setTab(params.tab as ExploreTab);
    if (params.type) {
      const next = (params.type.charAt(0).toUpperCase() + params.type.slice(1)) as CourseType;
      if (['School', 'University', 'Skills'].includes(next)) setCourseType(next);
    }
  }, [params.q, params.tab, params.type]);

  const coursesQuery = useCourses({
    q: query || undefined,
    type: courseType,
    pageSize: layout.courseColumns * 4,
  });
  const tutorsQuery = useTutors({ q: query || undefined, pageSize: 20 });
  const institutesQuery = useInstitutes({ q: query || undefined, pageSize: 20 });

  const { refreshing, onRefresh } = useRefresh(async () => {
    await Promise.all([
      coursesQuery.refetch(),
      tutorsQuery.refetch(),
      institutesQuery.refetch(),
    ]);
  });

  const segmentTabs: { id: ExploreTab; label: string }[] = [
    { id: 'courses', label: t('explore.courses') },
    { id: 'tutors', label: t('explore.tutors') },
    { id: 'institutes', label: t('explore.institutes') },
    { id: 'all', label: t('explore.all') },
  ];

  const isLoading =
    (tab !== 'tutors' && tab !== 'institutes' && coursesQuery.isLoading) ||
    (tab !== 'courses' && tab !== 'institutes' && tutorsQuery.isLoading) ||
    (tab !== 'courses' && tab !== 'tutors' && institutesQuery.isLoading);

  const isError = coursesQuery.isError || tutorsQuery.isError || institutesQuery.isError;

  const listData = useMemo(() => {
    if (tab === 'courses') {
      return (coursesQuery.data?.data ?? []).map((item) => ({ kind: 'course' as const, item }));
    }
    if (tab === 'tutors') {
      return (tutorsQuery.data?.data ?? []).map((item) => ({ kind: 'tutor' as const, item }));
    }
    if (tab === 'institutes') {
      return (institutesQuery.data?.data ?? []).map((item) => ({
        kind: 'institute' as const,
        item,
      }));
    }
    return [
      ...(coursesQuery.data?.data ?? []).map((item) => ({ kind: 'course' as const, item })),
      ...(tutorsQuery.data?.data ?? []).map((item) => ({ kind: 'tutor' as const, item })),
      ...(institutesQuery.data?.data ?? []).map((item) => ({
        kind: 'institute' as const,
        item,
      })),
    ];
  }, [tab, coursesQuery.data, tutorsQuery.data, institutesQuery.data]);

  const courseGap = spacing.md;
  const showCourseGrid = tab === 'courses';
  const columns = showCourseGrid ? layout.courseColumns : 1;

  const sectionTitle =
    tab === 'tutors'
      ? t('explore.tutors')
      : tab === 'institutes'
        ? t('explore.institutes')
        : tab === 'all'
          ? t('explore.all')
          : t('explore.courses');

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
        <View style={styles.header}>
          <Text style={styles.title}>{t('explore.title')}</Text>
        </View>

        <SearchBar
          value={query}
          onChangeText={setQuery}
          placeholder={t('home.searchPlaceholder')}
          trailingIcon="scan-outline"
          onSubmit={() => {
            coursesQuery.refetch();
            tutorsQuery.refetch();
            institutesQuery.refetch();
          }}
          onTrailingPress={() => {
            coursesQuery.refetch();
            tutorsQuery.refetch();
            institutesQuery.refetch();
          }}
        />

        <View style={styles.categoryRow}>
          {CATEGORY_CHIPS.map((chip) => {
            const selected =
              chip.id === 'institutes'
                ? tab === 'institutes'
                : courseType?.toLowerCase() === chip.id;
            return (
              <Pressable
                key={chip.id}
                style={styles.categoryItem}
                onPress={() => {
                  if (chip.id === 'institutes') {
                    setTab('institutes');
                    setCourseType(undefined);
                    return;
                  }
                  setTab('courses');
                  const next = (chip.id.charAt(0).toUpperCase() + chip.id.slice(1)) as CourseType;
                  setCourseType((prev) => (prev === next ? undefined : next));
                }}
              >
                <View style={[styles.categoryIcon, { backgroundColor: chip.soft }]}>
                  <Ionicons name={chip.icon} size={26} color={chip.tint} />
                </View>
                <Text style={[styles.categoryLabel, selected && styles.categoryLabelSelected]}>
                  {t(chip.labelKey)}
                </Text>
              </Pressable>
            );
          })}
        </View>

        <View style={styles.segments}>
          {segmentTabs.map((item) => {
            const active = tab === item.id;
            return (
              <Pressable
                key={item.id}
                onPress={() => {
                  setTab(item.id);
                  if (item.id !== 'courses') setCourseType(undefined);
                }}
                style={[styles.segment, active && styles.segmentActive]}
              >
                <Text
                  style={[styles.segmentText, active && styles.segmentTextActive]}
                  numberOfLines={1}
                >
                  {item.label}
                </Text>
              </Pressable>
            );
          })}
        </View>

        <SectionHeader title={sectionTitle} />

        {isError && !isLoading ? (
          <ErrorState
            onRetry={() => {
              coursesQuery.refetch();
              tutorsQuery.refetch();
              institutesQuery.refetch();
            }}
          />
        ) : null}

        {isLoading && !listData.length ? (
          <LoadingState />
        ) : !isError ? (
          <FlatList
            key={showCourseGrid ? `courses-${columns}` : `list-${tab}`}
            data={listData}
            keyExtractor={(row, index) => `${row.kind}-${'id' in row.item ? row.item.id : index}`}
            numColumns={columns}
            contentContainerStyle={styles.list}
            columnWrapperStyle={columns > 1 ? styles.columnWrap : undefined}
            refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} />}
            ListEmptyComponent={
              <EmptyState title={t('common.empty')} subtitle={t('home.emptyCoursesHint')} />
            }
            showsVerticalScrollIndicator={false}
            renderItem={({ item: row }) => {
              if (showCourseGrid && row.kind === 'course') {
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
              if (row.kind === 'course') {
                return (
                  <View style={styles.listItem}>
                    <CourseCard course={row.item} variant="featured" />
                  </View>
                );
              }
              if (row.kind === 'tutor') {
                return (
                  <View style={styles.listItem}>
                    <TutorCard tutor={row.item} />
                  </View>
                );
              }
              return (
                <View style={styles.listItem}>
                  <InstituteCard institute={row.item} />
                </View>
              );
            }}
          />
        ) : null}
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: colors.background },
  shell: {
    paddingTop: spacing.md,
    gap: spacing.lg,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    gap: spacing.md,
  },
  title: {
    ...typography.heading,
    color: colors.text,
    flex: 1,
    fontSize: 26,
    lineHeight: 32,
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
  segments: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
  },
  segment: {
    flex: 1,
    minHeight: 40,
    paddingHorizontal: spacing.sm,
    paddingVertical: spacing.sm,
    borderRadius: radius.lg,
    backgroundColor: colors.white,
    borderWidth: 1.5,
    borderColor: colors.border,
    alignItems: 'center',
    justifyContent: 'center',
  },
  segmentActive: {
    backgroundColor: colors.primary,
    borderColor: colors.primary,
  },
  segmentText: {
    ...typography.caption,
    color: colors.text,
    fontWeight: '700',
    fontSize: 12,
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
