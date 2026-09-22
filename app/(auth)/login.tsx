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
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { AuthArtShell } from '@/components/AuthArtShell';
import { useAuth } from '@/features/auth/useAuth';
import { useTranslation } from '@/i18n';
import en from '@/i18n/locales/en.json';
import { colors, radius, shadows, spacing, typography } from '@/theme';
import { ApiError } from '@/types/api';
import { yogaDirection } from '@/utils/rtl';

const SERIF = Platform.select({
  ios: 'Georgia',
  android: 'serif',
  default: 'Georgia',
});

export default function LoginScreen() {
  const { t, isRTL } = useTranslation();
  const { login, isAuthenticated, user, logout } = useAuth();
  const router = useRouter();
  const [email, setEmail] = useState('student@dars.app');
  const [password, setPassword] = useState('Password123!');
  const [showPassword, setShowPassword] = useState(false);
  const [errors, setErrors] = useState<{ email?: string; password?: string; form?: string }>({});
  const [loading, setLoading] = useState(false);

  const goHome = () => {
    if (user?.role === 'Tutor') {
      router.replace('/tutor-dashboard');
      return;
    }
    router.replace('/(tabs)');
  };

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
      const signedIn = await login({ email: email.trim(), password });
      router.replace(signedIn.role === 'Tutor' ? '/tutor-dashboard' : '/(tabs)');
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
            <View style={[styles.brandBlock, yogaDirection(false), isRTL && styles.brandPinLeft]}>
              <Text style={styles.logoWord} accessibilityRole="header">
                {en.brand.name.toLowerCase()}
                <Text style={styles.logoDot}>.</Text>
              </Text>
              <Text style={styles.tagline}>{en.brand.tagline}</Text>
              <Text style={styles.marketplace}>{en.brand.marketplace}</Text>
            </View>

            <View style={styles.headingBlock}>
              <Text style={styles.brandAr}>{t('brand.nameAr')}</Text>
              <Text style={styles.title}>{t('auth.login')}</Text>
              <Text style={styles.subtitle}>{t('auth.loginSubtitle')}</Text>
            </View>

            {isAuthenticated && user ? (
              <View style={styles.form}>
                <Text style={styles.sessionHint}>
                  {t('auth.continueAs')} {user.firstName}
                </Text>
                <Pressable style={styles.primaryBtn} onPress={goHome}>
                  <Text style={styles.primaryBtnText}>{t('auth.continueToApp')}</Text>
                  <View style={styles.primaryArrow}>
                    <Ionicons
                      name={isRTL ? 'arrow-back' : 'arrow-forward'}
                      size={18}
                      color={colors.primary}
                    />
                  </View>
                </Pressable>
                <Pressable
                  style={styles.secondaryBtn}
                  onPress={async () => {
                    await logout();
                  }}
                >
                  <Text style={styles.secondaryBtnText}>{t('common.logout')}</Text>
                </Pressable>
              </View>
            ) : (
              <View style={styles.form}>
                <View style={styles.field}>
                  <Text style={styles.fieldLabel}>{t('auth.email')}</Text>
                  <View style={[styles.fieldBox, errors.email ? styles.fieldBoxError : null]}>
                    <View style={styles.iconTile}>
                      <Ionicons name="mail-outline" size={18} color={colors.primaryMuted} />
                    </View>
                    <RNTextInput
                      value={email}
                      onChangeText={setEmail}
                      autoCapitalize="none"
                      keyboardType="email-address"
                      autoComplete="email"
                      placeholder={t('auth.email')}
                      placeholderTextColor={colors.textMuted}
                      style={styles.fieldInput}
                    />
                  </View>
                  {errors.email ? <Text style={styles.fieldError}>{errors.email}</Text> : null}
                </View>

                <View style={styles.field}>
                  <Text style={styles.fieldLabel}>{t('auth.password')}</Text>
                  <View style={[styles.fieldBox, errors.password ? styles.fieldBoxError : null]}>
                    <View style={styles.iconTile}>
                      <Ionicons name="lock-closed-outline" size={18} color={colors.primaryMuted} />
                    </View>
                    <RNTextInput
                      value={password}
                      onChangeText={setPassword}
                      secureTextEntry={!showPassword}
                      autoComplete="password"
                      placeholder={t('auth.passwordPlaceholder')}
                      placeholderTextColor={colors.textMuted}
                      style={styles.fieldInput}
                    />
                    <Pressable
                      onPress={() => setShowPassword((v) => !v)}
                      hitSlop={10}
                      style={styles.eyeBtn}
                    >
                      <Ionicons
                        name={showPassword ? 'eye-off-outline' : 'eye-outline'}
                        size={20}
                        color={colors.textMuted}
                      />
                    </Pressable>
                  </View>
                  {errors.password ? (
                    <Text style={styles.fieldError}>{errors.password}</Text>
                  ) : null}
                </View>

                <Pressable
                  onPress={() => router.push('/(auth)/forgot-password')}
                  style={styles.forgotWrap}
                >
                  <Text style={styles.forgot}>{t('auth.forgotPassword')}</Text>
                </Pressable>

                {errors.form ? <Text style={styles.formError}>{errors.form}</Text> : null}

                <Pressable
                  onPress={onSubmit}
                  disabled={loading}
                  style={({ pressed }) => [
                    styles.primaryBtn,
                    pressed && !loading && styles.pressed,
                    loading && styles.disabled,
                  ]}
                >
                  {loading ? (
                    <ActivityIndicator color={colors.white} style={styles.primaryBtnText} />
                  ) : (
                    <Text style={styles.primaryBtnText}>{t('auth.login')}</Text>
                  )}
                  <View style={styles.primaryArrow}>
                    <Ionicons
                      name={isRTL ? 'arrow-back' : 'arrow-forward'}
                      size={18}
                      color={colors.primary}
                    />
                  </View>
                </Pressable>

                <View style={styles.orRow}>
                  <View style={styles.orLine} />
                  <Text style={styles.orText}>{t('auth.or')}</Text>
                  <View style={styles.orLine} />
                </View>

                <Pressable
                  style={styles.secondaryBtn}
                  onPress={() => router.push('/dev-mode')}
                  disabled={loading}
                >
                  <Text style={styles.secondaryBtnText}>{t('auth.devMode')}</Text>
                  <Ionicons name="code-slash-outline" size={18} color={colors.primary} />
                </Pressable>
              </View>
            )}

            {!isAuthenticated ? (
              <Text style={styles.footer}>
                {t('auth.noAccount')}{' '}
                <Link href="/(auth)/register" style={styles.linkInline}>
                  {t('auth.register')}
                </Link>
              </Text>
            ) : null}
          </ScrollView>
        </KeyboardAvoidingView>
      </SafeAreaView>
    </AuthArtShell>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, zIndex: 1 },
  flex: { flex: 1 },
  content: {
    paddingHorizontal: spacing.xxl,
    paddingTop: spacing.lg,
    paddingBottom: spacing.massive,
    gap: spacing.md,
  },
  brandBlock: {
    gap: 2,
    maxWidth: '52%',
    marginBottom: spacing.xl,
    alignSelf: 'flex-start',
  },
  /** Under RTL parent, flex-end is the physical left (same slot as English). */
  brandPinLeft: {
    alignSelf: 'flex-end',
  },
  logoWord: {
    fontFamily: SERIF,
    fontSize: 34,
    lineHeight: 40,
    fontWeight: '700',
    color: colors.primary,
    letterSpacing: -0.4,
    textAlign: 'left',
    writingDirection: 'ltr',
  },
  logoDot: { color: colors.lavender, fontWeight: '700' },
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
  headingBlock: { gap: spacing.xs, marginTop: spacing.md },
  brandAr: {
    ...typography.subheading,
    color: colors.primary,
    fontWeight: '700',
  },
  title: {
    fontFamily: SERIF,
    fontSize: 32,
    lineHeight: 40,
    fontWeight: '700',
    color: colors.primary,
  },
  subtitle: {
    ...typography.body,
    color: colors.textMuted,
    fontSize: 15,
    lineHeight: 22,
    marginBottom: spacing.sm,
  },
  form: { gap: spacing.md },
  field: { gap: 6 },
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
  fieldBoxError: { borderColor: colors.error },
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
  eyeBtn: { paddingHorizontal: spacing.sm, paddingVertical: spacing.sm },
  fieldError: { ...typography.caption, color: colors.error },
  forgotWrap: { alignSelf: 'flex-end' },
  forgot: {
    ...typography.caption,
    color: colors.primary,
    fontWeight: '700',
  },
  formError: { ...typography.caption, color: colors.error },
  sessionHint: { ...typography.body, color: colors.textSecondary },
  primaryBtn: {
    marginTop: spacing.sm,
    backgroundColor: colors.primary,
    borderRadius: radius.lg,
    minHeight: 56,
    paddingHorizontal: spacing.lg,
    flexDirection: 'row',
    alignItems: 'center',
  },
  primaryBtnText: {
    ...typography.button,
    color: colors.white,
    fontWeight: '700',
    flex: 1,
    textAlign: 'center',
  },
  primaryArrow: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: colors.lavenderSoft,
    alignItems: 'center',
    justifyContent: 'center',
  },
  orRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.md,
    marginVertical: spacing.xs,
  },
  orLine: { flex: 1, height: StyleSheet.hairlineWidth, backgroundColor: colors.borderStrong },
  orText: { ...typography.caption, color: colors.textMuted, fontWeight: '600' },
  secondaryBtn: {
    backgroundColor: colors.white,
    borderRadius: radius.lg,
    minHeight: 52,
    paddingHorizontal: spacing.lg,
    borderWidth: 1.5,
    borderColor: colors.border,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: spacing.sm,
  },
  secondaryBtnText: {
    ...typography.button,
    color: colors.primary,
    fontWeight: '700',
  },
  pressed: { opacity: 0.92 },
  disabled: { opacity: 0.55 },
  footer: {
    ...typography.body,
    color: colors.textSecondary,
    textAlign: 'center',
    marginTop: spacing.lg,
  },
  linkInline: { color: colors.primary, fontWeight: '700' },
});
