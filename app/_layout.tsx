import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { Redirect, Stack, useSegments } from 'expo-router';
import * as SplashScreen from 'expo-splash-screen';
import * as SystemUI from 'expo-system-ui';
import { StatusBar } from 'expo-status-bar';
import React, { useEffect, useState } from 'react';
import { LoadingState } from '@/components/LoadingState';
import { AuthProvider, useAuth } from '@/features/auth/AuthContext';
import { I18nProvider, useI18n } from '@/i18n';
import { colors } from '@/theme';

export { ErrorBoundary } from 'expo-router';

SplashScreen.preventAutoHideAsync();
SystemUI.setBackgroundColorAsync(colors.background);

const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      retry: 1,
      staleTime: 30_000,
    },
  },
});

function AuthGate({ children }: { children: React.ReactNode }) {
  const { isAuthenticated, isLoading } = useAuth();
  const { ready } = useI18n();
  const segments = useSegments();

  useEffect(() => {
    if (!isLoading && ready) {
      SplashScreen.hideAsync();
    }
  }, [isLoading, ready]);

  if (isLoading || !ready) {
    return <LoadingState />;
  }

  const inAuthGroup = segments[0] === '(auth)';

  if (!isAuthenticated && !inAuthGroup) {
    return <Redirect href="/(auth)/welcome" />;
  }

  if (isAuthenticated && inAuthGroup) {
    return <Redirect href="/(tabs)" />;
  }

  return <>{children}</>;
}

function RootNavigator() {
  return (
    <AuthGate>
      <StatusBar style="dark" />
      <Stack
        screenOptions={{
          headerShown: false,
          contentStyle: { backgroundColor: colors.background },
          headerTintColor: colors.primary,
          headerStyle: { backgroundColor: colors.background },
          headerShadowVisible: false,
        }}
      >
        <Stack.Screen name="(auth)" />
        <Stack.Screen name="(tabs)" />
        <Stack.Screen name="course/[id]" options={{ headerShown: true, title: '' }} />
        <Stack.Screen name="tutor/[id]" options={{ headerShown: true, title: '' }} />
        <Stack.Screen name="institute/[id]" options={{ headerShown: true, title: '' }} />
        <Stack.Screen name="booking/[courseId]" options={{ headerShown: true, title: '' }} />
        <Stack.Screen name="booking/confirmation" options={{ headerShown: true, title: '' }} />
        <Stack.Screen name="favorites" options={{ headerShown: true, title: '' }} />
        <Stack.Screen name="conversation/[id]" options={{ headerShown: true, title: '' }} />
        <Stack.Screen name="settings/index" options={{ headerShown: true, title: '' }} />
        <Stack.Screen name="settings/language" options={{ headerShown: true, title: '' }} />
        <Stack.Screen name="tutor-dashboard" />
        <Stack.Screen name="institute-dashboard/index" options={{ headerShown: true, title: '' }} />
      </Stack>
    </AuthGate>
  );
}

export default function RootLayout() {
  const [client] = useState(() => queryClient);

  return (
    <QueryClientProvider client={client}>
      <I18nProvider>
        <AuthProvider>
          <RootNavigator />
        </AuthProvider>
      </I18nProvider>
    </QueryClientProvider>
  );
}
