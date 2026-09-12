import { useRouter } from 'expo-router';
import React, { useMemo, useState } from 'react';
import {
  Pressable,
  RefreshControl,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Chip } from '@/components/Chip';
import { CourseCard } from '@/components/CourseCard';
import { EmptyState } from '@/components/EmptyState';
import { ErrorState } from '@/components/ErrorState';
import { IconButton } from '@/components/IconButton';
import { LoadingState } from '@/components/LoadingState';
import { SearchBar } from '@/components/SearchBar';
import { SectionHeader } from '@/components/SectionHeader';
import { CATEGORY_CHIPS, POPULAR_SUBJECTS } from '@/constants/catalog';
import { useAuth } from '@/features/auth/useAuth';
import { useCourses } from '@/features/courses/hooks';
import { useRefresh } from '@/hooks/useRefresh';
import { useTranslation } from '@/i18n';
import { colors, radius, shadows, spacing, typography } from '@/theme';
import { greetingKey } from '@/utils/format';

export default function HomeScreen() {
  const { t, language } = useTranslation();
  const { user } = useAuth();
  const router = useRouter();
  const [query, setQuery] = useState('');
  const [courseType, setCourseType] = useState<'School' | 'University' | 'Skills' | undefined>();

  const coursesQuery = useCourses({
    pageSize: 6,
    type: courseType,
    q: query || undefined,
  });

  const { refreshing, onRefresh } = useRefresh(async () => {
    await coursesQuery.refetch();
  });

  const greeting = t(greetingKey());

  const subjects = useMemo(
    () => POPULAR_SUBJECTS.map((s) => (language === 'ar' ? s.ar : s.en)),
    [language],
  );

  return (
    <SafeAreaView style={styles.safe} edges={['top']}>
      <ScrollView
        contentContainerStyle={styles.content}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} />}
      >
        <View style={styles.header}>
          <View>
            <Text style={styles.greeting}>{greeting}</Text>
            <Text style={styles.name}>{user?.firstName ?? t('brand.name')}</Text>
          </View>
          <IconButton name="notifications-outline" onPress={() => undefined} />
        </View>

        <SearchBar
          value={query}
          onChangeText={setQuery}
          placeholder={t('home.searchPlaceholder')}
          onSubmit={() => router.push({ pathname: '/(tabs)/explore', params: { q: query } })}
        />

        <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.chips}>
          {CATEGORY_CHIPS.map((chip) => (
            <Chip
              key={chip.id}
              label={t(chip.labelKey)}
              selected={courseType?.toLowerCase() === chip.id}
              onPress={() => {
                if (chip.id === 'institutes') {
                  router.push({ pathname: '/(tabs)/explore', params: { tab: 'institutes' } });
                  return;
                }
                const next = (chip.id.charAt(0).toUpperCase() + chip.id.slice(1)) as
                  | 'School'
                  | 'University'
                  | 'Skills';
                setCourseType((prev) => (prev === next ? undefined : next));
              }}
            />
          ))}
        </ScrollView>

        <Pressable style={styles.promo} onPress={() => router.push('/(tabs)/explore')}>
          <Text style={styles.promoTitle}>{t('home.promoTitle')}</Text>
          <Text style={styles.promoSubtitle}>{t('home.promoSubtitle')}</Text>
        </Pressable>

        <SectionHeader title={t('home.popularSubjects')} />
        <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.chips}>
          {subjects.map((subject) => (
            <Chip
              key={subject}
              label={subject}
              onPress={() => {
                setQuery(subject);
                router.push({ pathname: '/(tabs)/explore', params: { q: subject } });
              }}
            />
          ))}
        </ScrollView>

        <SectionHeader
          title={t('home.featuredCourses')}
          actionLabel={t('common.seeAll')}
          onAction={() => router.push('/(tabs)/explore')}
        />

        {coursesQuery.isLoading ? <LoadingState /> : null}
        {coursesQuery.isError ? (
          <ErrorState onRetry={() => coursesQuery.refetch()} />
        ) : null}
        {!coursesQuery.isLoading && !coursesQuery.isError && !coursesQuery.data?.data.length ? (
          <EmptyState />
        ) : null}
        {coursesQuery.data?.data.map((course) => (
          <CourseCard key={course.id} course={course} />
        ))}
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: colors.background },
  content: { padding: spacing.xl, gap: spacing.lg, paddingBottom: spacing.massive },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  greeting: { ...typography.caption, color: colors.textSecondary },
  name: { ...typography.heading, color: colors.text },
  chips: { gap: spacing.sm, paddingVertical: spacing.xs },
  promo: {
    backgroundColor: colors.primary,
    borderRadius: radius.xl,
    padding: spacing.xxl,
    ...shadows.md,
  },
  promoTitle: { ...typography.heading, color: colors.white, marginBottom: spacing.sm },
  promoSubtitle: { ...typography.body, color: colors.lavender },
});
