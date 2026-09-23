import { Ionicons } from '@expo/vector-icons';
import { Link, useRouter } from 'expo-router';
import React, { useState } from 'react';
import {
  ActivityIndicator,
  KeyboardAvoidingView,
  Platform,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  TextInput as RNTextInput,
  View,
  type TextInputProps,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { AuthArtShell } from '@/components/AuthArtShell';
import { useAuth } from '@/features/auth/useAuth';
import { useTranslation } from '@/i18n';
import en from '@/i18n/locales/en.json';
import { LEARNER_TYPE_LABEL_KEYS, PROVIDER_TYPE_SINGULAR_KEYS } from '@/domain/marketplace';
import { colors, radius, shadows, spacing, typography } from '@/theme';
import { ApiError } from '@/types/api';
import type { LearnerType, ProviderType, Role } from '@/types/models';
import { yogaDirection } from '@/utils/rtl';

const SERIF = Platform.select({
  ios: 'Georgia',
  android: 'serif',
  default: 'Georgia',
});

type FieldProps = TextInputProps & {
  label: string;
  icon: keyof typeof Ionicons.glyphMap;
  error?: string;
  trailing?: React.ReactNode;
};

function IconField({ label, icon, error, trailing, style, ...rest }: FieldProps) {
  return (
    <View style={styles.field}>
      <Text style={styles.fieldLabel}>{label}</Text>
      <View style={[styles.fieldBox, error ? styles.fieldBoxError : null]}>
        <View style={styles.iconTile}>
          <Ionicons name={icon} size={18} color={colors.primaryMuted} />
        </View>
        <RNTextInput
          placeholderTextColor={colors.textMuted}
          style={[styles.fieldInput, style]}
          {...rest}
        />
        {trailing}
      </View>
      {error ? <Text style={styles.fieldError}>{error}</Text> : null}
    </View>
  );
}

const ROLES: {
  value: Role;
  icon: keyof typeof Ionicons.glyphMap;
  labelKey: 'auth.student' | 'auth.tutor' | 'auth.parent';
}[] = [
  { value: 'Student', icon: 'school-outline', labelKey: 'auth.student' },
  { value: 'Tutor', icon: 'easel-outline', labelKey: 'auth.tutor' },
  { value: 'Parent', icon: 'people-outline', labelKey: 'auth.parent' },
];

export default function RegisterScreen() {
  const { t, language, isRTL } = useTranslation();
  const { register } = useAuth();
  const router = useRouter();
  const [firstName, setFirstName] = useState('');
  const [lastName, setLastName] = useState('');
  const [email, setEmail] = useState('');
  const [phone, setPhone] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [role, setRole] = useState<Role>('Student');
  const [learnerType, setLearnerType] = useState<LearnerType>('SchoolStudent');
  const [providerType, setProviderType] = useState<Extract<ProviderType, 'Teacher' | 'Trainer'>>(
    'Teacher',
  );
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
      const user = await register({
        firstName: firstName.trim(),
        lastName: lastName.trim(),
        email: email.trim(),
        phone: phone.trim() || undefined,
        password,
        role,
        language,
        ...(role === 'Student' ? { learnerType } : {}),
        ...(role === 'Tutor' ? { providerType } : {}),
      });
      router.replace(user.role === 'Tutor' ? '/tutor-dashboard' : '/(tabs)');
    } catch (err) {
      const message = err instanceof ApiError ? err.message : t('common.error');
      setErrors({ form: message });
    } finally {
      setLoading(false);
    }
  };

  return (
    <AuthArtShell>
      <SafeAreaView style={styles.safe} edges={['top', 'bottom']}>
        <KeyboardAvoidingView
          style={styles.flex}
          behavior={Platform.OS === 'ios' ? 'padding' : undefined}
        >
          <ScrollView
            contentContainerStyle={styles.content}
            keyboardShouldPersistTaps="handled"
            showsVerticalScrollIndicator={false}
          >
            <View style={[styles.header, yogaDirection(false), isRTL && styles.brandPinLeft]}>
              <Text style={styles.logoWord} accessibilityRole="header">
                {en.brand.name.toLowerCase()}
                <Text style={styles.logoDot}>.</Text>
              </Text>
              <Text style={styles.tagline}>{en.brand.tagline}</Text>
              <Text style={styles.marketplace}>{en.brand.marketplace}</Text>
              <View style={styles.accentBar} />
            </View>

            <Text style={styles.title} accessibilityRole="header">
              <Text style={styles.titlePrimary}>{t('auth.registerTitleCreate')}</Text>
              <Text style={styles.titleAccent}> {t('auth.registerTitleAccount')}</Text>
            </Text>
            <Text style={styles.subtitle}>{t('auth.registerSubtitle')}</Text>

            <View style={styles.form}>
              <View style={styles.roleBlock}>
                <Text style={styles.fieldLabel}>{t('auth.role')}</Text>
                <View style={styles.roles}>
                  {ROLES.map((item) => {
                    const selected = role === item.value;
                    return (
                      <Pressable
                        key={item.value}
                        onPress={() => setRole(item.value)}
                        style={[styles.roleCard, selected && styles.roleCardSelected]}
                        accessibilityRole="button"
                        accessibilityState={{ selected }}
                      >
                        <Ionicons
                          name={item.icon}
                          size={22}
                          color={selected ? colors.primary : colors.textMuted}
                        />
                        <Text style={[styles.roleLabel, selected && styles.roleLabelSelected]}>
                          {t(item.labelKey)}
                        </Text>
                      </Pressable>
                    );
                  })}
                </View>
              </View>

              {role === 'Student' ? (
                <View style={styles.roleBlock}>
                  <Text style={styles.fieldLabel}>{t('marketplace.learnerType')}</Text>
                  <View style={styles.roles}>
                    {(
                      [
                        'SchoolStudent',
                        'UniversityStudent',
                        'Individual',
                      ] as LearnerType[]
                    ).map((value) => {
                      const selected = learnerType === value;
                      return (
                        <Pressable
                          key={value}
                          onPress={() => setLearnerType(value)}
                          style={[styles.learnerCard, selected && styles.roleCardSelected]}
                        >
                          <Text
                            style={[
                              styles.learnerLabel,
                              selected && styles.roleLabelSelected,
                            ]}
                            numberOfLines={2}
                          >
                            {t(LEARNER_TYPE_LABEL_KEYS[value])}
                          </Text>
                        </Pressable>
                      );
                    })}
                  </View>
                </View>
              ) : null}

              {role === 'Tutor' ? (
                <View style={styles.roleBlock}>
                  <Text style={styles.fieldLabel}>{t('marketplace.providerType')}</Text>
                  <View style={styles.roles}>
                    {(['Teacher', 'Trainer'] as const).map((value) => {
                      const selected = providerType === value;
                      return (
                        <Pressable
                          key={value}
                          onPress={() => setProviderType(value)}
                          style={[styles.roleCard, selected && styles.roleCardSelected]}
                        >
                          <Text style={[styles.roleLabel, selected && styles.roleLabelSelected]}>
                            {t(PROVIDER_TYPE_SINGULAR_KEYS[value])}
                          </Text>
                        </Pressable>
                      );
                    })}
                  </View>
                </View>
              ) : null}

              <IconField
                label={t('auth.firstName')}
                icon="person-outline"
                placeholder={t('auth.firstName')}
                value={firstName}
                onChangeText={setFirstName}
                error={errors.firstName}
                autoComplete="given-name"
              />
              <IconField
                label={t('auth.lastName')}
                icon="person-outline"
                placeholder={t('auth.lastName')}
                value={lastName}
                onChangeText={setLastName}
                error={errors.lastName}
                autoComplete="family-name"
              />
              <IconField
                label={t('auth.email')}
                icon="mail-outline"
                placeholder={t('auth.email')}
                autoCapitalize="none"
                keyboardType="email-address"
                autoComplete="email"
                value={email}
                onChangeText={setEmail}
                error={errors.email}
              />
              <IconField
                label={t('auth.phone')}
                icon="call-outline"
                placeholder={t('auth.phone')}
                keyboardType="phone-pad"
                autoComplete="tel"
                value={phone}
                onChangeText={setPhone}
              />
              <IconField
                label={t('auth.password')}
                icon="lock-closed-outline"
                placeholder={t('auth.password')}
                secureTextEntry={!showPassword}
                autoComplete="new-password"
                value={password}
                onChangeText={setPassword}
                error={errors.password}
                trailing={
                  <Pressable
                    onPress={() => setShowPassword((v) => !v)}
                    hitSlop={10}
                    accessibilityRole="button"
                    accessibilityLabel={showPassword ? 'Hide password' : 'Show password'}
                    style={styles.eyeBtn}
                  >
                    <Ionicons
                      name={showPassword ? 'eye-off-outline' : 'eye-outline'}
                      size={20}
                      color={colors.textMuted}
                    />
                  </Pressable>
                }
              />

              {errors.form ? <Text style={styles.formError}>{errors.form}</Text> : null}

              <Pressable
                onPress={onSubmit}
                disabled={loading}
                style={({ pressed }) => [
                  styles.submit,
                  pressed && !loading && styles.submitPressed,
                  loading && styles.submitDisabled,
                ]}
                accessibilityRole="button"
              >
                <View style={styles.submitSide} />
                {loading ? (
                  <ActivityIndicator color={colors.white} style={styles.submitText} />
                ) : (
                  <Text style={styles.submitText}>{t('auth.register')}</Text>
                )}
                <View style={styles.submitSide}>
                  <Ionicons
                    name={isRTL ? 'arrow-back' : 'arrow-forward'}
                    size={20}
                    color={colors.white}
                  />
                </View>
              </Pressable>
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
    </AuthArtShell>
  );
}

const styles = StyleSheet.create({
  flex: { flex: 1 },
  safe: { flex: 1, zIndex: 1 },
  content: {
    paddingHorizontal: spacing.xxl,
    paddingTop: spacing.lg,
    paddingBottom: spacing.massive,
    gap: spacing.md,
  },
  header: {
    gap: 2,
    marginBottom: spacing.sm,
    maxWidth: '55%',
    alignSelf: 'flex-start',
  },
  /** Under RTL parent, flex-end is the physical left (same slot as English). */
  brandPinLeft: {
    alignSelf: 'flex-end',
  },
  logoWord: {
    fontFamily: SERIF,
    fontSize: 36,
    lineHeight: 42,
    fontWeight: '700',
    color: colors.primary,
    letterSpacing: -0.4,
    textAlign: 'left',
    writingDirection: 'ltr',
  },
  logoDot: {
    color: colors.lavender,
    fontWeight: '700',
  },
  tagline: {
    ...typography.caption,
    color: colors.textSecondary,
    fontSize: 13,
    fontWeight: '600',
    textAlign: 'left',
    writingDirection: 'ltr',
  },
  marketplace: {
    ...typography.caption,
    color: colors.textMuted,
    fontSize: 12,
    textAlign: 'left',
    writingDirection: 'ltr',
  },
  accentBar: {
    width: 36,
    height: 4,
    borderRadius: 2,
    backgroundColor: colors.lavender,
    marginTop: spacing.sm,
    alignSelf: 'flex-start',
  },
  title: {
    fontFamily: SERIF,
    fontSize: 34,
    lineHeight: 40,
    fontWeight: '700',
    marginTop: spacing.sm,
  },
  titlePrimary: {
    color: colors.primary,
  },
  titleAccent: {
    color: '#8B7FB8',
  },
  subtitle: {
    ...typography.body,
    color: colors.textMuted,
    fontSize: 15,
    lineHeight: 22,
    marginBottom: spacing.sm,
    maxWidth: 320,
  },
  form: {
    gap: spacing.md,
  },
  field: {
    gap: 6,
  },
  fieldLabel: {
    ...typography.caption,
    color: colors.textSecondary,
    fontWeight: '600',
    fontSize: 13,
  },
  fieldBox: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.white,
    borderRadius: radius.xl,
    borderWidth: 1,
    borderColor: colors.border,
    paddingHorizontal: spacing.sm,
    minHeight: 54,
    gap: spacing.sm,
    ...shadows.sm,
  },
  fieldBoxError: {
    borderColor: colors.error,
  },
  iconTile: {
    width: 36,
    height: 36,
    borderRadius: radius.md,
    backgroundColor: colors.lavenderSoft,
    alignItems: 'center',
    justifyContent: 'center',
  },
  fieldInput: {
    flex: 1,
    fontSize: 16,
    lineHeight: 20,
    color: colors.text,
    paddingVertical: 0,
    marginVertical: 0,
    minHeight: 48,
    textAlignVertical: 'center',
    includeFontPadding: false,
  },
  eyeBtn: {
    paddingHorizontal: spacing.sm,
    paddingVertical: spacing.sm,
  },
  fieldError: {
    ...typography.caption,
    color: colors.error,
  },
  roleBlock: {
    gap: 8,
    marginBottom: spacing.xs,
  },
  roles: {
    flexDirection: 'row',
    gap: spacing.sm,
  },
  roleCard: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
    paddingVertical: spacing.md,
    paddingHorizontal: spacing.sm,
    borderRadius: radius.lg,
    backgroundColor: colors.white,
    borderWidth: 1.5,
    borderColor: colors.border,
    minHeight: 84,
  },
  learnerCard: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: spacing.sm,
    paddingHorizontal: spacing.xs,
    borderRadius: radius.lg,
    backgroundColor: colors.white,
    borderWidth: 1.5,
    borderColor: colors.border,
    minHeight: 44,
    maxHeight: 52,
  },
  roleCardSelected: {
    backgroundColor: colors.lavenderSoft,
    borderColor: colors.lavender,
  },
  roleLabel: {
    ...typography.caption,
    color: colors.textMuted,
    fontWeight: '600',
    fontSize: 13,
  },
  learnerLabel: {
    ...typography.caption,
    color: colors.textMuted,
    fontWeight: '600',
    fontSize: 12,
    textAlign: 'center',
    lineHeight: 16,
  },
  roleLabelSelected: {
    color: colors.primary,
  },
  formError: {
    ...typography.caption,
    color: colors.error,
  },
  submit: {
    marginTop: spacing.sm,
    backgroundColor: colors.primary,
    borderRadius: radius.lg,
    minHeight: 56,
    paddingHorizontal: spacing.lg,
    flexDirection: 'row',
    alignItems: 'center',
  },
  submitSide: {
    width: 28,
    alignItems: 'center',
    justifyContent: 'center',
  },
  submitPressed: {
    opacity: 0.92,
  },
  submitDisabled: {
    opacity: 0.55,
  },
  submitText: {
    ...typography.button,
    color: colors.white,
    fontWeight: '700',
    flex: 1,
    textAlign: 'center',
  },
  footer: {
    ...typography.body,
    color: colors.textSecondary,
    textAlign: 'center',
    marginTop: spacing.lg,
  },
  linkInline: {
    color: colors.primary,
    fontWeight: '700',
  },
});
