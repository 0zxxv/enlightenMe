import { useRouter } from 'expo-router';
import React, { useState } from 'react';
import { StyleSheet, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { BackButton } from '@/components/BackButton';
import { Button } from '@/components/Button';
import { TextInput } from '@/components/TextInput';
import { useTranslation } from '@/i18n';
import { colors, spacing, typography } from '@/theme';

export default function VerificationScreen() {
  const { t } = useTranslation();
  const router = useRouter();
  const [code, setCode] = useState('');

  return (
    <SafeAreaView style={styles.safe}>
      <View style={styles.topBar}>
        <BackButton onPress={() => router.back()} />
      </View>
      <View style={styles.content}>
        <Text style={styles.title}>{t('auth.verificationTitle')}</Text>
        <Text style={styles.subtitle}>{t('auth.verificationSubtitle')}</Text>
        <TextInput
          label={t('auth.verificationCode')}
          keyboardType="number-pad"
          value={code}
          onChangeText={setCode}
        />
        <Button title={t('auth.verify')} onPress={() => router.replace('/(tabs)')} />
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: colors.background },
  topBar: {
    paddingHorizontal: spacing.xxl,
    paddingTop: spacing.sm,
  },
  content: { padding: spacing.xxl, gap: spacing.lg },
  title: { ...typography.heading, color: colors.text },
  subtitle: { ...typography.body, color: colors.textSecondary },
});
