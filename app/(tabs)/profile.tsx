import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import React from 'react';
import {
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Avatar } from '@/components/Avatar';
import { useAuth } from '@/features/auth/useAuth';
import { useTranslation } from '@/i18n';
import { colors, radius, shadows, spacing, typography } from '@/theme';
import { fullName } from '@/utils/format';
import { yogaDirection } from '@/utils/rtl';

type MenuItem = {
  key: string;
  title: string;
  subtitle: string;
  icon: keyof typeof Ionicons.glyphMap;
  onPress: () => void;
};

export default function ProfileScreen() {
  const { t, isRTL } = useTranslation();
  const { user, logout } = useAuth();
  const router = useRouter();
  const name = fullName(user?.firstName, user?.lastName);
  const chevron = isRTL ? 'chevron-back' : 'chevron-forward';

  const menu: MenuItem[] = [
    {
      key: 'favorites',
      title: t('profile.favorites'),
      subtitle: t('profile.favoritesHint'),
      icon: 'heart-outline',
      onPress: () => router.push('/favorites'),
    },
    {
      key: 'settings',
      title: t('profile.settings'),
      subtitle: t('profile.settingsHint'),
      icon: 'settings-outline',
      onPress: () => router.push('/settings'),
    },
    {
      key: 'language',
      title: t('profile.language'),
      subtitle: t('profile.languageHint'),
      icon: 'globe-outline',
      onPress: () => router.push('/settings/language'),
    },
    {
      key: 'notifications',
      title: t('profile.notifications'),
      subtitle: t('profile.notificationsHint'),
      icon: 'notifications-outline',
      onPress: () => router.push('/notifications'),
    },
    {
      key: 'privacy',
      title: t('profile.privacy'),
      subtitle: t('profile.privacyHint'),
      icon: 'shield-checkmark-outline',
      onPress: () => router.push('/settings'),
    },
    {
      key: 'help',
      title: t('profile.help'),
      subtitle: t('profile.helpHint'),
      icon: 'help-circle-outline',
      onPress: () => undefined,
    },
  ];

  if (user?.role === 'Tutor' || user?.role === 'Admin') {
    menu.splice(1, 0, {
      key: 'tutor',
      title: t('profile.tutorDashboard'),
      subtitle: t('profile.tutorDashboardHint'),
      icon: 'easel-outline',
      onPress: () => router.push('/tutor-dashboard'),
    });
  }
  if (user?.role === 'InstituteAdmin' || user?.role === 'Admin') {
    menu.splice(1, 0, {
      key: 'institute',
      title: t('profile.instituteDashboard'),
      subtitle: t('profile.instituteDashboardHint'),
      icon: 'business-outline',
      onPress: () => router.push('/institute-dashboard'),
    });
  }

  return (
    <View style={styles.root}>
      <View style={styles.blobTop} pointerEvents="none" />
      <View style={styles.blobBottom} pointerEvents="none" />

      <SafeAreaView style={styles.safe} edges={['top']}>
        <ScrollView
          contentContainerStyle={styles.content}
          showsVerticalScrollIndicator={false}
        >
          <View style={styles.header}>
            <Text style={[styles.title, isRTL && styles.textEnd]}>{t('profile.title')}</Text>
            <Text style={[styles.subtitle, isRTL && styles.textEnd]}>{t('profile.subtitle')}</Text>
          </View>

          <Pressable style={styles.userCard} onPress={() => router.push('/settings')}>
            <Avatar name={name} size={56} />
            <View style={[styles.userMeta, yogaDirection(false), isRTL && styles.metaEnd]}>
              <Text style={[styles.userName, isRTL && styles.textEnd]}>
                {name || t('brand.name')}
              </Text>
              <Text style={[styles.userEmail, isRTL && styles.textEnd]}>{user?.email}</Text>
              {user?.role ? (
                <View style={styles.rolePill}>
                  <Text style={styles.rolePillText}>{user.role}</Text>
                </View>
              ) : null}
            </View>
            <Ionicons name={chevron} size={20} color={colors.textMuted} />
          </Pressable>

          <View style={styles.menu}>
            {menu.map((item) => (
              <Pressable key={item.key} style={styles.menuCard} onPress={item.onPress}>
                <View style={styles.menuIcon}>
                  <Ionicons name={item.icon} size={20} color={colors.primary} />
                </View>
                <View style={[styles.menuText, yogaDirection(false), isRTL && styles.metaEnd]}>
                  <Text style={[styles.menuTitle, isRTL && styles.textEnd]}>{item.title}</Text>
                  <Text style={[styles.menuSubtitle, isRTL && styles.textEnd]}>{item.subtitle}</Text>
                </View>
                <Ionicons name={chevron} size={18} color={colors.textMuted} />
              </Pressable>
            ))}
          </View>

          <Pressable
            style={styles.logoutBtn}
            onPress={async () => {
              await logout();
              router.replace('/(auth)/login');
            }}
          >
            <Ionicons name="log-out-outline" size={20} color={colors.error} />
            <Text style={styles.logoutText}>{t('common.logout')}</Text>
          </Pressable>

          <Text style={styles.version}>
            {t('brand.name')} · 1.0.0
          </Text>
        </ScrollView>
      </SafeAreaView>
    </View>
  );
}

const styles = StyleSheet.create({
  root: {
    flex: 1,
    backgroundColor: colors.background,
    overflow: 'hidden',
  },
  blobTop: {
    position: 'absolute',
    top: -40,
    right: -50,
    width: 180,
    height: 160,
    borderRadius: 90,
    backgroundColor: colors.lavenderSoft,
    opacity: 0.7,
  },
  blobBottom: {
    position: 'absolute',
    bottom: 80,
    left: -40,
    width: 160,
    height: 140,
    borderRadius: 80,
    backgroundColor: '#F3E8E0',
    opacity: 0.75,
  },
  safe: { flex: 1 },
  content: {
    paddingHorizontal: spacing.xl,
    paddingTop: spacing.lg,
    paddingBottom: spacing.massive,
    gap: spacing.md,
  },
  header: { gap: spacing.xs, marginBottom: spacing.sm },
  title: {
    ...typography.heading,
    color: colors.primary,
    fontSize: 28,
    lineHeight: 34,
  },
  subtitle: {
    ...typography.body,
    color: colors.textMuted,
    fontSize: 14,
  },
  textEnd: {
    textAlign: 'right',
    writingDirection: 'rtl',
    alignSelf: 'stretch',
  },
  metaEnd: {
    alignItems: 'flex-end',
  },
  userCard: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.md,
    backgroundColor: colors.white,
    borderRadius: radius.xl,
    padding: spacing.lg,
    ...shadows.sm,
  },
  userMeta: { flex: 1, gap: 4, alignItems: 'flex-start' },
  userName: { ...typography.subheading, color: colors.text, fontWeight: '700' },
  userEmail: { ...typography.caption, color: colors.textSecondary },
  rolePill: {
    marginTop: 4,
    backgroundColor: colors.primary,
    borderRadius: radius.full,
    paddingHorizontal: spacing.md,
    paddingVertical: 3,
  },
  rolePillText: {
    ...typography.caption,
    color: colors.white,
    fontWeight: '700',
    fontSize: 11,
  },
  menu: { gap: spacing.sm, marginTop: spacing.xs },
  menuCard: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.md,
    backgroundColor: colors.white,
    borderRadius: radius.lg,
    paddingVertical: spacing.md,
    paddingHorizontal: spacing.lg,
    ...shadows.sm,
  },
  menuIcon: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: colors.lavenderSoft,
    alignItems: 'center',
    justifyContent: 'center',
  },
  menuText: { flex: 1, gap: 2, alignItems: 'flex-start' },
  menuTitle: {
    ...typography.body,
    color: colors.text,
    fontWeight: '700',
  },
  menuSubtitle: {
    ...typography.caption,
    color: colors.textMuted,
  },
  logoutBtn: {
    marginTop: spacing.md,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: spacing.sm,
    backgroundColor: colors.errorSoft,
    borderRadius: radius.lg,
    minHeight: 52,
    paddingHorizontal: spacing.lg,
  },
  logoutText: {
    ...typography.button,
    color: colors.error,
    fontWeight: '700',
  },
  version: {
    ...typography.caption,
    color: colors.textMuted,
    textAlign: 'center',
    marginTop: spacing.md,
  },
});
