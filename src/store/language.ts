import AsyncStorage from '@react-native-async-storage/async-storage';
import * as Localization from 'expo-localization';
import { I18nManager } from 'react-native';
import type { LanguageCode } from '@/types/models';

const LANGUAGE_KEY = 'em_language';

export async function getStoredLanguage(): Promise<LanguageCode | null> {
  const value = await AsyncStorage.getItem(LANGUAGE_KEY);
  if (value === 'en' || value === 'ar') return value;
  return null;
}

export function detectDeviceLanguage(): LanguageCode {
  const locales = Localization.getLocales();
  const code = locales[0]?.languageCode?.toLowerCase();
  return code === 'ar' ? 'ar' : 'en';
}

export async function setStoredLanguage(language: LanguageCode) {
  await AsyncStorage.setItem(LANGUAGE_KEY, language);
  const isRTL = language === 'ar';
  if (I18nManager.isRTL !== isRTL) {
    I18nManager.allowRTL(isRTL);
    I18nManager.forceRTL(isRTL);
  }
}

export async function resolveInitialLanguage(): Promise<LanguageCode> {
  return (await getStoredLanguage()) ?? detectDeviceLanguage();
}
