import { Ionicons } from '@expo/vector-icons';
import { Tabs } from 'expo-router';
import React, { useMemo } from 'react';
import { StyleSheet } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { CollapsibleSideTabBar } from '@/components/CollapsibleSideTabBar';
import { useLayout } from '@/hooks/useLayout';
import { useTranslation } from '@/i18n';
import { colors } from '@/theme';
import { yogaDirection } from '@/utils/rtl';

type VisibleTab = {
  name: 'index' | 'courses' | 'bookings' | 'students' | 'messages' | 'profile';
  title: string;
  href: string;
  icon: (focused: boolean) => keyof typeof Ionicons.glyphMap;
  headerShown?: boolean;
};

export default function TutorDashboardLayout() {
  const { t, isRTL } = useTranslation();
  const { isDesktop, isTablet } = useLayout();
  const insets = useSafeAreaInsets();

  // Side nav on laptop + iPad-sized viewports.
  const sideNav = isDesktop || isTablet;
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
        name: 'messages',
        title: t('tabs.messages'),
        href: '/tutor-dashboard/messages',
        icon: (focused) => (focused ? 'chatbubbles' : 'chatbubbles-outline'),
        headerShown: false,
      },
      {
        name: 'profile',
        title: t('tabs.profile'),
        href: '/tutor-dashboard/profile',
        icon: (focused) => (focused ? 'person' : 'person-outline'),
        headerShown: true,
      },
    ];
    // Keep logical order; CollapsibleSideTabBar mirrors via flexDirection.
    return list;
  }, [t]);

  return (
    <Tabs
      key={`tutor-tabs-${isRTL ? 'rtl' : 'ltr'}-${sideNav ? 'side' : 'bottom'}`}
      tabBar={sideNav ? (props) => <CollapsibleSideTabBar {...props} /> : undefined}
      screenOptions={{
        headerShown: false,
        tabBarActiveTintColor: colors.primary,
        tabBarInactiveTintColor: colors.textMuted,
        tabBarHideOnKeyboard: true,
        tabBarShowLabel: !sideNav ? false : true,
        ...(sideNav
          ? {
              tabBarPosition: 'left' as const,
              // Width is owned by CollapsibleSideTabBar; keep style minimal.
              tabBarStyle: {
                backgroundColor: colors.backgroundElevated,
                borderTopWidth: 0,
                elevation: 0,
                shadowOpacity: 0,
              },
            }
          : {
              tabBarStyle: {
                backgroundColor: colors.backgroundElevated,
                borderTopColor: colors.border,
                borderTopWidth: StyleSheet.hairlineWidth,
                height: tabBarHeight,
                paddingBottom: bottomPad,
                paddingTop: 8,
                ...yogaDirection(isRTL),
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
            tabBarIcon: ({ color, focused }) => (
              <Ionicons name={tab.icon(focused)} color={color} size={22} />
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
