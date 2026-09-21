import React from 'react';
import { StyleSheet, Text, View } from 'react-native';
import { useTranslation } from '@/i18n';
import { colors, typography } from '@/theme';
import { formatPrice } from '@/utils/format';

type Props = {
  amount: number | string;
  currency?: string;
  /** Package total for all sessions (default marketplace model). */
  sessionCount?: number;
  compact?: boolean;
};

export function PriceDisplay({ amount, currency, sessionCount, compact }: Props) {
  const { t } = useTranslation();
  const cur = currency ?? t('common.currency');
  return (
    <View style={styles.wrap}>
      <Text style={[styles.price, compact && styles.priceCompact]}>
        {formatPrice(amount, cur)}
      </Text>
      {sessionCount != null && sessionCount > 0 ? (
        <Text style={styles.meta}>
          {sessionCount} {t('course.sessions')} · {t('course.priceTotal')}
        </Text>
      ) : null}
    </View>
  );
}

const styles = StyleSheet.create({
  wrap: { alignItems: 'flex-end', gap: 2 },
  price: {
    ...typography.price,
    color: colors.primary,
  },
  priceCompact: {
    fontSize: 16,
  },
  meta: {
    ...typography.caption,
    color: colors.textMuted,
    fontSize: 11,
  },
});
