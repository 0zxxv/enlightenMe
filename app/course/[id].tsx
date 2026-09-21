import { Ionicons } from '@expo/vector-icons';
import { Image } from 'expo-image';
import { useLocalSearchParams, useRouter } from 'expo-router';
import React, { useMemo, useState } from 'react';
import {
  Pressable,
  RefreshControl,
  ScrollView,
  Share,
  StyleSheet,
  Text,
  View,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Avatar } from '@/components/Avatar';
import { Button } from '@/components/Button';
import { EmptyState } from '@/components/EmptyState';
import { ErrorState } from '@/components/ErrorState';
import { LoadingState } from '@/components/LoadingState';
import { Rating } from '@/components/Rating';
import { useAddFavorite, useFavorites, useRemoveFavorite } from '@/features/favorites/hooks';
import { useAuth } from '@/features/auth/useAuth';
import { useCourse } from '@/features/courses/hooks';
import { useLayout } from '@/hooks/useLayout';
import { useRefresh } from '@/hooks/useRefresh';
import { useTranslation } from '@/i18n';
import { colors, radius, shadows, spacing, typography } from '@/theme';
import { courseTitle, fullName } from '@/utils/format';
import { resolveCourseImageSource } from '@/utils/courseImages';

type DetailTab = 'about' | 'curriculum' | 'reviews';

function formatDisplayPrice(amount: number | string, currency: string) {
  const value = typeof amount === 'string' ? Number(amount) : amount;
  if (Number.isNaN(value)) return '—';
  const label = currency === 'BHD' ? 'BD' : currency;
  const rounded = Number.isInteger(value) ? String(value) : value.toFixed(1);
  return `${rounded} ${label}`;
}

function formatLabel(format: string, online: string, inPerson: string, hybrid: string) {
  if (format === 'Online') return online;
  if (format === 'InPerson') return inPerson;
  if (format === 'Hybrid') return hybrid;
  return format;
}

function withCount(template: string, count: number) {
  return template.replace('{{count}}', String(count));
}

export default function CourseDetailsScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const { t, language } = useTranslation();
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const layout = useLayout();
  const { isAuthenticated } = useAuth();
  const [tab, setTab] = useState<DetailTab>('curriculum');
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

  if (courseQuery.isLoading) return <LoadingState />;
  if (courseQuery.isError || !course) {
    return <ErrorState onRetry={() => courseQuery.refetch()} />;
  }

  const tutorName = fullName(course.tutor?.firstName, course.tutor?.lastName);
  const description =
    language === 'ar' && course.descriptionAr ? course.descriptionAr : course.description;
  const { source: imageSource, isLocal } = resolveCourseImageSource(course);
  const isVerified = course.tutor?.tutorProfile?.verificationStatus === 'Verified';
  const heroHeight = layout.isDesktop ? 320 : layout.isTablet ? 280 : 240;

  const onToggleFavorite = () => {
    if (!isAuthenticated) {
      router.push('/(auth)/login');
      return;
    }
    if (favorite) removeFavorite.mutate(favorite.id);
    else addFavorite.mutate({ courseId: course.id });
  };

  const onShare = async () => {
    try {
      await Share.share({
        message: `${courseTitle(course, language)} — ${t('brand.name')}`,
      });
    } catch {
      // user cancelled
    }
  };

  const stats = [
    {
      key: 'level',
      icon: 'trending-up' as const,
      label: course.level || '—',
    },
    {
      key: 'sessions',
      icon: 'calendar-outline' as const,
      label: withCount(t('course.sessionsCount'), course.sessionCount),
    },
    {
      key: 'format',
      icon: 'desktop-outline' as const,
      label: formatLabel(
        course.format,
        t('common.online'),
        t('common.inPerson'),
        t('common.hybrid'),
      ),
    },
    {
      key: 'capacity',
      icon: 'people-outline' as const,
      label: withCount(t('course.maxStudents'), course.capacity),
    },
  ];

  return (
    <View style={styles.root}>
      <ScrollView
        contentContainerStyle={styles.content}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} />}
        showsVerticalScrollIndicator={false}
      >
        <View style={[styles.heroWrap, { height: heroHeight }]}>
          <Image
            source={imageSource}
            style={styles.hero}
            contentFit={isLocal || course.imageUrl ? 'cover' : 'contain'}
          />
          <View style={[styles.heroActions, { paddingTop: insets.top + spacing.sm }]}>
            <Pressable
              style={styles.heroBtn}
              onPress={() => router.back()}
              hitSlop={8}
              accessibilityRole="button"
              accessibilityLabel={t('common.back')}
            >
              <Ionicons
                name={language === 'ar' ? 'chevron-forward' : 'chevron-back'}
                size={22}
                color={colors.white}
              />
            </Pressable>
            <View style={styles.heroRight}>
              <Pressable
                style={styles.heroBtn}
                onPress={onToggleFavorite}
                hitSlop={8}
                accessibilityRole="button"
                accessibilityLabel={favorite ? t('course.unfavorite') : t('course.favorite')}
              >
                <Ionicons
                  name={favorite ? 'heart' : 'heart-outline'}
                  size={20}
                  color={favorite ? colors.error : colors.white}
                />
              </Pressable>
              <Pressable
                style={styles.heroBtn}
                onPress={onShare}
                hitSlop={8}
                accessibilityRole="button"
                accessibilityLabel={t('course.share')}
              >
                <Ionicons name="share-outline" size={20} color={colors.white} />
              </Pressable>
            </View>
          </View>
        </View>

        <View
          style={[
            styles.sheet,
            {
              paddingHorizontal: layout.contentPadding,
              maxWidth: layout.contentMaxWidth ?? '100%',
              alignSelf: 'center',
              width: '100%',
            },
          ]}
        >
          <Text style={styles.title}>{courseTitle(course, language)}</Text>
          <Text style={styles.description} numberOfLines={3}>
            {description}
          </Text>

          {tutorName ? (
            <Pressable
              style={styles.tutorRow}
              onPress={() => course.tutorId && router.push(`/tutor/${course.tutorId}`)}
            >
              <Avatar name={tutorName} size={48} />
              <View style={styles.tutorMeta}>
                <View style={styles.tutorNameRow}>
                  <Text style={styles.tutorName}>{tutorName}</Text>
                  {isVerified ? (
                    <View style={styles.verifiedPill}>
                      <Ionicons name="checkmark-circle" size={14} color={colors.primary} />
                      <Text style={styles.verifiedText}>{t('course.verifiedTutor')}</Text>
                    </View>
                  ) : null}
                </View>
                <View style={styles.ratingRow}>
                  <Ionicons name="star" size={14} color={colors.star} />
                  <Text style={styles.ratingText}>
                    {Number(course.ratingAvg || 0).toFixed(1)}
                    {course.ratingCount ? (
                      <Text style={styles.ratingCount}> ({course.ratingCount})</Text>
                    ) : null}
                  </Text>
                </View>
              </View>
            </Pressable>
          ) : null}

          <View style={styles.statsBox}>
            {stats.map((stat, index) => (
              <React.Fragment key={stat.key}>
                {index > 0 ? <View style={styles.statDivider} /> : null}
                <View style={styles.statItem}>
                  <Ionicons name={stat.icon} size={18} color={colors.primary} />
                  <Text style={styles.statLabel} numberOfLines={2}>
                    {stat.label}
                  </Text>
                </View>
              </React.Fragment>
            ))}
          </View>

          <View style={styles.bookRow}>
            <Text style={styles.price}>
              {formatDisplayPrice(course.priceDecimal, course.currency)}
            </Text>
            <Button
              title={t('common.bookNow')}
              onPress={() => router.push(`/booking/${course.id}`)}
              style={styles.bookBtn}
            />
          </View>

          <View style={styles.tabs}>
            {(['about', 'curriculum', 'reviews'] as DetailTab[]).map((key) => (
              <Pressable key={key} onPress={() => setTab(key)} style={styles.tab}>
                <Text style={[styles.tabText, tab === key && styles.tabTextActive]}>
                  {t(`course.${key}`)}
                </Text>
                {tab === key ? <View style={styles.tabUnderline} /> : null}
              </Pressable>
            ))}
          </View>
          <View style={styles.tabsRule} />

          {tab === 'about' ? <Text style={styles.paragraph}>{description}</Text> : null}

          {tab === 'curriculum' ? (
            course.curriculum?.length ? (
              <View style={styles.curriculumList}>
                {course.curriculum.map((item) => (
                  <View key={item.id} style={styles.curriculumItem}>
                    <View style={styles.curriculumBadge}>
                      <Text style={styles.curriculumOrder}>{item.order}</Text>
                    </View>
                    <Text style={styles.curriculumTitle}>
                      {language === 'ar' && item.titleAr ? item.titleAr : item.title}
                    </Text>
                  </View>
                ))}
              </View>
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
    </View>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1, backgroundColor: colors.background },
  content: { paddingBottom: spacing.massive },
  heroWrap: {
    width: '100%',
    backgroundColor: colors.lavenderSoft,
    position: 'relative',
  },
  hero: {
    ...StyleSheet.absoluteFill,
    width: '100%',
    height: '100%',
  },
  heroActions: {
    position: 'absolute',
    left: 0,
    right: 0,
    top: 0,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: spacing.lg,
  },
  heroRight: {
    flexDirection: 'row',
    gap: spacing.sm,
  },
  heroBtn: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: 'rgba(28, 24, 48, 0.45)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  sheet: {
    marginTop: -radius.xxl,
    backgroundColor: colors.white,
    borderTopLeftRadius: radius.xxl,
    borderTopRightRadius: radius.xxl,
    paddingTop: spacing.xl,
    paddingBottom: spacing.xxl,
    gap: spacing.md,
    minHeight: 420,
    ...shadows.sm,
  },
  title: {
    ...typography.heading,
    color: colors.primary,
    fontSize: 24,
    lineHeight: 30,
  },
  description: {
    ...typography.body,
    color: colors.textSecondary,
    lineHeight: 22,
  },
  tutorRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.md,
    marginTop: spacing.xs,
  },
  tutorMeta: {
    flex: 1,
    gap: 4,
  },
  tutorNameRow: {
    flexDirection: 'row',
    alignItems: 'center',
    flexWrap: 'wrap',
    gap: spacing.sm,
  },
  tutorName: {
    ...typography.subheading,
    color: colors.text,
    fontSize: 16,
  },
  verifiedPill: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    backgroundColor: colors.lavenderSoft,
    paddingHorizontal: spacing.sm,
    paddingVertical: 3,
    borderRadius: radius.full,
  },
  verifiedText: {
    ...typography.caption,
    color: colors.primary,
    fontWeight: '600',
    fontSize: 11,
  },
  ratingRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  ratingText: {
    ...typography.caption,
    color: colors.textSecondary,
    fontWeight: '600',
  },
  ratingCount: {
    color: colors.textMuted,
    fontWeight: '500',
  },
  statsBox: {
    flexDirection: 'row',
    alignItems: 'stretch',
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: radius.lg,
    backgroundColor: colors.backgroundElevated,
    paddingVertical: spacing.md,
    marginTop: spacing.xs,
  },
  statItem: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
    paddingHorizontal: 4,
  },
  statDivider: {
    width: 1,
    backgroundColor: colors.border,
    alignSelf: 'stretch',
  },
  statLabel: {
    ...typography.caption,
    color: colors.text,
    fontWeight: '600',
    textAlign: 'center',
    fontSize: 11,
    lineHeight: 14,
  },
  bookRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: spacing.lg,
    marginTop: spacing.sm,
  },
  price: {
    ...typography.heading,
    color: colors.primary,
    fontSize: 28,
    lineHeight: 34,
    fontWeight: '800',
  },
  bookBtn: {
    flex: 1,
    maxWidth: 200,
  },
  tabs: {
    flexDirection: 'row',
    gap: spacing.xl,
    marginTop: spacing.md,
  },
  tab: {
    paddingBottom: spacing.sm,
    position: 'relative',
  },
  tabText: {
    ...typography.body,
    color: colors.textMuted,
    fontWeight: '600',
  },
  tabTextActive: {
    color: colors.primary,
    fontWeight: '800',
  },
  tabUnderline: {
    position: 'absolute',
    left: 0,
    right: 0,
    bottom: 0,
    height: 3,
    borderRadius: 2,
    backgroundColor: colors.primary,
  },
  tabsRule: {
    height: StyleSheet.hairlineWidth,
    backgroundColor: colors.border,
    marginTop: -spacing.md,
  },
  paragraph: {
    ...typography.body,
    color: colors.textSecondary,
    lineHeight: 22,
  },
  curriculumList: {
    gap: spacing.sm,
  },
  curriculumItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.md,
    backgroundColor: '#F3F1F6',
    borderRadius: radius.md,
    paddingVertical: spacing.md,
    paddingHorizontal: spacing.md,
  },
  curriculumBadge: {
    width: 28,
    height: 28,
    borderRadius: 14,
    backgroundColor: colors.lavenderSoft,
    alignItems: 'center',
    justifyContent: 'center',
  },
  curriculumOrder: {
    ...typography.caption,
    color: colors.primary,
    fontWeight: '800',
  },
  curriculumTitle: {
    ...typography.body,
    color: colors.text,
    flex: 1,
    fontWeight: '600',
  },
  review: {
    backgroundColor: colors.background,
    borderRadius: radius.lg,
    padding: spacing.lg,
    gap: spacing.sm,
    marginBottom: spacing.md,
  },
  reviewer: { ...typography.caption, color: colors.textMuted },
});
