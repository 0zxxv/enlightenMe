import { useNavigation, useRouter } from 'expo-router';
import React, { useCallback, useLayoutEffect, useState } from 'react';
import { ActivityIndicator, Pressable, StyleSheet, Text, View } from 'react-native';
import { Button } from '@/components/Button';
import { EmptyState } from '@/components/EmptyState';
import { useAuth } from '@/features/auth/useAuth';
import { useTranslation } from '@/i18n';
import { colors, spacing, typography } from '@/theme';

export default function InstituteDashboardScreen() {
  const { t } = useTranslation();
  const navigation = useNavigation();
  const router = useRouter();
  const { logout } = useAuth();
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

  useLayoutEffect(() => {
    navigation.setOptions({
      title: t('instituteDashboard.title'),
      headerStyle: { backgroundColor: colors.background },
      headerTintColor: colors.primary,
      headerRight: () => (
        <View style={styles.headerActions}>
          <Pressable onPress={() => router.push('/dev-mode')} hitSlop={8} disabled={busy}>
            <Text style={styles.headerLink}>{t('auth.devMode')}</Text>
          </Pressable>
          <Pressable onPress={onLogout} hitSlop={8} disabled={busy}>
            {busy ? (
              <ActivityIndicator size="small" color={colors.primary} />
            ) : (
              <Text style={styles.headerLink}>{t('common.logout')}</Text>
            )}
          </Pressable>
        </View>
      ),
    });
  }, [busy, navigation, onLogout, router, t]);

  return (
    <View style={styles.root}>
      <EmptyState title={t('instituteDashboard.title')} subtitle={t('instituteDashboard.placeholder')} />
      <View style={styles.actions}>
        <Button
          title={t('tutorDashboard.openApp')}
          variant="secondary"
          onPress={() => router.push('/(tabs)/profile')}
        />
        <Button title={t('auth.devMode')} variant="ghost" onPress={() => router.push('/dev-mode')} />
        <Button title={t('common.logout')} variant="danger" onPress={onLogout} loading={busy} />
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  root: {
    flex: 1,
    backgroundColor: colors.background,
    padding: spacing.xl,
    justifyContent: 'center',
    gap: spacing.xl,
  },
  actions: { gap: spacing.sm },
  headerActions: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.md,
    marginRight: spacing.sm,
  },
  headerLink: {
    ...typography.caption,
    color: colors.primary,
    fontWeight: '700',
  },
});
