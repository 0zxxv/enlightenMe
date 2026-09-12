import { Stack } from 'expo-router';
import React from 'react';
import { StyleSheet, Text, View } from 'react-native';
import { Avatar } from '@/components/Avatar';
import { useAuth } from '@/features/auth/useAuth';
import { useTranslation } from '@/i18n';
import { colors, radius, shadows, spacing, typography } from '@/theme';
import { fullName } from '@/utils/format';

export default function TutorProfileManageScreen() {
  const { t } = useTranslation();
  const { user } = useAuth();
  const name = fullName(user?.firstName, user?.lastName);

  return (
    <>
      <Stack.Screen
        options={{
          title: t('tutorDashboard.profile'),
          headerStyle: { backgroundColor: colors.background },
          headerTintColor: colors.primary,
        }}
      />
      <View style={styles.root}>
        <View style={styles.card}>
          <Avatar name={name} size={72} />
          <Text style={styles.name}>{name}</Text>
          <Text style={styles.meta}>{user?.email}</Text>
          <Text style={styles.meta}>{user?.role}</Text>
        </View>
      </View>
    </>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1, backgroundColor: colors.background, padding: spacing.xl },
  card: {
    backgroundColor: colors.white,
    borderRadius: radius.xl,
    padding: spacing.xxl,
    alignItems: 'center',
    gap: spacing.sm,
    ...shadows.sm,
  },
  name: { ...typography.heading, color: colors.text },
  meta: { ...typography.caption, color: colors.textSecondary },
});
