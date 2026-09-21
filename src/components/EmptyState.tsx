import { Ionicons } from '@expo/vector-icons';
import React from 'react';
import { StyleSheet, Text, View } from 'react-native';
import { Button } from '@/components/Button';
import { useTranslation } from '@/i18n';
import { colors, spacing, typography } from '@/theme';

type Props = {
  title?: string;
  subtitle?: string;
  icon?: keyof typeof Ionicons.glyphMap;
  actionLabel?: string;
  onAction?: () => void;
};

export function EmptyState({
  title,
  subtitle,
  icon = 'file-tray-outline',
  actionLabel,
  onAction,
}: Props) {
  const { t } = useTranslation();
  return (
    <View style={styles.wrap}>
      <Ionicons name={icon} size={42} color={colors.lavender} />
      <Text style={styles.title}>{title ?? t('common.empty')}</Text>
      {subtitle ? <Text style={styles.subtitle}>{subtitle}</Text> : null}
      {actionLabel && onAction ? (
        <Button title={actionLabel} onPress={onAction} variant="secondary" size="sm" />
      ) : null}
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
