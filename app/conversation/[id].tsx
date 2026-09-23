import { Ionicons } from '@expo/vector-icons';
import * as Clipboard from 'expo-clipboard';
import { useLocalSearchParams, useNavigation } from 'expo-router';
import React, { useEffect, useLayoutEffect, useMemo, useRef, useState } from 'react';
import {
  Alert,
  FlatList,
  Keyboard,
  KeyboardAvoidingView,
  Modal,
  Platform,
  Pressable,
  Share,
  StyleSheet,
  Text,
  TextInput as RNTextInput,
  View,
} from 'react-native';
import { Swipeable } from 'react-native-gesture-handler';
import { EmptyState } from '@/components/EmptyState';
import { ErrorState } from '@/components/ErrorState';
import { LoadingState } from '@/components/LoadingState';
import { useAuth } from '@/features/auth/useAuth';
import {
  useConversationMessages,
  useConversationMeta,
  useReplyInConversation,
} from '@/features/messages/hooks';
import { useConversationPrefs } from '@/features/messages/useConversationPrefs';
import { useMessageActions } from '@/features/messages/useMessageActions';
import { useTranslation } from '@/i18n';
import { colors, radius, spacing, typography } from '@/theme';
import type { Message } from '@/types/models';
import { formatDate, formatTime, fullName } from '@/utils/format';

type BubbleAction =
  | 'reply'
  | 'forward'
  | 'copy'
  | 'info'
  | 'star'
  | 'pin'
  | 'delete';

export default function ConversationScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const { t, language, isRTL } = useTranslation();
  const { user } = useAuth();
  const navigation = useNavigation();
  const listRef = useRef<FlatList>(null);
  const inputRef = useRef<RNTextInput>(null);
  const messagesQuery = useConversationMessages(id);
  const metaQuery = useConversationMeta(id);
  const { markRead } = useConversationPrefs();
  const {
    starred,
    pinned,
    deleted,
    toggleStar,
    togglePin,
    deleteMessage,
  } = useMessageActions(id);
  const [body, setBody] = useState('');
  const [replyTo, setReplyTo] = useState<Message | null>(null);
  const [menuMessage, setMenuMessage] = useState<Message | null>(null);
  const [keyboardOpen, setKeyboardOpen] = useState(false);
  const markedRef = useRef<string | null>(null);

  const other = useMemo(
    () => metaQuery.data?.participants.find((p) => p.userId !== user?.id),
    [metaQuery.data, user?.id],
  );
  const recipientId = other?.userId;
  const reply = useReplyInConversation(id, recipientId);
  const title = metaQuery.data?.courseId
    ? metaQuery.data.title || t('messages.courseGroup')
    : fullName(other?.user?.firstName, other?.user?.lastName) || t('messages.title');

  const visibleMessages = useMemo(
    () => (messagesQuery.data ?? []).filter((item) => !deleted.includes(item.id)),
    [deleted, messagesQuery.data],
  );

  useLayoutEffect(() => {
    navigation.setOptions({
      title,
      headerStyle: { backgroundColor: colors.background },
      headerTintColor: colors.primary,
    });
  }, [navigation, title]);

  useEffect(() => {
    if (!id || !messagesQuery.data?.length) return;
    const last = messagesQuery.data[messagesQuery.data.length - 1];
    const key = `${id}:${last.id}`;
    if (markedRef.current === key) return;
    markedRef.current = key;
    markRead(id, last.id);
  }, [id, markRead, messagesQuery.data]);

  useEffect(() => {
    const show = Keyboard.addListener('keyboardDidShow', () => {
      setKeyboardOpen(true);
      requestAnimationFrame(() => listRef.current?.scrollToEnd({ animated: true }));
    });
    const hide = Keyboard.addListener('keyboardDidHide', () => setKeyboardOpen(false));
    return () => {
      show.remove();
      hide.remove();
    };
  }, []);

  if (messagesQuery.isLoading || metaQuery.isLoading) return <LoadingState />;
  if (messagesQuery.isError) {
    return <ErrorState onRetry={() => messagesQuery.refetch()} />;
  }

  const scrollToEnd = () => {
    requestAnimationFrame(() => listRef.current?.scrollToEnd({ animated: true }));
  };

  const onSend = async () => {
    const text = body.trim();
    const canSendToGroup = Boolean(metaQuery.data?.courseId);
    if (!text || reply.isPending || (!recipientId && !canSendToGroup)) return;
    const payload = replyTo
      ? `↩ ${replyTo.body.slice(0, 80)}${replyTo.body.length > 80 ? '…' : ''}\n${text}`
      : text;
    setBody('');
    setReplyTo(null);
    try {
      await reply.mutateAsync(payload);
      scrollToEnd();
    } catch {
      setBody(text);
    }
  };

  const runAction = async (action: BubbleAction, message: Message) => {
    setMenuMessage(null);
    if (action === 'reply') {
      setReplyTo(message);
      inputRef.current?.focus();
      return;
    }
    if (action === 'forward') {
      try {
        await Share.share({ message: message.body });
      } catch {
        // cancelled
      }
      return;
    }
    if (action === 'copy') {
      await Clipboard.setStringAsync(message.body);
      Alert.alert(t('messages.copied'));
      return;
    }
    if (action === 'info') {
      Alert.alert(
        t('messages.messageInfo'),
        `${formatDate(message.createdAt, language)} · ${formatTime(message.createdAt, language)}`,
      );
      return;
    }
    if (action === 'star') {
      toggleStar(message.id);
      return;
    }
    if (action === 'pin') {
      togglePin(message.id);
      return;
    }
    if (action === 'delete') {
      deleteMessage(message.id);
    }
  };

  const renderActions = (message: Message) => (
    <View style={styles.swipeActions}>
      <Pressable style={styles.swipeReply} onPress={() => runAction('reply', message)}>
        <Ionicons name="arrow-undo" size={18} color={colors.white} />
        <Text style={styles.swipeReplyText}>{t('messages.reply')}</Text>
      </Pressable>
    </View>
  );

  return (
    <KeyboardAvoidingView
      style={styles.root}
      behavior={Platform.OS === 'ios' ? 'padding' : undefined}
      keyboardVerticalOffset={88}
    >
      <FlatList
        ref={listRef}
        data={visibleMessages}
        keyExtractor={(item) => item.id}
        contentContainerStyle={styles.list}
        onContentSizeChange={scrollToEnd}
        keyboardShouldPersistTaps="handled"
        ListEmptyComponent={<EmptyState title={t('messages.empty')} />}
        renderItem={({ item }) => {
          const mine = item.senderId === user?.id;
          const isStarred = starred.includes(item.id);
          const isPinned = pinned.includes(item.id);
          return (
            <Swipeable
              renderLeftActions={isRTL ? undefined : () => renderActions(item)}
              renderRightActions={isRTL ? () => renderActions(item) : undefined}
              overshootLeft={!isRTL}
              overshootRight={isRTL}
              onSwipeableOpen={() => runAction('reply', item)}
            >
              <Pressable
                onLongPress={() => setMenuMessage(item)}
                delayLongPress={280}
                style={[styles.bubbleWrap, mine ? styles.bubbleWrapMine : styles.bubbleWrapTheirs]}
              >
                {isPinned ? (
                  <View style={styles.pinRow}>
                    <Ionicons name="pin" size={12} color={colors.lavender} />
                    <Text style={styles.pinLabel}>{t('messages.pinnedMessage')}</Text>
                  </View>
                ) : null}
                <View style={[styles.bubble, mine ? styles.mine : styles.theirs]}>
                  <Text style={[styles.body, mine && styles.mineText]}>{item.body}</Text>
                  <View style={styles.metaRow}>
                    {isStarred ? (
                      <Ionicons
                        name="star"
                        size={11}
                        color={mine ? colors.lavenderSoft : colors.warning}
                      />
                    ) : null}
                    <Text style={[styles.stamp, mine && styles.stampMine]}>
                      {formatDate(item.createdAt, language)} · {formatTime(item.createdAt, language)}
                    </Text>
                  </View>
                </View>
              </Pressable>
            </Swipeable>
          );
        }}
      />

      {replyTo ? (
        <View style={styles.replyBar}>
          <View style={styles.replyCopy}>
            <Text style={styles.replyLabel}>{t('messages.replying')}</Text>
            <Text style={styles.replyPreview} numberOfLines={1}>
              {replyTo.body}
            </Text>
          </View>
          <Pressable onPress={() => setReplyTo(null)} hitSlop={8}>
            <Ionicons name="close" size={18} color={colors.primary} />
          </Pressable>
        </View>
      ) : null}

      <View style={styles.composer}>
        <View style={styles.inputRow}>
          <RNTextInput
            ref={inputRef}
            value={body}
            onChangeText={setBody}
            placeholder={t('messages.placeholder')}
            placeholderTextColor={colors.textMuted}
            style={styles.input}
            multiline
            onFocus={scrollToEnd}
            onSubmitEditing={onSend}
            blurOnSubmit={false}
          />
          {keyboardOpen ? (
            <Pressable
              style={styles.keyboardBtn}
              onPress={() => Keyboard.dismiss()}
              accessibilityLabel={t('messages.hideKeyboard')}
            >
              <Ionicons name="chevron-down" size={20} color={colors.primary} />
            </Pressable>
          ) : null}
          <Pressable
            style={[
              styles.sendBtn,
              (!body.trim() || (!recipientId && !metaQuery.data?.courseId)) && styles.sendBtnDisabled,
            ]}
            onPress={onSend}
            disabled={
              !body.trim() ||
              (!recipientId && !metaQuery.data?.courseId) ||
              reply.isPending
            }
          >
            <Ionicons
              name={isRTL ? 'send' : 'send'}
              size={18}
              color={colors.white}
              style={isRTL ? { transform: [{ scaleX: -1 }] } : undefined}
            />
          </Pressable>
        </View>
      </View>

      <Modal visible={Boolean(menuMessage)} transparent animationType="fade">
        <Pressable style={styles.menuBackdrop} onPress={() => setMenuMessage(null)}>
          <View style={styles.menuCard}>
            {(
              [
                { id: 'reply' as const, icon: 'arrow-undo-outline', label: t('messages.reply') },
                { id: 'forward' as const, icon: 'arrow-redo-outline', label: t('messages.forward') },
                { id: 'copy' as const, icon: 'copy-outline', label: t('messages.copy') },
                { id: 'info' as const, icon: 'information-circle-outline', label: t('messages.info') },
                {
                  id: 'star' as const,
                  icon: menuMessage && starred.includes(menuMessage.id) ? 'star' : 'star-outline',
                  label: t('messages.star'),
                },
                {
                  id: 'pin' as const,
                  icon: menuMessage && pinned.includes(menuMessage.id) ? 'pin' : 'pin-outline',
                  label: t('messages.pinMessage'),
                },
                { id: 'delete' as const, icon: 'trash-outline', label: t('messages.deleteMessage') },
              ] as const
            ).map((action) => (
              <Pressable
                key={action.id}
                style={styles.menuItem}
                onPress={() => menuMessage && void runAction(action.id, menuMessage)}
              >
                <Ionicons
                  name={action.icon}
                  size={18}
                  color={action.id === 'delete' ? colors.error : colors.primary}
                />
                <Text
                  style={[
                    styles.menuItemText,
                    action.id === 'delete' && { color: colors.error },
                  ]}
                >
                  {action.label}
                </Text>
              </Pressable>
            ))}
          </View>
        </Pressable>
      </Modal>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1, backgroundColor: colors.background },
  list: { padding: spacing.xl, gap: spacing.sm, paddingBottom: spacing.xxl },
  bubbleWrap: { marginBottom: spacing.sm },
  bubbleWrapMine: { alignItems: 'flex-end' },
  bubbleWrapTheirs: { alignItems: 'flex-start' },
  pinRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    marginBottom: 4,
  },
  pinLabel: {
    ...typography.caption,
    color: colors.lavender,
    fontWeight: '700',
    fontSize: 11,
  },
  bubble: {
    maxWidth: '82%',
    borderRadius: radius.lg,
    padding: spacing.md,
  },
  mine: {
    backgroundColor: colors.primary,
  },
  theirs: {
    backgroundColor: colors.white,
    borderWidth: 1,
    borderColor: colors.border,
  },
  body: { ...typography.body, color: colors.text },
  mineText: { color: colors.white },
  metaRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'flex-end',
    gap: 4,
    marginTop: 6,
  },
  stamp: {
    ...typography.caption,
    color: colors.textMuted,
    fontSize: 10,
  },
  stampMine: { color: 'rgba(255,255,255,0.75)' },
  swipeActions: {
    justifyContent: 'center',
    marginBottom: spacing.sm,
  },
  swipeReply: {
    width: 72,
    height: '100%',
    backgroundColor: colors.lavender,
    borderRadius: radius.lg,
    alignItems: 'center',
    justifyContent: 'center',
    gap: 4,
    marginRight: spacing.sm,
  },
  swipeReplyText: {
    ...typography.caption,
    color: colors.white,
    fontWeight: '700',
    fontSize: 11,
  },
  replyBar: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.md,
    paddingHorizontal: spacing.lg,
    paddingVertical: spacing.sm,
    borderTopWidth: StyleSheet.hairlineWidth,
    borderTopColor: colors.border,
    backgroundColor: colors.lavenderSoft,
  },
  replyCopy: { flex: 1, gap: 2 },
  replyLabel: {
    ...typography.caption,
    color: colors.primary,
    fontWeight: '700',
  },
  replyPreview: {
    ...typography.caption,
    color: colors.textSecondary,
  },
  composer: {
    padding: spacing.lg,
    borderTopWidth: 1,
    borderTopColor: colors.border,
    backgroundColor: colors.backgroundElevated,
  },
  inputRow: {
    flexDirection: 'row',
    alignItems: 'flex-end',
    gap: spacing.sm,
  },
  input: {
    flex: 1,
    minHeight: 44,
    maxHeight: 120,
    borderRadius: radius.lg,
    borderWidth: 1,
    borderColor: colors.border,
    backgroundColor: colors.white,
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm,
    ...typography.body,
    color: colors.text,
  },
  keyboardBtn: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: colors.beige,
    alignItems: 'center',
    justifyContent: 'center',
  },
  sendBtn: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: colors.primary,
    alignItems: 'center',
    justifyContent: 'center',
  },
  sendBtnDisabled: { opacity: 0.45 },
  menuBackdrop: {
    flex: 1,
    backgroundColor: colors.overlay,
    justifyContent: 'center',
    padding: spacing.xl,
  },
  menuCard: {
    backgroundColor: colors.white,
    borderRadius: radius.xl,
    paddingVertical: spacing.sm,
    overflow: 'hidden',
  },
  menuItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.md,
    paddingHorizontal: spacing.lg,
    paddingVertical: spacing.md,
  },
  menuItemText: {
    ...typography.body,
    color: colors.text,
    fontWeight: '600',
  },
});
