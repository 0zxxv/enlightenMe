import { Image } from 'expo-image';
import { useRouter } from 'expo-router';
import React from 'react';
import { StyleSheet, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Button } from '@/components/Button';
import { useTranslation } from '@/i18n';
import { colors, spacing, typography } from '@/theme';

export default function WelcomeScreen() {
  const router = useRouter();
  const { t } = useTranslation();

  return (
    <View style={styles.root}>
      <View style={styles.hero}>
        <View style={styles.orbOne} />
        <View style={styles.orbTwo} />
        <SafeAreaView style={styles.safe}>
          <Image
            source={require('../../assets/images/dars_logo.png')}
            style={styles.logo}
            contentFit="contain"
            accessibilityLabel={`${t('brand.name')} ${t('brand.nameAr')}`}
          />
          <Text style={styles.subtitle}>{t('auth.welcomeSubtitle')}</Text>
        </SafeAreaView>
      </View>
      <SafeAreaView edges={['bottom']} style={styles.actions}>
        <Button title={t('auth.getStarted')} onPress={() => router.push('/(auth)/register')} size="lg" />
        <Button
          title={t('auth.haveAccount')}
          onPress={() => router.push('/(auth)/login')}
          variant="ghost"
          size="lg"
        />
      </SafeAreaView>
    </View>
  );
}

const styles = StyleSheet.create({
  root: {
    flex: 1,
    backgroundColor: colors.background,
  },
  hero: {
    flex: 1,
    backgroundColor: colors.primary,
    borderBottomLeftRadius: 36,
    borderBottomRightRadius: 36,
    overflow: 'hidden',
  },
  orbOne: {
    position: 'absolute',
    width: 220,
    height: 220,
    borderRadius: 110,
    backgroundColor: colors.lavender,
    opacity: 0.25,
    top: -40,
    right: -40,
  },
  orbTwo: {
    position: 'absolute',
    width: 160,
    height: 160,
    borderRadius: 80,
    backgroundColor: colors.beige,
    opacity: 0.2,
    bottom: 40,
    left: -30,
  },
  safe: {
    flex: 1,
    justifyContent: 'flex-end',
    padding: spacing.xxl,
    gap: spacing.sm,
  },
  logo: {
    width: '100%',
    maxWidth: 280,
    height: 200,
    marginBottom: spacing.md,
    alignSelf: 'flex-start',
    borderRadius: 16,
  },
  subtitle: {
    ...typography.body,
    color: 'rgba(255,255,255,0.82)',
    marginTop: spacing.md,
    maxWidth: 320,
  },
  actions: {
    padding: spacing.xxl,
    gap: spacing.md,
  },
});
