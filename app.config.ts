import type { ExpoConfig, ConfigContext } from 'expo/config';

export default ({ config }: ConfigContext): ExpoConfig => ({
  ...config,
  name: 'Dars',
  slug: 'dars',
  version: '1.0.0',
  orientation: 'portrait',
  icon: './assets/images/dars_icon.png',
  scheme: 'dars',
  userInterfaceStyle: 'light',
  ios: {
    supportsTablet: true,
    bundleIdentifier: 'com.dars.app',
  },
  android: {
    adaptiveIcon: {
      backgroundColor: '#F7F3EE',
      foregroundImage: './assets/images/dars_icon.png',
    },
    package: 'com.dars.app',
    predictiveBackGestureEnabled: false,
  },
  web: {
    bundler: 'metro',
    output: 'static',
    favicon: './assets/images/dars_icon.png',
  },
  plugins: [
    'expo-router',
    'expo-secure-store',
    'expo-localization',
    [
      'expo-splash-screen',
      {
        image: './assets/images/dars_logo.png',
        resizeMode: 'contain',
        backgroundColor: '#F7F3EE',
      },
    ],
  ],
  experiments: {
    typedRoutes: true,
  },
  extra: {
    eas: {
      projectId: 'dars-placeholder',
    },
  },
});
