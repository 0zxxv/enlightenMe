import React from 'react';
import {
  Modal,
  Pressable,
  StyleSheet,
  Text,
  View,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { colors, radius, spacing, typography } from '@/theme';

type Props = {
  visible: boolean;
  title?: string;
  onClose: () => void;
  children: React.ReactNode;
};

export function BottomSheet({ visible, title, onClose, children }: Props) {
  const insets = useSafeAreaInsets();
  return (
    <Modal visible={visible} transparent animationType="slide" onRequestClose={onClose}>
      <Pressable style={styles.overlay} onPress={onClose}>
        <Pressable
          style={[styles.sheet, { paddingBottom: Math.max(insets.bottom, spacing.xl) }]}
          onPress={(e) => e.stopPropagation()}
        >
          <View style={styles.handle} />
          {title ? <Text style={styles.title}>{title}</Text> : null}
          {children}
        </Pressable>
      </Pressable>
    </Modal>
  );
}

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    backgroundColor: colors.overlay,
    justifyContent: 'flex-end',
  },
  sheet: {
    backgroundColor: colors.backgroundElevated,
    borderTopLeftRadius: radius.xxl,
    borderTopRightRadius: radius.xxl,
    paddingHorizontal: spacing.xl,
    paddingTop: spacing.md,
    gap: spacing.md,
    maxHeight: '80%',
  },
  handle: {
    alignSelf: 'center',
    width: 44,
    height: 4,
    borderRadius: radius.full,
    backgroundColor: colors.beigeDark,
    marginBottom: spacing.sm,
  },
  title: {
    ...typography.subheading,
    color: colors.text,
  },
});
