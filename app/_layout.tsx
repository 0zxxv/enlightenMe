import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { Redirect, Stack, useSegments } from 'expo-router';
import * as SplashScreen from 'expo-splash-screen';
import * as SystemUI from 'expo-system-ui';
import { StatusBar } from 'expo-status-bar';
import React, { useEffect, useState } from 'react';
import { GestureHandlerRootView } from 'react-native-gesture-handler';
import { LoadingState } from '@/components/LoadingState';
import { RtlShell } from '@/components/RtlShell';
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

/** One-shot per JS session so a restored tab route still opens Welcome first. */
let coldStartEntryDone = false;

function AuthGate({ children }: { children: React.ReactNode }) {
  const { isAuthenticated, isLoading, user } = useAuth();
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
  const inPublicDevMode = segments[0] === 'dev-mode';

  // Cold start always shows Welcome first (even with a saved session / restored route).
  if (!coldStartEntryDone) {
    if (!inAuthGroup && !inPublicDevMode) {
      return <Redirect href="/(auth)/welcome" />;
    }
    coldStartEntryDone = true;
  }

  if (!isAuthenticated && !inAuthGroup && !inPublicDevMode) {
    return <Redirect href="/(auth)/welcome" />;
  }

  // Stay on login/welcome even if a session exists so cold start can show entry screens first.
  const authScreen = segments[1];
  const stayOnAuthEntry =
    inAuthGroup && (authScreen === 'login' || authScreen === 'welcome' || !authScreen);

  if (isAuthenticated && inAuthGroup && !stayOnAuthEntry) {
    if (user?.role === 'Tutor') {
      return <Redirect href="/tutor-dashboard" />;
    }
    return <Redirect href="/(tabs)" />;
  }

  return <>{children}</>;
}

function RootNavigator() {
  return (
    <RtlShell>
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
          <Stack.Screen name="index" />
          <Stack.Screen name="(auth)" />
          <Stack.Screen name="dev-mode" />
          <Stack.Screen name="(tabs)" />
          <Stack.Screen name="course/[id]" options={{ headerShown: false }} />
          <Stack.Screen name="tutor/[id]" options={{ headerShown: false }} />
          <Stack.Screen name="institute/[id]" options={{ headerShown: false }} />
          <Stack.Screen name="booking/[courseId]" options={{ headerShown: true, title: '' }} />
          <Stack.Screen name="booking/confirmation" options={{ headerShown: true, title: '' }} />
          <Stack.Screen name="booking/detail/[id]" options={{ headerShown: true, title: '' }} />
          <Stack.Screen name="booking/sessions/[id]" options={{ headerShown: true, title: '' }} />
          <Stack.Screen name="favorites" options={{ headerShown: true, title: '' }} />
          <Stack.Screen name="continue-learning" options={{ headerShown: true, title: '' }} />
          <Stack.Screen name="subjects" options={{ headerShown: true, title: '' }} />
          <Stack.Screen name="notifications" options={{ headerShown: false }} />
          <Stack.Screen name="conversation/[id]" options={{ headerShown: true, title: '' }} />
          <Stack.Screen name="settings/index" options={{ headerShown: true, title: '' }} />
          <Stack.Screen name="settings/language" options={{ headerShown: true, title: '' }} />
          <Stack.Screen name="tutor-dashboard" />
          <Stack.Screen name="institute-dashboard/index" options={{ headerShown: true, title: '' }} />
        </Stack>
      </AuthGate>
    </RtlShell>
  );
}

export default function RootLayout() {
  const [client] = useState(() => queryClient);

  return (
    <QueryClientProvider client={client}>
      <GestureHandlerRootView style={{ flex: 1 }}>
        <I18nProvider>
          <AuthProvider>
            <RootNavigator />
          </AuthProvider>
        </I18nProvider>
      </GestureHandlerRootView>
    </QueryClientProvider>
  );
}
