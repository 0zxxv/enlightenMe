import { Image } from 'expo-image';
import { useRouter } from 'expo-router';
import React from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import { Badge } from '@/components/Badge';
import { PriceDisplay } from '@/components/PriceDisplay';
import { Rating } from '@/components/Rating';
import { useTranslation } from '@/i18n';
import { colors, radius, shadows, spacing, typography } from '@/theme';
import type { Course } from '@/types/models';
import { courseTitle, fullName } from '@/utils/format';

type Props = {
  course: Course;
};

export function CourseCard({ course }: Props) {
  const router = useRouter();
  const { t, language } = useTranslation();
  const tutorName = fullName(course.tutor?.firstName, course.tutor?.lastName);

  return (
    <Pressable
      style={styles.card}
      onPress={() => router.push(`/course/${course.id}`)}
    >
      <Image
        source={{
          uri:
            course.imageUrl ||
            'https://images.unsplash.com/photo-1522202176988-66273c2fd55f?w=800&q=80',
        }}
        style={styles.image}
        contentFit="cover"
      />
      <View style={styles.body}>
        <View style={styles.row}>
          <Badge label={course.format} tone="neutral" />
          {course.tutor?.tutorProfile?.verificationStatus === 'Verified' ? (
            <Badge label={t('common.verified')} tone="success" />
          ) : null}
        </View>
        <Text style={styles.title} numberOfLines={2}>
          {courseTitle(course, language)}
        </Text>
        {tutorName ? (
          <Text style={styles.meta} numberOfLines={1}>
            {t('course.by')} {tutorName}
          </Text>
        ) : null}
        <View style={styles.footer}>
          <Rating value={Number(course.ratingAvg || 0)} count={course.ratingCount} />
          <PriceDisplay amount={course.priceDecimal} currency={course.currency} />
        </View>
      </View>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  card: {
    backgroundColor: colors.white,
    borderRadius: radius.lg,
    overflow: 'hidden',
    ...shadows.sm,
    marginBottom: spacing.lg,
  },
  image: {
    width: '100%',
    height: 140,
    backgroundColor: colors.beige,
  },
  body: {
    padding: spacing.lg,
    gap: spacing.sm,
  },
  row: {
    flexDirection: 'row',
    gap: spacing.sm,
    flexWrap: 'wrap',
  },
  title: {
    ...typography.subheading,
    color: colors.text,
  },
  meta: {
    ...typography.caption,
    color: colors.textSecondary,
  },
  footer: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginTop: spacing.xs,
  },
});
