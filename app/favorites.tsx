import { useNavigation } from 'expo-router';
import React, { useLayoutEffect } from 'react';
import { FlatList, RefreshControl, StyleSheet } from 'react-native';
import { CourseCard } from '@/components/CourseCard';
import { EmptyState } from '@/components/EmptyState';
import { ErrorState } from '@/components/ErrorState';
import { InstituteCard } from '@/components/InstituteCard';
import { LoadingState } from '@/components/LoadingState';
import { useFavorites } from '@/features/favorites/hooks';
import { useRefresh } from '@/hooks/useRefresh';
import { useTranslation } from '@/i18n';
import { colors, spacing } from '@/theme';

export default function FavoritesScreen() {
  const { t } = useTranslation();
  const navigation = useNavigation();
  const favoritesQuery = useFavorites();
  const { refreshing, onRefresh } = useRefresh(async () => {
    await favoritesQuery.refetch();
  });

  useLayoutEffect(() => {
    navigation.setOptions({
      title: t('favorites.title'),
      headerStyle: { backgroundColor: colors.background },
      headerTintColor: colors.primary,
    });
  }, [navigation, t]);

  if (favoritesQuery.isLoading) return <LoadingState />;
  if (favoritesQuery.isError) {
    return <ErrorState onRetry={() => favoritesQuery.refetch()} />;
  }

  return (
    <FlatList
      style={styles.root}
      contentContainerStyle={styles.content}
      data={favoritesQuery.data ?? []}
      keyExtractor={(item) => item.id}
      refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} />}
      ListEmptyComponent={<EmptyState title={t('favorites.empty')} />}
      renderItem={({ item }) => {
        if (item.course) return <CourseCard course={item.course} />;
        if (item.institute) return <InstituteCard institute={item.institute} />;
        return null;
      }}
    />
  );
}

const styles = StyleSheet.create({
  root: { flex: 1, backgroundColor: colors.background },
  content: { padding: spacing.xl, paddingBottom: spacing.massive },
});
