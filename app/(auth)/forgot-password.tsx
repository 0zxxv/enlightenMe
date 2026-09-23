import { useRouter } from 'expo-router';
import React, { useState } from 'react';
import { StyleSheet, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { BackButton } from '@/components/BackButton';
import { Button } from '@/components/Button';
import { TextInput } from '@/components/TextInput';
import { useTranslation } from '@/i18n';
import { forgotPassword } from '@/services/api/auth';
import { colors, spacing, typography } from '@/theme';
import { ApiError } from '@/types/api';

export default function ForgotPasswordScreen() {
  const { t } = useTranslation();
  const router = useRouter();
  const [email, setEmail] = useState('');
  const [error, setError] = useState('');
  const [sent, setSent] = useState(false);
  const [loading, setLoading] = useState(false);

  const onSubmit = async () => {
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
      setError(t('auth.invalidEmail'));
      return;
    }
    setLoading(true);
    setError('');
    try {
      await forgotPassword(email.trim());
      setSent(true);
    } catch (err) {
      setError(err instanceof ApiError ? err.message : t('common.error'));
    } finally {
      setLoading(false);
    }
  };

  return (
    <SafeAreaView style={styles.safe}>
      <View style={styles.topBar}>
        <BackButton onPress={() => router.back()} />
      </View>
      <View style={styles.content}>
        <Text style={styles.title}>{t('auth.forgotTitle')}</Text>
        <Text style={styles.subtitle}>{t('auth.forgotSubtitle')}</Text>
        <TextInput
          label={t('auth.email')}
          autoCapitalize="none"
          keyboardType="email-address"
          value={email}
          onChangeText={setEmail}
          error={error}
        />
        {sent ? <Text style={styles.sent}>{t('auth.resetSent')}</Text> : null}
        <Button title={t('auth.sendReset')} onPress={onSubmit} loading={loading} />
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: colors.background },
  topBar: {
    paddingHorizontal: spacing.xxl,
    paddingTop: spacing.sm,
  },
  content: { padding: spacing.xxl, gap: spacing.lg },
  title: { ...typography.heading, color: colors.text },
  subtitle: { ...typography.body, color: colors.textSecondary },
  sent: { ...typography.body, color: colors.success },
});
