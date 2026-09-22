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

type ResultTab = 'services' | 'providers';

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

  const providerRows = useMemo(() => {
    const rows: Array<
      { kind: 'tutor'; item: Tutor } | { kind: 'institute'; item: Institute }
    > = [];
    const showTeachers =
      !serviceType ||
      allowedProviders.includes('Teacher') ||
      allowedProviders.includes('Trainer');
    const showInstitutes = !serviceType || allowedProviders.includes('Institute');

    if (providerType === 'all' || providerType === 'Teacher' || providerType === 'Trainer') {
      if (showTeachers) {
        tutors.forEach((item) => {
          const pt = item.tutorProfile?.providerType;
          if (providerType === 'all' || pt === providerType || (!pt && providerType === 'Teacher')) {
            rows.push({ kind: 'tutor', item });
          }
        });
      }
    }
    if ((providerType === 'all' || providerType === 'Institute') && showInstitutes) {
      institutes.forEach((item) => rows.push({ kind: 'institute', item }));
    }
    return rows;
  }, [tutors, institutes, providerType, serviceType, allowedProviders]);

  const courseGap = spacing.md;
  const columns = layout.courseColumns;
  const writing = {
    textAlign: (isRTL ? 'right' : 'left') as 'left' | 'right',
    writingDirection: (isRTL ? 'rtl' : 'ltr') as 'rtl' | 'ltr',
  };

  const refetchAll = () => {
    coursesQuery.refetch();
    tutorsQuery.refetch();
    institutesQuery.refetch();
  };

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
            <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.providerChips}>
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

        <View style={styles.segments}>
          {(
            [
              { id: 'services' as const, label: t('marketplace.services') },
              { id: 'providers' as const, label: t('marketplace.providers') },
            ] as const
          ).map((item) => {
            const active = resultTab === item.id;
            return (
              <Pressable
                key={item.id}
                onPress={() => setResultTab(item.id)}
                style={[styles.segment, active && styles.segmentActive]}
              >
                <Text style={[styles.segmentText, active && styles.segmentTextActive]}>
                  {item.label}
                </Text>
              </Pressable>
            );
          })}
        </View>

        {isError && !isLoading ? <ErrorState onRetry={refetchAll} /> : null}
        {isLoading ? <LoadingState /> : null}

        {!isLoading && !isError && resultTab === 'services' ? (
          <>
            <SectionHeader title={t('marketplace.services')} />
            <FlatList
              key={`services-${columns}-${serviceType ?? 'all'}-${providerType}`}
              data={courses}
              keyExtractor={(item) => item.id}
              numColumns={columns}
              contentContainerStyle={styles.list}
              columnWrapperStyle={columns > 1 ? styles.columnWrap : undefined}
              refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} />}
              ListEmptyComponent={
                <EmptyState title={t('common.empty')} subtitle={t('home.emptyCoursesHint')} />
              }
              showsVerticalScrollIndicator={false}
              renderItem={({ item }) => (
                <View
                  style={{
                    width: `${100 / columns}%` as `${number}%`,
                    paddingHorizontal: courseGap / 2,
                    marginBottom: courseGap,
                  }}
                >
                  <CourseCard course={item} variant="featured" />
                </View>
              )}
            />
          </>
        ) : null}

        {!isLoading && !isError && resultTab === 'providers' ? (
          <>
            <SectionHeader title={t('marketplace.serviceProviders')} />
            <FlatList
              data={providerRows}
              keyExtractor={(row) => `${row.kind}-${row.item.id}`}
              contentContainerStyle={styles.list}
              refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} />}
              ListEmptyComponent={<EmptyState title={t('common.empty')} />}
              showsVerticalScrollIndicator={false}
              renderItem={({ item: row }) =>
                row.kind === 'tutor' ? (
                  <View style={styles.listItem}>
                    <TutorCard tutor={row.item} />
                  </View>
                ) : (
                  <View style={styles.listItem}>
                    <InstituteCard institute={row.item} />
                  </View>
                )
              }
            />
          </>
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
    gap: spacing.sm,
  },
  columnWrap: {
    marginHorizontal: -spacing.md / 2,
  },
  listItem: {
    marginBottom: spacing.md,
    width: '100%',
  },
});
