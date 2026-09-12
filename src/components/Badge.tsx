import React from 'react';
import { StyleSheet, Text, View, ViewStyle } from 'react-native';
import { colors, radius, spacing, typography } from '@/theme';

type Props = {
  label: string;
  tone?: 'primary' | 'success' | 'warning' | 'neutral';
  style?: ViewStyle;
};

export function Badge({ label, tone = 'primary', style }: Props) {
  return (
    <View style={[styles.base, styles[tone], style]}>
      <Text style={[styles.text, styles[`text_${tone}`]]}>{label}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  base: {
    alignSelf: 'flex-start',
    paddingHorizontal: spacing.sm,
    paddingVertical: spacing.xxs + 1,
    borderRadius: radius.sm,
  },
  primary: { backgroundColor: colors.lavenderSoft },
  success: { backgroundColor: colors.successSoft },
  warning: { backgroundColor: colors.warningSoft },
  neutral: { backgroundColor: colors.beige },
  text: {
    ...typography.caption,
    fontWeight: '600',
  },
  text_primary: { color: colors.primary },
  text_success: { color: colors.success },
  text_warning: { color: colors.warning },
  text_neutral: { color: colors.textSecondary },
});
