import React from 'react';
import { StyleSheet, Text, View } from 'react-native';
import { Image } from 'expo-image';
import { colors, radius, typography } from '@/theme';

type Props = {
  name: string;
  uri?: string | null;
  size?: number;
};

export function Avatar({ name, uri, size = 48 }: Props) {
  const initials = name
    .split(' ')
    .filter(Boolean)
    .slice(0, 2)
    .map((part) => part[0]?.toUpperCase())
    .join('');

  if (uri) {
    return (
      <Image
        source={{ uri }}
        style={{ width: size, height: size, borderRadius: size / 2 }}
        contentFit="cover"
      />
    );
  }

  return (
    <View
      style={[
        styles.fallback,
        { width: size, height: size, borderRadius: size / 2 },
      ]}
    >
      <Text style={[styles.initials, { fontSize: size * 0.36 }]}>{initials || '?'}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  fallback: {
    backgroundColor: colors.lavenderSoft,
    alignItems: 'center',
    justifyContent: 'center',
  },
  initials: {
    ...typography.label,
    color: colors.primary,
    textTransform: 'none',
    letterSpacing: 0,
  },
});
