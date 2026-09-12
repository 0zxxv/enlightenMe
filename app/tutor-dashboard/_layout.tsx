import { Stack } from 'expo-router';
import React from 'react';
import { colors } from '@/theme';

export default function TutorDashboardLayout() {
  return (
    <Stack
      screenOptions={{
        headerStyle: { backgroundColor: colors.background },
        headerTintColor: colors.primary,
        headerShadowVisible: false,
        contentStyle: { backgroundColor: colors.background },
      }}
    />
  );
}
