import { Image } from 'expo-image';
import { Link, useRouter } from 'expo-router';
import React, { useState } from 'react';
import {
  KeyboardAvoidingView,
  Platform,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Button } from '@/components/Button';
import { TextInput } from '@/components/TextInput';
import { useAuth } from '@/features/auth/useAuth';
import { useTranslation } from '@/i18n';
import { colors, spacing, typography } from '@/theme';
import { ApiError } from '@/types/api';

export default function LoginScreen() {
  const { t } = useTranslation();
  const { login } = useAuth();
  const router = useRouter();
  const [email, setEmail] = useState('student@dars.app');
  const [password, setPassword] = useState('Password123!');
  const [errors, setErrors] = useState<{ email?: string; password?: string; form?: string }>({});
  const [loading, setLoading] = useState(false);

  const validate = () => {
    const next: typeof errors = {};
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) next.email = t('auth.invalidEmail');
    if (!password) next.password = t('auth.passwordRequired');
    setErrors(next);
    return Object.keys(next).length === 0;
  };

  const onSubmit = async () => {
    if (!validate()) return;
    setLoading(true);
    setErrors({});
    try {
      await login({ email: email.trim(), password });
      router.replace('/(tabs)');
    } catch (err) {
      const message = err instanceof ApiError ? err.message : t('common.error');
      setErrors({ form: message });
    } finally {
      setLoading(false);
    }
  };

  return (
    <SafeAreaView style={styles.safe}>
      <KeyboardAvoidingView
        style={{ flex: 1 }}
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
      >
        <ScrollView contentContainerStyle={styles.content} keyboardShouldPersistTaps="handled">
          <Image
            source={require('../../assets/images/dars_icon.png')}
            style={styles.icon}
            contentFit="contain"
            accessibilityLabel={t('brand.name')}
          />
          <Text style={styles.brand}>{t('brand.nameAr')}</Text>
          <Text style={styles.title}>{t('auth.login')}</Text>
          <View style={styles.form}>
            <TextInput
              label={t('auth.email')}
              autoCapitalize="none"
              keyboardType="email-address"
              value={email}
              onChangeText={setEmail}
              error={errors.email}
            />
            <TextInput
              label={t('auth.password')}
              secureTextEntry
              value={password}
              onChangeText={setPassword}
              error={errors.password}
            />
            <Text style={styles.link} onPress={() => router.push('/(auth)/forgot-password')}>
              {t('auth.forgotPassword')}
            </Text>
            {errors.form ? <Text style={styles.formError}>{errors.form}</Text> : null}
            <Button title={t('auth.login')} onPress={onSubmit} loading={loading} />
          </View>
          <Text style={styles.footer}>
            {t('auth.noAccount')}{' '}
            <Link href="/(auth)/register" style={styles.linkInline}>
              {t('auth.register')}
            </Link>
          </Text>
        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: colors.background },
  content: { padding: spacing.xxl, gap: spacing.lg },
  icon: { width: 72, height: 72, borderRadius: 16 },
  brand: { ...typography.heading, color: colors.primary },
  title: { ...typography.display, color: colors.text, fontSize: 32 },
  form: { gap: spacing.lg, marginTop: spacing.md },
  link: { ...typography.caption, color: colors.primary, fontWeight: '600', alignSelf: 'flex-end' },
  linkInline: { color: colors.primary, fontWeight: '700' },
  formError: { ...typography.caption, color: colors.error },
  footer: { ...typography.body, color: colors.textSecondary, textAlign: 'center' },
});
