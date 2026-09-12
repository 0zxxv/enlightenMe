import React, {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
} from 'react';
import { I18nManager } from 'react-native';
import ar from './locales/ar.json';
import en from './locales/en.json';
import { resolveInitialLanguage, setStoredLanguage } from '@/store/language';
import type { LanguageCode } from '@/types/models';

type Dictionaries = {
  en: typeof en;
  ar: typeof ar;
};

const dictionaries: Dictionaries = { en, ar };

type NestedKeyOf<T, Prefix extends string = ''> = T extends object
  ? {
      [K in keyof T & string]: T[K] extends object
        ? NestedKeyOf<T[K], `${Prefix}${K}.`>
        : `${Prefix}${K}`;
    }[keyof T & string]
  : never;

export type I18nKey = NestedKeyOf<typeof en>;

type I18nContextValue = {
  language: LanguageCode;
  isRTL: boolean;
  t: (key: I18nKey | string) => string;
  setLanguage: (language: LanguageCode) => Promise<void>;
  ready: boolean;
};

const I18nContext = createContext<I18nContextValue | null>(null);

function lookup(dict: typeof en, key: string): string {
  const parts = key.split('.');
  let current: unknown = dict;
  for (const part of parts) {
    if (current && typeof current === 'object' && part in current) {
      current = (current as Record<string, unknown>)[part];
    } else {
      return key;
    }
  }
  return typeof current === 'string' ? current : key;
}

export function I18nProvider({ children }: { children: React.ReactNode }) {
  const [language, setLanguageState] = useState<LanguageCode>('en');
  const [ready, setReady] = useState(false);

  useEffect(() => {
    resolveInitialLanguage().then((lang) => {
      setLanguageState(lang);
      const isRTL = lang === 'ar';
      if (I18nManager.isRTL !== isRTL) {
        I18nManager.allowRTL(isRTL);
        I18nManager.forceRTL(isRTL);
      }
      setReady(true);
    });
  }, []);

  const setLanguage = useCallback(async (next: LanguageCode) => {
    await setStoredLanguage(next);
    setLanguageState(next);
  }, []);

  const value = useMemo<I18nContextValue>(
    () => ({
      language,
      isRTL: language === 'ar',
      ready,
      t: (key) => lookup(dictionaries[language], key),
      setLanguage,
    }),
    [language, ready, setLanguage],
  );

  return <I18nContext.Provider value={value}>{children}</I18nContext.Provider>;
}

export function useI18n() {
  const ctx = useContext(I18nContext);
  if (!ctx) throw new Error('useI18n must be used within I18nProvider');
  return ctx;
}

export function useTranslation() {
  const { t, language, isRTL } = useI18n();
  return { t, language, isRTL };
}
