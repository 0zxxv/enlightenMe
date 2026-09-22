import React, { useEffect } from 'react';
import { Platform, StyleSheet, View } from 'react-native';
import { useI18n } from '@/i18n';
import { yogaDirection } from '@/utils/rtl';

/**
 * Mirrors layout for Arabic on web + Expo.
 * Native: Yoga `direction`. Web: document `dir` (RN-web rejects style `direction`).
 */
export function RtlShell({ children }: { children: React.ReactNode }) {
  const { isRTL, language, ready } = useI18n();

  useEffect(() => {
    if (!ready || Platform.OS !== 'web') return;
    const dir = isRTL ? 'rtl' : 'ltr';
    document.documentElement.setAttribute('dir', dir);
    document.documentElement.style.direction = dir;
    document.body.style.direction = dir;
  }, [isRTL, ready]);

  if (!ready) return null;

  return (
    <View
      key={`rtl-${language}`}
      style={[styles.root, yogaDirection(isRTL)]}
      collapsable={false}
    >
      {children}
    </View>
  );
}

const styles = StyleSheet.create({
  root: {
    flex: 1,
  },
});
