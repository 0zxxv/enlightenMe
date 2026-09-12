import { useNavigation, useRouter } from 'expo-router';
import React, { useLayoutEffect } from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import { useTranslation } from '@/i18n';
import { colors, radius, shadows, spacing, typography } from '@/theme';

export default function SettingsScreen() {
  const { t } = useTranslation();
  const navigation = useNavigation();
  const router = useRouter();

  useLayoutEffect(() => {
    navigation.setOptions({
      title: t('settings.title'),
      headerStyle: { backgroundColor: colors.background },
      headerTintColor: colors.primary,
    });
  }, [navigation, t]);

  return (
    <View style={styles.root}>
      <Pressable style={styles.row} onPress={() => router.push('/settings/language')}>
        <Text style={styles.label}>{t('settings.language')}</Text>
        <Text style={styles.hint}>{t('settings.languageHint')}</Text>
      </Pressable>
    </View>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1, backgroundColor: colors.background, padding: spacing.xl },
  row: {
    backgroundColor: colors.white,
    borderRadius: radius.lg,
    padding: spacing.xl,
    gap: spacing.sm,
    ...shadows.sm,
  },
  label: { ...typography.subheading, color: colors.text },
  hint: { ...typography.caption, color: colors.textSecondary },
});
