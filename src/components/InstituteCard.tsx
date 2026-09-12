import { useRouter } from 'expo-router';
import React from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import { Avatar } from '@/components/Avatar';
import { Badge } from '@/components/Badge';
import { Rating } from '@/components/Rating';
import { useTranslation } from '@/i18n';
import { colors, radius, shadows, spacing, typography } from '@/theme';
import type { Institute } from '@/types/models';

type Props = {
  institute: Institute;
};

export function InstituteCard({ institute }: Props) {
  const router = useRouter();
  const { t, language } = useTranslation();
  const name =
    language === 'ar' && institute.nameAr ? institute.nameAr : institute.name;

  return (
    <Pressable style={styles.card} onPress={() => router.push(`/institute/${institute.id}`)}>
      <Avatar name={name} size={56} />
      <View style={styles.body}>
        <View style={styles.row}>
          <Text style={styles.name}>{name}</Text>
          {institute.verificationStatus === 'Verified' ? (
            <Badge label={t('common.verified')} tone="success" />
          ) : null}
        </View>
        {institute.description ? (
          <Text style={styles.city} numberOfLines={2}>
            {institute.description}
          </Text>
        ) : null}
        <Rating value={Number(institute.ratingAvg || 0)} count={institute.ratingCount} />
      </View>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  card: {
    flexDirection: 'row',
    gap: spacing.md,
    backgroundColor: colors.white,
    borderRadius: radius.lg,
    padding: spacing.lg,
    marginBottom: spacing.md,
    ...shadows.sm,
  },
  body: {
    flex: 1,
    gap: spacing.xs,
  },
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
    flexWrap: 'wrap',
  },
  name: {
    ...typography.subheading,
    color: colors.text,
  },
  city: {
    ...typography.caption,
    color: colors.textSecondary,
  },
});
