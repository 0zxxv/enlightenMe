import { Link, Stack } from 'expo-router';
import React from 'react';
import { StyleSheet, Text, View } from 'react-native';
import { colors, spacing, typography } from '@/theme';

export default function NotFoundScreen() {
  return (
    <>
      <Stack.Screen options={{ title: 'Not found', headerShown: true }} />
      <View style={styles.root}>
        <Text style={styles.title}>Screen not found</Text>
        <Link href="/" style={styles.link}>
          Go home
        </Link>
      </View>
    </>
  );
}

const styles = StyleSheet.create({
  root: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: colors.background,
    padding: spacing.xxl,
    gap: spacing.md,
  },
  title: { ...typography.heading, color: colors.text },
  link: { ...typography.body, color: colors.primary, fontWeight: '700' },
});
