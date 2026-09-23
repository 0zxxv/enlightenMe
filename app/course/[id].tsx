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
import { BackButton } from '@/components/BackButton';
import { Badge } from '@/components/Badge';
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
import {
  PROVIDER_TYPE_SINGULAR_KEYS,
  SERVICE_TYPE_SINGULAR_KEYS,
  normalizeServiceType,
} from '@/domain/marketplace';
import { colors, radius, shadows, spacing, typography } from '@/theme';
import { courseTitle, formatDate, formatTime, fullName } from '@/utils/format';
import { resolveCourseImageSource } from '@/utils/courseImages';

type DetailTab = 'about' | 'curriculum' | 'reviews';

type AboutFact = {
  key: string;
  icon: keyof typeof Ionicons.glyphMap;
  label: string;
  value: string;
};

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
  const [tab, setTab] = useState<DetailTab>('about');
  const [expandedCurriculumId, setExpandedCurriculumId] = useState<string | null>(null);
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

  if (courseQuery.isLoading) {
    return (
      <View style={styles.root}>
        <BackButton withSafeTop />
        <LoadingState />
      </View>
    );
  }
  if (courseQuery.isError || !course) {
    return (
      <View style={styles.root}>
        <BackButton withSafeTop />
        <ErrorState onRetry={() => courseQuery.refetch()} />
      </View>
    );
  }

  const tutorName = fullName(course.tutor?.firstName, course.tutor?.lastName);
  const serviceType =
    normalizeServiceType(String(course.serviceType ?? course.type ?? '')) ?? 'TrainingSkill';
  const providerType = course.instituteId
    ? ('Institute' as const)
    : course.tutor?.tutorProfile?.providerType;
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

  const subjectName =
    language === 'ar' && course.subject?.nameAr
      ? course.subject.nameAr
      : course.subject?.nameEn;
  const categoryName =
    language === 'ar' && course.category?.nameAr
      ? course.category.nameAr
      : course.category?.nameEn;
  const universityName =
    language === 'ar' && course.university?.nameAr
      ? course.university.nameAr
      : course.university?.nameEn;
  const collegeName =
    language === 'ar' && course.college?.nameAr
      ? course.college.nameAr
      : course.college?.nameEn;
  const instituteName =
    language === 'ar' && course.institute?.nameAr
      ? course.institute.nameAr
      : course.institute?.name;
  const formatName = formatLabel(
    course.format,
    t('common.online'),
    t('common.inPerson'),
    t('common.hybrid'),
  );
  const durationLabel = course.durationMinutes
    ? t('course.durationMinutes').replace('{{count}}', String(course.durationMinutes))
    : null;

  const aboutFacts: AboutFact[] = [];
  const pushFact = (fact: AboutFact) => {
    if (fact.value?.trim()) aboutFacts.push(fact);
  };
  pushFact({
    key: 'service',
    icon: 'school-outline',
    label: t('course.serviceType'),
    value: t(SERVICE_TYPE_SINGULAR_KEYS[serviceType]),
  });
  if (subjectName) {
    pushFact({
      key: 'subject',
      icon: 'book-outline',
      label: t('explore.subject'),
      value: subjectName,
    });
  }
  if (categoryName) {
    pushFact({
      key: 'category',
      icon: 'grid-outline',
      label: t('course.category'),
      value: categoryName,
    });
  }
  if (course.level) {
    pushFact({
      key: 'level',
      icon: 'trending-up-outline',
      label: t('course.level'),
      value: course.level,
    });
  }
  if (course.grade) {
    pushFact({
      key: 'grade',
      icon: 'ribbon-outline',
      label: t('course.grade'),
      value: course.grade,
    });
  }
  if (course.courseCode) {
    pushFact({
      key: 'code',
      icon: 'barcode-outline',
      label: t('course.courseCode'),
      value: course.courseCode,
    });
  }
  if (course.major) {
    pushFact({
      key: 'major',
      icon: 'library-outline',
      label: t('course.major'),
      value: course.major,
    });
  }
  if (universityName) {
    pushFact({
      key: 'university',
      icon: 'business-outline',
      label: t('course.university'),
      value: universityName,
    });
  }
  if (collegeName) {
    pushFact({
      key: 'college',
      icon: 'albums-outline',
      label: t('course.college'),
      value: collegeName,
    });
  }
  if (course.skillCategory) {
    pushFact({
      key: 'skill',
      icon: 'construct-outline',
      label: t('course.skillCategory'),
      value: course.skillCategory,
    });
  }
  if (course.curriculumName) {
    pushFact({
      key: 'curriculumName',
      icon: 'document-text-outline',
      label: t('course.curriculumName'),
      value: course.curriculumName,
    });
  }
  pushFact({
    key: 'format',
    icon: 'desktop-outline',
    label: t('explore.format'),
    value: formatName,
  });
  if (course.location) {
    pushFact({
      key: 'location',
      icon: 'location-outline',
      label: t('course.location'),
      value: course.location,
    });
  }
  if (durationLabel) {
    pushFact({
      key: 'duration',
      icon: 'time-outline',
      label: t('course.duration'),
      value: durationLabel,
    });
  }
  pushFact({
    key: 'sessions',
    icon: 'calendar-outline',
    label: t('course.sessions'),
    value: withCount(t('course.sessionsCount'), course.sessionCount),
  });
  pushFact({
    key: 'capacity',
    icon: 'people-outline',
    label: t('course.capacity'),
    value: withCount(t('course.maxStudents'), course.capacity),
  });
  pushFact({
    key: 'price',
    icon: 'pricetag-outline',
    label: t('course.packagePrice'),
    value: formatDisplayPrice(course.priceDecimal, course.currency),
  });
  if (instituteName) {
    pushFact({
      key: 'institute',
      icon: 'home-outline',
      label: t('course.institute'),
      value: instituteName,
    });
  }
  if (providerType) {
    pushFact({
      key: 'provider',
      icon: 'person-outline',
      label: t('course.provider'),
      value: t(PROVIDER_TYPE_SINGULAR_KEYS[providerType]),
    });
  }

  const now = Date.now();
  const upcomingSessions = [...(course.sessions ?? [])]
    .filter((s) => new Date(s.startsAt).getTime() >= now)
    .sort((a, b) => +new Date(a.startsAt) - +new Date(b.startsAt))
    .slice(0, 3);

  const learnItems = [...(course.curriculum ?? [])]
    .sort((a, b) => a.order - b.order)
    .slice(0, 5)
    .map((item) => (language === 'ar' && item.titleAr ? item.titleAr : item.title));

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
            <BackButton variant="overlay" />
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
          <View style={styles.metaBadges}>
            <Badge label={t(SERVICE_TYPE_SINGULAR_KEYS[serviceType])} tone="primary" />
            {providerType ? (
              <Badge label={t(PROVIDER_TYPE_SINGULAR_KEYS[providerType])} tone="neutral" />
            ) : null}
          </View>
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

          {tab === 'about' ? (
            <View style={styles.aboutSection}>
              <View style={styles.aboutBlock}>
                <Text style={styles.aboutHeading}>{t('course.overview')}</Text>
                <Text style={styles.paragraph}>{description}</Text>
              </View>

              {learnItems.length ? (
                <View style={styles.aboutBlock}>
                  <Text style={styles.aboutHeading}>{t('course.whatYouLearn')}</Text>
                  <View style={styles.learnList}>
                    {learnItems.map((item, index) => (
                      <View key={`${item}-${index}`} style={styles.learnRow}>
                        <View style={styles.learnDot}>
                          <Ionicons name="checkmark" size={12} color={colors.primary} />
                        </View>
                        <Text style={styles.learnText}>{item}</Text>
                      </View>
                    ))}
                  </View>
                </View>
              ) : null}

              <View style={styles.aboutBlock}>
                <Text style={styles.aboutHeading}>{t('course.details')}</Text>
                <View style={styles.factsCard}>
                  {aboutFacts.map((fact, index) => (
                    <View
                      key={fact.key}
                      style={[
                        styles.factRow,
                        index < aboutFacts.length - 1 && styles.factRowBorder,
                      ]}
                    >
                      <View style={styles.factIcon}>
                        <Ionicons name={fact.icon} size={16} color={colors.primary} />
                      </View>
                      <Text style={styles.factLabel}>{fact.label}</Text>
                      <Text style={styles.factValue}>{fact.value}</Text>
                    </View>
                  ))}
                </View>
              </View>

              {course.institute?.description ? (
                <View style={styles.aboutBlock}>
                  <Text style={styles.aboutHeading}>{t('course.aboutInstitute')}</Text>
                  <Pressable
                    style={styles.providerCard}
                    onPress={() =>
                      course.instituteId && router.push(`/institute/${course.instituteId}`)
                    }
                  >
                    <Text style={styles.providerTitle}>{instituteName}</Text>
                    <Text style={styles.paragraph}>{course.institute.description}</Text>
                  </Pressable>
                </View>
              ) : null}

              {course.tutor?.tutorProfile?.bio ? (
                <View style={styles.aboutBlock}>
                  <Text style={styles.aboutHeading}>{t('course.aboutTutor')}</Text>
                  <Pressable
                    style={styles.providerCard}
                    onPress={() => course.tutorId && router.push(`/tutor/${course.tutorId}`)}
                  >
                    <View style={styles.providerHeader}>
                      <Avatar name={tutorName || 'Tutor'} size={40} />
                      <View style={styles.providerMeta}>
                        <Text style={styles.providerTitle}>{tutorName}</Text>
                        {course.tutor.tutorProfile.expertise?.length ? (
                          <Text style={styles.providerExpertise} numberOfLines={2}>
                            {course.tutor.tutorProfile.expertise.slice(0, 4).join(' · ')}
                          </Text>
                        ) : null}
                      </View>
                    </View>
                    <Text style={styles.paragraph} numberOfLines={5}>
                      {course.tutor.tutorProfile.bio}
                    </Text>
                  </Pressable>
                </View>
              ) : null}

              {upcomingSessions.length ? (
                <View style={styles.aboutBlock}>
                  <Text style={styles.aboutHeading}>{t('course.upcomingSessions')}</Text>
                  <View style={styles.sessionList}>
                    {upcomingSessions.map((session) => (
                      <View key={session.id} style={styles.sessionCard}>
                        <View style={styles.sessionIcon}>
                          <Ionicons name="calendar-outline" size={16} color={colors.primary} />
                        </View>
                        <View style={styles.sessionCopy}>
                          <Text style={styles.sessionDate}>
                            {formatDate(session.startsAt, language)}
                          </Text>
                          <Text style={styles.sessionTime}>
                            {formatTime(session.startsAt, language)} –{' '}
                            {formatTime(session.endsAt, language)}
                          </Text>
                          <Text style={styles.sessionSeats}>
                            {t('course.seatsLeft').replace(
                              '{{count}}',
                              String(session.seatsAvailable),
                            )}
                          </Text>
                        </View>
                      </View>
                    ))}
                  </View>
                </View>
              ) : null}
            </View>
          ) : null}

          {tab === 'curriculum' ? (
            course.curriculum?.length ? (
              <View style={styles.curriculumList}>
                {course.curriculum.map((item) => {
                  const expanded = expandedCurriculumId === item.id;
                  const title =
                    language === 'ar' && item.titleAr ? item.titleAr : item.title;
                  return (
                    <Pressable
                      key={item.id}
                      style={[styles.curriculumItem, expanded && styles.curriculumItemOpen]}
                      onPress={() =>
                        setExpandedCurriculumId((prev) => (prev === item.id ? null : item.id))
                      }
                    >
                      <View style={styles.curriculumBadge}>
                        <Text style={styles.curriculumOrder}>{item.order}</Text>
                      </View>
                      <View style={styles.curriculumCopy}>
                        <View style={styles.curriculumTitleRow}>
                          <Text style={styles.curriculumTitle}>{title}</Text>
                          <Ionicons
                            name={expanded ? 'chevron-up' : 'chevron-down'}
                            size={16}
                            color={colors.textMuted}
                          />
                        </View>
                        {expanded ? (
                          <Text style={styles.curriculumDesc}>
                            {item.description?.trim() || t('course.curriculumNoDetails')}
                          </Text>
                        ) : null}
                      </View>
                    </Pressable>
                  );
                })}
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
  metaBadges: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: spacing.sm,
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
  aboutSection: {
    gap: spacing.xl,
  },
  aboutBlock: {
    gap: spacing.sm,
  },
  aboutHeading: {
    ...typography.subheading,
    color: colors.primary,
    fontSize: 16,
    fontWeight: '800',
  },
  learnList: {
    gap: spacing.sm,
  },
  learnRow: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: spacing.sm,
  },
  learnDot: {
    width: 22,
    height: 22,
    borderRadius: 11,
    backgroundColor: colors.lavenderSoft,
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: 1,
  },
  learnText: {
    ...typography.body,
    color: colors.text,
    flex: 1,
    lineHeight: 22,
  },
  factsCard: {
    backgroundColor: '#F3F1F6',
    borderRadius: radius.lg,
    overflow: 'hidden',
  },
  factRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.md,
  },
  factRowBorder: {
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: colors.border,
  },
  factIcon: {
    width: 28,
    height: 28,
    borderRadius: 14,
    backgroundColor: colors.white,
    alignItems: 'center',
    justifyContent: 'center',
  },
  factLabel: {
    ...typography.caption,
    color: colors.textMuted,
    fontWeight: '600',
    width: 96,
  },
  factValue: {
    ...typography.body,
    color: colors.text,
    flex: 1,
    fontWeight: '600',
    fontSize: 14,
    textAlign: 'right',
  },
  providerCard: {
    backgroundColor: '#F3F1F6',
    borderRadius: radius.lg,
    padding: spacing.md,
    gap: spacing.sm,
  },
  providerHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
  },
  providerMeta: {
    flex: 1,
    gap: 2,
  },
  providerTitle: {
    ...typography.subheading,
    color: colors.text,
    fontSize: 15,
  },
  providerExpertise: {
    ...typography.caption,
    color: colors.textMuted,
  },
  sessionList: {
    gap: spacing.sm,
  },
  sessionCard: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.md,
    backgroundColor: '#F3F1F6',
    borderRadius: radius.lg,
    padding: spacing.md,
  },
  sessionIcon: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: colors.lavenderSoft,
    alignItems: 'center',
    justifyContent: 'center',
  },
  sessionCopy: {
    flex: 1,
    gap: 2,
  },
  sessionDate: {
    ...typography.body,
    color: colors.text,
    fontWeight: '700',
    fontSize: 14,
  },
  sessionTime: {
    ...typography.caption,
    color: colors.textSecondary,
  },
  sessionSeats: {
    ...typography.caption,
    color: colors.primary,
    fontWeight: '600',
  },
  curriculumList: {
    gap: spacing.sm,
  },
  curriculumItem: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: spacing.md,
    backgroundColor: '#F3F1F6',
    borderRadius: radius.md,
    paddingVertical: spacing.md,
    paddingHorizontal: spacing.md,
  },
  curriculumItemOpen: {
    backgroundColor: colors.lavenderSoft,
  },
  curriculumBadge: {
    width: 28,
    height: 28,
    borderRadius: 14,
    backgroundColor: colors.lavenderSoft,
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: 2,
  },
  curriculumOrder: {
    ...typography.caption,
    color: colors.primary,
    fontWeight: '800',
  },
  curriculumCopy: { flex: 1, gap: spacing.sm },
  curriculumTitleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
  },
  curriculumTitle: {
    ...typography.body,
    color: colors.text,
    flex: 1,
    fontWeight: '600',
  },
  curriculumDesc: {
    ...typography.caption,
    color: colors.textSecondary,
    lineHeight: 18,
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
