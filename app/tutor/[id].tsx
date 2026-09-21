import { useLocalSearchParams, useNavigation, useRouter } from 'expo-router';
import React, { useLayoutEffect, useState } from 'react';
import { Alert, RefreshControl, ScrollView, StyleSheet, Text, View } from 'react-native';
import { Avatar } from '@/components/Avatar';
import { Badge } from '@/components/Badge';
import { Button } from '@/components/Button';
import { CourseCard } from '@/components/CourseCard';
import { EmptyState } from '@/components/EmptyState';
import { ErrorState } from '@/components/ErrorState';
import { LoadingState } from '@/components/LoadingState';
import { Rating } from '@/components/Rating';
import { SectionHeader } from '@/components/SectionHeader';
import { useAuth } from '@/features/auth/useAuth';
import { useOpenConversation } from '@/features/messages/hooks';
import { useTutor } from '@/features/tutors/hooks';
import { useRefresh } from '@/hooks/useRefresh';
import { useTranslation } from '@/i18n';
import { colors, radius, spacing, typography } from '@/theme';
import { ApiError } from '@/types/api';
import { fullName } from '@/utils/format';

export default function TutorProfileScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const { t } = useTranslation();
  const { isAuthenticated, user } = useAuth();
  const navigation = useNavigation();
  const router = useRouter();
  const tutorQuery = useTutor(id);
  const tutor = tutorQuery.data;
  const openConversation = useOpenConversation();
  const [messaging, setMessaging] = useState(false);
  const { refreshing, onRefresh } = useRefresh(async () => {
    await tutorQuery.refetch();
  });

  const name = fullName(tutor?.firstName, tutor?.lastName);
  const canMessage =
    isAuthenticated && user?.role === 'Student' && user.id !== tutor?.id;

  useLayoutEffect(() => {
    navigation.setOptions({
      title: name || t('tutor.about'),
      headerStyle: { backgroundColor: colors.background },
      headerTintColor: colors.primary,
    });
  }, [navigation, name, t]);

  if (tutorQuery.isLoading) return <LoadingState />;
  if (tutorQuery.isError || !tutor) {
    return <ErrorState onRetry={() => tutorQuery.refetch()} />;
  }

  const profile = tutor.tutorProfile;

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

  return (
    <ScrollView
      style={styles.root}
      contentContainerStyle={styles.content}
      refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} />}
    >
      <View style={styles.header}>
        <Avatar name={name} size={80} />
        <Text style={styles.name}>{name}</Text>
        {profile?.verificationStatus === 'Verified' ? (
          <Badge label={t('common.verified')} tone="success" />
        ) : null}
        <Rating value={Number(profile?.ratingAvg || 0)} count={profile?.ratingCount} />
        {canMessage ? (
          <Button
            title={t('tutor.message')}
            onPress={onMessage}
            loading={messaging}
            style={styles.messageBtn}
          />
        ) : null}
      </View>

      <View style={styles.stats}>
        <View style={styles.stat}>
          <Text style={styles.statValue}>{profile?.studentCount ?? 0}</Text>
          <Text style={styles.statLabel}>{t('tutor.students')}</Text>
        </View>
        <View style={styles.stat}>
          <Text style={styles.statValue}>{profile?.courseCount ?? 0}</Text>
          <Text style={styles.statLabel}>{t('tutor.courses')}</Text>
        </View>
        <View style={styles.stat}>
          <Text style={styles.statValue}>{Number(profile?.ratingAvg || 0).toFixed(1)}</Text>
          <Text style={styles.statLabel}>{t('tutor.rating')}</Text>
        </View>
      </View>

      <SectionHeader title={t('tutor.about')} />
      <Text style={styles.bio}>{profile?.bio || t('tutor.noBio')}</Text>

      {profile?.expertise?.length ? (
        <>
          <SectionHeader title={t('tutor.expertise')} />
          <View style={styles.expertise}>
            {profile.expertise.map((item) => (
              <Badge key={item} label={item} tone="neutral" />
            ))}
          </View>
        </>
      ) : null}

      <SectionHeader title={t('tutor.courses')} />
      {tutor.courses?.length ? (
        tutor.courses.map((course) => <CourseCard key={course.id} course={course} />)
      ) : (
        <EmptyState title={t('common.empty')} subtitle={undefined} />
      )}
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1, backgroundColor: colors.background },
  content: { padding: spacing.xl, paddingBottom: spacing.massive, gap: spacing.md },
  header: { alignItems: 'center', gap: spacing.sm, marginBottom: spacing.md },
  name: { ...typography.heading, color: colors.text },
  messageBtn: { alignSelf: 'stretch', marginTop: spacing.sm },
  stats: {
    flexDirection: 'row',
    backgroundColor: colors.white,
    borderRadius: radius.xl,
    padding: spacing.lg,
  },
  stat: { flex: 1, alignItems: 'center', gap: spacing.xs },
  statValue: { ...typography.heading, color: colors.primary, fontSize: 22 },
  statLabel: { ...typography.caption, color: colors.textSecondary },
  bio: { ...typography.body, color: colors.textSecondary, lineHeight: 22 },
  expertise: { flexDirection: 'row', flexWrap: 'wrap', gap: spacing.sm },
});
