import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import React from 'react';
import { Pressable, StyleSheet, View, type ViewStyle } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useTranslation } from '@/i18n';
import { colors, shadows, spacing } from '@/theme';

type Variant = 'light' | 'dark' | 'overlay';

type Props = {
  onPress?: () => void;
  variant?: Variant;
  style?: ViewStyle;
  /** When true, wraps with safe-area top padding for standalone bars. */
  withSafeTop?: boolean;
};

export function BackButton({
  onPress,
  variant = 'light',
  style,
  withSafeTop = false,
}: Props) {
  const router = useRouter();
  const { t, isRTL } = useTranslation();
  const insets = useSafeAreaInsets();
  const icon =
    variant === 'overlay'
      ? isRTL
        ? 'chevron-forward'
        : 'chevron-back'
      : isRTL
        ? 'arrow-forward'
        : 'arrow-back';

  const btn = (
    <Pressable
      style={[
        styles.base,
        variant === 'light' && styles.light,
        variant === 'dark' && styles.dark,
        variant === 'overlay' && styles.overlay,
        style,
      ]}
      onPress={onPress ?? (() => router.back())}
      hitSlop={8}
      accessibilityRole="button"
      accessibilityLabel={t('common.back')}
    >
      <Ionicons
        name={icon}
        size={variant === 'overlay' ? 22 : 20}
        color={variant === 'overlay' ? colors.white : colors.primary}
      />
    </Pressable>
  );

  if (!withSafeTop) return btn;

  return (
    <View style={[styles.bar, { paddingTop: insets.top + spacing.sm }]}>
      {btn}
    </View>
  );
}

const styles = StyleSheet.create({
  bar: {
    paddingHorizontal: spacing.lg,
    paddingBottom: spacing.sm,
  },
  base: {
    width: 40,
    height: 40,
    borderRadius: 20,
    alignItems: 'center',
    justifyContent: 'center',
  },
  light: {
    backgroundColor: colors.beige,
  },
  dark: {
    backgroundColor: colors.white,
    ...shadows.sm,
  },
  overlay: {
    backgroundColor: 'rgba(28,24,48,0.45)',
  },
});
