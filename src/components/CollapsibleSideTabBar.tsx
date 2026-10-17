import { Ionicons } from '@expo/vector-icons';
import type { BottomTabBarProps } from '@react-navigation/bottom-tabs';
import React, { useState } from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useTranslation } from '@/i18n';
import { colors, radius, spacing, typography } from '@/theme';
import { yogaDirection } from '@/utils/rtl';

const EXPANDED_WIDTH = 168;
const COLLAPSED_WIDTH = 64;

type ExpoTabOptions = {
  href?: string | null;
};

/**
 * Narrow, collapsible side nav for tablet/desktop.
 * Expanded: icon + label. Collapsed: icons only.
 */
export function CollapsibleSideTabBar({ state, descriptors, navigation }: BottomTabBarProps) {
  const { t, isRTL } = useTranslation();
  const insets = useSafeAreaInsets();
  const [collapsed, setCollapsed] = useState(false);
  const width = collapsed ? COLLAPSED_WIDTH : EXPANDED_WIDTH;

  const borderSide = isRTL
    ? { borderLeftWidth: StyleSheet.hairlineWidth, borderLeftColor: colors.border }
    : { borderRightWidth: StyleSheet.hairlineWidth, borderRightColor: colors.border };

  return (
    <View
      style={[
        styles.rail,
        borderSide,
        yogaDirection(false),
        {
          width,
          paddingTop: Math.max(insets.top, spacing.md) + spacing.sm,
          paddingBottom: Math.max(insets.bottom, spacing.md),
        },
      ]}
    >
      <Pressable
        onPress={() => setCollapsed((v) => !v)}
        style={[styles.toggle, collapsed && styles.toggleCollapsed]}
        accessibilityRole="button"
        accessibilityLabel={collapsed ? t('common.expandNav') : t('common.collapseNav')}
        hitSlop={8}
      >
        <Ionicons
          name={
            collapsed
              ? isRTL
                ? 'chevron-back'
                : 'chevron-forward'
              : isRTL
                ? 'chevron-forward'
                : 'chevron-back'
          }
          size={18}
          color={colors.primary}
        />
      </Pressable>

      <View style={styles.list}>
        {state.routes.map((route, index) => {
          const focused = state.index === index;
          const { options } = descriptors[route.key];
          const expoOptions = options as typeof options & ExpoTabOptions;
          if (expoOptions.href === null) return null;

          const label =
            typeof options.tabBarLabel === 'string'
              ? options.tabBarLabel
              : typeof options.title === 'string'
                ? options.title
                : route.name;

          const color = focused ? colors.primary : colors.textMuted;
          const onPress = () => {
            const event = navigation.emit({
              type: 'tabPress',
              target: route.key,
              canPreventDefault: true,
            });
            if (!focused && !event.defaultPrevented) {
              navigation.navigate(route.name, route.params);
            }
          };

          return (
            <Pressable
              key={route.key}
              onPress={onPress}
              accessibilityRole="button"
              accessibilityState={{ selected: focused }}
              accessibilityLabel={label}
              style={[
                styles.item,
                yogaDirection(false),
                {
                  flexDirection: isRTL ? 'row-reverse' : 'row',
                  justifyContent: collapsed ? 'center' : isRTL ? 'flex-end' : 'flex-start',
                },
                focused && styles.itemActive,
              ]}
            >
              {options.tabBarIcon
                ? options.tabBarIcon({ focused, color, size: 22 })
                : null}
              {!collapsed ? (
                <Text
                  style={[
                    styles.label,
                    {
                      color,
                      textAlign: isRTL ? 'right' : 'left',
                      writingDirection: isRTL ? 'rtl' : 'ltr',
                    },
                  ]}
                  numberOfLines={1}
                >
                  {label}
                </Text>
              ) : null}
            </Pressable>
          );
        })}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  rail: {
    backgroundColor: colors.backgroundElevated,
    paddingHorizontal: spacing.sm,
    flexGrow: 0,
    flexShrink: 0,
    alignSelf: 'stretch',
  },
  toggle: {
    alignItems: 'center',
    justifyContent: 'center',
    alignSelf: 'stretch',
    minHeight: 36,
    marginBottom: spacing.md,
    borderRadius: radius.lg,
    backgroundColor: colors.beige,
  },
  toggleCollapsed: {
    alignSelf: 'center',
    width: 40,
  },
  list: {
    gap: spacing.xs,
  },
  item: {
    alignItems: 'center',
    gap: spacing.sm,
    minHeight: 44,
    paddingHorizontal: spacing.sm,
    borderRadius: radius.lg,
  },
  itemActive: {
    backgroundColor: colors.lavenderSoft,
  },
  label: {
    ...typography.caption,
    fontWeight: '700',
    fontSize: 13,
    flexShrink: 1,
  },
});
