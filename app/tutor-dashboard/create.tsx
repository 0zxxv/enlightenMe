import { Stack, useLocalSearchParams, useRouter } from 'expo-router';
import React, { useEffect, useMemo, useState } from 'react';
import { Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { Button } from '@/components/Button';
import { Chip } from '@/components/Chip';
import { ErrorState } from '@/components/ErrorState';
import { LoadingState } from '@/components/LoadingState';
import { TextInput } from '@/components/TextInput';
import { useTranslation } from '@/i18n';
import { listCategories, type CategoryNode } from '@/services/api/categories';
import {
  createCourse,
  createCourseSession,
  getCourse,
  publishCourse,
  updateCourse,
} from '@/services/api/courses';
import { colors, radius, shadows, spacing, typography } from '@/theme';
import { ApiError } from '@/types/api';
import type { CourseFormat, CourseType } from '@/types/models';
import { formatDate, formatTime } from '@/utils/format';

type Step = 'basics' | 'category' | 'details' | 'schedule' | 'review';

type DraftSession = {
  key: string;
  date: string;
  time: string;
  existingId?: string;
};

const STEPS: Step[] = ['basics', 'category', 'details', 'schedule', 'review'];

function typeFromParent(parent: CategoryNode | undefined): CourseType {
  const slug = (parent?.slug ?? '').toLowerCase();
  if (slug.includes('school')) return 'School';
  if (slug.includes('university')) return 'University';
  if (slug.includes('skill')) return 'Skills';
  const name = (parent?.nameEn ?? '').toLowerCase();
  if (name.includes('school')) return 'School';
  if (name.includes('university')) return 'University';
  return 'Skills';
}

function categoryLabel(node: CategoryNode, language: string) {
  return language === 'ar' ? node.nameAr : node.nameEn;
}

function toIso(date: string, time: string) {
  const normalized = time.length === 5 ? `${time}:00` : time;
  const value = new Date(`${date}T${normalized}`);
  if (Number.isNaN(value.getTime())) return null;
  return value.toISOString();
}

function pad(n: number) {
  return String(n).padStart(2, '0');
}

function splitIso(iso: string): { date: string; time: string } {
  const d = new Date(iso);
  return {
    date: `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}`,
    time: `${pad(d.getHours())}:${pad(d.getMinutes())}`,
  };
}

export default function CreateCourseScreen() {
  const { t, language } = useTranslation();
  const router = useRouter();
  const queryClient = useQueryClient();
  const { courseId: courseIdParam } = useLocalSearchParams<{ courseId?: string }>();
  const courseId = typeof courseIdParam === 'string' ? courseIdParam : undefined;
  const isEdit = Boolean(courseId);

  const [step, setStep] = useState<Step>('basics');
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [parentId, setParentId] = useState<string>();
  const [categoryId, setCategoryId] = useState<string>();
  const [type, setType] = useState<CourseType>('Skills');
  const [level, setLevel] = useState('');
  const [format, setFormat] = useState<CourseFormat>('Online');
  const [capacity, setCapacity] = useState('10');
  const [sessionCount, setSessionCount] = useState('1');
  const [durationMinutes, setDurationMinutes] = useState('60');
  const [price, setPrice] = useState('25');
  const [sessions, setSessions] = useState<DraftSession[]>([]);
  const [draftDate, setDraftDate] = useState('');
  const [draftTime, setDraftTime] = useState('');
  const [error, setError] = useState<string>();
  const [saving, setSaving] = useState(false);
  const [hydrated, setHydrated] = useState(!isEdit);

  const categoriesQuery = useQuery({
    queryKey: ['categories'],
    queryFn: listCategories,
  });

  const courseQuery = useQuery({
    queryKey: ['course', courseId],
    queryFn: () => getCourse(courseId!),
    enabled: Boolean(courseId),
  });

  const parents = categoriesQuery.data ?? [];
  const selectedParent = parents.find((p) => p.id === parentId);
  const children = selectedParent?.children ?? [];

  useEffect(() => {
    if (!courseQuery.data || !categoriesQuery.data || hydrated) return;
    const course = courseQuery.data;
    setTitle(course.title);
    setDescription(course.description);
    setType(course.type);
    setLevel(course.level ?? '');
    setFormat(course.format);
    setCapacity(String(course.capacity));
    setSessionCount(String(course.sessionCount));
    setDurationMinutes(String(course.durationMinutes ?? 60));
    setPrice(String(course.priceDecimal));
    setCategoryId(course.categoryId);

    const cats = categoriesQuery.data;
    let foundParent: CategoryNode | undefined;
    let foundChildId: string | undefined;
    for (const parent of cats) {
      if (parent.id === course.categoryId) {
        foundParent = parent;
        break;
      }
      const child = parent.children?.find((c) => c.id === course.categoryId);
      if (child) {
        foundParent = parent;
        foundChildId = child.id;
        break;
      }
    }
    if (foundParent) {
      setParentId(foundParent.id);
      setCategoryId(foundChildId ?? foundParent.id);
    }

    const existing = (course.sessions ?? []).map((s) => {
      const parts = splitIso(s.startsAt);
      return {
        key: s.id,
        existingId: s.id,
        date: parts.date,
        time: parts.time,
      };
    });
    setSessions(existing);
    setHydrated(true);
  }, [courseQuery.data, categoriesQuery.data, hydrated]);

  const stepIndex = STEPS.indexOf(step);
  const stepLabel = useMemo(() => {
    const map: Record<Step, string> = {
      basics: t('tutorDashboard.stepBasics'),
      category: t('tutorDashboard.stepCategory'),
      details: t('tutorDashboard.stepDetails'),
      schedule: t('tutorDashboard.stepSchedule'),
      review: t('tutorDashboard.stepReview'),
    };
    return map[step];
  }, [step, t]);

  const canContinue = () => {
    if (step === 'basics') return title.trim().length > 0 && description.trim().length > 0;
    if (step === 'category') return Boolean(categoryId);
    if (step === 'details') {
      return (
        Number(capacity) > 0 &&
        Number(sessionCount) > 0 &&
        Number(durationMinutes) > 0 &&
        Number(price) >= 0
      );
    }
    return true;
  };

  const onSelectParent = (parent: CategoryNode) => {
    setParentId(parent.id);
    setType(typeFromParent(parent));
    if ((parent.children?.length ?? 0) === 0) {
      setCategoryId(parent.id);
    } else {
      setCategoryId(undefined);
    }
  };

  const addSession = () => {
    if (!draftDate.trim() || !draftTime.trim()) return;
    if (!toIso(draftDate.trim(), draftTime.trim())) {
      setError(t('common.error'));
      return;
    }
    setError(undefined);
    setSessions((prev) => [
      ...prev,
      {
        key: `local-${Date.now()}-${prev.length}`,
        date: draftDate.trim(),
        time: draftTime.trim(),
      },
    ]);
    setDraftDate('');
    setDraftTime('');
  };

  const removeSession = (key: string) => {
    setSessions((prev) => prev.filter((s) => s.key !== key));
  };

  const buildPayload = () => ({
    title: title.trim(),
    description: description.trim(),
    categoryId: categoryId!,
    type,
    level: level.trim() || undefined,
    format,
    capacity: Number(capacity),
    sessionCount: Number(sessionCount),
    durationMinutes: Number(durationMinutes),
    priceDecimal: Number(price),
  });

  const persistSessions = async (id: string) => {
    const duration = Number(durationMinutes) || 60;
    const capacitySeats = Number(capacity) || 1;
    for (const session of sessions) {
      if (session.existingId) continue;
      const startsAt = toIso(session.date, session.time);
      if (!startsAt) continue;
      const ends = new Date(startsAt);
      ends.setMinutes(ends.getMinutes() + duration);
      await createCourseSession(id, {
        startsAt,
        endsAt: ends.toISOString(),
        seatsTotal: capacitySeats,
      });
    }
  };

  const saveCourse = async (publish: boolean) => {
    if (!categoryId) {
      setError(t('tutorDashboard.selectCategory'));
      return;
    }
    if (publish && sessions.length === 0) {
      setError(t('tutorDashboard.noSessionsAdded'));
      return;
    }

    setSaving(true);
    setError(undefined);
    try {
      const payload = buildPayload();
      let id = courseId;
      if (id) {
        await updateCourse(id, payload);
      } else {
        const created = await createCourse(payload);
        id = created.id;
      }

      await persistSessions(id);

      if (publish) {
        await publishCourse(id);
      }

      await queryClient.invalidateQueries({ queryKey: ['tutor'] });
      await queryClient.invalidateQueries({ queryKey: ['course', id] });
      router.replace('/tutor-dashboard/courses');
    } catch (err) {
      setError(err instanceof ApiError ? err.message : t('common.error'));
    } finally {
      setSaving(false);
    }
  };

  const loading =
    categoriesQuery.isLoading || (isEdit && (courseQuery.isLoading || !hydrated));
  const loadError = categoriesQuery.isError || (isEdit && courseQuery.isError);

  if (loading) {
    return (
      <>
        <Stack.Screen
          options={{
            title: isEdit ? t('tutorDashboard.editTitle') : t('tutorDashboard.createTitle'),
            headerStyle: { backgroundColor: colors.background },
            headerTintColor: colors.primary,
          }}
        />
        <LoadingState />
      </>
    );
  }

  if (loadError) {
    return (
      <>
        <Stack.Screen
          options={{
            title: isEdit ? t('tutorDashboard.editTitle') : t('tutorDashboard.createTitle'),
            headerStyle: { backgroundColor: colors.background },
            headerTintColor: colors.primary,
          }}
        />
        <ErrorState
          onRetry={() => {
            categoriesQuery.refetch();
            if (courseId) courseQuery.refetch();
          }}
        />
      </>
    );
  }

  return (
    <>
      <Stack.Screen
        options={{
          title: isEdit ? t('tutorDashboard.editTitle') : t('tutorDashboard.createTitle'),
          headerStyle: { backgroundColor: colors.background },
          headerTintColor: colors.primary,
        }}
      />
      <ScrollView style={styles.root} contentContainerStyle={styles.content}>
        <View style={styles.progress}>
          <Text style={styles.progressLabel}>
            {stepIndex + 1}/{STEPS.length} · {stepLabel}
          </Text>
          <View style={styles.progressTrack}>
            {STEPS.map((s, i) => (
              <View
                key={s}
                style={[styles.progressDot, i <= stepIndex ? styles.progressDotActive : null]}
              />
            ))}
          </View>
        </View>

        {step === 'basics' ? (
          <View style={styles.section}>
            <TextInput
              label={t('tutorDashboard.courseTitle')}
              value={title}
              onChangeText={setTitle}
            />
            <TextInput
              label={t('tutorDashboard.description')}
              value={description}
              onChangeText={setDescription}
              multiline
              style={styles.multiline}
            />
          </View>
        ) : null}

        {step === 'category' ? (
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>{t('tutorDashboard.selectCategory')}</Text>
            <View style={styles.chipWrap}>
              {parents.map((parent) => (
                <Chip
                  key={parent.id}
                  label={categoryLabel(parent, language)}
                  selected={parentId === parent.id}
                  onPress={() => onSelectParent(parent)}
                />
              ))}
            </View>
            {children.length > 0 ? (
              <>
                <Text style={styles.sectionTitle}>{t('tutorDashboard.selectSubcategory')}</Text>
                <View style={styles.chipWrap}>
                  {children.map((child) => (
                    <Chip
                      key={child.id}
                      label={categoryLabel(child, language)}
                      selected={categoryId === child.id}
                      onPress={() => setCategoryId(child.id)}
                    />
                  ))}
                </View>
              </>
            ) : null}
            <Text style={styles.hint}>
              {t('explore.type')}: {type}
            </Text>
          </View>
        ) : null}

        {step === 'details' ? (
          <View style={styles.section}>
            <TextInput
              label={t('tutorDashboard.level')}
              value={level}
              onChangeText={setLevel}
              placeholder="Beginner / Intermediate / Advanced"
            />
            <Text style={styles.sectionTitle}>{t('tutorDashboard.format')}</Text>
            <View style={styles.chipWrap}>
              {(['Online', 'InPerson', 'Hybrid'] as CourseFormat[]).map((value) => (
                <Chip
                  key={value}
                  label={value}
                  selected={format === value}
                  onPress={() => setFormat(value)}
                />
              ))}
            </View>
            <TextInput
              label={t('tutorDashboard.capacity')}
              value={capacity}
              onChangeText={setCapacity}
              keyboardType="number-pad"
            />
            <TextInput
              label={t('tutorDashboard.sessionCount')}
              value={sessionCount}
              onChangeText={setSessionCount}
              keyboardType="number-pad"
            />
            <TextInput
              label={t('tutorDashboard.durationMinutes')}
              value={durationMinutes}
              onChangeText={setDurationMinutes}
              keyboardType="number-pad"
            />
            <TextInput
              label={t('tutorDashboard.price')}
              value={price}
              onChangeText={setPrice}
              keyboardType="decimal-pad"
            />
          </View>
        ) : null}

        {step === 'schedule' ? (
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>{t('tutorDashboard.addSession')}</Text>
            <TextInput
              label={t('tutorDashboard.sessionDate')}
              value={draftDate}
              onChangeText={setDraftDate}
              placeholder="2026-10-01"
              autoCapitalize="none"
            />
            <TextInput
              label={t('tutorDashboard.sessionTime')}
              value={draftTime}
              onChangeText={setDraftTime}
              placeholder="16:00"
              autoCapitalize="none"
            />
            <Button title={t('tutorDashboard.addSession')} variant="secondary" onPress={addSession} />

            <Text style={styles.sectionTitle}>{t('tutorDashboard.sessionsAdded')}</Text>
            {sessions.length === 0 ? (
              <Text style={styles.hint}>{t('tutorDashboard.noSessionsAdded')}</Text>
            ) : (
              sessions.map((session) => {
                const iso = toIso(session.date, session.time);
                return (
                  <View key={session.key} style={styles.sessionRow}>
                    <View style={styles.sessionInfo}>
                      <Text style={styles.sessionTitle}>
                        {iso
                          ? `${formatDate(iso, language)} · ${formatTime(iso, language)}`
                          : `${session.date} ${session.time}`}
                      </Text>
                      {session.existingId ? (
                        <Text style={styles.hint}>{session.existingId.slice(0, 8)}…</Text>
                      ) : null}
                    </View>
                    {!session.existingId ? (
                      <Pressable onPress={() => removeSession(session.key)} hitSlop={8}>
                        <Text style={styles.remove}>{t('tutorDashboard.removeSession')}</Text>
                      </Pressable>
                    ) : null}
                  </View>
                );
              })
            )}
          </View>
        ) : null}

        {step === 'review' ? (
          <View style={styles.reviewCard}>
            <Text style={styles.reviewTitle}>{title}</Text>
            <Text style={styles.reviewBody}>{description}</Text>
            <Text style={styles.hint}>
              {type} · {format} · {t('tutorDashboard.capacity')} {capacity}
            </Text>
            <Text style={styles.hint}>
              {t('tutorDashboard.sessionCount')}: {sessionCount} · {t('tutorDashboard.price')}:{' '}
              {price}
            </Text>
            <Text style={styles.hint}>
              {t('tutorDashboard.sessionsAdded')}: {sessions.length}
            </Text>
          </View>
        ) : null}

        {error ? <Text style={styles.error}>{error}</Text> : null}

        <View style={styles.actions}>
          {stepIndex > 0 ? (
            <Button
              title={t('tutorDashboard.back')}
              variant="ghost"
              onPress={() => setStep(STEPS[stepIndex - 1])}
              disabled={saving}
            />
          ) : null}
          {step !== 'review' ? (
            <Button
              title={t('tutorDashboard.next')}
              onPress={() => setStep(STEPS[stepIndex + 1])}
              disabled={!canContinue() || saving}
            />
          ) : (
            <>
              <Button
                title={t('tutorDashboard.saveDraft')}
                variant="secondary"
                loading={saving}
                onPress={() => saveCourse(false)}
              />
              <Button
                title={t('tutorDashboard.publish')}
                loading={saving}
                onPress={() => saveCourse(true)}
              />
            </>
          )}
        </View>
      </ScrollView>
    </>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1, backgroundColor: colors.background },
  content: { padding: spacing.xl, gap: spacing.lg, paddingBottom: spacing.massive },
  progress: { gap: spacing.sm },
  progressLabel: { ...typography.caption, color: colors.textSecondary, fontWeight: '600' },
  progressTrack: { flexDirection: 'row', gap: spacing.xs },
  progressDot: {
    flex: 1,
    height: 4,
    borderRadius: radius.full,
    backgroundColor: colors.border,
  },
  progressDotActive: { backgroundColor: colors.primary },
  section: { gap: spacing.lg },
  sectionTitle: { ...typography.subheading, color: colors.text, fontSize: 16 },
  chipWrap: { flexDirection: 'row', flexWrap: 'wrap', gap: spacing.sm },
  multiline: { minHeight: 120, textAlignVertical: 'top' },
  hint: { ...typography.caption, color: colors.textMuted },
  sessionRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: colors.white,
    borderRadius: radius.lg,
    padding: spacing.lg,
    gap: spacing.md,
    ...shadows.sm,
  },
  sessionInfo: { flex: 1, gap: spacing.xxs },
  sessionTitle: { ...typography.body, color: colors.text, fontWeight: '600' },
  remove: { ...typography.caption, color: colors.error, fontWeight: '700' },
  reviewCard: {
    backgroundColor: colors.white,
    borderRadius: radius.xl,
    padding: spacing.xl,
    gap: spacing.sm,
    ...shadows.sm,
  },
  reviewTitle: { ...typography.heading, color: colors.text, fontSize: 22 },
  reviewBody: { ...typography.body, color: colors.textSecondary, lineHeight: 22 },
  error: { ...typography.caption, color: colors.error },
  actions: { gap: spacing.sm, marginTop: spacing.sm },
});
