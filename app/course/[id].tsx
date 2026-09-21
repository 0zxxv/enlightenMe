import { Image } from 'expo-image';
import { useLocalSearchParams, useNavigation, useRouter } from 'expo-router';
import React, { useLayoutEffect, useMemo, useState } from 'react';
import {
  Pressable,
  RefreshControl,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from 'react-native';
import { Badge } from '@/components/Badge';
import { Button } from '@/components/Button';
import { EmptyState } from '@/components/EmptyState';
import { ErrorState } from '@/components/ErrorState';
import { LoadingState } from '@/components/LoadingState';
import { PriceDisplay } from '@/components/PriceDisplay';
import { Rating } from '@/components/Rating';
import { useAddFavorite, useFavorites, useRemoveFavorite } from '@/features/favorites/hooks';
import { useAuth } from '@/features/auth/useAuth';
import { useCourse } from '@/features/courses/hooks';
import { useRefresh } from '@/hooks/useRefresh';
import { useTranslation } from '@/i18n';
import { colors, radius, shadows, spacing, typography } from '@/theme';
import { courseTitle, fullName } from '@/utils/format';

type DetailTab = 'about' | 'curriculum' | 'reviews';

const PLACEHOLDER = require('../../assets/images/dars_icon.png');

export default function CourseDetailsScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const { t, language } = useTranslation();
  const router = useRouter();
  const navigation = useNavigation();
  const { isAuthenticated } = useAuth();
  const [tab, setTab] = useState<DetailTab>('about');
  const courseQuery = useCourse(id);
  const course = courseQuery.data;
  const favoritesQuery = useFavorites();
  const addFavorite = useAddFavorite();
  const removeFavorite = useRemoveFavorite();

  const favorite = useMemo(
    () => favoritesQuery.data?.find((f) => f.courseId === id),
    [favoritesQuery.data, id],
  );

  const { refreshing, onRefresh } = useRefresh(async () => {
    await courseQuery.refetch();
  });

  useLayoutEffect(() => {
    navigation.setOptions({
      title: course ? courseTitle(course, language) : '',
      headerStyle: { backgroundColor: colors.background },
      headerTintColor: colors.primary,
    });
  }, [navigation, course, language]);

  if (courseQuery.isLoading) return <LoadingState />;
  if (courseQuery.isError || !course) {
    return <ErrorState onRetry={() => courseQuery.refetch()} />;
  }

  const tutorName = fullName(course.tutor?.firstName, course.tutor?.lastName);
  const description =
    language === 'ar' && course.descriptionAr ? course.descriptionAr : course.description;

  const onToggleFavorite = () => {
    if (!isAuthenticated) {
      router.push('/(auth)/login');
      return;
    }
    if (favorite) removeFavorite.mutate(favorite.id);
    else addFavorite.mutate({ courseId: course.id });
  };

  return (
    <View style={styles.root}>
      <ScrollView
        contentContainerStyle={styles.content}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} />}
      >
        <Image
          source={course.imageUrl ? { uri: course.imageUrl } : PLACEHOLDER}
          style={styles.hero}
          contentFit={course.imageUrl ? 'cover' : 'contain'}
        />
        <View style={styles.body}>
          <View style={styles.badges}>
            <Badge label={course.format} tone="neutral" />
            {course.courseCode ? <Badge label={course.courseCode} tone="primary" /> : null}
            {course.tutor?.tutorProfile?.verificationStatus === 'Verified' ? (
              <Badge label={t('common.verified')} tone="success" />
            ) : null}
          </View>
          <Text style={styles.title}>{courseTitle(course, language)}</Text>
          {tutorName ? (
            <Pressable onPress={() => course.tutorId && router.push(`/tutor/${course.tutorId}`)}>
              <Text style={styles.tutor}>
                {t('course.by')} {tutorName}
              </Text>
            </Pressable>
          ) : null}
          <View style={styles.metaRow}>
            <Rating value={Number(course.ratingAvg || 0)} count={course.ratingCount} />
            <PriceDisplay
              amount={course.priceDecimal}
              currency={course.currency}
              sessionCount={course.sessionCount}
            />
          </View>

          <View style={styles.stats}>
            {course.level ? (
              <View style={styles.stat}>
                <Text style={styles.statLabel}>{t('course.level')}</Text>
                <Text style={styles.statValue}>{course.level}</Text>
              </View>
            ) : null}
            <View style={styles.stat}>
              <Text style={styles.statLabel}>{t('course.sessions')}</Text>
              <Text style={styles.statValue}>{course.sessionCount}</Text>
            </View>
            <View style={styles.stat}>
              <Text style={styles.statLabel}>{t('course.capacity')}</Text>
              <Text style={styles.statValue}>{course.capacity}</Text>
            </View>
            {course.durationMinutes ? (
              <View style={styles.stat}>
                <Text style={styles.statLabel}>{t('course.duration')}</Text>
                <Text style={styles.statValue}>{course.durationMinutes}m</Text>
              </View>
            ) : null}
          </View>

          <View style={styles.tabs}>
            {(['about', 'curriculum', 'reviews'] as DetailTab[]).map((key) => (
              <Pressable
                key={key}
                onPress={() => setTab(key)}
                style={[styles.tab, tab === key && styles.tabActive]}
              >
                <Text style={[styles.tabText, tab === key && styles.tabTextActive]}>
                  {t(`course.${key}`)}
                </Text>
              </Pressable>
            ))}
          </View>

          {tab === 'about' ? <Text style={styles.paragraph}>{description}</Text> : null}

          {tab === 'curriculum' ? (
            course.curriculum?.length ? (
              course.curriculum.map((item) => (
                <View key={item.id} style={styles.curriculumItem}>
                  <Text style={styles.curriculumOrder}>{item.order}.</Text>
                  <Text style={styles.curriculumTitle}>
                    {language === 'ar' && item.titleAr ? item.titleAr : item.title}
                  </Text>
                </View>
              ))
            ) : (
              <EmptyState title={t('course.noCurriculum')} />
            )
          ) : null}

          {tab === 'reviews' ? (
            course.reviews?.length ? (
              course.reviews.map((review) => (
                <View key={review.id} style={styles.review}>
                  <Rating value={review.rating} />
                  <Text style={styles.paragraph}>{review.comment}</Text>
                  <Text style={styles.reviewer}>
                    {fullName(review.user?.firstName, review.user?.lastName)}
                  </Text>
                </View>
              ))
            ) : (
              <EmptyState title={t('course.noReviews')} />
            )
          ) : null}
        </View>
      </ScrollView>
      <View style={styles.cta}>
        <Button
          title={favorite ? t('course.unfavorite') : t('course.favorite')}
          variant="ghost"
          onPress={onToggleFavorite}
          style={{ flex: 1 }}
        />
        <Button
          title={t('common.bookNow')}
          onPress={() => router.push(`/booking/${course.id}`)}
          style={{ flex: 2 }}
        />
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1, backgroundColor: colors.background },
  content: { paddingBottom: spacing.massive },
  hero: { width: '100%', height: 220, backgroundColor: colors.lavenderSoft },
  body: { padding: spacing.xl, gap: spacing.md },
  badges: { flexDirection: 'row', flexWrap: 'wrap', gap: spacing.sm },
  title: { ...typography.heading, color: colors.text },
  tutor: { ...typography.body, color: colors.primary, fontWeight: '600' },
  metaRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
  },
  stats: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: spacing.sm,
  },
  stat: {
    backgroundColor: colors.white,
    borderRadius: radius.lg,
    paddingVertical: spacing.sm,
    paddingHorizontal: spacing.md,
    ...shadows.sm,
    minWidth: '45%',
    flexGrow: 1,
  },
  statLabel: { ...typography.caption, color: colors.textMuted },
  statValue: { ...typography.body, color: colors.text, fontWeight: '700', marginTop: 2 },
  tabs: { flexDirection: 'row', gap: spacing.sm, marginTop: spacing.sm },
  tab: {
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm,
    borderRadius: radius.full,
    backgroundColor: colors.beige,
  },
  tabActive: { backgroundColor: colors.primary },
  tabText: { ...typography.caption, color: colors.text, fontWeight: '600' },
  tabTextActive: { color: colors.white },
  paragraph: { ...typography.body, color: colors.textSecondary, lineHeight: 22 },
  curriculumItem: { flexDirection: 'row', gap: spacing.sm, marginBottom: spacing.sm },
  curriculumOrder: { ...typography.body, color: colors.primary, fontWeight: '700' },
  curriculumTitle: { ...typography.body, color: colors.text, flex: 1 },
  review: {
    backgroundColor: colors.white,
    borderRadius: radius.lg,
    padding: spacing.lg,
    gap: spacing.sm,
    marginBottom: spacing.md,
    ...shadows.sm,
  },
  reviewer: { ...typography.caption, color: colors.textMuted },
  cta: {
    flexDirection: 'row',
    gap: spacing.md,
    padding: spacing.xl,
    borderTopWidth: 1,
    borderTopColor: colors.border,
    backgroundColor: colors.backgroundElevated,
  },
});
