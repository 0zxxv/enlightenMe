import React from 'react';
import { ActivityIndicator, StyleSheet, Text, View } from 'react-native';
import { useTranslation } from '@/i18n';
import { colors, spacing, typography } from '@/theme';

export function LoadingState({ message }: { message?: string }) {
  const { t } = useTranslation();
  return (
    <View style={styles.wrap}>
      <ActivityIndicator size="large" color={colors.primary} />
      <Text style={styles.text}>{message ?? t('common.loading')}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  wrap: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    gap: spacing.md,
    padding: spacing.xxl,
  },
  text: {
    ...typography.body,
    color: colors.textSecondary,
  },
});
