import { Ionicons } from '@expo/vector-icons';
import React from 'react';
import { Pressable, StyleSheet, TextInput, View, type ViewStyle } from 'react-native';
import { useTranslation } from '@/i18n';
import { colors, radius, shadows, spacing, typography } from '@/theme';

type Props = {
  value: string;
  onChangeText: (text: string) => void;
  placeholder?: string;
  onSubmit?: () => void;
  /** Optional trailing action (e.g. scan / filters). */
  trailingIcon?: keyof typeof Ionicons.glyphMap;
  onTrailingPress?: () => void;
  style?: ViewStyle;
};

export function SearchBar({
  value,
  onChangeText,
  placeholder,
  onSubmit,
  trailingIcon = 'scan-outline',
  onTrailingPress,
  style,
}: Props) {
  const { isRTL } = useTranslation();

  return (
    <View style={[styles.wrap, style]}>
      <Ionicons name="search" size={20} color={colors.textMuted} />
      <TextInput
        value={value}
        onChangeText={onChangeText}
        placeholder={placeholder}
        placeholderTextColor={colors.textMuted}
        style={[styles.input, { textAlign: isRTL ? 'right' : 'left', writingDirection: isRTL ? 'rtl' : 'ltr' }]}
        returnKeyType="search"
        onSubmitEditing={onSubmit}
      />
      {value.length > 0 ? (
        <Pressable onPress={() => onChangeText('')} hitSlop={8}>
          <Ionicons name="close-circle" size={18} color={colors.textMuted} />
        </Pressable>
      ) : trailingIcon ? (
        <Pressable onPress={onTrailingPress ?? onSubmit} hitSlop={8}>
          <Ionicons name={trailingIcon} size={20} color={colors.textMuted} />
        </Pressable>
      ) : null}
    </View>
  );
}

const styles = StyleSheet.create({
  wrap: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
    backgroundColor: colors.white,
    borderRadius: radius.xl,
    borderWidth: 1,
    borderColor: colors.border,
    paddingHorizontal: spacing.lg,
    minHeight: 52,
    ...shadows.sm,
  },
  input: {
    ...typography.body,
    flex: 1,
    color: colors.text,
    paddingVertical: spacing.sm,
  },
});
