import { Ionicons } from '@expo/vector-icons';
import { Image } from 'expo-image';
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
import { useAuth } from '@/features/auth/useAuth';
import { useTranslation } from '@/i18n';
import { colors, radius, shadows, spacing, typography } from '@/theme';
import { ApiError } from '@/types/api';
import type { Role } from '@/types/models';

const BEIGE = '#F7F3EE';
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
    <View style={styles.root}>
      <View
        style={[styles.decorTop, isRTL ? styles.decorTopRtl : null]}
        pointerEvents="none"
      >
        <Image
          source={require('../../assets/images/bg.png')}
          style={styles.decorTopImage}
          contentFit="cover"
          contentPosition="top"
        />
      </View>
      <View
        style={[styles.decorBlobA, isRTL ? styles.decorBlobARtl : null]}
        pointerEvents="none"
      />
      <View
        style={[styles.decorBlobB, isRTL ? styles.decorBlobBRtl : null]}
        pointerEvents="none"
      />

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
            <View style={styles.header}>
              <Text style={styles.logoWord} accessibilityRole="header">
                {t('brand.name').toLowerCase()}
                <Text style={styles.logoDot}>.</Text>
              </Text>
              <Text style={styles.tagline}>{t('brand.tagline')}</Text>
              <View style={[styles.accentBar, isRTL && styles.accentBarRtl]} />
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
    </View>
  );
}

const styles = StyleSheet.create({
  root: {
    flex: 1,
    backgroundColor: BEIGE,
    overflow: 'hidden',
  },
  flex: { flex: 1 },
  safe: { flex: 1 },
  decorTop: {
    position: 'absolute',
    top: -12,
    right: -28,
    width: '58%',
    height: 260,
    borderBottomLeftRadius: 120,
    borderTopLeftRadius: 40,
    overflow: 'hidden',
    opacity: 0.92,
  },
  decorTopRtl: {
    right: undefined,
    left: -28,
    borderBottomLeftRadius: 0,
    borderTopLeftRadius: 0,
    borderBottomRightRadius: 120,
    borderTopRightRadius: 40,
  },
  decorTopImage: {
    width: '140%',
    height: '140%',
    marginLeft: '-10%',
  },
  decorBlobA: {
    position: 'absolute',
    bottom: -60,
    left: -80,
    width: 220,
    height: 180,
    borderRadius: 110,
    backgroundColor: colors.lavenderSoft,
    opacity: 0.55,
  },
  decorBlobARtl: {
    left: undefined,
    right: -80,
  },
  decorBlobB: {
    position: 'absolute',
    bottom: 40,
    left: 40,
    width: 140,
    height: 100,
    borderRadius: 80,
    backgroundColor: colors.beige,
    opacity: 0.7,
  },
  decorBlobBRtl: {
    left: undefined,
    right: 40,
  },
  content: {
    paddingHorizontal: spacing.xxl,
    paddingTop: spacing.lg,
    paddingBottom: spacing.massive,
    gap: spacing.md,
  },
  header: {
    gap: 4,
    marginBottom: spacing.sm,
    maxWidth: '55%',
  },
  logoWord: {
    fontFamily: SERIF,
    fontSize: 36,
    lineHeight: 42,
    fontWeight: '700',
    color: colors.primary,
    letterSpacing: -0.4,
  },
  logoDot: {
    color: colors.lavender,
    fontWeight: '700',
  },
  tagline: {
    ...typography.caption,
    color: colors.textMuted,
    fontSize: 13,
  },
  accentBar: {
    width: 36,
    height: 4,
    borderRadius: 2,
    backgroundColor: colors.lavender,
    marginTop: spacing.sm,
  },
  accentBarRtl: {
    alignSelf: 'flex-end',
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
    ...typography.body,
    flex: 1,
    color: colors.text,
    paddingVertical: spacing.md,
    minHeight: 48,
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
