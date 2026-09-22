import { useRouter } from 'expo-router';
import React from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import { Avatar } from '@/components/Avatar';
import { Badge } from '@/components/Badge';
import { Rating } from '@/components/Rating';
import { useTranslation } from '@/i18n';
import { colors, radius, shadows, spacing, typography } from '@/theme';
import type { Tutor } from '@/types/models';
import { fullName } from '@/utils/format';

type Props = {
  tutor: Tutor;
};

export function TutorCard({ tutor }: Props) {
  const router = useRouter();
  const { t } = useTranslation();
  const name = fullName(tutor.firstName, tutor.lastName);
  const profile = tutor.tutorProfile;

  return (
    <Pressable style={styles.card} onPress={() => router.push(`/tutor/${tutor.id}`)}>
      <Avatar name={name} size={56} />
      <View style={styles.body}>
        <View style={styles.row}>
          <Text style={styles.name}>{name}</Text>
          {profile?.providerType ? (
            <Badge
              label={t(
                profile.providerType === 'Trainer'
                  ? 'marketplace.trainer'
                  : 'marketplace.teacher',
              )}
              tone="neutral"
            />
          ) : null}
          {profile?.verificationStatus === 'Verified' ? (
            <Badge label={t('common.verified')} tone="success" />
          ) : null}
        </View>
        <Text style={styles.bio} numberOfLines={2}>
          {profile?.bio || t('tutor.noBio')}
        </Text>
        <View style={styles.meta}>
          <Rating value={Number(profile?.ratingAvg || 0)} count={profile?.ratingCount} />
          <Text style={styles.stat}>
            {profile?.studentCount ?? 0} {t('tutor.students')}
          </Text>
        </View>
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
  bio: {
    ...typography.caption,
    color: colors.textSecondary,
  },
  meta: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginTop: spacing.xs,
  },
  stat: {
    ...typography.caption,
    color: colors.textMuted,
  },
});
