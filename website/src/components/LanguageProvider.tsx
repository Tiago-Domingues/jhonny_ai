"use client";

import {
  createContext,
  useContext,
  useEffect,
  useState,
  type ReactNode,
} from "react";
import { LOCALES, LOCALE_META, translations, type Locale } from "@/lib/i18n";

type LanguageContextValue = {
  locale: Locale;
  setLocale: (l: Locale) => void;
  toggle: () => void;
  t: (typeof translations)[Locale];
};

const LanguageContext = createContext<LanguageContextValue | null>(null);
const LOCALE_STORAGE_KEY = "jss-locale-v2";

function isLocale(value: string | null): value is Locale {
  return Boolean(value && (LOCALES as string[]).includes(value));
}

export function LanguageProvider({ children }: { children: ReactNode }) {
  const [locale, setLocale] = useState<Locale>("en");

  useEffect(() => {
    const id = window.setTimeout(() => {
      const stored = window.localStorage.getItem(LOCALE_STORAGE_KEY);
      if (isLocale(stored)) {
        setLocale(stored);
      }
    }, 0);
    return () => window.clearTimeout(id);
  }, []);

  useEffect(() => {
    window.localStorage.setItem(LOCALE_STORAGE_KEY, locale);
    document.documentElement.lang = LOCALE_META[locale].htmlLang;
  }, [locale]);

  const value: LanguageContextValue = {
    locale,
    setLocale,
    toggle: () => {
      const index = LOCALES.indexOf(locale);
      setLocale(LOCALES[(index + 1) % LOCALES.length]!);
    },
    t: translations[locale],
  };

  return (
    <LanguageContext.Provider value={value}>
      {children}
    </LanguageContext.Provider>
  );
}

export function useLanguage() {
  const ctx = useContext(LanguageContext);
  if (!ctx) {
    throw new Error("useLanguage must be used within a LanguageProvider");
  }
  return ctx;
}
