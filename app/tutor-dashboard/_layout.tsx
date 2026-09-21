import { Ionicons } from '@expo/vector-icons';
import { Tabs } from 'expo-router';
import React, { useMemo } from 'react';
import { Platform, StyleSheet } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useLayout } from '@/hooks/useLayout';
import { useTranslation } from '@/i18n';
import { colors, spacing } from '@/theme';

type VisibleTab = {
  name: 'index' | 'courses' | 'bookings' | 'students' | 'profile';
  title: string;
  href: string;
  icon: (focused: boolean) => keyof typeof Ionicons.glyphMap;
  headerShown?: boolean;
};

export default function TutorDashboardLayout() {
  const { t, isRTL } = useTranslation();
  const { isDesktop } = useLayout();
  const insets = useSafeAreaInsets();

  const useSideNav = Platform.OS === 'web' && isDesktop;
  const bottomPad = Math.max(insets.bottom, 8);
  const tabBarHeight = 56 + bottomPad;

  const visibleTabs = useMemo<VisibleTab[]>(() => {
    const list: VisibleTab[] = [
      {
        name: 'index',
        title: t('tabs.home'),
        href: '/tutor-dashboard',
        icon: (focused) => (focused ? 'home' : 'home-outline'),
        headerShown: false,
      },
      {
        name: 'courses',
        title: t('tutorDashboard.courses'),
        href: '/tutor-dashboard/courses',
        icon: (focused) => (focused ? 'book' : 'book-outline'),
        headerShown: true,
      },
      {
        name: 'bookings',
        title: t('tutorDashboard.bookings'),
        href: '/tutor-dashboard/bookings',
        icon: (focused) => (focused ? 'calendar' : 'calendar-outline'),
        headerShown: true,
      },
      {
        name: 'students',
        title: t('tutorDashboard.students'),
        href: '/tutor-dashboard/students',
        icon: (focused) => (focused ? 'people' : 'people-outline'),
        headerShown: true,
      },
      {
        name: 'profile',
        title: t('tabs.profile'),
        href: '/tutor-dashboard/profile',
        icon: (focused) => (focused ? 'person' : 'person-outline'),
        headerShown: true,
      },
    ];
    return isRTL ? [...list].reverse() : list;
  }, [t, isRTL]);

  return (
    <Tabs
      key={`tutor-tabs-${isRTL ? 'rtl' : 'ltr'}`}
      screenOptions={{
        headerShown: false,
        tabBarActiveTintColor: colors.primary,
        tabBarInactiveTintColor: colors.textMuted,
        tabBarHideOnKeyboard: true,
        ...(useSideNav
          ? {
              tabBarPosition: 'left' as const,
              tabBarStyle: {
                backgroundColor: colors.backgroundElevated,
                borderRightColor: colors.border,
                borderTopWidth: 0,
                width: 220,
                paddingTop: spacing.xl,
                direction: isRTL ? 'rtl' : 'ltr',
              },
              tabBarItemStyle: {
                flexDirection: 'row' as const,
                justifyContent: 'flex-start' as const,
                paddingHorizontal: spacing.lg,
                height: 48,
              },
              tabBarLabelStyle: {
                fontSize: 13,
                fontWeight: '600' as const,
                marginLeft: spacing.sm,
              },
            }
          : {
              tabBarStyle: {
                backgroundColor: colors.backgroundElevated,
                borderTopColor: colors.border,
                borderTopWidth: StyleSheet.hairlineWidth,
                height: tabBarHeight,
                paddingBottom: bottomPad,
                paddingTop: 6,
                direction: isRTL ? 'rtl' : 'ltr',
              },
              tabBarLabelStyle: {
                fontSize: 11,
                fontWeight: '600' as const,
              },
            }),
      }}
    >
      {visibleTabs.map((tab) => (
        <Tabs.Screen
          key={tab.name}
          name={tab.name}
          options={{
            title: tab.title,
            href: tab.href as never,
            headerShown: tab.headerShown,
            headerStyle: { backgroundColor: colors.background },
            headerTintColor: colors.primary,
            headerShadowVisible: false,
            tabBarIcon: ({ color, size, focused }) => (
              <Ionicons name={tab.icon(focused)} color={color} size={size} />
            ),
          }}
        />
      ))}
      <Tabs.Screen
        name="create"
        options={{
          href: null,
          headerShown: true,
          headerStyle: { backgroundColor: colors.background },
          headerTintColor: colors.primary,
          headerShadowVisible: false,
        }}
      />
      <Tabs.Screen
        name="earnings"
        options={{
          href: null,
          headerShown: true,
          headerStyle: { backgroundColor: colors.background },
          headerTintColor: colors.primary,
          headerShadowVisible: false,
        }}
      />
      <Tabs.Screen
        name="verification"
        options={{
          href: null,
          headerShown: true,
          headerStyle: { backgroundColor: colors.background },
          headerTintColor: colors.primary,
          headerShadowVisible: false,
        }}
      />
    </Tabs>
  );
}
