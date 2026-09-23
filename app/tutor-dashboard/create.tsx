import { Ionicons } from '@expo/vector-icons';
import { Image } from 'expo-image';
import * as ImagePicker from 'expo-image-picker';
import { Stack, useLocalSearchParams, useRouter } from 'expo-router';
import React, { useEffect, useMemo, useState } from 'react';
import { Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { Button } from '@/components/Button';
import { Chip } from '@/components/Chip';
import { CourseCard } from '@/components/CourseCard';
import { ErrorState } from '@/components/ErrorState';
import { LoadingState } from '@/components/LoadingState';
import { TextInput } from '@/components/TextInput';
import { COURSE_SKILL_OPTIONS, SCHOOL_STAGES } from '@/constants/catalog';
import { LOCAL_COURSE_IMAGES } from '@/utils/courseImages';
import { SERVICE_TYPE_SINGULAR_KEYS, normalizeServiceType } from '@/domain/marketplace';
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
import type { Course, CourseFormat, ServiceType } from '@/types/models';
import { formatDate, formatTime } from '@/utils/format';

type WizardStep = 1 | 2 | 3 | 4;

type DraftSession = {
  key: string;
  date: string;
  time: string;
  existingId?: string;
};

const STEPS: WizardStep[] = [1, 2, 3, 4];
const HOURS = Array.from({ length: 13 }, (_, i) => i + 8);
const MINUTES = ['00', '15', '30', '45'] as const;

function resolveCategoryId(
  parents: CategoryNode[],
  serviceType: ServiceType,
): string | undefined {
  const matchParent = parents.find((parent) => {
    const slug = (parent.slug ?? '').toLowerCase();
    const name = (parent.nameEn ?? '').toLowerCase();
    if (serviceType === 'SchoolCourse') {
      return slug.includes('school') || name.includes('school');
    }
    if (serviceType === 'UniversityCourse') {
      return slug.includes('university') || name.includes('university');
    }
    return slug.includes('skill') || slug.includes('training') || name.includes('skill');
  });
  if (!matchParent) return undefined;
  const children = matchParent.children ?? [];
  return children[0]?.id ?? matchParent.id;
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

function daysInMonth(year: number, month: number) {
  return new Date(year, month + 1, 0).getDate();
}

function startWeekday(year: number, month: number) {
  return new Date(year, month, 1).getDay();
}

function isHttpsUrl(uri: string | undefined) {
  return Boolean(uri && /^https:\/\//i.test(uri));
}

export default function CreateCourseScreen() {
  const { t, language } = useTranslation();
  const router = useRouter();
  const queryClient = useQueryClient();
  const { courseId: courseIdParam } = useLocalSearchParams<{ courseId?: string }>();
  const courseId = typeof courseIdParam === 'string' ? courseIdParam : undefined;
  const isEdit = Boolean(courseId);

  const [step, setStep] = useState<WizardStep>(1);
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [serviceType, setServiceType] = useState<ServiceType>('TrainingSkill');
  const [skills, setSkills] = useState<string[]>([]);
  const [customSkill, setCustomSkill] = useState('');
  const [stage, setStage] = useState('');
  const [grade, setGrade] = useState('');
  const [format, setFormat] = useState<CourseFormat>('Online');
  const [capacity] = useState('10');
  const [sessionCount, setSessionCount] = useState('1');
  const [durationMinutes, setDurationMinutes] = useState('60');
  const [price, setPrice] = useState('25');
  const [paymentQrUri, setPaymentQrUri] = useState<string>();
  const [courseImageUri, setCourseImageUri] = useState<string>();
  const [courseImageGridKey, setCourseImageGridKey] = useState<string>();
  const [calendarMonth, setCalendarMonth] = useState(() => {
    const now = new Date();
    return new Date(now.getFullYear(), now.getMonth(), 1);
  });
  const [selectedDay, setSelectedDay] = useState<number | null>(null);
  const [draftHour, setDraftHour] = useState(16);
  const [draftMinute, setDraftMinute] = useState('00');
  const [sessions, setSessions] = useState<DraftSession[]>([]);
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

  const stageGrades = useMemo(() => {
    const found = SCHOOL_STAGES.find((s) => s.id === stage);
    return found?.grades ?? [];
  }, [stage]);

  useEffect(() => {
    if (!courseQuery.data || !categoriesQuery.data || hydrated) return;
    const course = courseQuery.data;
    setTitle(course.title);
    setDescription(course.description);
    setServiceType(
      normalizeServiceType(String(course.serviceType ?? course.type ?? '')) ?? 'TrainingSkill',
    );
    if (course.skillCategory) {
      setSkills(
        course.skillCategory
          .split(',')
          .map((s) => s.trim())
          .filter(Boolean),
      );
    }
    setStage(course.stage ?? '');
    setGrade(course.grade ?? '');
    setFormat(course.format);
    setSessionCount(String(course.sessionCount));
    setDurationMinutes(String(course.durationMinutes ?? 60));
    setPrice(String(course.priceDecimal));
    if (course.imageUrl && isHttpsUrl(course.imageUrl)) {
      setCourseImageUri(course.imageUrl);
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

  const stepLabel = useMemo(() => {
    const map: Record<WizardStep, string> = {
      1: t('tutorDashboard.step1'),
      2: t('tutorDashboard.step2'),
      3: t('tutorDashboard.step3'),
      4: t('tutorDashboard.step4'),
    };
    return map[step];
  }, [step, t]);

  const selectedDateIso = useMemo(() => {
    if (!selectedDay) return undefined;
    const y = calendarMonth.getFullYear();
    const m = calendarMonth.getMonth();
    return `${y}-${pad(m + 1)}-${pad(selectedDay)}`;
  }, [calendarMonth, selectedDay]);

  const toggleSkill = (skill: string) => {
    setSkills((prev) =>
      prev.includes(skill) ? prev.filter((s) => s !== skill) : [...prev, skill],
    );
  };

  const addCustomSkill = () => {
    const next = customSkill.trim();
    if (!next) return;
    setSkills((prev) => (prev.includes(next) ? prev : [...prev, next]));
    setCustomSkill('');
  };

  const pickImage = async (kind: 'course' | 'qr') => {
    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ['images'],
      quality: 0.85,
    });
    if (result.canceled || !result.assets[0]?.uri) return;
    const uri = result.assets[0].uri;
    if (kind === 'course') {
      setCourseImageUri(uri);
      setCourseImageGridKey(undefined);
    } else {
      setPaymentQrUri(uri);
    }
  };

  const addSession = () => {
    if (!selectedDateIso) return;
    const time = `${pad(draftHour)}:${draftMinute}`;
    if (!toIso(selectedDateIso, time)) {
      setError(t('common.error'));
      return;
    }
    setError(undefined);
    setSessions((prev) => [
      ...prev,
      {
        key: `local-${Date.now()}-${prev.length}`,
        date: selectedDateIso,
        time,
      },
    ]);
    setSelectedDay(null);
  };

  const removeSession = (key: string) => {
    setSessions((prev) => prev.filter((s) => s.key !== key));
  };

  const canContinue = () => {
    if (step === 1) {
      return title.trim().length > 0 && description.trim().length > 0 && Boolean(serviceType);
    }
    if (step === 2) {
      const nums =
        Number(sessionCount) > 0 &&
        Number(durationMinutes) > 0 &&
        Number(price) >= 0;
      if (serviceType === 'SchoolCourse') {
        return nums && Boolean(stage) && Boolean(grade);
      }
      return nums;
    }
    return true;
  };

  const buildPayload = (categoryId: string) => {
    const imageUrl = isHttpsUrl(courseImageUri) ? courseImageUri : undefined;
    return {
      title: title.trim(),
      description: description.trim(),
      categoryId,
      serviceType,
      skillCategory: skills.length ? skills.join(', ') : undefined,
      grade: serviceType === 'SchoolCourse' ? grade || undefined : undefined,
      stage: serviceType === 'SchoolCourse' ? stage || undefined : undefined,
      format,
      capacity: Number(capacity),
      sessionCount: Number(sessionCount),
      durationMinutes: Number(durationMinutes),
      priceDecimal: Number(price),
      imageUrl,
    };
  };

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
    const parents = categoriesQuery.data ?? [];
    const categoryId = resolveCategoryId(parents, serviceType);
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
      const payload = buildPayload(categoryId);
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

  const previewCourse = useMemo((): Course => {
    const previewTitle =
      courseImageGridKey && !courseImageUri
        ? `${title.trim()} ${courseImageGridKey}`
        : title.trim();
    return {
      id: 'preview',
      title: previewTitle || t('tutorDashboard.courseTitle'),
      description: description.trim() || '—',
      categoryId: '',
      serviceType,
      skillCategory: skills.join(', ') || null,
      priceDecimal: Number(price) || 0,
      currency: 'BHD',
      sessionCount: Number(sessionCount) || 1,
      capacity: Number(capacity) || 10,
      format,
      durationMinutes: Number(durationMinutes) || 60,
      status: 'Draft',
      ratingAvg: 0,
      ratingCount: 0,
      imageUrl: courseImageUri ?? null,
      grade: grade || null,
      stage: stage || null,
    };
  }, [
    capacity,
    courseImageGridKey,
    courseImageUri,
    description,
    format,
    grade,
    price,
    serviceType,
    sessionCount,
    skills,
    stage,
    durationMinutes,
    t,
    title,
  ]);

  const calendarCells = useMemo(() => {
    const year = calendarMonth.getFullYear();
    const month = calendarMonth.getMonth();
    const total = daysInMonth(year, month);
    const leading = startWeekday(year, month);
    const cells: (number | null)[] = [];
    for (let i = 0; i < leading; i += 1) cells.push(null);
    for (let d = 1; d <= total; d += 1) cells.push(d);
    return cells;
  }, [calendarMonth]);

  const monthLabel = calendarMonth.toLocaleDateString(language === 'ar' ? 'ar-BH' : 'en-US', {
    month: 'long',
    year: 'numeric',
  });

  const formatChipLabel = (value: CourseFormat) => {
    if (value === 'Online') return t('common.online');
    if (value === 'InPerson') return t('common.inPerson');
    return t('common.hybrid');
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
            {step}/{STEPS.length} · {stepLabel}
          </Text>
          <View style={styles.progressTrack}>
            {STEPS.map((s) => (
              <View
                key={s}
                style={[styles.progressDot, s <= step ? styles.progressDotActive : null]}
              />
            ))}
          </View>
        </View>

        {step === 1 ? (
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>{t('marketplace.whatService')}</Text>
            <View style={styles.chipWrap}>
              {(['SchoolCourse', 'UniversityCourse', 'TrainingSkill'] as ServiceType[]).map(
                (value) => (
                  <Chip
                    key={value}
                    label={t(SERVICE_TYPE_SINGULAR_KEYS[value])}
                    selected={serviceType === value}
                    onPress={() => {
                      setServiceType(value);
                      if (value !== 'SchoolCourse') {
                        setStage('');
                        setGrade('');
                      }
                    }}
                  />
                ),
              )}
            </View>

            <Text style={styles.sectionTitle}>{t('tutorDashboard.skills')}</Text>
            <View style={styles.chipWrap}>
              {COURSE_SKILL_OPTIONS.map((skill) => (
                <Chip
                  key={skill}
                  label={skill}
                  selected={skills.includes(skill)}
                  onPress={() => toggleSkill(skill)}
                />
              ))}
            </View>
            <View style={styles.addSkillRow}>
              <TextInput
                value={customSkill}
                onChangeText={setCustomSkill}
                placeholder={t('tutorDashboard.customSkillPlaceholder')}
                style={styles.addSkillInput}
              />
              <Button title={t('tutorDashboard.addSkill')} variant="secondary" onPress={addCustomSkill} />
            </View>

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

        {step === 2 ? (
          <View style={styles.section}>
            {serviceType === 'SchoolCourse' ? (
              <>
                <Text style={styles.sectionTitle}>{t('tutorDashboard.stage')}</Text>
                <View style={styles.chipWrap}>
                  {SCHOOL_STAGES.map((item) => (
                    <Chip
                      key={item.id}
                      label={language === 'ar' ? item.ar : item.en}
                      selected={stage === item.id}
                      onPress={() => {
                        setStage(item.id);
                        setGrade('');
                      }}
                    />
                  ))}
                </View>
                {stageGrades.length > 0 ? (
                  <>
                    <Text style={styles.sectionTitle}>{t('tutorDashboard.grade')}</Text>
                    <View style={styles.chipWrap}>
                      {stageGrades.map((g) => (
                        <Chip
                          key={g}
                          label={g}
                          selected={grade === g}
                          onPress={() => setGrade(g)}
                        />
                      ))}
                    </View>
                  </>
                ) : null}
              </>
            ) : null}

            <Text style={styles.sectionTitle}>{t('tutorDashboard.format')}</Text>
            <View style={styles.chipWrap}>
              {(['Online', 'InPerson', 'Hybrid'] as CourseFormat[]).map((value) => (
                <Chip
                  key={value}
                  label={formatChipLabel(value)}
                  selected={format === value}
                  onPress={() => setFormat(value)}
                />
              ))}
            </View>

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

            <Text style={styles.sectionTitle}>{t('tutorDashboard.paymentQr')}</Text>
            <Button
              title={t('tutorDashboard.uploadPaymentQr')}
              variant="secondary"
              onPress={() => pickImage('qr')}
            />
            {paymentQrUri ? (
              <Image source={{ uri: paymentQrUri }} style={styles.qrPreview} contentFit="contain" />
            ) : null}
          </View>
        ) : null}

        {step === 3 ? (
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>{t('tutorDashboard.courseImage')}</Text>
            <Button
              title={t('tutorDashboard.pickImage')}
              variant="secondary"
              onPress={() => pickImage('course')}
            />
            {courseImageUri ? (
              <Image source={{ uri: courseImageUri }} style={styles.heroPreview} contentFit="cover" />
            ) : null}

            <Text style={styles.sectionTitle}>{t('tutorDashboard.pickGridImage')}</Text>
            <View style={styles.imageGrid}>
              {LOCAL_COURSE_IMAGES.map((entry) => (
                <Pressable
                  key={entry.key}
                  style={[
                    styles.imageGridItem,
                    courseImageGridKey === entry.key && styles.imageGridItemSelected,
                  ]}
                  onPress={() => {
                    setCourseImageGridKey(entry.key);
                    setCourseImageUri(undefined);
                  }}
                >
                  <Image source={entry.source} style={styles.imageGridThumb} contentFit="cover" />
                </Pressable>
              ))}
            </View>

            <Text style={styles.sectionTitle}>{t('tutorDashboard.calendar')}</Text>
            <View style={styles.calendarHeader}>
              <Pressable
                onPress={() =>
                  setCalendarMonth(
                    (prev) => new Date(prev.getFullYear(), prev.getMonth() - 1, 1),
                  )
                }
                hitSlop={8}
              >
                <Ionicons name="chevron-back" size={22} color={colors.primary} />
              </Pressable>
              <Text style={styles.calendarMonth}>{monthLabel}</Text>
              <Pressable
                onPress={() =>
                  setCalendarMonth(
                    (prev) => new Date(prev.getFullYear(), prev.getMonth() + 1, 1),
                  )
                }
                hitSlop={8}
              >
                <Ionicons name="chevron-forward" size={22} color={colors.primary} />
              </Pressable>
            </View>
            <View style={styles.calendarGrid}>
              {calendarCells.map((day, index) =>
                day === null ? (
                  <View key={`empty-${index}`} style={styles.calendarCell} />
                ) : (
                  <Pressable
                    key={day}
                    style={[
                      styles.calendarCell,
                      selectedDay === day && styles.calendarCellSelected,
                    ]}
                    onPress={() => setSelectedDay(day)}
                  >
                    <Text
                      style={[
                        styles.calendarDayText,
                        selectedDay === day && styles.calendarDayTextSelected,
                      ]}
                    >
                      {day}
                    </Text>
                  </Pressable>
                ),
              )}
            </View>

            <Text style={styles.sectionTitle}>{t('tutorDashboard.pickTime')}</Text>
            <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.timeScroll}>
              <View style={styles.chipWrap}>
                {HOURS.map((h) => (
                  <Chip
                    key={h}
                    label={pad(h)}
                    selected={draftHour === h}
                    onPress={() => setDraftHour(h)}
                  />
                ))}
              </View>
            </ScrollView>
            <View style={styles.chipWrap}>
              {MINUTES.map((m) => (
                <Chip
                  key={m}
                  label={m}
                  selected={draftMinute === m}
                  onPress={() => setDraftMinute(m)}
                />
              ))}
            </View>
            <Button
              title={t('tutorDashboard.addSession')}
              variant="secondary"
              onPress={addSession}
              disabled={!selectedDateIso}
            />

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

        {step === 4 ? (
          <View style={styles.section}>
            <CourseCard course={previewCourse} showFavorite={false} variant="featured" />
          </View>
        ) : null}

        {error ? <Text style={styles.error}>{error}</Text> : null}

        <View style={styles.actions}>
          {step > 1 ? (
            <Button
              title={t('tutorDashboard.back')}
              variant="ghost"
              onPress={() => setStep((step - 1) as WizardStep)}
              disabled={saving}
            />
          ) : null}
          {step < 4 ? (
            <Button
              title={t('tutorDashboard.next')}
              onPress={() => setStep((step + 1) as WizardStep)}
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
  addSkillRow: { flexDirection: 'row', alignItems: 'flex-end', gap: spacing.sm },
  addSkillInput: { flex: 1 },
  hint: { ...typography.caption, color: colors.textMuted },
  qrPreview: {
    width: '100%',
    height: 160,
    borderRadius: radius.lg,
    backgroundColor: colors.white,
  },
  heroPreview: {
    width: '100%',
    height: 180,
    borderRadius: radius.xl,
    backgroundColor: colors.border,
  },
  imageGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: spacing.sm,
  },
  imageGridItem: {
    width: '30%',
    aspectRatio: 1,
    borderRadius: radius.lg,
    overflow: 'hidden',
    borderWidth: 2,
    borderColor: 'transparent',
  },
  imageGridItemSelected: {
    borderColor: colors.primary,
  },
  imageGridThumb: {
    width: '100%',
    height: '100%',
  },
  calendarHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  calendarMonth: {
    ...typography.subheading,
    color: colors.text,
    fontSize: 16,
  },
  calendarGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
  },
  calendarCell: {
    width: `${100 / 7}%`,
    aspectRatio: 1,
    alignItems: 'center',
    justifyContent: 'center',
    padding: 2,
  },
  calendarCellSelected: {
    backgroundColor: colors.lavenderSoft,
    borderRadius: radius.full,
  },
  calendarDayText: {
    ...typography.body,
    color: colors.text,
    fontWeight: '600',
  },
  calendarDayTextSelected: {
    color: colors.primary,
    fontWeight: '800',
  },
  timeScroll: { flexGrow: 0 },
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
  error: { ...typography.caption, color: colors.error },
  actions: { gap: spacing.sm, marginTop: spacing.sm },
});
