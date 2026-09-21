import { Ionicons } from '@expo/vector-icons';
import { Tabs } from 'expo-router';
import React from 'react';
import { Platform, StyleSheet } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useLayout } from '@/hooks/useLayout';
import { useTranslation } from '@/i18n';
import { colors, spacing } from '@/theme';

export default function TabLayout() {
  const { t } = useTranslation();
  const { isDesktop } = useLayout();
  const insets = useSafeAreaInsets();

  // Side nav only on wide web. Phones always keep a bottom tab bar.
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
          href: '/(tabs)',
          tabBarIcon: ({ color, size, focused }) => (
            <Ionicons name={focused ? 'home' : 'home-outline'} color={color} size={size} />
          ),
        }}
      />
      <Tabs.Screen
        name="explore"
        options={{
          title: t('tabs.explore'),
          href: '/(tabs)/explore',
          tabBarIcon: ({ color, size, focused }) => (
            <Ionicons name={focused ? 'search' : 'search-outline'} color={color} size={size} />
          ),
        }}
      />
      <Tabs.Screen
        name="messages"
        options={{
          title: t('tabs.messages'),
          href: '/(tabs)/messages',
          tabBarIcon: ({ color, size, focused }) => (
            <Ionicons
              name={focused ? 'chatbubble-ellipses' : 'chatbubble-ellipses-outline'}
              color={color}
              size={size}
            />
          ),
        }}
      />
      <Tabs.Screen
        name="bookings"
        options={{
          title: t('tabs.bookings'),
          href: '/(tabs)/bookings',
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
        name="profile"
        options={{
          title: t('tabs.profile'),
          href: '/(tabs)/profile',
          tabBarIcon: ({ color, size, focused }) => (
            <Ionicons name={focused ? 'person' : 'person-outline'} color={color} size={size} />
          ),
        }}
      />
    </Tabs>
  );
}
