import React from 'react';
import { Pressable, StyleSheet, Text } from 'react-native';
import { colors, radius, spacing, typography } from '@/theme';

type Props = {
  label: string;
  selected?: boolean;
  onPress?: () => void;
};

export function Chip({ label, selected, onPress }: Props) {
  return (
    <Pressable
      onPress={onPress}
      style={[styles.base, selected ? styles.selected : styles.idle]}
    >
      <Text style={[styles.text, selected ? styles.textSelected : styles.textIdle]}>{label}</Text>
    </Pressable>
  );
}

export function FilterChip(props: Props) {
  return <Chip {...props} />;
}

const styles = StyleSheet.create({
  base: {
    paddingHorizontal: spacing.lg,
    paddingVertical: spacing.sm,
    borderRadius: radius.full,
    borderWidth: 1,
  },
  idle: {
    backgroundColor: colors.white,
    borderColor: colors.border,
  },
  selected: {
    backgroundColor: colors.primary,
    borderColor: colors.primary,
  },
  text: {
    ...typography.caption,
    fontWeight: '600',
  },
  textIdle: {
    color: colors.textSecondary,
  },
  textSelected: {
    color: colors.white,
  },
});
