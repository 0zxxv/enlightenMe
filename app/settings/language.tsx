import { useNavigation } from 'expo-router';
import React, { useLayoutEffect } from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import { useI18n, useTranslation } from '@/i18n';
import { colors, radius, shadows, spacing, typography } from '@/theme';
import type { LanguageCode } from '@/types/models';

export default function LanguageScreen() {
  const { t, isRTL } = useTranslation();
  const { language, setLanguage } = useI18n();
  const navigation = useNavigation();

  useLayoutEffect(() => {
    navigation.setOptions({
      title: t('settings.language'),
      headerStyle: { backgroundColor: colors.background },
      headerTintColor: colors.primary,
    });
  }, [navigation, t]);

  const choose = async (next: LanguageCode) => {
    if (next === language) return;
    await setLanguage(next);
  };

  return (
    <View style={styles.root}>
      {(
        [
          { id: 'en' as const, label: t('settings.english') },
          { id: 'ar' as const, label: t('settings.arabic') },
        ] as const
      ).map((item) => (
        <Pressable
          key={item.id}
          style={[styles.row, language === item.id && styles.rowActive]}
          onPress={() => choose(item.id)}
        >
          <Text
            style={[
              styles.label,
              language === item.id && styles.labelActive,
              { textAlign: isRTL ? 'right' : 'left', writingDirection: isRTL ? 'rtl' : 'ltr' },
            ]}
          >
            {item.label}
          </Text>
        </Pressable>
      ))}
      <Text style={[styles.hint, { textAlign: isRTL ? 'right' : 'left' }]}>
        {t('settings.languageHint')}
      </Text>
    </View>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1, backgroundColor: colors.background, padding: spacing.xl, gap: spacing.md },
  row: {
    backgroundColor: colors.white,
    borderRadius: radius.lg,
    padding: spacing.xl,
    ...shadows.sm,
  },
  rowActive: { backgroundColor: colors.primary },
  label: { ...typography.subheading, color: colors.text },
  labelActive: { color: colors.white },
  hint: { ...typography.caption, color: colors.textSecondary, marginTop: spacing.md },
});
