import { useRouter } from 'expo-router';
import React from 'react';
import {
  FlatList,
  Pressable,
  RefreshControl,
  StyleSheet,
  Text,
  View,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Avatar } from '@/components/Avatar';
import { EmptyState } from '@/components/EmptyState';
import { ErrorState } from '@/components/ErrorState';
import { LoadingState } from '@/components/LoadingState';
import { useAuth } from '@/features/auth/useAuth';
import { useConversations } from '@/features/messages/hooks';
import { useRefresh } from '@/hooks/useRefresh';
import { useTranslation } from '@/i18n';
import { colors, radius, shadows, spacing, typography } from '@/theme';
import { fullName } from '@/utils/format';

export default function TutorMessagesScreen() {
  const { t } = useTranslation();
  const { user } = useAuth();
  const router = useRouter();
  const conversationsQuery = useConversations();
  const { refreshing, onRefresh } = useRefresh(async () => {
    await conversationsQuery.refetch();
  });

  return (
    <SafeAreaView style={styles.safe} edges={['top']}>
      <Text style={styles.title}>{t('messages.title')}</Text>
      {conversationsQuery.isLoading ? <LoadingState /> : null}
      {conversationsQuery.isError ? (
        <ErrorState onRetry={() => conversationsQuery.refetch()} />
      ) : null}
      {!conversationsQuery.isLoading && !conversationsQuery.isError ? (
        <FlatList
          data={conversationsQuery.data ?? []}
          keyExtractor={(item) => item.id}
          contentContainerStyle={styles.list}
          refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} />}
          ListEmptyComponent={
            <EmptyState title={t('messages.empty')} subtitle={t('messages.emptyHintTutor')} />
          }
          renderItem={({ item }) => {
            const other = item.participants.find((p) => p.userId !== user?.id)?.user;
            const name = fullName(other?.firstName, other?.lastName) || t('messages.title');
            const preview = item.messages?.[0]?.body;
            return (
              <Pressable
                style={styles.card}
                onPress={() => router.push(`/conversation/${item.id}`)}
              >
                <Avatar name={name} size={48} />
                <View style={styles.body}>
                  <Text style={styles.name}>{name}</Text>
                  {preview ? (
                    <Text style={styles.preview} numberOfLines={1}>
                      {preview}
                    </Text>
                  ) : null}
                </View>
              </Pressable>
            );
          }}
        />
      ) : null}
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: colors.background },
  title: {
    ...typography.heading,
    color: colors.text,
    paddingHorizontal: spacing.xl,
    paddingTop: spacing.xl,
    marginBottom: spacing.md,
  },
  list: { paddingHorizontal: spacing.xl, paddingBottom: spacing.massive },
  card: {
    flexDirection: 'row',
    gap: spacing.md,
    backgroundColor: colors.white,
    borderRadius: radius.lg,
    padding: spacing.lg,
    marginBottom: spacing.md,
    ...shadows.sm,
  },
  body: { flex: 1, justifyContent: 'center', gap: spacing.xs },
  name: { ...typography.subheading, color: colors.text },
  preview: { ...typography.caption, color: colors.textSecondary },
});
