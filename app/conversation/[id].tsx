import { useLocalSearchParams, useNavigation } from 'expo-router';
import React, { useLayoutEffect, useMemo, useRef, useState } from 'react';
import {
  FlatList,
  KeyboardAvoidingView,
  Platform,
  StyleSheet,
  Text,
  View,
} from 'react-native';
import { Button } from '@/components/Button';
import { EmptyState } from '@/components/EmptyState';
import { ErrorState } from '@/components/ErrorState';
import { LoadingState } from '@/components/LoadingState';
import { TextInput } from '@/components/TextInput';
import { useAuth } from '@/features/auth/useAuth';
import {
  useConversationMessages,
  useConversationMeta,
  useReplyInConversation,
} from '@/features/messages/hooks';
import { useTranslation } from '@/i18n';
import { colors, radius, spacing, typography } from '@/theme';
import { fullName } from '@/utils/format';

export default function ConversationScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const { t } = useTranslation();
  const { user } = useAuth();
  const navigation = useNavigation();
  const listRef = useRef<FlatList>(null);
  const messagesQuery = useConversationMessages(id);
  const metaQuery = useConversationMeta(id);
  const [body, setBody] = useState('');

  const other = useMemo(
    () => metaQuery.data?.participants.find((p) => p.userId !== user?.id),
    [metaQuery.data, user?.id],
  );
  const recipientId = other?.userId;
  const reply = useReplyInConversation(id, recipientId);
  const title = fullName(other?.user?.firstName, other?.user?.lastName) || t('messages.title');

  useLayoutEffect(() => {
    navigation.setOptions({
      title,
      headerStyle: { backgroundColor: colors.background },
      headerTintColor: colors.primary,
    });
  }, [navigation, title]);

  if (messagesQuery.isLoading || metaQuery.isLoading) return <LoadingState />;
  if (messagesQuery.isError) {
    return <ErrorState onRetry={() => messagesQuery.refetch()} />;
  }

  const onSend = async () => {
    const text = body.trim();
    if (!text || reply.isPending || !recipientId) return;
    setBody('');
    try {
      await reply.mutateAsync(text);
      requestAnimationFrame(() => listRef.current?.scrollToEnd({ animated: true }));
    } catch {
      setBody(text);
    }
  };

  return (
    <KeyboardAvoidingView
      style={styles.root}
      behavior={Platform.OS === 'ios' ? 'padding' : undefined}
      keyboardVerticalOffset={88}
    >
      <FlatList
        ref={listRef}
        data={messagesQuery.data ?? []}
        keyExtractor={(item) => item.id}
        contentContainerStyle={styles.list}
        onContentSizeChange={() => listRef.current?.scrollToEnd({ animated: false })}
        ListEmptyComponent={<EmptyState title={t('messages.empty')} />}
        renderItem={({ item }) => {
          const mine = item.senderId === user?.id;
          return (
            <View style={[styles.bubble, mine ? styles.mine : styles.theirs]}>
              <Text style={[styles.body, mine && styles.mineText]}>{item.body}</Text>
            </View>
          );
        }}
      />
      <View style={styles.composer}>
        <TextInput
          value={body}
          onChangeText={setBody}
          placeholder={t('messages.placeholder')}
          onSubmitEditing={onSend}
          returnKeyType="send"
        />
        <Button
          title={t('messages.send')}
          onPress={onSend}
          loading={reply.isPending}
          disabled={!body.trim() || !recipientId}
        />
      </View>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1, backgroundColor: colors.background },
  list: { padding: spacing.xl, gap: spacing.sm, paddingBottom: spacing.xxl },
  bubble: {
    maxWidth: '80%',
    borderRadius: radius.lg,
    padding: spacing.md,
    marginBottom: spacing.sm,
  },
  mine: {
    alignSelf: 'flex-end',
    backgroundColor: colors.primary,
  },
  theirs: {
    alignSelf: 'flex-start',
    backgroundColor: colors.white,
  },
  body: { ...typography.body, color: colors.text },
  mineText: { color: colors.white },
  composer: {
    padding: spacing.lg,
    borderTopWidth: 1,
    borderTopColor: colors.border,
    gap: spacing.sm,
    backgroundColor: colors.backgroundElevated,
  },
});
