import { Ionicons } from '@expo/vector-icons';
import { Image } from 'expo-image';
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
import { CourseCard } from '@/components/CourseCard';
import { EmptyState } from '@/components/EmptyState';
import { ErrorState } from '@/components/ErrorState';
import { IconButton } from '@/components/IconButton';
import { LoadingState } from '@/components/LoadingState';
import { SearchBar } from '@/components/SearchBar';
import { SectionHeader } from '@/components/SectionHeader';
import { POPULAR_SUBJECTS, SERVICE_CATEGORY_CHIPS } from '@/constants/catalog';
import { useAuth } from '@/features/auth/useAuth';
import { useCourses } from '@/features/courses/hooks';
import { useLayout } from '@/hooks/useLayout';
import { useRefresh } from '@/hooks/useRefresh';
import { useTranslation } from '@/i18n';
import { colors, radius, shadows, spacing, typography } from '@/theme';
import { greetingKey } from '@/utils/format';

export default function HomeScreen() {
  const { t, language, isRTL } = useTranslation();
  const { user } = useAuth();
  const router = useRouter();
  const layout = useLayout();
  const [query, setQuery] = useState('');

  const coursesQuery = useCourses({ pageSize: layout.courseColumns * 2 });

  const { refreshing, onRefresh } = useRefresh(async () => {
    await coursesQuery.refetch();
  });

  const greeting = t(greetingKey());
  const firstName = user?.firstName ?? t('brand.name');
  const rowDir = isRTL ? ('row-reverse' as const) : ('row' as const);

  const isLarge = layout.isTablet || layout.isDesktop;

  const phoneSubjects = useMemo(() => {
    const count = layout.subjectColumns;
    return POPULAR_SUBJECTS.slice(0, Math.max(4, count));
  }, [layout.subjectColumns]);

  const onSearch = () => {
    router.push({ pathname: '/(tabs)/explore', params: { q: query } });
  };

  const courseGap = spacing.md;
  const courseWidthPct = `${100 / layout.courseColumns}%` as `${number}%`;

  const openSubject = (subject: (typeof POPULAR_SUBJECTS)[number]) => {
    router.push({
      pathname: '/(tabs)/explore',
      params: { q: language === 'ar' ? subject.ar : subject.en },
    });
  };
  return (
    <SafeAreaView style={styles.safe} edges={['top']}>
      <ScrollView
        contentContainerStyle={[
          styles.content,
          {
            paddingHorizontal: layout.contentPadding,
            paddingBottom: spacing.massive,
            maxWidth: layout.contentMaxWidth ?? '100%',
            alignSelf: 'center',
            width: '100%',
          },
        ]}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} />}
        showsVerticalScrollIndicator={false}
      >
        <View style={[styles.header, { flexDirection: rowDir }]}>
          <Text
            style={[
              styles.greetingLine,
              { textAlign: isRTL ? 'right' : 'left', writingDirection: isRTL ? 'rtl' : 'ltr' },
            ]}
            numberOfLines={2}
          >
            {greeting}, <Text style={styles.greetingName}>{firstName}</Text>{' '}
            <Text style={styles.wave}>👋</Text>
          </Text>
          <IconButton name="notifications-outline" onPress={() => router.push('/notifications')} />
        </View>

        <SearchBar
          value={query}
          onChangeText={setQuery}
          placeholder={t('home.searchPlaceholder')}
          onSubmit={onSearch}
          trailingIcon="scan-outline"
          onTrailingPress={onSearch}
        />

        <SectionHeader title={t('home.whatToLearn')} />
        <View style={[styles.categoryRow, { flexDirection: rowDir }]}>
          {SERVICE_CATEGORY_CHIPS.map((chip) => (
            <Pressable
              key={chip.id}
              style={styles.categoryItem}
              onPress={() => {
                router.push({
                  pathname: '/(tabs)/explore',
                  params: { serviceType: chip.id, result: 'services' },
                });
              }}
            >
              <View style={[styles.categoryIcon, { backgroundColor: chip.soft }]}>
                <Ionicons name={chip.icon} size={26} color={chip.tint} />
              </View>
              <Text style={styles.categoryLabel}>{t(chip.labelKey)}</Text>
            </Pressable>
          ))}
        </View>

        {!isLarge ? (
          <>
            <Pressable
              style={styles.promoWrap}
              onPress={() => router.push('/(tabs)/explore')}
            >
              <Image
                source={require('../../assets/images/bg2.png')}
                style={styles.promoBg}
                contentFit="cover"
              />
              <View style={[styles.promo, { flexDirection: rowDir }]}>
                <View style={styles.promoCopy}>
                  <Text
                    style={[
                      styles.promoTitle,
                      {
                        textAlign: isRTL ? 'right' : 'left',
                        writingDirection: isRTL ? 'rtl' : 'ltr',
                      },
                    ]}
                  >
                    {t('home.promoTitle')}
                  </Text>
                  <Text
                    style={[
                      styles.promoSubtitle,
                      {
                        textAlign: isRTL ? 'right' : 'left',
                        writingDirection: isRTL ? 'rtl' : 'ltr',
                      },
                    ]}
                  >
                    {t('home.promoSubtitle')}
                  </Text>
                </View>
                <View style={styles.promoArrow}>
                  <Ionicons
                    name={isRTL ? 'arrow-back' : 'arrow-forward'}
                    size={20}
                    color={colors.primary}
                  />
                </View>
              </View>
            </Pressable>

            <SectionHeader
              title={t('home.popularSubjects')}
              actionLabel={t('common.seeAll')}
              onAction={() => router.push('/subjects')}
            />
            <View style={[styles.subjectGrid, { flexDirection: rowDir }]}>
              {phoneSubjects.map((subject) => (
                <Pressable
                  key={subject.id}
                  style={[
                    styles.subjectItemGrid,
                    {
                      width: `${100 / Math.min(layout.subjectColumns, phoneSubjects.length)}%`,
                    },
                  ]}
                  onPress={() => openSubject(subject)}
                >
                  <View style={[styles.subjectIcon, { backgroundColor: subject.soft }]}>
                    <Ionicons name={subject.icon} size={22} color={subject.tint} />
                  </View>
                  <Text style={styles.subjectLabel} numberOfLines={1}>
                    {language === 'ar' ? subject.ar : subject.en}
                  </Text>
                </Pressable>
              ))}
            </View>
          </>
        ) : (
          <View style={styles.subjectsBlock}>
            <SectionHeader
              title={t('home.popularSubjects')}
              actionLabel={t('common.seeAll')}
              onAction={() => router.push('/subjects')}
            />
            <ScrollView
              horizontal
              showsHorizontalScrollIndicator={false}
              contentContainerStyle={[styles.subjectStrip, { flexDirection: rowDir }]}
            >
              {POPULAR_SUBJECTS.map((subject) => (
                <Pressable
                  key={subject.id}
                  style={styles.subjectItemStrip}
                  onPress={() => openSubject(subject)}
                >
                  <View style={[styles.subjectIcon, { backgroundColor: subject.soft }]}>
                    <Ionicons name={subject.icon} size={22} color={subject.tint} />
                  </View>
                  <Text style={styles.subjectLabel} numberOfLines={1}>
                    {language === 'ar' ? subject.ar : subject.en}
                  </Text>
                </Pressable>
              ))}
            </ScrollView>
          </View>
        )}

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
          <EmptyState
            title={t('common.empty')}
            subtitle={t('home.emptyCoursesHint')}
            actionLabel={t('tabs.explore')}
            onAction={() => router.push('/(tabs)/explore')}
          />
        ) : null}

        <View style={[styles.courseGrid, { marginHorizontal: -courseGap / 2 }]}>
          {coursesQuery.data?.data.map((course) => (
            <View
              key={course.id}
              style={{
                width: courseWidthPct,
                paddingHorizontal: courseGap / 2,
                marginBottom: courseGap,
              }}
            >
              <CourseCard course={course} variant="featured" />
            </View>
          ))}
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: colors.background },
  content: {
    gap: spacing.lg,
    paddingTop: spacing.md,
  },
  header: {
    alignItems: 'center',
    gap: spacing.md,
  },
  greetingLine: {
    ...typography.heading,
    color: colors.text,
    flex: 1,
    fontSize: 26,
    lineHeight: 32,
  },
  greetingName: {
    fontWeight: '800',
    color: colors.text,
  },
  wave: {
    fontSize: 24,
  },
  categoryRow: {
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
  promoWrap: {
    borderRadius: radius.xxl,
    overflow: 'hidden',
    ...shadows.sm,
    position: 'relative',
    width: '100%',
    aspectRatio: 2.35,
  },
  subjectsBlock: {
    gap: spacing.sm,
  },
  subjectStrip: {
    gap: spacing.md,
    paddingVertical: spacing.xs,
  },
  subjectGrid: {
    flexWrap: 'wrap',
  },
  promoBg: {
    ...StyleSheet.absoluteFill,
    width: '100%',
    height: '100%',
  },
  promo: {
    ...StyleSheet.absoluteFill,
    paddingHorizontal: spacing.xl,
    paddingVertical: spacing.lg,
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: spacing.lg,
    backgroundColor: 'rgba(247, 243, 238, 0.22)',
  },
  promoCopy: {
    flex: 1,
    gap: spacing.sm,
  },
  promoTitle: {
    ...typography.heading,
    color: colors.primary,
    fontSize: 22,
  },
  promoSubtitle: {
    ...typography.body,
    color: colors.primaryMuted,
    maxWidth: 280,
  },
  promoArrow: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: colors.white,
    alignItems: 'center',
    justifyContent: 'center',
    ...shadows.sm,
  },
  subjectItemGrid: {
    alignItems: 'center',
    gap: spacing.sm,
    paddingVertical: spacing.sm,
    paddingHorizontal: 4,
  },
  subjectItemStrip: {
    alignItems: 'center',
    gap: spacing.sm,
    paddingVertical: spacing.sm,
    paddingHorizontal: 4,
    width: 76,
  },
  subjectIcon: {
    width: 56,
    height: 56,
    borderRadius: 16,
    alignItems: 'center',
    justifyContent: 'center',
  },
  subjectLabel: {
    ...typography.caption,
    color: colors.text,
    fontWeight: '600',
    fontSize: 11,
    textAlign: 'center',
  },
  courseGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
  },
});
