import React from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import { useTranslation } from '@/i18n';
import { colors, spacing, typography } from '@/theme';
import { yogaDirection } from '@/utils/rtl';

type Props = {
  title: string;
  actionLabel?: string;
  onAction?: () => void;
};

/**
 * Title + optional "See all".
 * LTR: title left, action right. RTL: title right, action left.
 * Isolates Yoga `direction` so parent RTL does not undo `row-reverse`.
 */
export function SectionHeader({ title, actionLabel, onAction }: Props) {
  const { isRTL } = useTranslation();

  return (
    <View
      style={[
        styles.row,
        yogaDirection(false),
        { flexDirection: isRTL ? 'row-reverse' : 'row' },
      ]}
    >
      <Text
        style={[
          styles.title,
          {
            textAlign: isRTL ? 'right' : 'left',
            writingDirection: isRTL ? 'rtl' : 'ltr',
          },
        ]}
        numberOfLines={1}
      >
        {title}
      </Text>
      {actionLabel && onAction ? (
        <Pressable onPress={onAction} hitSlop={8} style={styles.actionHit}>
          <Text style={styles.action}>{actionLabel}</Text>
        </Pressable>
      ) : null}
    </View>
  );
}

const styles = StyleSheet.create({
  row: {
    width: '100%',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: spacing.md,
    marginBottom: spacing.md,
  },
  title: {
    ...typography.subheading,
    color: colors.text,
    flex: 1,
    flexShrink: 1,
    minWidth: 0,
  },
  actionHit: {
    flexShrink: 0,
  },
  action: {
    ...typography.caption,
    color: colors.primary,
    fontWeight: '700',
  },
});
