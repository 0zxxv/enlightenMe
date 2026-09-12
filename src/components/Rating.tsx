import { Ionicons } from '@expo/vector-icons';
import React from 'react';
import { StyleSheet, Text, View } from 'react-native';
import { colors, spacing, typography } from '@/theme';

type Props = {
  value: number;
  count?: number;
  size?: number;
};

export function Rating({ value, count, size = 14 }: Props) {
  return (
    <View style={styles.row}>
      <Ionicons name="star" size={size} color={colors.star} />
      <Text style={styles.value}>{value.toFixed(1)}</Text>
      {typeof count === 'number' ? <Text style={styles.count}>({count})</Text> : null}
    </View>
  );
}

const styles = StyleSheet.create({
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.xs,
  },
  value: {
    ...typography.caption,
    color: colors.text,
    fontWeight: '600',
  },
  count: {
    ...typography.caption,
    color: colors.textMuted,
  },
});
