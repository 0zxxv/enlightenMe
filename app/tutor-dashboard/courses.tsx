import { Stack } from 'expo-router';
import React from 'react';
import { FlatList, RefreshControl, StyleSheet, Text, View } from 'react-native';
import { EmptyState } from '@/components/EmptyState';
import { ErrorState } from '@/components/ErrorState';
import { LoadingState } from '@/components/LoadingState';
import { useQuery } from '@tanstack/react-query';
import { useRefresh } from '@/hooks/useRefresh';
import { useTranslation } from '@/i18n';
import { getTutorCourses } from '@/services/api/tutorDashboard';
import { colors, radius, spacing, typography } from '@/theme';

export default function TutorCoursesScreen() {
  const { t } = useTranslation();
  const query = useQuery({ queryKey: ['tutor', 'courses'], queryFn: getTutorCourses });
  const { refreshing, onRefresh } = useRefresh(async () => {
    await query.refetch();
  });

  return (
    <>
      <Stack.Screen
        options={{
          title: t('tutorDashboard.courses'),
          headerStyle: { backgroundColor: colors.background },
          headerTintColor: colors.primary,
        }}
      />
      {query.isLoading ? <LoadingState /> : null}
      {query.isError ? <ErrorState onRetry={() => query.refetch()} /> : null}
      {!query.isLoading && !query.isError ? (
        <FlatList
          style={styles.root}
          contentContainerStyle={styles.content}
          data={query.data ?? []}
          keyExtractor={(item) => item.id}
          refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} />}
          ListEmptyComponent={<EmptyState title={t('tutorDashboard.emptyCourses')} />}
          renderItem={({ item }) => (
            <View style={styles.row}>
              <Text style={styles.title}>{item.title}</Text>
              <Text style={styles.meta}>
                {item.status} · {item.format}
              </Text>
            </View>
          )}
        />
      ) : null}
    </>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1, backgroundColor: colors.background },
  content: { padding: spacing.xl, paddingBottom: spacing.massive },
  row: {
    backgroundColor: colors.white,
    borderRadius: radius.lg,
    padding: spacing.lg,
    marginBottom: spacing.md,
  },
  title: { ...typography.subheading, color: colors.text },
  meta: { ...typography.caption, color: colors.textSecondary, marginTop: spacing.xs },
});
