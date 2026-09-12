import { Stack } from 'expo-router';
import React from 'react';
import { StyleSheet, Text, View } from 'react-native';
import { Badge } from '@/components/Badge';
import { useTranslation } from '@/i18n';
import { colors, radius, shadows, spacing, typography } from '@/theme';

export default function TutorVerificationScreen() {
  const { t } = useTranslation();

  return (
    <>
      <Stack.Screen
        options={{
          title: t('tutorDashboard.verification'),
          headerStyle: { backgroundColor: colors.background },
          headerTintColor: colors.primary,
        }}
      />
      <View style={styles.root}>
        <View style={styles.card}>
          <Text style={styles.label}>{t('tutorDashboard.verificationStatus')}</Text>
          <Badge label="Pending" tone="warning" />
          <Text style={styles.body}>{t('tutorDashboard.verificationHint')}</Text>
        </View>
      </View>
    </>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1, backgroundColor: colors.background, padding: spacing.xl },
  card: {
    backgroundColor: colors.white,
    borderRadius: radius.xl,
    padding: spacing.xxl,
    gap: spacing.md,
    ...shadows.sm,
  },
  label: { ...typography.subheading, color: colors.text },
  body: { ...typography.body, color: colors.textSecondary, lineHeight: 22 },
});
