import React from 'react';
import { StyleSheet, Text } from 'react-native';
import { useTranslation } from '@/i18n';
import { colors, typography } from '@/theme';
import { formatPrice } from '@/utils/format';

type Props = {
  amount: number | string;
  currency?: string;
};

export function PriceDisplay({ amount, currency }: Props) {
  const { t } = useTranslation();
  return (
    <Text style={styles.price}>{formatPrice(amount, currency ?? t('common.currency'))}</Text>
  );
}

const styles = StyleSheet.create({
  price: {
    ...typography.price,
    color: colors.primary,
  },
});
