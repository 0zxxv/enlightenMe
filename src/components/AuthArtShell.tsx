import React from 'react';
import { StyleSheet, Text, View } from 'react-native';
import { useTranslation } from '@/i18n';
import { colors, typography } from '@/theme';
import { yogaDirection } from '@/utils/rtl';

const BEIGE = '#F7F3EE';

type Props = {
  children: React.ReactNode;
};

/**
 * Shared auth canvas: soft lavender blobs + decorative quote (top-right).
 */
export function AuthArtShell({ children }: Props) {
  const { t } = useTranslation();

  return (
    <View style={styles.root}>
      <View style={[styles.decorLayer, yogaDirection(false)]} pointerEvents="none">
        <View style={styles.blobA} />
        <View style={styles.blobB} />
        <View style={styles.blobC} />
        <View style={styles.quoteRow}>
          <Text style={styles.quote}>{t('brand.quote')}</Text>
          <Text style={styles.heart}>💜</Text>
        </View>
      </View>
      <View style={styles.blobBottom} pointerEvents="none" />
      <View style={styles.blobBottomSoft} pointerEvents="none" />
      {children}
    </View>
  );
}

const styles = StyleSheet.create({
  root: {
    flex: 1,
    backgroundColor: BEIGE,
    overflow: 'hidden',
  },
  decorLayer: {
    position: 'absolute',
    top: 0,
    right: 0,
    width: 220,
    height: 200,
    zIndex: 0,
  },
  blobA: {
    position: 'absolute',
    top: -36,
    right: -48,
    width: 180,
    height: 160,
    borderRadius: 90,
    backgroundColor: colors.lavenderSoft,
    opacity: 0.75,
  },
  blobB: {
    position: 'absolute',
    top: 28,
    right: 36,
    width: 100,
    height: 90,
    borderRadius: 50,
    backgroundColor: '#F3E8E0',
    opacity: 0.7,
  },
  blobC: {
    position: 'absolute',
    top: 70,
    right: -10,
    width: 70,
    height: 64,
    borderRadius: 35,
    backgroundColor: colors.lavenderSoft,
    opacity: 0.45,
  },
  quoteRow: {
    position: 'absolute',
    top: 52,
    right: 16,
    left: 8,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'flex-end',
    gap: 4,
  },
  quote: {
    ...typography.caption,
    color: colors.lavender,
    fontStyle: 'italic',
    fontSize: 12,
    textAlign: 'right',
    writingDirection: 'ltr',
    maxWidth: 150,
  },
  heart: {
    fontSize: 11,
  },
  blobBottom: {
    position: 'absolute',
    bottom: -40,
    left: -60,
    width: 200,
    height: 160,
    borderRadius: 100,
    backgroundColor: colors.lavenderSoft,
    opacity: 0.55,
    zIndex: 0,
  },
  blobBottomSoft: {
    position: 'absolute',
    bottom: 24,
    left: 36,
    width: 120,
    height: 90,
    borderRadius: 60,
    backgroundColor: colors.beige,
    opacity: 0.65,
    zIndex: 0,
  },
});
