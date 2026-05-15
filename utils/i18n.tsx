import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
  type ReactNode,
} from 'react';
import { getPref, setPref } from './prefs';
import {
  SUPPORTED_LANGUAGES,
  translations,
  type Language,
  type TranslationKey,
} from '../constants/i18n';

const DEFAULT_LANGUAGE: Language = 'en';
const LANGUAGE_PREF_KEY = 'language';

export type TParams = Record<string, string | number>;
export type TFunction = (key: TranslationKey | string, params?: TParams) => string | string[];

export interface I18nContextValue {
  lang: Language;
  setLang: (next: Language) => void;
  t: TFunction;
  ready: boolean;
}

const isLanguage = (value: unknown): value is Language =>
  typeof value === 'string' && (SUPPORTED_LANGUAGES as readonly string[]).includes(value);

// Detect the device language, falling back to English.
export const detectLanguage = (): Language => {
  try {
    const candidates: string[] = [];
    if (typeof navigator !== 'undefined') {
      if (Array.isArray(navigator.languages)) candidates.push(...navigator.languages);
      if (navigator.language) candidates.push(navigator.language);
    }
    if (typeof Intl !== 'undefined' && Intl.DateTimeFormat) {
      candidates.push(Intl.DateTimeFormat().resolvedOptions().locale);
    }
    for (const candidate of candidates) {
      const code = String(candidate).toLowerCase().slice(0, 2);
      if (isLanguage(code)) return code;
    }
  } catch {
    // ignore detection failures and use the default
  }
  return DEFAULT_LANGUAGE;
};

// Replace {token} placeholders with provided params.
const interpolate = (template: string, params?: TParams): string => {
  if (!params) return template;
  return String(template).replace(/\{(\w+)\}/g, (match, key: string) =>
    key in params ? String(params[key]) : match,
  );
};

const translate = (
  lang: Language,
  key: TranslationKey | string,
  params?: TParams,
): string | string[] => {
  const table = translations[lang] ?? translations[DEFAULT_LANGUAGE];
  const value =
    (table as Record<string, string | string[]>)[key] ??
    (translations[DEFAULT_LANGUAGE] as Record<string, string | string[]>)[key] ??
    key;
  return typeof value === 'string' ? interpolate(value, params) : value;
};

const I18nContext = createContext<I18nContextValue | null>(null);

export const LanguageProvider = ({ children }: { children: ReactNode }) => {
  const [lang, setLangState] = useState<Language>(DEFAULT_LANGUAGE);
  const [ready, setReady] = useState(false);

  useEffect(() => {
    let active = true;
    (async () => {
      let stored: string | null;
      try {
        stored = await getPref(LANGUAGE_PREF_KEY);
      } catch {
        stored = null;
      }
      if (!active) return;
      setLangState(isLanguage(stored) ? stored : detectLanguage());
      setReady(true);
    })();
    return () => {
      active = false;
    };
  }, []);

  const setLang = useCallback((next: Language) => {
    if (!isLanguage(next)) return;
    setLangState(next);
    setPref(LANGUAGE_PREF_KEY, next).catch(() => {});
  }, []);

  const t = useCallback<TFunction>((key, params) => translate(lang, key, params), [lang]);

  const value = useMemo<I18nContextValue>(
    () => ({ lang, setLang, t, ready }),
    [lang, setLang, t, ready],
  );

  return <I18nContext.Provider value={value}>{children}</I18nContext.Provider>;
};

export const useT = (): I18nContextValue => {
  const context = useContext(I18nContext);
  if (!context) {
    // Safe fallback when used outside a provider (e.g. isolated tests).
    return {
      lang: DEFAULT_LANGUAGE,
      setLang: () => {},
      t: (key, params) => translate(DEFAULT_LANGUAGE, key, params),
      ready: true,
    };
  }
  return context;
};
