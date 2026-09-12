import { Ionicons } from '@expo/vector-icons';
import React from 'react';
import { StyleSheet, Text, View } from 'react-native';
import { useTranslation } from '@/i18n';
import { colors, spacing, typography } from '@/theme';

type Props = {
  title?: string;
  subtitle?: string;
  icon?: keyof typeof Ionicons.glyphMap;
};

export function EmptyState({ title, subtitle, icon = 'file-tray-outline' }: Props) {
  const { t } = useTranslation();
  return (
    <View style={styles.wrap}>
      <Ionicons name={icon} size={42} color={colors.lavender} />
      <Text style={styles.title}>{title ?? t('common.empty')}</Text>
      {subtitle ? <Text style={styles.subtitle}>{subtitle}</Text> : null}
    </View>
  );
}

const styles = StyleSheet.create({
  wrap: {
    alignItems: 'center',
    justifyContent: 'center',
    gap: spacing.sm,
    paddingVertical: spacing.huge,
    paddingHorizontal: spacing.xxl,
  },
  title: {
    ...typography.subheading,
    color: colors.text,
    textAlign: 'center',
  },
  subtitle: {
    ...typography.body,
    color: colors.textSecondary,
    textAlign: 'center',
  },
});
