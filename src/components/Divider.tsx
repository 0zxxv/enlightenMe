import React from 'react';
import { StyleSheet, View } from 'react-native';
import { colors, spacing } from '@/theme';

export function Divider() {
  return <View style={styles.line} />;
}

const styles = StyleSheet.create({
  line: {
    height: StyleSheet.hairlineWidth,
    backgroundColor: colors.border,
    marginVertical: spacing.md,
  },
});
