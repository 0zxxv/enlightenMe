import { useRouter } from 'expo-router';
import React, { useCallback, useState } from 'react';
import { StyleSheet, Text, View } from 'react-native';
import { Avatar } from '@/components/Avatar';
import { Button } from '@/components/Button';
import { useAuth } from '@/features/auth/useAuth';
import { useTranslation } from '@/i18n';
import { colors, radius, shadows, spacing, typography } from '@/theme';
import { fullName } from '@/utils/format';

export default function TutorProfileManageScreen() {
  const { t, isRTL } = useTranslation();
  const { user, logout } = useAuth();
  const router = useRouter();
  const [busy, setBusy] = useState(false);
  const name = fullName(user?.firstName, user?.lastName);

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
    <View style={styles.root}>
      <View style={styles.card}>
        <Avatar name={name} size={72} />
        <Text
          style={[
            styles.name,
            { textAlign: 'center', writingDirection: isRTL ? 'rtl' : 'ltr' },
          ]}
        >
          {name}
        </Text>
        <Text style={styles.meta}>{user?.email}</Text>
        <Text style={styles.meta}>{user?.role}</Text>
      </View>

      <Button
        title={t('tutorDashboard.earnings')}
        variant="ghost"
        onPress={() => router.push('/tutor-dashboard/earnings')}
      />
      <Button
        title={t('tutorDashboard.verification')}
        variant="ghost"
        onPress={() => router.push('/tutor-dashboard/verification')}
      />
      <Button title={t('auth.devMode')} variant="ghost" onPress={() => router.push('/dev-mode')} />
      <Button title={t('common.logout')} variant="secondary" onPress={onLogout} loading={busy} />
    </View>
  );
}

const styles = StyleSheet.create({
  root: {
    flex: 1,
    backgroundColor: colors.background,
    padding: spacing.xl,
    gap: spacing.md,
  },
  card: {
    backgroundColor: colors.white,
    borderRadius: radius.xl,
    padding: spacing.xxl,
    alignItems: 'center',
    gap: spacing.sm,
    ...shadows.sm,
    marginBottom: spacing.md,
  },
  name: { ...typography.heading, color: colors.text },
  meta: { ...typography.caption, color: colors.textSecondary },
});
