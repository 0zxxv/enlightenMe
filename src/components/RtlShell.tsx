import { Platform, StyleSheet, View } from 'react-native';
import { useI18n } from '@/i18n';
import React, { useEffect } from 'react';

/** Applies document/app direction so flex rows, text, and absolute start/end mirror in Arabic. */
export function RtlShell({ children }: { children: React.ReactNode }) {
  const { isRTL, ready } = useI18n();

  useEffect(() => {
    if (!ready || Platform.OS !== 'web') return;
    const dir = isRTL ? 'rtl' : 'ltr';
    document.documentElement.setAttribute('dir', dir);
    document.documentElement.style.direction = dir;
    document.body.style.direction = dir;
  }, [isRTL, ready]);

  return (
    <View
      style={[
        styles.root,
        {
          direction: isRTL ? 'rtl' : 'ltr',
        } as object,
      ]}
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
