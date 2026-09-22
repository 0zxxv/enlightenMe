import Constants from 'expo-constants';
import { reloadAppAsync } from 'expo';
import { I18nManager, Platform, type ViewStyle } from 'react-native';

export function isExpoGo() {
  return Constants.appOwnership === 'expo';
}

/**
 * Yoga `direction` for native. RN-web rejects `direction` in StyleSheet
 * (use document `dir` / writingDirection instead).
 */
export function yogaDirection(isRTL: boolean): ViewStyle {
  if (Platform.OS === 'web') return {};
  return { direction: isRTL ? 'rtl' : 'ltr' };
}

/** Persist + apply layout direction. Native (non–Expo Go) reloads so Yoga/I18nManager remount correctly. */
export async function applyLayoutDirection(isRTL: boolean): Promise<{ reloaded: boolean }> {
  I18nManager.allowRTL(true);

  if (Platform.OS === 'web') {
    const dir = isRTL ? 'rtl' : 'ltr';
    document.documentElement.setAttribute('dir', dir);
    document.documentElement.style.direction = dir;
    document.body.style.direction = dir;
    return { reloaded: false };
  }

  // Expo Go resets I18nManager on launch — rely on software `direction` instead of reload loops.
  if (isExpoGo()) {
    return { reloaded: false };
  }

  if (I18nManager.isRTL !== isRTL) {
    I18nManager.forceRTL(isRTL);
    await reloadAppAsync('language-direction');
    return { reloaded: true };
  }

  return { reloaded: false };
}
