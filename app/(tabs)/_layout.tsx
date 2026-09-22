import { Ionicons } from '@expo/vector-icons';
import { Tabs } from 'expo-router';
import React, { useMemo } from 'react';
import { Platform, StyleSheet } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useLayout } from '@/hooks/useLayout';
import { useTranslation } from '@/i18n';
import { colors, spacing } from '@/theme';
import { yogaDirection } from '@/utils/rtl';

type TabDef = {
  name: 'index' | 'explore' | 'messages' | 'bookings' | 'profile';
  title: string;
  href: '/(tabs)' | '/(tabs)/explore' | '/(tabs)/messages' | '/(tabs)/bookings' | '/(tabs)/profile';
  icon: (focused: boolean) => keyof typeof Ionicons.glyphMap;
};

export default function TabLayout() {
  const { t, isRTL } = useTranslation();
  const { isDesktop } = useLayout();
  const insets = useSafeAreaInsets();

  const useSideNav = Platform.OS === 'web' && isDesktop;
  const bottomPad = Math.max(insets.bottom, 8);
  const tabBarHeight = 56 + bottomPad;

  const tabs = useMemo<TabDef[]>(() => {
    const list: TabDef[] = [
      {
        name: 'index',
        title: t('tabs.home'),
        href: '/(tabs)',
        icon: (focused) => (focused ? 'home' : 'home-outline'),
      },
      {
        name: 'explore',
        title: t('tabs.explore'),
        href: '/(tabs)/explore',
        icon: (focused) => (focused ? 'search' : 'search-outline'),
      },
      {
        name: 'messages',
        title: t('tabs.messages'),
        href: '/(tabs)/messages',
        icon: (focused) => (focused ? 'chatbubble-ellipses' : 'chatbubble-ellipses-outline'),
      },
      {
        name: 'bookings',
        title: t('tabs.bookings'),
        href: '/(tabs)/bookings',
        icon: (focused) => (focused ? 'calendar' : 'calendar-outline'),
      },
      {
        name: 'profile',
        title: t('tabs.profile'),
        href: '/(tabs)/profile',
        icon: (focused) => (focused ? 'person' : 'person-outline'),
      },
    ];
    // Expo Go ignores I18nManager — reverse tab order for a true RTL mirror.
    return isRTL ? [...list].reverse() : list;
  }, [t, isRTL]);

  return (
    <Tabs
      key={`student-tabs-${isRTL ? 'rtl' : 'ltr'}`}
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
                ...yogaDirection(isRTL),
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
                ...yogaDirection(isRTL),
              },
              tabBarLabelStyle: {
                fontSize: 11,
                fontWeight: '600' as const,
              },
            }),
      }}
    >
      {tabs.map((tab) => (
        <Tabs.Screen
          key={tab.name}
          name={tab.name}
          options={{
            title: tab.title,
            href: tab.href,
            tabBarIcon: ({ color, size, focused }) => (
              <Ionicons name={tab.icon(focused)} color={color} size={size} />
            ),
          }}
        />
      ))}
    </Tabs>
  );
}
