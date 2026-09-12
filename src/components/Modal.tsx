import React from 'react';
import {
  Modal as RNModal,
  Pressable,
  StyleSheet,
  Text,
  View,
} from 'react-native';
import { colors, radius, spacing, typography } from '@/theme';

type Props = {
  visible: boolean;
  title?: string;
  onClose: () => void;
  children: React.ReactNode;
};

export function Modal({ visible, title, onClose, children }: Props) {
  return (
    <RNModal visible={visible} transparent animationType="fade" onRequestClose={onClose}>
      <Pressable style={styles.overlay} onPress={onClose}>
        <Pressable style={styles.sheet} onPress={(e) => e.stopPropagation()}>
          {title ? <Text style={styles.title}>{title}</Text> : null}
          {children}
        </Pressable>
      </Pressable>
    </RNModal>
  );
}

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    backgroundColor: colors.overlay,
    justifyContent: 'center',
    padding: spacing.xl,
  },
  sheet: {
    backgroundColor: colors.backgroundElevated,
    borderRadius: radius.xl,
    padding: spacing.xl,
    gap: spacing.md,
  },
  title: {
    ...typography.subheading,
    color: colors.text,
  },
});
