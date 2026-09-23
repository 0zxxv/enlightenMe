import { Button } from '@/components/Button';
import { useLayout } from '@/hooks/useLayout';
import { useTranslation } from '@/i18n';
import { spacing } from '@/theme';
import { Image } from 'expo-image';
import { useRouter } from 'expo-router';
import { Platform, StyleSheet, useWindowDimensions, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

const BEIGE = '#F7F3EE';

export default function WelcomeScreen() {
  const router = useRouter();
  const { t } = useTranslation();
  const { width: windowWidth, height: windowHeight } = useWindowDimensions();
  const { isDesktop, isTablet, isMobile, contentPadding } = useLayout();

  const isLarge = isTablet || isDesktop;

  const artSource = isDesktop
    ? require('../../assets/images/welcome-laptop.png')
    : isTablet
      ? require('../../assets/images/welcome-ipad.png')
      : require('../../assets/images/welcome.png');

  return (
    <View style={styles.root}>
      <View
        style={[
          styles.artLayer,
          styles.artLayerFull,
          {
            width: windowWidth,
            height: windowHeight,
          },
        ]}
        pointerEvents="none"
      >
        <Image
          source={artSource}
          style={styles.art}
          contentFit="cover"
          contentPosition="center"
          accessibilityLabel={t('brand.quote')}
        />
      </View>

      <SafeAreaView style={styles.foreground} edges={['top', 'bottom']}>
        <View
          style={[
            styles.topPanel,
            isMobile && styles.topPanelPhone,
            isLarge && styles.topPanelLargeScreen,
            {
              width: '100%',
              paddingHorizontal: contentPadding,
            },
          ]}
        >
          <View
            style={[
              styles.actions,
              isLarge && styles.actionsLarge,
              isLarge && styles.actionsLargeScreen,
            ]}
          >
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
  artLayerFull: {
    top: 0,
    bottom: 0,
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
  topPanelPhone: {
    flex: 1,
    justifyContent: 'flex-end',
    paddingTop: 0,
    paddingBottom: spacing.lg,
  },
  topPanelLargeScreen: {
    flex: 1,
    justifyContent: 'flex-end',
    alignItems: 'flex-end',
    alignSelf: 'stretch',
    paddingTop: 0,
    paddingBottom: spacing.xxl,
  },
  actions: {
    gap: spacing.md,
    width: '100%',
  },
  actionsLarge: {
    gap: spacing.lg,
  },
  actionsLargeScreen: {
    width: '100%',
    maxWidth: 360,
    alignSelf: 'flex-end',
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
