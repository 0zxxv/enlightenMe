import { useRouter, type Href } from 'expo-router';
import React, { useState } from 'react';
import { ScrollView, StyleSheet, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Button } from '@/components/Button';
import {
  DEV_EXPERIENCES,
  DEV_QUICK_TESTS,
  type DevExperience,
  type DevQuickTest,
} from '@/config/devUsers';
import { useAuth } from '@/features/auth/useAuth';
import { useTranslation } from '@/i18n';
import { listCourses } from '@/services/api/courses';
import { colors, spacing, typography } from '@/theme';
import { ApiError } from '@/types/api';

const STUDENT = DEV_EXPERIENCES.find((e) => e.id === 'student')!;

export default function DevModeScreen() {
  const { t } = useTranslation();
  const { login } = useAuth();
  const router = useRouter();
  const [busyId, setBusyId] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  const runAs = async (email: string, password: string, href: Href) => {
    await login({ email, password });
    router.replace(href);
  };

  const onExperience = async (experience: DevExperience) => {
    setBusyId(experience.id);
    setError(null);
    try {
      await runAs(experience.email, experience.password, experience.href);
    } catch (err) {
      const message = err instanceof ApiError ? err.message : t('common.error');
      setError(message);
    } finally {
      setBusyId(null);
    }
  };

  const onQuickTest = async (test: DevQuickTest) => {
    setBusyId(test.id);
    setError(null);
    try {
      await login({ email: STUDENT.email, password: STUDENT.password });

      if (test.openFirstCourseBooking) {
        const result = await listCourses({ pageSize: 1 });
        const courseId = result.data[0]?.id;
        if (!courseId) {
          setError(t('auth.devModeNoCourses'));
          return;
        }
        router.replace(`/booking/${courseId}` as Href);
        return;
      }

      if (test.href) {
        router.replace(test.href);
      }
    } catch (err) {
      const message = err instanceof ApiError ? err.message : t('common.error');
      setError(message);
    } finally {
      setBusyId(null);
    }
  };

  const locked = busyId !== null;

  return (
    <SafeAreaView style={styles.safe}>
      <ScrollView contentContainerStyle={styles.content}>
        <Text style={styles.eyebrow}>{t('brand.name')}</Text>
        <Text style={styles.title}>{t('auth.devModeTitle')}</Text>
        <Text style={styles.subtitle}>{t('auth.devModeSubtitle')}</Text>

        {error ? <Text style={styles.error}>{error}</Text> : null}

        <View style={styles.section}>
          <Text style={styles.sectionLabel}>{t('auth.devModeRoles')}</Text>
          <View style={styles.list}>
            {DEV_EXPERIENCES.map((experience) => (
              <Button
                key={experience.id}
                title={experience.label}
                variant="secondary"
                onPress={() => onExperience(experience)}
                loading={busyId === experience.id}
                disabled={locked && busyId !== experience.id}
              />
            ))}
          </View>
        </View>

        <View style={styles.divider} />

        <View style={styles.section}>
          <Text style={styles.sectionLabel}>{t('auth.devModeQuickTests')}</Text>
          <Text style={styles.sectionHint}>{t('auth.devModeQuickTestsHint')}</Text>
          <View style={styles.list}>
            {DEV_QUICK_TESTS.map((test) => (
              <Button
                key={test.id}
                title={test.label}
                variant="ghost"
                onPress={() => onQuickTest(test)}
                loading={busyId === test.id}
                disabled={locked && busyId !== test.id}
              />
            ))}
          </View>
        </View>

        <Text style={styles.footnote}>{t('auth.devModeFootnote')}</Text>

        <Button
          title={t('common.back')}
          variant="ghost"
          onPress={() => {
            if (router.canGoBack()) {
              router.back();
              return;
            }
            router.replace('/(auth)/login');
          }}
          disabled={locked}
        />
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: colors.background },
  content: { padding: spacing.xxl, gap: spacing.md, paddingBottom: spacing.massive },
  eyebrow: { ...typography.caption, color: colors.primary, fontWeight: '700', letterSpacing: 0.6 },
  title: { ...typography.display, color: colors.text, fontSize: 32 },
  subtitle: { ...typography.body, color: colors.textSecondary, marginBottom: spacing.sm },
  section: { gap: spacing.sm, marginTop: spacing.sm },
  sectionLabel: { ...typography.heading, color: colors.text, fontSize: 18 },
  sectionHint: { ...typography.caption, color: colors.textMuted },
  list: { gap: spacing.md, marginTop: spacing.xs },
  divider: {
    height: StyleSheet.hairlineWidth,
    backgroundColor: colors.borderStrong,
    marginVertical: spacing.lg,
  },
  error: { ...typography.caption, color: colors.error },
  footnote: { ...typography.caption, color: colors.textMuted, marginTop: spacing.lg, lineHeight: 20 },
});
