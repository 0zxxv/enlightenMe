import { Ionicons } from '@expo/vector-icons';
import { Image } from 'expo-image';
import { useRouter } from 'expo-router';
import React, { useMemo } from 'react';
import { Pressable, StyleSheet, Text, View, type ViewStyle } from 'react-native';
import { Avatar } from '@/components/Avatar';
import { useAddFavorite, useFavorites, useRemoveFavorite } from '@/features/favorites/hooks';
import { useAuth } from '@/features/auth/useAuth';
import { useTranslation } from '@/i18n';
import { colors, radius, shadows, spacing, typography } from '@/theme';
import type { Course } from '@/types/models';
import { courseTitle, formatPrice, fullName } from '@/utils/format';
import { resolveCourseImageSource } from '@/utils/courseImages';

type Props = {
  course: Course;
  showFavorite?: boolean;
  /** Compact marketplace tile matching the student home reference. */
  variant?: 'default' | 'featured';
  style?: ViewStyle;
};

export function CourseCard({
  course,
  showFavorite = true,
  variant = 'default',
  style,
}: Props) {
  const router = useRouter();
  const { t, language, isRTL } = useTranslation();
  const { isAuthenticated } = useAuth();
  const favoritesQuery = useFavorites();
  const addFavorite = useAddFavorite();
  const removeFavorite = useRemoveFavorite();

  const tutorName = fullName(course.tutor?.firstName, course.tutor?.lastName);
  const favorite = useMemo(
    () => favoritesQuery.data?.find((f) => f.courseId === course.id),
    [favoritesQuery.data, course.id],
  );
  const isFav = Boolean(favorite);
  const featured = variant === 'featured';
  const { source: imageSource, isLocal } = resolveCourseImageSource(course);

  const onToggleFavorite = () => {
    if (!isAuthenticated) {
      router.push('/(auth)/login');
      return;
    }
    if (isFav && favorite) {
      removeFavorite.mutate(favorite.id);
    } else {
      addFavorite.mutate({ courseId: course.id });
    }
  };

  return (
    <Pressable
      style={[styles.card, featured && styles.cardFeatured, style]}
      onPress={() => router.push(`/course/${course.id}`)}
    >
      <View style={[styles.imageWrap, featured && styles.imageWrapFeatured]}>
        <Image
          source={imageSource}
          style={styles.image}
          contentFit={isLocal || course.imageUrl ? 'cover' : 'contain'}
        />
        {showFavorite ? (
          <Pressable style={styles.heart} onPress={onToggleFavorite} hitSlop={8}>
            <Ionicons
              name={isFav ? 'heart' : 'heart-outline'}
              size={18}
              color={isFav ? colors.error : colors.primary}
            />
          </Pressable>
        ) : null}
      </View>
      <View style={[styles.body, featured && styles.bodyFeatured]}>
        <Text
          style={[
            styles.title,
            featured && styles.titleFeatured,
            { textAlign: isRTL ? 'right' : 'left', writingDirection: isRTL ? 'rtl' : 'ltr' },
          ]}
          numberOfLines={2}
        >
          {courseTitle(course, language)}
        </Text>
        {tutorName ? (
          <View style={styles.tutorRow}>
            <Avatar name={tutorName} size={featured ? 22 : 28} />
            <Text
              style={[styles.meta, { textAlign: isRTL ? 'right' : 'left' }]}
              numberOfLines={1}
            >
              {tutorName}
            </Text>
          </View>
        ) : null}
        <View style={styles.footer}>
          <View style={styles.ratingRow}>
            <Ionicons name="star" size={14} color={colors.star} />
            <Text style={styles.ratingText}>
              {Number(course.ratingAvg || 0).toFixed(1)}
              {course.ratingCount ? (
                <Text style={styles.ratingCount}> ({course.ratingCount})</Text>
              ) : null}
            </Text>
          </View>
          <Text style={styles.price}>
            {formatPrice(course.priceDecimal, course.currency ?? t('common.currency'))}
          </Text>
        </View>
      </View>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  card: {
    backgroundColor: colors.white,
    borderRadius: radius.xl,
    overflow: 'hidden',
    ...shadows.sm,
    marginBottom: spacing.lg,
  },
  cardFeatured: {
    marginBottom: 0,
    flex: 1,
  },
  imageWrap: {
    position: 'relative',
    backgroundColor: colors.lavenderSoft,
  },
  imageWrapFeatured: {
    borderTopLeftRadius: radius.xl,
    borderTopRightRadius: radius.xl,
  },
  image: {
    width: '100%',
    height: 132,
    backgroundColor: colors.beige,
  },
  heart: {
    position: 'absolute',
    top: spacing.sm,
    end: spacing.sm,
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: colors.white,
    alignItems: 'center',
    justifyContent: 'center',
    ...shadows.sm,
  },
  body: {
    padding: spacing.lg,
    gap: spacing.sm,
  },
  bodyFeatured: {
    padding: spacing.md,
    gap: spacing.xs,
  },
  title: {
    ...typography.subheading,
    color: colors.text,
  },
  titleFeatured: {
    fontSize: 14,
    lineHeight: 18,
  },
  tutorRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
  },
  meta: {
    ...typography.caption,
    color: colors.textSecondary,
    flex: 1,
  },
  footer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginTop: spacing.xs,
  },
  ratingRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  ratingText: {
    ...typography.caption,
    color: colors.text,
    fontWeight: '600',
  },
  ratingCount: {
    color: colors.textMuted,
    fontWeight: '500',
  },
  price: {
    ...typography.caption,
    color: colors.text,
    fontWeight: '800',
    fontSize: 13,
  },
});
