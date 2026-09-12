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
import { Chip } from '@/components/Chip';
import { TextInput } from '@/components/TextInput';
import { useAuth } from '@/features/auth/useAuth';
import { useTranslation } from '@/i18n';
import { colors, spacing, typography } from '@/theme';
import { ApiError } from '@/types/api';
import type { Role } from '@/types/models';

export default function RegisterScreen() {
  const { t, language } = useTranslation();
  const { register } = useAuth();
  const router = useRouter();
  const [firstName, setFirstName] = useState('');
  const [lastName, setLastName] = useState('');
  const [email, setEmail] = useState('');
  const [phone, setPhone] = useState('');
  const [password, setPassword] = useState('');
  const [role, setRole] = useState<Role>('Student');
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [loading, setLoading] = useState(false);

  const validate = () => {
    const next: Record<string, string> = {};
    if (!firstName.trim()) next.firstName = t('auth.nameRequired');
    if (!lastName.trim()) next.lastName = t('auth.nameRequired');
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) next.email = t('auth.invalidEmail');
    if (password.length < 8) next.password = t('auth.passwordMin');
    setErrors(next);
    return Object.keys(next).length === 0;
  };

  const onSubmit = async () => {
    if (!validate()) return;
    setLoading(true);
    try {
      await register({
        firstName: firstName.trim(),
        lastName: lastName.trim(),
        email: email.trim(),
        phone: phone.trim() || undefined,
        password,
        role,
        language,
      });
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
          <Text style={styles.brand}>{t('brand.name')}</Text>
          <Text style={styles.title}>{t('auth.register')}</Text>
          <View style={styles.form}>
            <TextInput
              label={t('auth.firstName')}
              value={firstName}
              onChangeText={setFirstName}
              error={errors.firstName}
            />
            <TextInput
              label={t('auth.lastName')}
              value={lastName}
              onChangeText={setLastName}
              error={errors.lastName}
            />
            <TextInput
              label={t('auth.email')}
              autoCapitalize="none"
              keyboardType="email-address"
              value={email}
              onChangeText={setEmail}
              error={errors.email}
            />
            <TextInput
              label={t('auth.phone')}
              keyboardType="phone-pad"
              value={phone}
              onChangeText={setPhone}
            />
            <TextInput
              label={t('auth.password')}
              secureTextEntry
              value={password}
              onChangeText={setPassword}
              error={errors.password}
            />
            <Text style={styles.label}>{t('auth.role')}</Text>
            <View style={styles.roles}>
              {(
                [
                  ['Student', t('auth.student')],
                  ['Tutor', t('auth.tutor')],
                  ['Parent', t('auth.parent')],
                ] as const
              ).map(([value, label]) => (
                <Chip
                  key={value}
                  label={label}
                  selected={role === value}
                  onPress={() => setRole(value)}
                />
              ))}
            </View>
            {errors.form ? <Text style={styles.formError}>{errors.form}</Text> : null}
            <Button title={t('auth.register')} onPress={onSubmit} loading={loading} />
          </View>
          <Text style={styles.footer}>
            {t('auth.hasAccount')}{' '}
            <Link href="/(auth)/login" style={styles.linkInline}>
              {t('auth.login')}
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
  brand: { ...typography.heading, color: colors.primary },
  title: { ...typography.display, color: colors.text, fontSize: 32 },
  form: { gap: spacing.lg },
  label: { ...typography.caption, color: colors.textSecondary, fontWeight: '600' },
  roles: { flexDirection: 'row', flexWrap: 'wrap', gap: spacing.sm },
  formError: { ...typography.caption, color: colors.error },
  footer: { ...typography.body, color: colors.textSecondary, textAlign: 'center' },
  linkInline: { color: colors.primary, fontWeight: '700' },
});
