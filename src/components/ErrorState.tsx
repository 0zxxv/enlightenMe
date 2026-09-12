import React from 'react';
import { StyleSheet, Text, View } from 'react-native';
import { Button } from '@/components/Button';
import { useTranslation } from '@/i18n';
import { colors, spacing, typography } from '@/theme';

type Props = {
  message?: string;
  onRetry?: () => void;
};

export function ErrorState({ message, onRetry }: Props) {
  const { t } = useTranslation();
  return (
    <View style={styles.wrap}>
      <Text style={styles.title}>{t('common.error')}</Text>
      <Text style={styles.message}>{message ?? t('errors.network')}</Text>
      {onRetry ? <Button title={t('common.retry')} onPress={onRetry} variant="secondary" /> : null}
    </View>
  );
}

const styles = StyleSheet.create({
  wrap: {
    alignItems: 'center',
    justifyContent: 'center',
    gap: spacing.md,
    padding: spacing.xxl,
  },
  title: {
    ...typography.subheading,
    color: colors.error,
  },
  message: {
    ...typography.body,
    color: colors.textSecondary,
    textAlign: 'center',
  },
});
