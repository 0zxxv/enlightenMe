import { Ionicons } from '@expo/vector-icons';
import { Tabs } from 'expo-router';
import React from 'react';
import { Platform, StyleSheet } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useLayout } from '@/hooks/useLayout';
import { useTranslation } from '@/i18n';
import { colors, spacing } from '@/theme';

export default function TutorDashboardLayout() {
  const { t, isRTL } = useTranslation();
  const { isDesktop } = useLayout();
  const insets = useSafeAreaInsets();

  const useSideNav = Platform.OS === 'web' && isDesktop;
  const bottomPad = Math.max(insets.bottom, 8);
  const tabBarHeight = 56 + bottomPad;

  return (
    <Tabs
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
      <Tabs.Screen
        name="index"
        options={{
          title: t('tabs.home'),
          href: '/tutor-dashboard',
          headerShown: false,
          tabBarIcon: ({ color, size, focused }) => (
            <Ionicons name={focused ? 'home' : 'home-outline'} color={color} size={size} />
          ),
        }}
      />
      <Tabs.Screen
        name="courses"
        options={{
          title: t('tutorDashboard.courses'),
          href: '/tutor-dashboard/courses',
          headerShown: true,
          headerStyle: { backgroundColor: colors.background },
          headerTintColor: colors.primary,
          headerShadowVisible: false,
          tabBarIcon: ({ color, size, focused }) => (
            <Ionicons name={focused ? 'book' : 'book-outline'} color={color} size={size} />
          ),
        }}
      />
      <Tabs.Screen
        name="bookings"
        options={{
          title: t('tutorDashboard.bookings'),
          href: '/tutor-dashboard/bookings',
          headerShown: true,
          headerStyle: { backgroundColor: colors.background },
          headerTintColor: colors.primary,
          headerShadowVisible: false,
          tabBarIcon: ({ color, size, focused }) => (
            <Ionicons
              name={focused ? 'calendar' : 'calendar-outline'}
              color={color}
              size={size}
            />
          ),
        }}
      />
      <Tabs.Screen
        name="students"
        options={{
          title: t('tutorDashboard.students'),
          href: '/tutor-dashboard/students',
          headerShown: true,
          headerStyle: { backgroundColor: colors.background },
          headerTintColor: colors.primary,
          headerShadowVisible: false,
          tabBarIcon: ({ color, size, focused }) => (
            <Ionicons name={focused ? 'people' : 'people-outline'} color={color} size={size} />
          ),
        }}
      />
      <Tabs.Screen
        name="profile"
        options={{
          title: t('tabs.profile'),
          href: '/tutor-dashboard/profile',
          headerShown: true,
          headerStyle: { backgroundColor: colors.background },
          headerTintColor: colors.primary,
          headerShadowVisible: false,
          tabBarIcon: ({ color, size, focused }) => (
            <Ionicons name={focused ? 'person' : 'person-outline'} color={color} size={size} />
          ),
        }}
      />
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
