import { Ionicons } from '@expo/vector-icons';
import React from 'react';
import { Pressable, StyleSheet, ViewStyle } from 'react-native';
import { colors, radius, spacing } from '@/theme';

type Props = {
  name: keyof typeof Ionicons.glyphMap;
  onPress?: () => void;
  size?: number;
  color?: string;
  background?: string;
  style?: ViewStyle;
};

export function IconButton({
  name,
  onPress,
  size = 22,
  color = colors.primary,
  background = colors.beige,
  style,
}: Props) {
  return (
    <Pressable
      accessibilityRole="button"
      onPress={onPress}
      style={({ pressed }) => [
        styles.base,
        { backgroundColor: background },
        pressed && styles.pressed,
        style,
      ]}
    >
      <Ionicons name={name} size={size} color={color} />
    </Pressable>
  );
}

const styles = StyleSheet.create({
  base: {
    width: 44,
    height: 44,
    borderRadius: radius.full,
    alignItems: 'center',
    justifyContent: 'center',
    padding: spacing.sm,
  },
  pressed: {
    opacity: 0.85,
  },
});
