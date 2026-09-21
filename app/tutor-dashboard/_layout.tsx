import { Stack, useRouter } from 'expo-router';
import React, { useCallback, useState } from 'react';
import { ActivityIndicator, Pressable, StyleSheet, Text, View } from 'react-native';
import { useAuth } from '@/features/auth/useAuth';
import { useTranslation } from '@/i18n';
import { colors, spacing, typography } from '@/theme';

function DashboardHeaderActions() {
  const { t } = useTranslation();
  const { logout } = useAuth();
  const router = useRouter();
  const [busy, setBusy] = useState(false);

  const onLogout = useCallback(async () => {
    if (busy) return;
    setBusy(true);
    try {
      await logout();
      router.replace('/(auth)/login');
    } finally {
      setBusy(false);
    }
  }, [busy, logout, router]);

  return (
    <View style={styles.actions}>
      <Pressable
        accessibilityRole="button"
        onPress={() => router.push('/dev-mode')}
        disabled={busy}
        hitSlop={8}
      >
        <Text style={styles.link}>{t('auth.devMode')}</Text>
      </Pressable>
      <Pressable accessibilityRole="button" onPress={onLogout} disabled={busy} hitSlop={8}>
        {busy ? (
          <ActivityIndicator size="small" color={colors.primary} />
        ) : (
          <Text style={styles.link}>{t('common.logout')}</Text>
        )}
      </Pressable>
    </View>
  );
}

export default function TutorDashboardLayout() {
  return (
    <Stack
      screenOptions={{
        headerStyle: { backgroundColor: colors.background },
        headerTintColor: colors.primary,
        headerShadowVisible: false,
        contentStyle: { backgroundColor: colors.background },
        headerRight: () => <DashboardHeaderActions />,
      }}
    />
  );
}

const styles = StyleSheet.create({
  actions: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.md,
    marginRight: spacing.sm,
  },
  link: {
    ...typography.caption,
    color: colors.primary,
    fontWeight: '700',
  },
});
