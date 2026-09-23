import { Ionicons } from '@expo/vector-icons';
import { useLocalSearchParams, useNavigation, useRouter } from 'expo-router';
import React, { useLayoutEffect, useMemo, useState } from 'react';
import {
  Alert,
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
import { CourseCard } from '@/components/CourseCard';
import { EmptyState } from '@/components/EmptyState';
import { ErrorState } from '@/components/ErrorState';
import { LoadingState } from '@/components/LoadingState';
import { useAddFavorite, useFavorites, useRemoveFavorite } from '@/features/favorites/hooks';
import { useAuth } from '@/features/auth/useAuth';
import { useOpenConversation } from '@/features/messages/hooks';
import { useTutor } from '@/features/tutors/hooks';
import { useLayout } from '@/hooks/useLayout';
import { useRefresh } from '@/hooks/useRefresh';
import { useTranslation } from '@/i18n';
import { colors, radius, shadows, spacing, typography } from '@/theme';
import { ApiError } from '@/types/api';
import { fullName } from '@/utils/format';

const BIO_PREVIEW = 140;

export default function TutorProfileScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const { t, isRTL } = useTranslation();
  const { isAuthenticated, user } = useAuth();
  const navigation = useNavigation();
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const layout = useLayout();
  const tutorQuery = useTutor(id);
  const tutor = tutorQuery.data;
  const openConversation = useOpenConversation();
  const favoritesQuery = useFavorites();
  const addFavorite = useAddFavorite();
  const removeFavorite = useRemoveFavorite();
  const [messaging, setMessaging] = useState(false);
  const [bioExpanded, setBioExpanded] = useState(false);
  const { refreshing, onRefresh } = useRefresh(async () => {
    await tutorQuery.refetch();
  });

  useLayoutEffect(() => {
    navigation.setOptions({ headerShown: false });
  }, [navigation]);

  const favorite = useMemo(
    () => favoritesQuery.data?.find((f) => f.tutorId === id),
    [favoritesQuery.data, id],
  );

  if (tutorQuery.isLoading) {
    return (
      <View style={styles.root}>
        <BackButton withSafeTop />
        <LoadingState />
      </View>
    );
  }

  if (tutorQuery.isError || !tutor) {
    return (
      <View style={styles.root}>
        <BackButton withSafeTop />
        <ErrorState onRetry={() => tutorQuery.refetch()} />
      </View>
    );
  }

  const name = fullName(tutor.firstName, tutor.lastName);
  const profile = tutor.tutorProfile;
  const canMessage = isAuthenticated && user?.role === 'Student' && user.id !== tutor.id;
  const verified = profile?.verificationStatus === 'Verified';
  const ratingAvg = Number(profile?.ratingAvg || 0);
  const ratingCount = profile?.ratingCount ?? 0;
  const expertise = profile?.expertise ?? [];
  const subtitle =
    expertise.slice(0, 2).join(' & ') ||
    (profile?.providerType === 'Trainer'
      ? t('marketplace.trainer')
      : t('marketplace.teacher'));
  const bio = profile?.bio || t('tutor.noBio');
  const bioNeedsMore = bio.length > BIO_PREVIEW;
  const bioShown = bioExpanded || !bioNeedsMore ? bio : `${bio.slice(0, BIO_PREVIEW).trim()}…`;
  const courses = tutor.courses ?? [];
  const previewCourses = courses.slice(0, 4);
  const courseGap = spacing.md;
  const columns = 2;
  const courseWidthPct = `${100 / columns}%` as `${number}%`;
  const chevron = isRTL ? 'chevron-back' : 'chevron-forward';

  const onMessage = async () => {
    if (!isAuthenticated) {
      router.push('/(auth)/login');
      return;
    }
    setMessaging(true);
    try {
      const result = await openConversation.mutateAsync(tutor.id);
      router.push(`/conversation/${result.conversationId}`);
    } catch (err) {
      const message =
        err instanceof ApiError ? err.message : t('messages.openFailed');
      Alert.alert(t('messages.title'), message);
    } finally {
      setMessaging(false);
    }
  };

  const onShare = async () => {
    try {
      await Share.share({ message: `${name} — ${t('brand.name')}` });
    } catch {
      // cancelled
    }
  };

  const onToggleFavorite = () => {
    if (!isAuthenticated) {
      router.push('/(auth)/login');
      return;
    }
    if (favorite) removeFavorite.mutate(favorite.id);
    else addFavorite.mutate({ tutorId: tutor.id });
  };

  const onMore = () => {
    Alert.alert(name, undefined, [
      canMessage
        ? { text: t('tutor.message'), onPress: () => void onMessage() }
        : undefined,
      { text: t('common.cancel'), style: 'cancel' },
    ].filter(Boolean) as { text: string; onPress?: () => void; style?: 'cancel' }[]);
  };

  return (
    <View style={styles.root}>
      <ScrollView
        contentContainerStyle={[
          styles.content,
          {
            paddingTop: insets.top + spacing.sm,
            paddingHorizontal: layout.contentPadding,
            paddingBottom: spacing.massive + (canMessage ? 72 : 0),
            maxWidth: layout.contentMaxWidth ?? '100%',
            alignSelf: 'center',
            width: '100%',
          },
        ]}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} />}
        showsVerticalScrollIndicator={false}
      >
        <View style={styles.topBar}>
          <BackButton />
          <View style={styles.topActions}>
            <Pressable style={styles.roundBtn} onPress={onShare} hitSlop={6}>
              <Ionicons name="share-outline" size={18} color={colors.primary} />
            </Pressable>
            <Pressable style={styles.roundBtn} onPress={onToggleFavorite} hitSlop={6}>
              <Ionicons
                name={favorite ? 'heart' : 'heart-outline'}
                size={18}
                color={favorite ? colors.error : colors.primary}
              />
            </Pressable>
            <Pressable style={styles.roundBtn} onPress={onMore} hitSlop={6}>
              <Ionicons name="ellipsis-horizontal" size={18} color={colors.primary} />
            </Pressable>
          </View>
        </View>

        <View style={styles.profileRow}>
          <View style={styles.avatarWrap}>
            <Avatar name={name} size={88} />
            <View style={styles.onlineDot} />
          </View>
          <View style={styles.profileMeta}>
            <View style={styles.nameRow}>
              <Text style={styles.name}>{name}</Text>
              {verified ? (
                <Ionicons name="checkmark-circle" size={18} color={colors.lavender} />
              ) : null}
            </View>
            <Text style={styles.subtitle} numberOfLines={2}>
              {subtitle}
            </Text>
            <View style={styles.infoRow}>
              <Ionicons name="location-outline" size={14} color={colors.textMuted} />
              <Text style={styles.infoText}>{t('tutor.location')}</Text>
            </View>
            <View style={styles.infoRow}>
              <Ionicons name="language-outline" size={14} color={colors.textMuted} />
              <Text style={styles.infoText}>{t('tutor.languages')}</Text>
            </View>
          </View>
        </View>

        {expertise.length ? (
          <ScrollView
            horizontal
            showsHorizontalScrollIndicator={false}
            contentContainerStyle={styles.tagsRow}
          >
            {expertise.map((tag) => (
              <View key={tag} style={styles.tag}>
                <Text style={styles.tagText}>{tag}</Text>
              </View>
            ))}
          </ScrollView>
        ) : null}

        <View style={styles.statsRow}>
          <View style={styles.statCard}>
            <View style={[styles.statIcon, { backgroundColor: colors.warningSoft }]}>
              <Ionicons name="star" size={16} color={colors.warning} />
            </View>
            <View style={styles.statCopy}>
              <Text style={styles.statValue}>{ratingAvg.toFixed(1)}</Text>
              <Text style={styles.statHint}>
                ({ratingCount} {t('tutor.reviews')})
              </Text>
            </View>
          </View>
          <View style={styles.statCard}>
            <View style={[styles.statIcon, { backgroundColor: colors.lavenderSoft }]}>
              <Ionicons name="people" size={16} color={colors.primary} />
            </View>
            <View style={styles.statCopy}>
              <Text style={styles.statValue}>{profile?.studentCount ?? 0}</Text>
              <Text style={styles.statHint}>{t('tutor.students')}</Text>
            </View>
          </View>
          <View style={styles.statCard}>
            <View style={[styles.statIcon, { backgroundColor: colors.successSoft }]}>
              <Ionicons name="book" size={16} color={colors.success} />
            </View>
            <View style={styles.statCopy}>
              <Text style={styles.statValue}>{profile?.courseCount ?? courses.length}</Text>
              <Text style={styles.statHint}>{t('tutor.courses')}</Text>
            </View>
          </View>
        </View>

        <View style={styles.aboutCard}>
          <Text style={styles.sectionTitle}>{t('tutor.about')}</Text>
          <View style={styles.aboutBody}>
            <Text style={styles.bio}>{bioShown}</Text>
            <View style={styles.aboutArt} pointerEvents="none">
              <Ionicons name="leaf" size={28} color={colors.success} />
              <Ionicons name="library-outline" size={34} color={colors.lavender} />
            </View>
          </View>
          {bioNeedsMore ? (
            <Pressable
              style={styles.showMore}
              onPress={() => setBioExpanded((v) => !v)}
            >
              <Text style={styles.showMoreText}>
                {bioExpanded ? t('tutor.showLess') : t('tutor.showMore')}
              </Text>
              <Ionicons
                name={bioExpanded ? 'chevron-up' : 'chevron-down'}
                size={14}
                color={colors.primary}
              />
            </Pressable>
          ) : null}
        </View>

        <View style={styles.coursesHeader}>
          <Text style={styles.sectionTitle}>
            {t('tutor.courses')} ({courses.length})
          </Text>
          {courses.length > 4 ? (
            <Pressable
              style={styles.seeAll}
              onPress={() =>
                router.push({
                  pathname: '/(tabs)/explore',
                  params: { q: name, result: 'services' },
                })
              }
            >
              <Text style={styles.seeAllText}>{t('common.seeAll')}</Text>
              <Ionicons name={chevron} size={14} color={colors.primary} />
            </Pressable>
          ) : null}
        </View>

        {previewCourses.length ? (
          <View style={[styles.courseGrid, { marginHorizontal: -courseGap / 2 }]}>
            {previewCourses.map((course) => (
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
          <EmptyState title={t('common.empty')} />
        )}
      </ScrollView>

      {canMessage ? (
        <View
          style={[
            styles.footer,
            {
              paddingBottom: Math.max(insets.bottom, spacing.md),
              paddingHorizontal: layout.contentPadding,
            },
          ]}
        >
          <Pressable
            style={[styles.messageBtn, messaging && styles.messageBtnDisabled]}
            onPress={onMessage}
            disabled={messaging}
          >
            <Ionicons name="chatbubble-ellipses-outline" size={18} color={colors.white} />
            <Text style={styles.messageBtnText}>{t('tutor.message')}</Text>
          </Pressable>
        </View>
      ) : null}
    </View>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1, backgroundColor: colors.background },
  content: { gap: spacing.lg },
  topBar: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  topActions: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
  },
  roundBtn: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: colors.white,
    borderWidth: 1,
    borderColor: colors.border,
    alignItems: 'center',
    justifyContent: 'center',
    ...shadows.sm,
  },
  profileRow: {
    flexDirection: 'row',
    gap: spacing.md,
    alignItems: 'flex-start',
  },
  avatarWrap: {
    position: 'relative',
  },
  onlineDot: {
    position: 'absolute',
    right: 4,
    bottom: 4,
    width: 16,
    height: 16,
    borderRadius: 8,
    backgroundColor: colors.success,
    borderWidth: 2.5,
    borderColor: colors.background,
  },
  profileMeta: {
    flex: 1,
    gap: 4,
    paddingTop: 2,
  },
  nameRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  name: {
    ...typography.heading,
    color: colors.primary,
    fontSize: 22,
    lineHeight: 28,
  },
  subtitle: {
    ...typography.body,
    color: colors.textMuted,
    fontSize: 14,
  },
  infoRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    marginTop: 2,
  },
  infoText: {
    ...typography.caption,
    color: colors.textMuted,
    fontWeight: '600',
  },
  tagsRow: {
    flexDirection: 'row',
    gap: spacing.sm,
  },
  tag: {
    backgroundColor: colors.lavenderSoft,
    borderRadius: radius.full,
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm - 2,
  },
  tagText: {
    ...typography.caption,
    color: colors.primary,
    fontWeight: '700',
  },
  statsRow: {
    flexDirection: 'row',
    gap: spacing.sm,
  },
  statCard: {
    flex: 1,
    backgroundColor: colors.white,
    borderRadius: radius.xl,
    padding: spacing.sm,
    gap: spacing.sm,
    ...shadows.sm,
  },
  statIcon: {
    width: 32,
    height: 32,
    borderRadius: 16,
    alignItems: 'center',
    justifyContent: 'center',
  },
  statCopy: { gap: 1 },
  statValue: {
    ...typography.heading,
    color: colors.primary,
    fontSize: 18,
    lineHeight: 22,
  },
  statHint: {
    ...typography.caption,
    color: colors.textMuted,
    fontSize: 11,
  },
  aboutCard: {
    backgroundColor: colors.white,
    borderRadius: radius.xxl,
    padding: spacing.lg,
    gap: spacing.sm,
    ...shadows.sm,
  },
  sectionTitle: {
    ...typography.subheading,
    color: colors.primary,
    fontSize: 17,
    fontWeight: '800',
  },
  aboutBody: {
    flexDirection: 'row',
    gap: spacing.md,
  },
  bio: {
    ...typography.body,
    color: colors.textSecondary,
    lineHeight: 22,
    flex: 1,
  },
  aboutArt: {
    width: 56,
    alignItems: 'center',
    justifyContent: 'flex-end',
    gap: 2,
    opacity: 0.85,
  },
  showMore: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    alignSelf: 'flex-start',
  },
  showMoreText: {
    ...typography.caption,
    color: colors.primary,
    fontWeight: '700',
  },
  coursesHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  seeAll: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 2,
  },
  seeAllText: {
    ...typography.caption,
    color: colors.primary,
    fontWeight: '700',
  },
  courseGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
  },
  footer: {
    borderTopWidth: StyleSheet.hairlineWidth,
    borderTopColor: colors.border,
    backgroundColor: colors.backgroundElevated,
    paddingTop: spacing.md,
  },
  messageBtn: {
    minHeight: 52,
    borderRadius: radius.lg,
    backgroundColor: colors.primary,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: spacing.sm,
  },
  messageBtnDisabled: { opacity: 0.7 },
  messageBtnText: {
    ...typography.button,
    color: colors.white,
    fontWeight: '700',
  },
});
