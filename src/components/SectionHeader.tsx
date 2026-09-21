import React from 'react';
import { StyleSheet, Text, View } from 'react-native';
import { useTranslation } from '@/i18n';
import { colors, spacing, typography } from '@/theme';

type Props = {
  title: string;
  actionLabel?: string;
  onAction?: () => void;
};

export function SectionHeader({ title, actionLabel, onAction }: Props) {
  const { isRTL } = useTranslation();

  return (
    <View style={styles.row}>
      <Text
        style={[
          styles.title,
          { textAlign: isRTL ? 'right' : 'left', writingDirection: isRTL ? 'rtl' : 'ltr' },
        ]}
      >
        {title}
      </Text>
      {actionLabel && onAction ? (
        <Text onPress={onAction} style={styles.action}>
          {actionLabel}
        </Text>
      ) : null}
    </View>
  );
}

const styles = StyleSheet.create({
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: spacing.md,
  },
  title: {
    ...typography.subheading,
    color: colors.text,
    flex: 1,
  },
  action: {
    ...typography.caption,
    color: colors.primary,
    fontWeight: '600',
  },
});
