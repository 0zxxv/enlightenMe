import { useLocalSearchParams } from 'expo-router';
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
import { CourseCard } from '@/components/CourseCard';
import { EmptyState } from '@/components/EmptyState';
import { ErrorState } from '@/components/ErrorState';
import { InstituteCard } from '@/components/InstituteCard';
import { LoadingState } from '@/components/LoadingState';
import { SearchBar } from '@/components/SearchBar';
import { TutorCard } from '@/components/TutorCard';
import { useCourses } from '@/features/courses/hooks';
import { useInstitutes } from '@/features/institutes/hooks';
import { useTutors } from '@/features/tutors/hooks';
import { useRefresh } from '@/hooks/useRefresh';
import { useTranslation } from '@/i18n';
import { colors, radius, spacing, typography } from '@/theme';
import type { CourseType } from '@/types/models';

type ExploreTab = 'all' | 'courses' | 'tutors' | 'institutes';

export default function ExploreScreen() {
  const { t } = useTranslation();
  const params = useLocalSearchParams<{ q?: string; tab?: string }>();
  const initialTab = (params.tab as ExploreTab) || 'all';
  const [tab, setTab] = useState<ExploreTab>(initialTab);
  const [query, setQuery] = useState(params.q ?? '');
  const [courseType, setCourseType] = useState<CourseType | undefined>();

  const coursesQuery = useCourses({
    q: query || undefined,
    type: courseType,
    pageSize: 20,
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

  const tabs: { id: ExploreTab; label: string }[] = [
    { id: 'all', label: t('explore.all') },
    { id: 'courses', label: t('explore.courses') },
    { id: 'tutors', label: t('explore.tutors') },
    { id: 'institutes', label: t('explore.institutes') },
  ];

  const typeFilters: { id?: CourseType; label: string }[] = [
    { id: undefined, label: t('explore.all') },
    { id: 'School', label: t('home.school') },
    { id: 'University', label: t('home.university') },
    { id: 'Skills', label: t('home.skills') },
  ];

  const isLoading =
    (tab !== 'tutors' && tab !== 'institutes' && coursesQuery.isLoading) ||
    (tab !== 'courses' && tab !== 'institutes' && tutorsQuery.isLoading) ||
    (tab !== 'courses' && tab !== 'tutors' && institutesQuery.isLoading);

  const isError =
    coursesQuery.isError || tutorsQuery.isError || institutesQuery.isError;

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

  return (
    <SafeAreaView style={styles.safe} edges={['top']}>
      <View style={styles.header}>
        <Text style={styles.title}>{t('explore.title')}</Text>
        <SearchBar
          value={query}
          onChangeText={setQuery}
          placeholder={t('home.searchPlaceholder')}
        />
        <View style={styles.tabs}>
          {tabs.map((item) => (
            <Pressable
              key={item.id}
              onPress={() => setTab(item.id)}
              style={[styles.tab, tab === item.id && styles.tabActive]}
            >
              <Text style={[styles.tabText, tab === item.id && styles.tabTextActive]}>
                {item.label}
              </Text>
            </Pressable>
          ))}
        </View>
        {(tab === 'all' || tab === 'courses') && (
          <View style={styles.filters}>
            {typeFilters.map((item) => (
              <Pressable
                key={item.label}
                onPress={() => setCourseType(item.id)}
                style={[styles.filter, courseType === item.id && styles.tabActive]}
              >
                <Text
                  style={[styles.filterText, courseType === item.id && styles.tabTextActive]}
                >
                  {item.label}
                </Text>
              </Pressable>
            ))}
          </View>
        )}
      </View>

      {isLoading ? <LoadingState /> : null}
      {isError && !isLoading ? (
        <ErrorState
          onRetry={() => {
            coursesQuery.refetch();
            tutorsQuery.refetch();
            institutesQuery.refetch();
          }}
        />
      ) : null}

      {!isLoading && !isError ? (
        <FlatList
          data={listData}
          keyExtractor={(row, index) => `${row.kind}-${('id' in row.item ? row.item.id : index)}`}
          contentContainerStyle={styles.list}
          refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} />}
          ListEmptyComponent={<EmptyState />}
          renderItem={({ item: row }) => {
            if (row.kind === 'course') return <CourseCard course={row.item} />;
            if (row.kind === 'tutor') return <TutorCard tutor={row.item} />;
            return <InstituteCard institute={row.item} />;
          }}
        />
      ) : null}
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: colors.background },
  header: { padding: spacing.xl, gap: spacing.md },
  title: { ...typography.heading, color: colors.text },
  tabs: { flexDirection: 'row', flexWrap: 'wrap', gap: spacing.sm },
  tab: {
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm,
    borderRadius: radius.full,
    backgroundColor: colors.beige,
  },
  tabActive: { backgroundColor: colors.primary },
  tabText: { ...typography.caption, color: colors.text, fontWeight: '600' },
  tabTextActive: { color: colors.white },
  filters: { flexDirection: 'row', flexWrap: 'wrap', gap: spacing.sm },
  filter: {
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.xs,
    borderRadius: radius.md,
    borderWidth: 1,
    borderColor: colors.border,
    backgroundColor: colors.white,
  },
  filterText: { ...typography.caption, color: colors.textSecondary },
  list: { paddingHorizontal: spacing.xl, paddingBottom: spacing.massive },
});
