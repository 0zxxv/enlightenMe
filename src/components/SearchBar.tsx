import { Ionicons } from '@expo/vector-icons';
import React from 'react';
import { Pressable, StyleSheet, TextInput, View } from 'react-native';
import { colors, radius, spacing, typography } from '@/theme';

type Props = {
  value: string;
  onChangeText: (text: string) => void;
  placeholder?: string;
  onSubmit?: () => void;
};

export function SearchBar({ value, onChangeText, placeholder, onSubmit }: Props) {
  return (
    <View style={styles.wrap}>
      <Ionicons name="search" size={18} color={colors.textMuted} />
      <TextInput
        value={value}
        onChangeText={onChangeText}
        placeholder={placeholder}
        placeholderTextColor={colors.textMuted}
        style={styles.input}
        returnKeyType="search"
        onSubmitEditing={onSubmit}
      />
      {value.length > 0 ? (
        <Pressable onPress={() => onChangeText('')}>
          <Ionicons name="close-circle" size={18} color={colors.textMuted} />
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
    borderRadius: radius.lg,
    borderWidth: 1,
    borderColor: colors.border,
    paddingHorizontal: spacing.lg,
    minHeight: 48,
  },
  input: {
    ...typography.body,
    flex: 1,
    color: colors.text,
    paddingVertical: spacing.sm,
  },
});
