import { Ionicons } from '@expo/vector-icons';
import { useLocalSearchParams, useNavigation } from 'expo-router';
import React, { useLayoutEffect } from 'react';
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
import { BackButton } from '@/components/BackButton';
import { Badge } from '@/components/Badge';
import { CourseCard } from '@/components/CourseCard';
import { EmptyState } from '@/components/EmptyState';
import { ErrorState } from '@/components/ErrorState';
import { LoadingState } from '@/components/LoadingState';
import { useInstitute } from '@/features/institutes/hooks';
import { useLayout } from '@/hooks/useLayout';
import { useRefresh } from '@/hooks/useRefresh';
import { useTranslation } from '@/i18n';
import { colors, radius, spacing, typography } from '@/theme';

export default function InstituteProfileScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const { t, language } = useTranslation();
  const navigation = useNavigation();
  const insets = useSafeAreaInsets();
  const layout = useLayout();
  const instituteQuery = useInstitute(id);
  const institute = instituteQuery.data as
    | (NonNullable<typeof instituteQuery.data> & { courses?: import('@/types/models').Course[] })
    | undefined;
  const { refreshing, onRefresh } = useRefresh(async () => {
    await instituteQuery.refetch();
  });

  useLayoutEffect(() => {
    navigation.setOptions({ headerShown: false });
  }, [navigation]);

  if (instituteQuery.isLoading) {
    return (
      <View style={styles.root}>
        <BackButton withSafeTop />
        <LoadingState />
      </View>
    );
  }
  if (instituteQuery.isError || !institute) {
    return (
      <View style={styles.root}>
        <BackButton withSafeTop />
        <ErrorState onRetry={() => instituteQuery.refetch()} />
      </View>
    );
  }

  const name =
    language === 'ar' && institute.nameAr ? institute.nameAr : institute.name ?? '';
  const verified = institute.verificationStatus === 'Verified';
  const ratingAvg = Number(institute.ratingAvg || 0);
  const ratingCount = institute.ratingCount ?? 0;
  const heroHeight = layout.isDesktop ? 280 : layout.isTablet ? 240 : 210;
  const courseGap = spacing.md;
  const columns = Math.min(layout.courseColumns, 2);
  const courseWidthPct = `${100 / columns}%` as `${number}%`;

  const onShare = async () => {
    try {
      await Share.share({ message: `${name} — ${t('brand.name')}` });
    } catch {
      // cancelled
    }
  };

  return (
    <View style={styles.root}>
      <ScrollView
        contentContainerStyle={styles.content}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} />}
        showsVerticalScrollIndicator={false}
      >
        <View style={[styles.heroWrap, { height: heroHeight }]}>
          <View style={styles.heroBg} />
          <View style={styles.heroGlow} pointerEvents="none" />
          <View style={[styles.heroActions, { paddingTop: insets.top + spacing.sm }]}>
            <BackButton variant="overlay" />
            <Pressable
              style={styles.heroBtn}
              onPress={onShare}
              hitSlop={8}
              accessibilityLabel={t('course.share')}
            >
              <Ionicons name="share-outline" size={20} color={colors.white} />
            </Pressable>
          </View>
          <View style={styles.avatarWrap}>
            <Avatar name={name} size={104} />
            {verified ? (
              <View style={styles.verifiedBadge}>
                <Ionicons name="checkmark" size={14} color={colors.white} />
              </View>
            ) : null}
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
          <Text style={styles.name}>{name}</Text>
          <View style={styles.metaRow}>
            {verified ? (
              <View style={styles.verifiedPill}>
                <Ionicons name="checkmark-circle" size={14} color={colors.primary} />
                <Text style={styles.verifiedText}>{t('common.verified')}</Text>
              </View>
            ) : (
              <Badge label={t('marketplace.institute')} tone="neutral" />
            )}
            <View style={styles.ratingRow}>
              <Ionicons name="star" size={14} color={colors.star} />
              <Text style={styles.ratingText}>
                {ratingAvg.toFixed(1)}
                {ratingCount ? (
                  <Text style={styles.ratingCount}> ({ratingCount})</Text>
                ) : null}
              </Text>
            </View>
          </View>

          <Text style={styles.sectionTitle}>{t('institute.about')}</Text>
          <Text style={styles.bio}>{institute.description || t('common.empty')}</Text>

          <Text style={styles.sectionTitle}>{t('institute.courses')}</Text>
          {institute.courses?.length ? (
            <View style={[styles.courseGrid, { marginHorizontal: -courseGap / 2 }]}>
              {institute.courses.map((course) => (
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
          ) : (
            <EmptyState />
          )}
        </View>
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1, backgroundColor: colors.background },
  content: { paddingBottom: spacing.massive },
  heroWrap: {
    position: 'relative',
    overflow: 'hidden',
    justifyContent: 'flex-end',
    alignItems: 'center',
  },
  heroBg: {
    ...StyleSheet.absoluteFill,
    backgroundColor: colors.primary,
  },
  heroGlow: {
    position: 'absolute',
    width: 280,
    height: 280,
    borderRadius: 140,
    backgroundColor: colors.infoSoft,
    opacity: 0.55,
    top: -40,
    alignSelf: 'center',
  },
  heroActions: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    zIndex: 2,
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingHorizontal: spacing.lg,
  },
  heroBtn: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: 'rgba(28,24,48,0.45)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  avatarWrap: {
    marginBottom: -52,
    zIndex: 3,
  },
  verifiedBadge: {
    position: 'absolute',
    right: 4,
    bottom: 4,
    width: 28,
    height: 28,
    borderRadius: 14,
    backgroundColor: colors.success,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 2,
    borderColor: colors.white,
  },
  sheet: {
    backgroundColor: colors.background,
    borderTopLeftRadius: radius.xxl,
    borderTopRightRadius: radius.xxl,
    marginTop: 52,
    paddingTop: spacing.xl,
    gap: spacing.md,
    paddingBottom: spacing.xxl,
  },
  name: {
    ...typography.heading,
    color: colors.text,
    fontSize: 26,
    lineHeight: 32,
    textAlign: 'center',
  },
  metaRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    flexWrap: 'wrap',
    gap: spacing.sm,
  },
  verifiedPill: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    backgroundColor: colors.lavenderSoft,
    paddingHorizontal: spacing.sm,
    paddingVertical: 4,
    borderRadius: radius.full,
  },
  verifiedText: {
    ...typography.caption,
    color: colors.primary,
    fontWeight: '700',
  },
  ratingRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  ratingText: {
    ...typography.caption,
    color: colors.text,
    fontWeight: '700',
  },
  ratingCount: {
    color: colors.textMuted,
    fontWeight: '500',
  },
  sectionTitle: {
    ...typography.subheading,
    color: colors.text,
    fontSize: 17,
    marginTop: spacing.sm,
  },
  bio: {
    ...typography.body,
    color: colors.textSecondary,
    lineHeight: 22,
  },
  courseGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
  },
});
