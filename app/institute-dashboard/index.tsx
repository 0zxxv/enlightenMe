import { useNavigation } from 'expo-router';
import React, { useLayoutEffect } from 'react';
import { StyleSheet, Text, View } from 'react-native';
import { EmptyState } from '@/components/EmptyState';
import { useTranslation } from '@/i18n';
import { colors, spacing } from '@/theme';

export default function InstituteDashboardScreen() {
  const { t } = useTranslation();
  const navigation = useNavigation();

  useLayoutEffect(() => {
    navigation.setOptions({
      title: t('instituteDashboard.title'),
      headerStyle: { backgroundColor: colors.background },
      headerTintColor: colors.primary,
    });
  }, [navigation, t]);

  return (
    <View style={styles.root}>
      <EmptyState title={t('instituteDashboard.title')} subtitle={t('instituteDashboard.placeholder')} />
    </View>
  );
}

const styles = StyleSheet.create({
  root: {
    flex: 1,
    backgroundColor: colors.background,
    padding: spacing.xl,
    justifyContent: 'center',
  },
});
