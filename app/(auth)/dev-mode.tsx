import { useRouter } from 'expo-router';
import React, { useState } from 'react';
import { ScrollView, StyleSheet, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Button } from '@/components/Button';
import { DEV_USERS, type DevUser } from '@/config/devUsers';
import { useAuth } from '@/features/auth/useAuth';
import { useTranslation } from '@/i18n';
import { colors, spacing, typography } from '@/theme';
import { ApiError } from '@/types/api';

function homeForRole(role: DevUser['role']) {
  if (role === 'Tutor') return '/tutor-dashboard' as const;
  return '/(tabs)' as const;
}

export default function DevModeScreen() {
  const { t } = useTranslation();
  const { login } = useAuth();
  const router = useRouter();
  const [loadingEmail, setLoadingEmail] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  const onPick = async (user: DevUser) => {
    setLoadingEmail(user.email);
    setError(null);
    try {
      await login({ email: user.email, password: user.password });
      router.replace(homeForRole(user.role));
    } catch (err) {
      const message = err instanceof ApiError ? err.message : t('common.error');
      setError(message);
    } finally {
      setLoadingEmail(null);
    }
  };

  return (
    <SafeAreaView style={styles.safe}>
      <ScrollView contentContainerStyle={styles.content}>
        <Text style={styles.title}>{t('auth.devMode')}</Text>
        <Text style={styles.subtitle}>{t('auth.devModeSubtitle')}</Text>
        {error ? <Text style={styles.error}>{error}</Text> : null}
        <View style={styles.list}>
          {DEV_USERS.map((user) => (
            <Button
              key={user.email}
              title={`${user.name} — ${user.role}`}
              variant="secondary"
              onPress={() => onPick(user)}
              loading={loadingEmail === user.email}
              disabled={loadingEmail !== null && loadingEmail !== user.email}
            />
          ))}
        </View>
        <Button
          title={t('common.back')}
          variant="ghost"
          onPress={() => router.back()}
          disabled={loadingEmail !== null}
        />
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: colors.background },
  content: { padding: spacing.xxl, gap: spacing.lg },
  title: { ...typography.display, color: colors.text, fontSize: 32 },
  subtitle: { ...typography.body, color: colors.textSecondary },
  list: { gap: spacing.md, marginTop: spacing.sm },
  error: { ...typography.caption, color: colors.error },
});
