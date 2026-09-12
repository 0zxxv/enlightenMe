import { useLocalSearchParams, useNavigation } from 'expo-router';
import React, { useLayoutEffect, useState } from 'react';
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
import { useConversationMessages } from '@/features/messages/hooks';
import { useTranslation } from '@/i18n';
import { colors, radius, spacing, typography } from '@/theme';
import { useQueryClient } from '@tanstack/react-query';

export default function ConversationScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const { t } = useTranslation();
  const { user } = useAuth();
  const navigation = useNavigation();
  const messagesQuery = useConversationMessages(id);
  const [body, setBody] = useState('');
  const [sending, setSending] = useState(false);
  const qc = useQueryClient();

  useLayoutEffect(() => {
    navigation.setOptions({
      title: t('messages.title'),
      headerStyle: { backgroundColor: colors.background },
      headerTintColor: colors.primary,
    });
  }, [navigation, t]);

  if (messagesQuery.isLoading) return <LoadingState />;
  if (messagesQuery.isError) {
    return <ErrorState onRetry={() => messagesQuery.refetch()} />;
  }

  const onSend = async () => {
    if (!body.trim()) return;
    setSending(true);
    try {
      // Backend send requires recipientId; for existing conversation this screen
      // currently only displays. Keep send UI for follow-up when recipient is known.
      await qc.invalidateQueries({ queryKey: ['conversation', id] });
      setBody('');
    } finally {
      setSending(false);
    }
  };

  return (
    <KeyboardAvoidingView
      style={styles.root}
      behavior={Platform.OS === 'ios' ? 'padding' : undefined}
      keyboardVerticalOffset={88}
    >
      <FlatList
        data={messagesQuery.data ?? []}
        keyExtractor={(item) => item.id}
        contentContainerStyle={styles.list}
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
        />
        <Button title={t('messages.send')} onPress={onSend} loading={sending} disabled />
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
