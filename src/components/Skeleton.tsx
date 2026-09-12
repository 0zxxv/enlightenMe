import React from 'react';
import { StyleSheet, View } from 'react-native';
import { colors, radius } from '@/theme';

type Props = {
  width?: number | `${number}%`;
  height?: number;
  radiusSize?: number;
};

export function Skeleton({ width = '100%', height = 16, radiusSize = 8 }: Props) {
  return (
    <View
      style={[
        styles.base,
        {
          width,
          height,
          borderRadius: radiusSize ?? radius.sm,
        },
      ]}
    />
  );
}

const styles = StyleSheet.create({
  base: {
    backgroundColor: colors.skeleton,
  },
});
