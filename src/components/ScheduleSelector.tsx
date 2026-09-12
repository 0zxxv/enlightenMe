import React, { useMemo } from 'react';
import { Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import { useTranslation } from '@/i18n';
import { colors, radius, spacing, typography } from '@/theme';
import type { CourseSession } from '@/types/models';
import { formatDate, formatTime } from '@/utils/format';

type Props = {
  sessions: CourseSession[];
  selectedSessionId?: string;
  onSelectDate: (dateKey: string) => void;
  onSelectSession: (sessionId: string) => void;
  selectedDateKey?: string;
};

function dateKey(value: string) {
  return new Date(value).toISOString().slice(0, 10);
}

export function ScheduleSelector({
  sessions,
  selectedSessionId,
  onSelectDate,
  onSelectSession,
  selectedDateKey,
}: Props) {
  const { t, language } = useTranslation();

  const dates = useMemo(() => {
    const map = new Map<string, CourseSession[]>();
    sessions.forEach((session) => {
      const key = dateKey(session.startsAt);
      const list = map.get(key) ?? [];
      list.push(session);
      map.set(key, list);
    });
    return Array.from(map.entries());
  }, [sessions]);

  const times = selectedDateKey
    ? dates.find(([key]) => key === selectedDateKey)?.[1] ?? []
    : [];

  if (!sessions.length) {
    return <Text style={styles.empty}>{t('booking.noSessions')}</Text>;
  }

  return (
    <View style={styles.wrap}>
      <Text style={styles.label}>{t('booking.selectDate')}</Text>
      <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.row}>
        {dates.map(([key, list]) => (
          <Pressable
            key={key}
            onPress={() => onSelectDate(key)}
            style={[styles.chip, selectedDateKey === key && styles.chipSelected]}
          >
            <Text style={[styles.chipText, selectedDateKey === key && styles.chipTextSelected]}>
              {formatDate(list[0].startsAt, language)}
            </Text>
          </Pressable>
        ))}
      </ScrollView>

      {selectedDateKey ? (
        <>
          <Text style={styles.label}>{t('booking.selectTime')}</Text>
          <View style={styles.times}>
            {times.map((session) => (
              <Pressable
                key={session.id}
                onPress={() => onSelectSession(session.id)}
                style={[
                  styles.time,
                  selectedSessionId === session.id && styles.chipSelected,
                ]}
              >
                <Text
                  style={[
                    styles.chipText,
                    selectedSessionId === session.id && styles.chipTextSelected,
                  ]}
                >
                  {formatTime(session.startsAt, language)}
                </Text>
              </Pressable>
            ))}
          </View>
        </>
      ) : null}
    </View>
  );
}

const styles = StyleSheet.create({
  wrap: {
    gap: spacing.md,
  },
  label: {
    ...typography.caption,
    color: colors.textSecondary,
    fontWeight: '600',
  },
  row: {
    gap: spacing.sm,
  },
  times: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: spacing.sm,
  },
  chip: {
    paddingHorizontal: spacing.lg,
    paddingVertical: spacing.sm,
    borderRadius: radius.md,
    backgroundColor: colors.white,
    borderWidth: 1,
    borderColor: colors.border,
  },
  time: {
    paddingHorizontal: spacing.lg,
    paddingVertical: spacing.sm,
    borderRadius: radius.md,
    backgroundColor: colors.white,
    borderWidth: 1,
    borderColor: colors.border,
  },
  chipSelected: {
    backgroundColor: colors.primary,
    borderColor: colors.primary,
  },
  chipText: {
    ...typography.caption,
    color: colors.text,
    fontWeight: '600',
  },
  chipTextSelected: {
    color: colors.white,
  },
  empty: {
    ...typography.body,
    color: colors.textSecondary,
  },
});
