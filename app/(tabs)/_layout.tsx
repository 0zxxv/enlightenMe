import { Ionicons } from '@expo/vector-icons';
import { Tabs } from 'expo-router';
import React from 'react';
import { Platform } from 'react-native';
import { useLayout } from '@/hooks/useLayout';
import { useTranslation } from '@/i18n';
import { colors, spacing } from '@/theme';

export default function TabLayout() {
  const { t } = useTranslation();
  const { isDesktop } = useLayout();

  return (
    <Tabs
      screenOptions={{
        headerShown: false,
        tabBarActiveTintColor: colors.primary,
        tabBarInactiveTintColor: colors.textMuted,
        // Side rail on wide web/laptop; bottom tabs on phone/tablet.
        tabBarPosition: isDesktop ? 'left' : 'bottom',
        tabBarStyle: isDesktop
          ? {
              backgroundColor: colors.backgroundElevated,
              borderRightColor: colors.border,
              borderTopWidth: 0,
              width: 220,
              paddingTop: spacing.xl,
            }
          : {
              backgroundColor: colors.backgroundElevated,
              borderTopColor: colors.border,
              height: Platform.OS === 'web' ? 64 : undefined,
              paddingBottom: Platform.OS === 'web' ? 8 : undefined,
            },
        tabBarItemStyle: isDesktop
          ? {
              flexDirection: 'row',
              justifyContent: 'flex-start',
              paddingHorizontal: spacing.lg,
              height: 48,
            }
          : undefined,
        tabBarLabelStyle: {
          fontSize: isDesktop ? 13 : 11,
          fontWeight: '600',
          marginLeft: isDesktop ? spacing.sm : 0,
        },
      }}
    >
      <Tabs.Screen
        name="index"
        options={{
          title: t('tabs.home'),
          tabBarIcon: ({ color, size, focused }) => (
            <Ionicons name={focused ? 'home' : 'home-outline'} color={color} size={size} />
          ),
        }}
      />
      <Tabs.Screen
        name="explore"
        options={{
          title: t('tabs.explore'),
          tabBarIcon: ({ color, size, focused }) => (
            <Ionicons name={focused ? 'search' : 'search-outline'} color={color} size={size} />
          ),
        }}
      />
      <Tabs.Screen
        name="messages"
        options={{
          title: t('tabs.messages'),
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
          tabBarIcon: ({ color, size, focused }) => (
            <Ionicons name={focused ? 'person' : 'person-outline'} color={color} size={size} />
          ),
        }}
      />
    </Tabs>
  );
}
