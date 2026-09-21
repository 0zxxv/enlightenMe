import { useRouter } from 'expo-router';
import React from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Avatar } from '@/components/Avatar';
import { Button } from '@/components/Button';
import { useAuth } from '@/features/auth/useAuth';
import { useTranslation } from '@/i18n';
import { colors, radius, shadows, spacing, typography } from '@/theme';
import { fullName } from '@/utils/format';

export default function ProfileScreen() {
  const { t } = useTranslation();
  const { user, logout } = useAuth();
  const router = useRouter();
  const name = fullName(user?.firstName, user?.lastName);

  const links = [
    { label: t('profile.favorites'), href: '/favorites' as const },
    { label: t('profile.settings'), href: '/settings' as const },
    { label: t('profile.language'), href: '/settings/language' as const },
  ];

  return (
    <SafeAreaView style={styles.safe} edges={['top']}>
      <Text style={styles.title}>{t('profile.title')}</Text>
      <View style={styles.card}>
        <Avatar name={name} size={64} />
        <View style={styles.meta}>
          <Text style={styles.name}>{name || t('brand.name')}</Text>
          <Text style={styles.email}>{user?.email}</Text>
          <Text style={styles.role}>{user?.role}</Text>
        </View>
      </View>

      <View style={styles.links}>
        {links.map((link) => (
          <Pressable key={link.href} style={styles.link} onPress={() => router.push(link.href)}>
            <Text style={styles.linkText}>{link.label}</Text>
          </Pressable>
        ))}
        {user?.role === 'Tutor' || user?.role === 'Admin' ? (
          <Pressable
            style={styles.link}
            onPress={() => router.push('/tutor-dashboard')}
          >
            <Text style={styles.linkText}>{t('profile.tutorDashboard')}</Text>
          </Pressable>
        ) : null}
        {user?.role === 'InstituteAdmin' || user?.role === 'Admin' ? (
          <Pressable
            style={styles.link}
            onPress={() => router.push('/institute-dashboard')}
          >
            <Text style={styles.linkText}>{t('profile.instituteDashboard')}</Text>
          </Pressable>
        ) : null}
      </View>

      <Button
        title={t('common.logout')}
        variant="danger"
        onPress={async () => {
          await logout();
          router.replace('/(auth)/login');
        }}
      />
      <Button title={t('auth.devMode')} variant="ghost" onPress={() => router.push('/dev-mode')} />
      <Text style={styles.version}>
        {t('brand.name')} · {t('profile.version')} 1.0.0
      </Text>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: {
    flex: 1,
    backgroundColor: colors.background,
    padding: spacing.xl,
    gap: spacing.lg,
  },
  title: { ...typography.heading, color: colors.text },
  card: {
    flexDirection: 'row',
    gap: spacing.lg,
    backgroundColor: colors.white,
    borderRadius: radius.xl,
    padding: spacing.xl,
    ...shadows.sm,
  },
  meta: { flex: 1, justifyContent: 'center', gap: spacing.xs },
  name: { ...typography.subheading, color: colors.text },
  email: { ...typography.caption, color: colors.textSecondary },
  role: { ...typography.caption, color: colors.primary, fontWeight: '700' },
  links: { gap: spacing.sm },
  link: {
    backgroundColor: colors.white,
    borderRadius: radius.lg,
    padding: spacing.lg,
    ...shadows.sm,
  },
  linkText: { ...typography.body, color: colors.text, fontWeight: '600' },
  version: {
    ...typography.caption,
    color: colors.textMuted,
    textAlign: 'center',
    marginTop: 'auto',
  },
});
