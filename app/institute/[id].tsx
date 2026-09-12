import { useLocalSearchParams, useNavigation } from 'expo-router';
import React, { useLayoutEffect } from 'react';
import { RefreshControl, ScrollView, StyleSheet, Text, View } from 'react-native';
import { Avatar } from '@/components/Avatar';
import { Badge } from '@/components/Badge';
import { CourseCard } from '@/components/CourseCard';
import { EmptyState } from '@/components/EmptyState';
import { ErrorState } from '@/components/ErrorState';
import { LoadingState } from '@/components/LoadingState';
import { Rating } from '@/components/Rating';
import { SectionHeader } from '@/components/SectionHeader';
import { useInstitute } from '@/features/institutes/hooks';
import { useRefresh } from '@/hooks/useRefresh';
import { useTranslation } from '@/i18n';
import { colors, radius, spacing, typography } from '@/theme';

export default function InstituteProfileScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const { t, language } = useTranslation();
  const navigation = useNavigation();
  const instituteQuery = useInstitute(id);
  const institute = instituteQuery.data as
    | (NonNullable<typeof instituteQuery.data> & { courses?: import('@/types/models').Course[] })
    | undefined;
  const { refreshing, onRefresh } = useRefresh(async () => {
    await instituteQuery.refetch();
  });

  const name =
    language === 'ar' && institute?.nameAr ? institute.nameAr : institute?.name ?? '';

  useLayoutEffect(() => {
    navigation.setOptions({
      title: name || t('institute.about'),
      headerStyle: { backgroundColor: colors.background },
      headerTintColor: colors.primary,
    });
  }, [navigation, name, t]);

  if (instituteQuery.isLoading) return <LoadingState />;
  if (instituteQuery.isError || !institute) {
    return <ErrorState onRetry={() => instituteQuery.refetch()} />;
  }

  return (
    <ScrollView
      style={styles.root}
      contentContainerStyle={styles.content}
      refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} />}
    >
      <View style={styles.header}>
        <Avatar name={name} size={80} />
        <Text style={styles.name}>{name}</Text>
        {institute.verificationStatus === 'Verified' ? (
          <Badge label={t('common.verified')} tone="success" />
        ) : null}
        <Rating value={Number(institute.ratingAvg || 0)} count={institute.ratingCount} />
      </View>

      <SectionHeader title={t('institute.about')} />
      <Text style={styles.bio}>{institute.description || t('common.empty')}</Text>

      <SectionHeader title={t('institute.courses')} />
      {institute.courses?.length ? (
        institute.courses.map((course) => <CourseCard key={course.id} course={course} />)
      ) : (
        <EmptyState />
      )}
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1, backgroundColor: colors.background },
  content: { padding: spacing.xl, paddingBottom: spacing.massive, gap: spacing.md },
  header: { alignItems: 'center', gap: spacing.sm, marginBottom: spacing.md },
  name: { ...typography.heading, color: colors.text },
  bio: { ...typography.body, color: colors.textSecondary, lineHeight: 22 },
});
