import { BlurView } from 'expo-blur';
import React from 'react';
import {
  ActivityIndicator,
  Platform,
  Pressable,
  StyleSheet,
  Text,
  View,
  ViewStyle,
  TextStyle,
} from 'react-native';
import { colors, radius, spacing, typography } from '@/theme';

type Variant = 'primary' | 'secondary' | 'ghost' | 'danger' | 'glass';
type Size = 'md' | 'lg' | 'sm';

type Props = {
  title: string;
  onPress?: () => void;
  variant?: Variant;
  size?: Size;
  loading?: boolean;
  disabled?: boolean;
  style?: ViewStyle;
  textStyle?: TextStyle;
};

export function Button({
  title,
  onPress,
  variant = 'primary',
  size = 'md',
  loading,
  disabled,
  style,
  textStyle,
}: Props) {
  const isDisabled = disabled || loading;
  const isGlass = variant === 'glass';

  return (
    <Pressable
      accessibilityRole="button"
      onPress={onPress}
      disabled={isDisabled}
      style={({ pressed }) => [
        styles.base,
        styles[variant],
        styles[`size_${size}`],
        pressed && !isDisabled && styles.pressed,
        isDisabled && styles.disabled,
        style,
      ]}
    >
      {isGlass ? (
        Platform.OS === 'web' ? (
          <View
            pointerEvents="none"
            style={[
              StyleSheet.absoluteFill,
              styles.glassFallback,
              { backdropFilter: 'blur(14px)', WebkitBackdropFilter: 'blur(14px)' } as ViewStyle,
            ]}
          />
        ) : (
          <BlurView
            pointerEvents="none"
            intensity={28}
            tint="light"
            style={StyleSheet.absoluteFill}
          />
        )
      ) : null}
      {loading ? (
        <ActivityIndicator color={variant === 'primary' ? colors.white : colors.primary} />
      ) : (
        <Text style={[styles.text, styles[`text_${variant}`], textStyle]}>{title}</Text>
      )}
    </Pressable>
  );
}

const styles = StyleSheet.create({
  base: {
    borderRadius: radius.md,
    alignItems: 'center',
    justifyContent: 'center',
    flexDirection: 'row',
    overflow: 'hidden',
  },
  primary: {
    backgroundColor: colors.primary,
  },
  secondary: {
    backgroundColor: colors.lavenderSoft,
  },
  ghost: {
    backgroundColor: 'transparent',
    borderWidth: 1,
    borderColor: colors.borderStrong,
  },
  glass: {
    backgroundColor: 'rgba(255, 252, 248, 0.12)',
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.45)',
  },
  glassFallback: {
    backgroundColor: 'rgba(255, 252, 248, 0.14)',
  } as ViewStyle,
  danger: {
    backgroundColor: colors.errorSoft,
  },
  size_sm: {
    paddingVertical: spacing.sm,
    paddingHorizontal: spacing.lg,
    minHeight: 40,
  },
  size_md: {
    paddingVertical: spacing.md,
    paddingHorizontal: spacing.xl,
    minHeight: 48,
  },
  size_lg: {
    paddingVertical: spacing.lg,
    paddingHorizontal: spacing.xxl,
    minHeight: 56,
  },
  pressed: {
    opacity: 0.9,
  },
  disabled: {
    opacity: 0.5,
  },
  text: {
    ...typography.button,
  },
  text_primary: {
    color: colors.textOnPrimary,
  },
  text_secondary: {
    color: colors.primary,
  },
  text_ghost: {
    color: colors.primary,
  },
  text_glass: {
    color: colors.primary,
  },
  text_danger: {
    color: colors.error,
  },
});
