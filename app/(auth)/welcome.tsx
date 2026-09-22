import { Button } from '@/components/Button';
import { useLayout } from '@/hooks/useLayout';
import { useTranslation } from '@/i18n';
import { colors, spacing, typography } from '@/theme';
import { Image } from 'expo-image';
import { useRouter } from 'expo-router';
import { Platform, StyleSheet, Text, useWindowDimensions, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

const BEIGE = '#F7F3EE';
/** Intrinsic size of assets/images/bg.png */
const PHONE_ART_ASPECT = 881 / 1499;

export default function WelcomeScreen() {
  const router = useRouter();
  const { t } = useTranslation();
  const { width: windowWidth, height: windowHeight } = useWindowDimensions();
  const { isDesktop, isTablet, contentPadding } = useLayout();

  const isLarge = isTablet || isDesktop;
  const panelMaxWidth = isDesktop ? 560 : isTablet ? 520 : undefined;

  const artSource = isDesktop
    ? require('../../assets/images/bg4.png')
    : isTablet
      ? require('../../assets/images/bg3.png')
      : require('../../assets/images/bg.png');

  // Full page width; height follows image ratio (capped so it stays behind the CTAs).
  const artWidth = windowWidth;
  const naturalArtHeight = isLarge ? windowHeight * 0.72 : artWidth / PHONE_ART_ASPECT;
  const artHeight = Math.min(naturalArtHeight, windowHeight * 0.68);

  return (
    <View style={styles.root}>
      <View
        style={[
          styles.artLayer,
          {
            width: artWidth,
            height: artHeight,
          },
        ]}
        pointerEvents="none"
      >
        <Image
          source={artSource}
          style={styles.art}
          contentFit={isLarge ? 'contain' : 'cover'}
          contentPosition="bottom"
          accessibilityLabel={t('brand.quote')}
        />
      </View>

      <SafeAreaView style={styles.foreground} edges={['top', 'bottom']}>
        <View
          style={[
            styles.topPanel,
            isLarge && styles.topPanelLarge,
            {
              maxWidth: panelMaxWidth ?? '100%',
              width: '100%',
              paddingHorizontal: contentPadding,
            },
          ]}
        >
          <View style={[styles.brand, isLarge && styles.brandLarge]}>
            <Text
              style={[styles.logoWord, isLarge && styles.logoWordLarge]}
              accessibilityRole="header"
            >
              {t('brand.name').toLowerCase()}
              <Text style={styles.logoDot}>.</Text>
            </Text>
            <Text style={[styles.tagline, isLarge && styles.taglineLarge]}>
              {t('brand.tagline')}
            </Text>
            <Text style={[styles.marketplace, isLarge && styles.marketplaceLarge]}>
              {t('brand.marketplace')}
            </Text>
          </View>

          <View style={[styles.actions, isLarge && styles.actionsLarge]}>
            <Button
              title={t('auth.getStarted')}
              onPress={() => router.push('/(auth)/register')}
              size="lg"
              style={isLarge ? styles.buttonLarge : undefined}
              textStyle={isLarge ? styles.buttonTextLarge : undefined}
            />
            <Button
              title={t('auth.haveAccount')}
              onPress={() => router.push('/(auth)/login')}
              variant="glass"
              size="lg"
              style={isLarge ? styles.buttonLarge : undefined}
              textStyle={isLarge ? styles.buttonTextLarge : undefined}
            />
          </View>
        </View>
      </SafeAreaView>
    </View>
  );
}

const styles = StyleSheet.create({
  root: {
    flex: 1,
    width: '100%',
    backgroundColor: BEIGE,
    overflow: 'hidden',
    ...Platform.select({
      web: {
        minHeight: '100vh' as unknown as number,
        height: '100%' as unknown as number,
      },
      default: {},
    }),
  },
  artLayer: {
    position: 'absolute',
    left: 0,
    right: 0,
    bottom: 0,
    zIndex: 0,
  },
  art: {
    width: '100%',
    height: '100%',
  },
  foreground: {
    flex: 1,
    zIndex: 1,
    width: '100%',
  },
  topPanel: {
    width: '100%',
    alignSelf: 'center',
    paddingTop: spacing.xl,
    gap: spacing.xl,
  },
  topPanelLarge: {
    paddingTop: spacing.xxl,
    gap: spacing.xxl,
  },
  brand: {
    gap: spacing.xs,
    paddingTop: spacing.md,
  },
  brandLarge: {
    gap: spacing.sm,
    paddingTop: spacing.lg,
  },
  logoWord: {
    fontSize: 42,
    lineHeight: 48,
    fontWeight: '800',
    color: colors.primary,
    letterSpacing: -0.5,
  },
  logoWordLarge: {
    fontSize: 64,
    lineHeight: 72,
    letterSpacing: -1,
  },
  logoDot: {
    color: colors.lavender,
    fontWeight: '800',
  },
  tagline: {
    ...typography.subheading,
    color: colors.primary,
    fontSize: 18,
    marginTop: spacing.xs,
  },
  taglineLarge: {
    fontSize: 28,
    lineHeight: 36,
    marginTop: spacing.sm,
  },
  marketplace: {
    ...typography.body,
    color: colors.textMuted,
    marginTop: 2,
  },
  marketplaceLarge: {
    fontSize: 20,
    lineHeight: 28,
    marginTop: spacing.xs,
  },
  actions: {
    gap: spacing.md,
    width: '100%',
  },
  actionsLarge: {
    gap: spacing.lg,
  },
  buttonLarge: {
    minHeight: 68,
    paddingVertical: spacing.xl,
    paddingHorizontal: spacing.xxxl,
    borderRadius: 16,
  },
  buttonTextLarge: {
    fontSize: 20,
    lineHeight: 26,
  },
});
